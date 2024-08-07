import {
	Mina,
	SmartContract,
	Experimental,
	Struct,
	verify,
	method,
	PrivateKey,
	PublicKey,
	Field,
	VerificationKey,
	UInt64,
	Bool,
	Provable,
} from 'o1js';

import {
	RuntimeModule, runtimeModule, runtimeMethod, state
} from '@proto-kit/module';

import {
  EventEmitter,
  EventEmittingComponent,
} from "@proto-kit/common";

import { inject } from "tsyringe";

import { State, StateMap, assert } from '@proto-kit/protocol';

import {
	DeckState,
	CardProof,
	DeckProof,
	CardIds,
} from './cardDeck.js';

import {
	Player,
	PlayerInfo,
	initPlayers,
} from '../player.js';

import {
	Hands,
	HandProof,
	initHand,
	HandState,
	createHand,
} from '../player/hand.js';

export type BBBluffEvents = {
	"player-added": [UInt64],
}

export class BoardState extends Struct({
	rank: Field,
	numCards: UInt64,
	cards: CardIds,
	root: Field,
}) {}

export class GameState extends Struct({
	status: UInt64,
	subStatus: UInt64,
	round: UInt64,
	hands: UInt64,
	players: UInt64,
	lastPlayer: PublicKey,
	nextPlayer: PublicKey,
	startTime: UInt64,
	endTime: UInt64,
}) {}

export class PlayerScore extends Struct({
	cardCount: UInt64,
	playTime: UInt64,
}) {}

export enum GameStatus {
  NONE = 1,
  INIT,
  SETUP,
  START,
  END,
}

export enum GameSubStatus {
  NONE = 1,
  DECKADDED,
  ADDINGPLAYERS,
  DISTRIBUTINGCARDS,
  PLAYINGHAND,
}

@runtimeModule()
export class BBBluff extends RuntimeModule {
	// Dealer 
	@state() public dealer = State.from<PublicKey>(PublicKey);

	// Dealer and player decks
	@state() public deck = StateMap.from<PublicKey, DeckState>(
		PublicKey,
		DeckState
	);

	// Board
	@state() public board = State.from<BoardState>(BoardState);

	// Game State
	@state() public gameState = State.from<GameState>(GameState);

	// Player scores
	@state() public playerScore = StateMap.from<PublicKey, PlayerScore>(
		PublicKey,
		PlayerScore
	);

	public constructor(
		@inject("Player") public player: Player,
		@inject("Hands") public hand: Hands
	) {
		super();
		console.log("constructor");
	}

	@runtimeMethod()
	public init(): void {
		
		const sender = this.transaction.sender.value;

		// Set dealer
		this.dealer.set(sender);

		// Init board state
		const newBoardState = new BoardState({
			rank: Field(0),
			numCards: UInt64.zero,
			cards: new CardIds({ids: [...new Array(52)].map((e) => Field(0)!)}),
			root: Field.from(0n),
		});
		this.board.set(newBoardState);

		// Init game state
		const newGameState = new GameState({
			status: UInt64.from(GameStatus.INIT), 
			subStatus: UInt64.from(GameSubStatus.NONE),
			round: UInt64.zero,
			hands: UInt64.zero,
			players: UInt64.zero,
			lastPlayer: PublicKey.empty(),
			nextPlayer: PublicKey.empty(),
			startTime: UInt64.from(0),
			endTime: UInt64.from(new Date('2100-01-01').getTime()),
		});
		this.gameState.set(newGameState);

		console.log("Initialized game..");
	}

	@runtimeMethod()
	public addDeck(deck: DeckState/*, deckProof: DeckProof*/): void {

		const sender = this.transaction.sender.value;
		const dealer = this.dealer.get().value;

		// Check if sender is dealer 
		assert(sender.equals(dealer));

		// Validate deck proof
		//deckProof.verify();

		// Set deck
		this.deck.set(dealer, deck);

		// Update game state
		let _gameState = this.gameState.get().value;
		_gameState.status = UInt64.from(GameStatus.SETUP);
		_gameState.subStatus = UInt64.from(GameSubStatus.DECKADDED),

		this.gameState.set(_gameState);

		console.log("Added deck..");
	}

