import { 
	state,
	runtimeModule,
	RuntimeModule,
	runtimeMethod
} from "@proto-kit/module";
import {
	State,
	StateMap,
	assert
} from "@proto-kit/protocol";

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
} from 'o1js';

import { CardState,
		 CardGen,
		 CardProof,
		 DeckState,
		 DeckProof,
		 CardIds 
} from './cardDeck.js';

class HandInfo extends Struct({
	numOfCards: UInt64,
	player: PublicKey
}) {}

/*@runtimeModule()
export class Hands extends RuntimeModule<unknown> {
	@state() public hand = StateMap.from<Field, HandInfo>(
		Field,
		HandInfo,
	);

	@runtimeMethod()
	public add(hand: Field , player: PublicKey, numOfCards: UInt64) {

		const curHand = this.hand.get(hand).value;
		curHand.numOfCards = numOfCards;
		curHand.player = player;
	}

	@runtimeMethod()
	public transfer(player: PublicKey, cardId: Field) {

	}
}
*/
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
	static assertInitialState(state: HandState, rank: Field) {
		state.numCards.assertEquals(Field(0));
		state.rank.assertEquals(rank);
		//state.cards.length.assertEquals(0);
	}

	// Assert equality of state
	static assertEquals(state1: HandState, state2: HandState) {
		state1.numCards.assertEquals(state2.numCards);
		//state1.cards.length.assertEquals(state2.suite);
		//state1.rank.assertEquals(state2.rank);
	}
};

export class HandPublicInput extends Struct({
  state: HandState,
  deckCards: CardIds,
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
				HandState.assertInitialState(input.state, rank);
				return new CardIds({ids: input.state.cards.ids});;
			}
		},

		add: {
			privateInputs: [SelfProof<HandPublicInput, CardIds>,
							CardProof],

			method(input: HandPublicInput,
				earlierProof: SelfProof<HandPublicInput, CardIds>,
				cardProof: Proof<CardState, Field>): CardIds {

				// Verify previous deck state proof 
				earlierProof.verify();

				// Verify card proof
				cardProof.verify();

				// Verify card from valid deck
				let match: Bool = new Bool(false);
				let cardId = cardProof.publicOutput;

				for (let i = 0; i < 52; i++) {
					match = input.deckCards.ids[i].equals(cardId);
				}
				//match.assertTrue();

				// Add card to hand 
				const computedState = HandState.add(
								earlierProof.publicInput.state,
								cardId);

				HandState.assertEquals(input.state, computedState);

				return computedState.cards;
			}
		}

	}
});

export async function initHand() {
	console.log("compiling Card circuit...");
	await CardGen.compile();
	console.log("compiling finised");

	console.log("compiling Hand circuit...");
	await HandGen.compile();
	console.log("compiling finised");

}
export async function createHand(deckCards: CardIds, rank: Field) {

	console.log("Creating Hand..");
	let hand0 = HandState.initState(rank);
	let publicInput0 = new HandPublicInput({
		state: hand0,
		deckCards: deckCards,
	})

	let hproof0 = await HandGen.create(publicInput0, rank);
	let suite = Field(1);
	let card, cproof;

	console.log(`Adding card of rank:${rank}`);
	card = CardState.newCard(Field(1), suite, rank);
	console.log(`new card :${rank}`);
	cproof = await CardGen.checkCard(card, Field(1), suite, rank);
	console.log(`checked new card :${rank}`);

	let cardId = cproof.publicOutput;
	let hand = HandState.add(hand0, cardId);
	let publicInput = new HandPublicInput({
		state: hand,
		deckCards: deckCards,
	})
	let hproof = await HandGen.add(publicInput, hproof0, cproof);

	console.log(`Creating Hand done for ${rank}}.`);
	console.log("Handcards[0]:", hproof.publicOutput.ids[0].toBigInt());
}

await initHand();

let cardsdeck = new CardIds({ ids: [...new Array(52)].map((v, i) => {
								return Poseidon.hash([Field(i)]);
							})});
console.log("CARDS:", cardsdeck.ids);
await createHand(cardsdeck, Field(2));