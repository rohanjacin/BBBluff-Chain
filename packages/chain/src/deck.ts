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

import {
	Field,
	PublicKey,
	PrivateKey,
	Scalar,
	Struct,
	SelfProof,
	Experimental,
	verify,
	JsonProof,
} from 'o1js';

const tmp:Scalar = Scalar.from(1);
const Owner:PublicKey = new PrivateKey(tmp).toPublicKey();

// Card deck structure containing 
// qty - current deck size
// suite - suite of the toppmost card
class DeckState extends Struct({
	qty: Field,
	suite: Field,
	rank: Field,
}) {
	// Initial state
	static initState() {
		return new DeckState({
			qty: Field(1),
			suite: Field(2),
			rank: Field(3),
		});
	}

	// Add a card on top
	static add(state: DeckState, _qty: Field,
			_suite: Field, _rank: Field) {
		return new DeckState({
			//qty: state.qty.add(Field(_qty)),
			qty: _qty,
			suite: _suite,
			rank: _rank,		
		});
	}

	// Assert initial state
	static assertInitialState(state: DeckState) {
		state.qty.assertEquals(Field(1));
		state.suite.assertEquals(Field(2));
		state.rank.assertEquals(Field(1));
	}

	// Assert equality of state
	static assertEquals(state1: DeckState, state2: DeckState) {
		state1.qty.assertEquals(state2.qty);
		state1.suite.assertEquals(state2.suite);
		state1.rank.assertEquals(state2.rank);
	}
};

@runtimeModule()
export class Deck extends RuntimeModule<unknown> {
	@state() public cards = StateMap.from<Field, PublicKey>(
		Field,
		PublicKey,
	);

	@runtimeMethod()
	public add(player: PublicKey, cardId: Field) {

		const curCardOwner = this.cards.get(cardId);
		const newCardOwner = this.cards.set(cardId, player);
	}

	@runtimeMethod()
	public transfer(player: PublicKey, cardId: Field) {

		let curCardOwner = this.cards.get(cardId);
		this.cards.set(cardId, player);
	}
}

// Card deck zk circuit/program
const DeckGen = Experimental.ZkProgram({

	// Name and state of deck 
	name: "Card-Deck",
	publicInput: DeckState,

	methods: {
		// Create base 
		create: {
			privateInputs: [],

			async method(state: DeckState) {
				DeckState.assertInitialState(state);
			},
		},

		// Add card to deck specifying suite and rank 
		add: {
			privateInputs: [SelfProof<DeckState, void>,
							Field, Field, Field],

			async method(newState: DeckState, 
				earlierProof: SelfProof<DeckState, void>,
				qty: Field, suite: Field, rank: Field) {

				// Verify previous card proof 
				earlierProof.verify();
				// Check card inputs against claimed state 
				const computedState = DeckState.add(
								earlierProof.publicInput,
								qty, suite, rank);
				DeckState.assertEquals(computedState, newState);
			},
		},
	},
});

export async function initDeck() {

	// Compile the circuit/program
	console.log("compiling...");
	const { verificationKey } = await DeckGen.compile();
	console.log("compiling finised");

	// Create initial state and base proof 
	console.log("proving initial state...");
	let state0 = DeckState.initState();
	let card_proof0 = await DeckGen.create(state0);
	console.log("proving initial state done");

	let qty = 1, suite, rank;
	let state, proof;
	let cardProofJson: JsonProof;

	// Add cards proofs iteratively
	for (let i = 1, suite = 4,  state = state0,
		proof = card_proof0; suite <= 4; suite++) {

		for (rank = 1; rank <= 13; rank++, i++) {
			console.log(`working on card${i}`);
			state = await DeckState.add(state, Field(qty), Field(suite), Field(rank));
			proof = await DeckGen.add(state, proof, Field(qty), Field(suite), Field(rank));
			state = state;
			proof = proof;
			console.log(`qty:${proof.publicInput.qty.toString()}` +
				` suite:${proof.publicInput.suite.toString()}` + 
				`rank:${proof.publicInput.rank.toString()}`);
		}
	}
} 
