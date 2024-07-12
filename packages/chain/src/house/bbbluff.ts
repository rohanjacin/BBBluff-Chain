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
} from 'o1js';

import {
	RuntimeModule, runtimeModule, runtimeMethod, state
} from '@proto-kit/module';

import { inject } from "tsyringe";

import { State, StateMap } from '@proto-kit/protocol';

import {
	DeckState,
	CardProof,
	initCards,
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
	createHand,
} from '../player/hand.js';

import { EventEmitter } from 'events';
class MyEmitter extends EventEmitter {}
const teste = new MyEmitter();

@runtimeModule()
export class BBBluff extends RuntimeModule {
	@state() public dealer = State.from<PublicKey>(PublicKey);

	@state() public deck = StateMap.from<PublicKey, DeckState>(
		PublicKey,
		DeckState
	);

	@state() public cardBalances = StateMap.from<PublicKey, UInt64>(
		PublicKey,
		UInt64
	);

	@state() public players = State.from<UInt64>(UInt64);

	public constructor(
		@inject("Player") public player: Player,
		@inject("Hands") public hand: Hands
	) {
		super();
		console.log("constructor")
	}

	@runtimeMethod()
	public addDeck(address: PublicKey, deck: DeckState): void {
		console.log("Adding deckcdcd..");
		this.deck.set(address, deck);
	}

	@runtimeMethod()
	public addPlayers(address: PublicKey, info: PlayerInfo): void {
		console.log("Adding player..");
		this.player.addPlayer(address, info);
		this.players.set(
			this.players.get().orElse(UInt64.from(0)).add(1));
		console.log("no of players:", this.players);

		let num_players = this.players.get();
		teste.emit('test');
	}

	@runtimeMethod()
	public transferCards(from: PublicKey, to: PublicKey,
		numCards: UInt64): void {

	}

	@runtimeMethod()
	public start(address: PublicKey): void {
		console.log("Starting BBBluff...");
		this.dealer.set(address);
	}
}

class Dealer extends Struct({
	publicKey: PublicKey,
	playerSessionKey: Field,
	deckMapRoot: Field,
}){};

const dealer = new Dealer({
	publicKey: PrivateKey.random().toPublicKey(),
	playerSessionKey: Field.random(),
	deckMapRoot: Field.random(),
});

/*let Players: PlayerInfo[] = await initPlayers();
let deck: DeckState = await initCards(Players);
let vk = await initHand();
let proof = await createHand(Field(1), Field(1), 
					Field.random(), Players[0]);
*/
/*let bbbluff = new BBBluff(dealer.publicKey);
console.log("Creating transaction");
let tx = await Mina.transaction(async () => {
				await bbbluff.verifyHand(proof)});
let [contractProof] = await tx.prove();
console.log("DONEE:", contractProof);*/