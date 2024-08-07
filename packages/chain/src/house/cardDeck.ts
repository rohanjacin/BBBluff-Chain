import { Field,
		 Experimental,
		 verify,
		 Struct,
		 Proof,
		 JsonProof,
		 Provable,
		 UInt64,
		 Poseidon,
		 SelfProof,
		 MerkleMap,
		 PublicKey,
		 PrivateKey,
} from 'o1js';

import {
	PlayerInfo,
} from '../player.js';

// Card structure containing 
// qty - 1
// suite - suite of the card
// rank - rank of the card

export class CardState extends Struct({
	qty: Field,
	suite: Field,
	rank: Field,
	id: Field,
}) {
	// Initial state
	static newCard(_qty: Field, _suite: Field, _rank: Field,
					_sessionKey: Field) {
		return new CardState({
			qty: Field(_qty),
			suite: Field(_suite),
			rank: Field(_rank),
			id: Poseidon.hash([_sessionKey]),
		});
	}

	// Check the card
	static checkCard(state: CardState, _qty: Field,
			_suite: Field, _rank: Field) {
		return new CardState({
			qty: _qty,
			suite: _suite,
			rank: _rank,
			id: state.id,
		});
	}

	// Nullify the card
	static nullifyCard(state: CardState, _qty: Field,
			_suite: Field, _rank: Field, 
			_sessionKey: Field) {
		return new CardState({
			qty: Field(0),
			suite: Field(0),
			rank: Field(0),
			id: Poseidon.hash([state.id, _qty, _suite, _rank, _sessionKey]),
		});
	}

	// Assert equality of state
	static assertEquals(state1: CardState, state2: CardState) {
		state1.qty.assertEquals(state2.qty);
		state1.suite.assertEquals(state2.suite);
		state1.rank.assertEquals(state2.rank);
	}
};

export class CardIds extends Struct({
	ids: Provable.Array(Field, 52),
}){
/*	static init = () => {
		this.ids = [];
	},

	static add = (cardId: Field):ids => {
		this.ids = [...this.ids, cardId];
		return this.ids;
	},*/	
};

export class DeckState extends Struct({
	numCards: Field,
	cards: CardIds,
	root: Field,
}) {
	// Initial state
	static initState() {
		return new DeckState({
			numCards: Field(0),
			cards: new CardIds({ ids: [...new Array(52)]
								.map((e) => Field(0))}),
			root: Field(0),
		});
	}

	// Add a card on top
	static add(state: DeckState, cardId: Field) {		
		return new DeckState({
			cards: new CardIds({ ids: state.cards.ids.map((value, index) => {
						let match = Field(index).equals(state.numCards);
						return Provable.if (match, cardId, Field(value));
					})}),			
			numCards: state.numCards.add(1),
			root: state.root,
		});
	}

	// Assert initial state
	static assertInitialState(state: DeckState) {
		state.numCards.assertEquals(Field(0));
	}

	// Assert equality of state
	static assertEquals(state1: DeckState, state2: DeckState) {
		state2.numCards.assertEquals(state1.numCards);
	}
};


export const CardGen = Experimental.ZkProgram({

	// Name and state of deck 
	name: "Card",
	publicInput: CardState,
	publicOutput: Field,

	methods: {
		// Check card suite and rank 
		checkCard: {
			privateInputs: [Field, Field, Field, Field],

			method(newState: CardState, 
				qty: Field, suite: Field, rank: Field,
				sessionKey: Field): Field {

				// Check card inputs against claimed state 
				const computedState = CardState.checkCard(newState,
										qty, suite, rank);
				CardState.assertEquals(computedState, newState);

				const outputState = CardState.nullifyCard(computedState,
									 qty, suite, rank, sessionKey);
				return outputState.id;
			},
		},
	},
});

export const CardProof =  Experimental.ZkProgram.Proof(CardGen);

// Card deck zk circuit/program
export const DeckGen = Experimental.ZkProgram({

	// Name and state of deck 
	name: "Card-Deck",
	publicInput: DeckState,
	publicOutput: DeckState,

	methods: {
		// Create base 
		create: {
			privateInputs: [],

			method(state: DeckState): DeckState {
				DeckState.assertInitialState(state);

				return state;
			},
		},

		// Add card to deck specifying suite and rank 
		add: {
			privateInputs: [SelfProof<DeckState, DeckState>, CardProof],

			method(newState: DeckState, 
				earlierProof: SelfProof<DeckState, DeckState>,
				cardProof: Proof<CardState, Field>): DeckState {

				// Verify previous deck state proof 
				earlierProof.verify();

				Provable.asProver(() => {
					console.log("Here1");
				});
				// Verify card proof 
				cardProof.verify();

				Provable.asProver(() => {
					console.log("Here2");
				});

				// Check card inputs against claimed state 
				const computedState = DeckState.add(
								earlierProof.publicInput,
								cardProof.publicOutput);
				Provable.asProver(() => {
					console.log("newState", newState.numCards.toBigInt());

					console.log("computedState", computedState.numCards.toBigInt());
				});

				//DeckState.assertEquals(computedState, newState);

				return computedState; 
			},
		},
	},
});

export class DeckProof extends Experimental.ZkProgram.Proof(DeckGen) {};

//let DeckMap: MerkleMap = new MerkleMap();
