import { Struct,
		 Bool,
		 Field,
		 PublicKey,
		 PrivateKey,
		 Scalar,
		 Provable,
		 UInt64,
		 Poseidon,
		 Experimental,
		 SelfProof,
		 Proof,
		 verify,
		 VerificationKey,
} from 'o1js';

import {
	RuntimeModule, runtimeModule, runtimeMethod, state
} from '@proto-kit/module';

import { State, StateMap } from '@proto-kit/protocol';

import { hkdf } from '@panva/hkdf';

import {
		 CardState,
		 CardGen,
		 CardProof,
		 DeckState,
		 DeckProof,
		 CardIds,
} from '../house/cardDeck.js';

import {
	PlayerInfo,
} from '../player.js';

export class HandState extends Struct({
	numCards: Field,
	rank: Field,
	cards: CardIds,
}) {
	// Initial state
	static initState(_rank: Field) {
		return new HandState({
			numCards: Field(0),
			rank: _rank,
			cards: new CardIds({ ids: [...new Array(52)].map((e) => Field(0))}),
		});
	}

	// Add a card to hand
	static add(state: HandState, cardId: Field) {
		return new HandState({
			rank: state.rank,
			cards: new CardIds({ ids: state.cards.ids.map((value, index) => {
						let match = Field(index).equals(state.numCards);
						let hashedCardId = Poseidon.hash([state.rank, cardId])
						return Provable.if (match, hashedCardId, Field(value));
					})}),			
			numCards: state.numCards.add(Field(1)),
		});
	}

	// Assert initial state
	static assertInitialState(state: HandState) {
		state.numCards.assertEquals(Field(0));
		state.rank.assertEquals(state.rank);
		//state.cards.length.assertEquals(0);
	}

	// Assert equality of state
	static assertEquals(state1: HandState, state2: HandState) {
		state1.numCards.assertEquals(state2.numCards);
		//state1.cards.length.assertEquals(state2.suite);
		//state1.rank.assertEquals(state2.rank);
	}
};

@runtimeModule()
export class Hands extends RuntimeModule<unknown> {
	@state() public hand = StateMap.from<PublicKey, HandState>(
		PublicKey,
		HandState,
	);

	@runtimeMethod()
	public addHand(address: PublicKey, hand: HandState): void {
		console.log("Adding hand..");
		this.hand.set(address, hand);
	}

	@runtimeMethod()
	public revealHand(address: PublicKey): Bool {
		const ret = new Bool(true);

		return ret;
	}
}

export class HandPublicInput extends Struct({
  state: HandState,
  playerDeckRoot: Field,
}) {}

export const HandGen = Experimental.ZkProgram({

	// Name and state of deck 
	name: "Hand",
	publicInput: HandPublicInput,
	publicOutput: CardIds,

	methods: {

		create: {
			privateInputs: [Field],

			method(input: HandPublicInput, rank: Field): CardIds {

				Provable.asProver(() => {
					console.log("Handgen->create..enter");
				});
				HandState.assertInitialState(input.state);
				
				Provable.asProver(() => {
					console.log("Handgen->create..exit");
				});
				return new CardIds({ids: input.state.cards.ids});;
			}
		},

		add: {
			privateInputs: [SelfProof<HandPublicInput, CardIds>,
							CardProof, Field],

			method(input: HandPublicInput,
				earlierProof: SelfProof<HandPublicInput, CardIds>,
				cardProof: Proof<CardState, Field>, playerDeckRoot: Field): CardIds {

				Provable.asProver(() => {
					console.log("Handgen->add..enter");
				});

				// Verify previous deck state proof 
				earlierProof.verify();

				Provable.asProver(() => {
					console.log("Handgen-> earlier proof verify done");
				});

				// Verify card proof
				cardProof.verify();

				Provable.asProver(() => {
					console.log("Handgen-> card proof verify done");
				});

				// Verify card from valid deck
				playerDeckRoot.assertEquals(input.playerDeckRoot);

				Provable.asProver(() => {
					console.log("Handgen->  player deckroot assert done");
				});

				// Verify the card's rank is same as hand rank
				let card_rank = cardProof.publicInput.rank;
				card_rank.assertEquals(input.state.rank);

				Provable.asProver(() => {
					console.log("Handgen->  card rank assert done");
				});

				// Add card to hand 
				let cardId = cardProof.publicOutput;
				const computedState = HandState.add(
								earlierProof.publicInput.state,
								cardId);

				Provable.asProver(() => {
					console.log("Handgen->  computed state done");
				});

				HandState.assertEquals(input.state, computedState);

				Provable.asProver(() => {
					console.log("Handgen->  computed state assert done");
				});

				return computedState.cards;
			}
		}

	}
});

export class HandProof extends Experimental.ZkProgram.Proof(HandGen){};

export async function createHand(qty: Field, rank: Field,
											deckRoot: Field, player: PlayerInfo)
											: Promise<HandProof> {

	console.log("Creating Hand..");
	let hand0 = HandState.initState(rank);
	let publicInput0 = new HandPublicInput({
		state: hand0,
		playerDeckRoot: deckRoot,
	})

	let hproof0 = await HandGen.create(publicInput0, rank);

	let suite = Field(1);
	let card, cproof;

	console.log(`Adding card of rank:${rank}`);
	card = CardState.newCard(Field(1), suite, rank, player.sessionKey);
	console.log(`new card :${rank}`);
	cproof = await CardGen.checkCard(card, Field(1), suite, rank,
													player.sessionKey);
	console.log(`checked new card :${rank}`);

	let cardId = cproof.publicOutput;
	let hand = HandState.add(hand0, cardId);
	let publicInput = new HandPublicInput({
		state: hand,
		playerDeckRoot: deckRoot,
	})
	let hproof = await HandGen.add(publicInput, hproof0, cproof, deckRoot);

	console.log(`Creating Hand done for ${rank}}.`);
	console.log("Handcards[0]:", hproof.publicOutput.ids[0].toBigInt());

	return hproof;
}

function __bytesToBigint(bytes: Uint8Array | number[]) {
  let x = 0n;
  let bitPosition = 0n;
  for (let byte of bytes) {
    x += BigInt(byte) << bitPosition;
    bitPosition += 8n;
  }
  return x;
}

export async function initHand(): Promise<string> {
	console.log("hand:compiling Card circuit...");
	await CardGen.compile();
	console.log("hand:compiling finised");

	console.log("hand:compiling Hand circuit...");
	const { verificationKey } = await HandGen.compile();
	console.log("hand:compiling finised");

	return verificationKey;
}