	@runtimeMethod()
	public join(info: PlayerInfo): void {

		const sender = this.transaction.sender.value;

		// Check if player is not dealer
    //assert(sender.equals(dealer));

		let _gameState = this.gameState.get().value;
		
		// Check if its first player being added
		const firstPlayer = _gameState.players.greaterThan(UInt64.zero).not();

		// Check if in setup phase
		const setupDone = _gameState.status.equals(UInt64.from(GameStatus.SETUP));

		// Check if in deck added incase of first player,
		// or in adding player state if not first player 	
		const deckOrPlayerAdded = Provable.if(firstPlayer,
			_gameState.subStatus.equals(UInt64.from(GameSubStatus.DECKADDED)),
			_gameState.subStatus.equals(UInt64.from(GameSubStatus.ADDINGPLAYERS)));

		assert(setupDone.and(deckOrPlayerAdded));

		// Check if player limit is reached
		assert(_gameState.players.lessThan(UInt64.from(4)));

		// Update game state
		_gameState.players = UInt64.from(_gameState.players).add(1);
		_gameState.status = UInt64.from(GameStatus.SETUP);
		_gameState.subStatus = UInt64.from(GameSubStatus.ADDINGPLAYERS);
		this.gameState.set(_gameState);

		// Register player
		this.player.addPlayer(sender, info);
	}

	@runtimeMethod()
	public claimCards(from: PublicKey): void {

		const sender = this.transaction.sender.value;
		let dealer = this.dealer.get().value;

		// Check if player claims from dealer
    assert(from.equals(dealer));

    // Reterive dealer's deck
		const _deck = this.deck.get(dealer).value;
    //assert(deck.isSome, 'Deck not present');
		
		let dDeck = new DeckState(_deck);

		// Create player deck
		let cards: CardIds = new CardIds({ids: [...new Array(52)]
									.map((e) => Field(0)!)});
		
		// Copy players share of cards
		for (let i = 0; i < 13; i++) {
			//cards.ids[i] = dDeck.cards.ids[i];
			cards.ids[i] = dDeck.cards.ids.shift()!;
		}

		dDeck.numCards = Field(39);
		
		const playerDeck = new DeckState({
			numCards: Field(13),
			cards: cards,
			root: Field.random(),
		});

		// Set players deck
		this.deck.set(sender, playerDeck);

		// Update dealer deck
		this.deck.set(dealer, dDeck);

		// Update game state
		let _gameState = this.gameState.get().value;		
		_gameState.status = UInt64.from(GameStatus.SETUP);
		_gameState.subStatus = UInt64.from(GameSubStatus.DISTRIBUTINGCARDS);
		_gameState.nextPlayer = PublicKey.from(sender);

		this.gameState.set(_gameState);

		console.log("Player claimed cards..");
	}

	@runtimeMethod()
	public start(): void {

		const sender = this.transaction.sender.value;
		let dealer = this.dealer.get().value;

		// Check if sender is dealer 
		assert(sender.equals(dealer));

		// Update game state
		let _gameState = this.gameState.get().value;
		_gameState.startTime = UInt64.from(new Date('2099-12-31').getTime());
		_gameState.status = UInt64.from(GameStatus.START);
		_gameState.subStatus = UInt64.from(GameSubStatus.NONE);
		this.gameState.set(_gameState);

		console.log("Game started..");		
	}

	@runtimeMethod()
	public addHand(hand: HandState): void {

		const sender = this.transaction.sender.value;
		const gameState = this.gameState.get().value;
		
		// Check if player turn is valid
		assert(sender.equals(gameState.nextPlayer));

		// Check if its a new Hand
		const board = this.board.get().value;
		const newHand = board.numCards.greaterThan(UInt64.zero).not();
		console.log("new hand:", newHand);

		// Check if hand rank is the same a current round rank
		const rankPass = Provable.if(newHand, Bool(true), hand.rank.equals(board.rank));
		console.log("rankPass:", rankPass);
		assert(rankPass);

		// Add hand to board state
		const newBoardState = new BoardState({
			rank: board.rank,
			numCards: board.numCards.add(UInt64.from(hand.numCards)),
			cards: new CardIds({ids: [...board.cards.ids, ...hand.cards.ids]}),
			root: Field(8),
		});
		this.board.set(newBoardState);

		// Update game state
		let _gameState = this.gameState.get().value;
		_gameState.status = UInt64.from(GameStatus.START);
		_gameState.subStatus = UInt64.from(GameSubStatus.PLAYINGHAND);

		this.gameState.set(_gameState);

		console.log("Played Hand..");		

		// Register hand
		this.hand.addHand(sender, hand);
	}
}