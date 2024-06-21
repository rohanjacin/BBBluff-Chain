import { Field, Experimental, verify, Struct, Proof } from 'o1js';

// Card structure containing 
// qty - 1
// suite - suite of the card
// rank - rank of the card

class CardState extends Struct({
	qty: Field,
	suite: Field,
	rank: Field,
}) {
	// Initial state
	static newCard(_qty: Field, _suite: Field, _rank: Field) {
		return new CardState({
			qty: Field(_qty),
			suite: Field(_suite),
			rank: Field(_rank),
		});
	}

	// Check the card
	static checkCard(state: CardState, _qty: Field,
			_suite: Field, _rank: Field) {
		return new CardState({
			qty: _qty,
			suite: _suite,
			rank: _rank,		
		});
	}

	// Assert equality of state
	static assertEquals(state1: CardState, state2: CardState) {
		state1.qty.assertEquals(state2.qty);
		state1.suite.assertEquals(state2.suite);
		state1.rank.assertEquals(state2.rank);
	}
};


export const CardGen = Experimental.ZkProgram({

	// Name and state of deck 
	name: "Card",
	publicInput: CardState,

	methods: {
		// Check card suite and rank 
		checkCard: {
			privateInputs: [Field, Field, Field],

			async method(newState: CardState, 
				qty: Field, suite: Field, rank: Field) {

				// Check card inputs against claimed state 
				const computedState = CardState.checkCard(newState,
										qty, suite, rank);
				CardState.assertEquals(computedState, newState);
			},
		},
	},
});

export async function initCards() {

	// Compile the circuit/program
	console.log("compiling...");
	const { verificationKey } = await CardGen.compile();
	console.log("compiling finised");

	const MAXCARDS = 52;
	let qty = 1, suite, rank;
	let state, proof;
	//let proofJsonList = Provable.Array(JsonProof, MAXCARDS);

	// Create card proofs 
	for (let i = 1, suite = 1; suite <= 4; suite++) {

		for (rank = 1; rank <= 13; rank++, i++) {
			console.log(`working on card${i}`);
			let state = CardState.newCard(Field(1), Field(suite), Field(rank));
			let proof = await CardGen.checkCard(state, Field(1), Field(suite), Field(rank));
			console.log("proving card done");
			//proofJson = proof.toJSON(); 

			console.log(`qty:${proof.publicInput.qty.toString()}` +
				` suite:${proof.publicInput.suite.toString()}` + 
				`rank:${proof.publicInput.rank.toString()}`);
		}
	}
} 
