import { Field,
		 Experimental,
		 verify,
		 Struct,
		 Proof,
		 JsonProof,
		 Provable,
		 UInt64,
		 Poseidon,
		 SelfProof
} from 'o1js';

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
	static newCard(_qty: Field, _suite: Field, _rank: Field) {
		return new CardState({
			qty: Field(_qty),
			suite: Field(_suite),
			rank: Field(_rank),
			id: Poseidon.hash([Field.random()]),
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
			_suite: Field, _rank: Field) {
		return new CardState({
			qty: Field(0),
			suite: Field(0),
			rank: Field(0),
			id: Poseidon.hash([state.id, _qty, _suite, _rank]),
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
}) {
	// Initial state
	static initState() {
		return new DeckState({
			numCards: Field(0),
			//cards: new CardIds({ ids: []}), //CardIds.init(),
			cards: new CardIds({ ids: [...new Array(52)].map((e) => Field(0))}), //CardIds.init(),
		});
	}

	// Add a card on top
	static add(state: DeckState, cardId: Field) {
		return new DeckState({
			cards: new CardIds({ ids: state.cards.ids.map((value, index) => {
				Provable.asProver (() => {
						//console.log("index:", Field(index));
						//console.log("numCards:", state.numCards);
						//console.log("cond:", Field(index).equals(state.numCards));

				});
						let match = Field(index).equals(state.numCards);
						return Provable.if (match, cardId, Field(value));
					})}),			
			numCards: state.numCards.add(Field(1)),
			//cards: state.cards,
		});
	}

	// Assert initial state
	static assertInitialState(state: DeckState) {
		state.numCards.assertEquals(Field(0));
		//state.cards.length.assertEquals(0);
	}

	// Assert equality of state
	static assertEquals(state1: DeckState, state2: DeckState) {
		state1.numCards.assertEquals(state2.numCards);
		//state1.cards.length.assertEquals(state2.suite);
		//state1.rank.assertEquals(state2.rank);
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
			privateInputs: [Field, Field, Field],

			method(newState: CardState, 
				qty: Field, suite: Field, rank: Field): Field {

				// Check card inputs against claimed state 
				const computedState = CardState.checkCard(newState,
										qty, suite, rank);
				CardState.assertEquals(computedState, newState);

				const outputState = CardState.nullifyCard(computedState,
									 qty, suite, rank);
				return outputState.id;
			},
		},
	},
});

export const CardProof =  Experimental.ZkProgram.Proof(CardGen);

// Card deck zk circuit/program
const DeckGen = Experimental.ZkProgram({

	// Name and state of deck 
	name: "Card-Deck",
	publicInput: DeckState,
	publicOutput: CardIds,

	methods: {
		// Create base 
		create: {
			privateInputs: [],

			method(state: DeckState): CardIds {
				DeckState.assertInitialState(state);

				return state.cards;
			},
		},

		// Add card to deck specifying suite and rank 
		add: {
			privateInputs: [SelfProof<DeckState, CardIds>, CardProof],

			method(newState: DeckState, 
				earlierProof: SelfProof<DeckState, CardIds>,
				cardProof: Proof<CardState, Field>): CardIds {

				// Verify previous deck state proof 
				earlierProof.verify();

				// Verify card proof 
				cardProof.verify();

				// Check card inputs against claimed state 
				const computedState = DeckState.add(
								earlierProof.publicInput,
								cardProof.publicOutput);

				DeckState.assertEquals(computedState, newState);

				return computedState.cards; 
			},
		},
	},
});

export const DeckProof =  Experimental.ZkProgram.Proof(DeckGen);

export async function initCards() {

	//let HashedType = Hashed.create(String);
	//let hashed = HashedType.hash("Hello");

	// Compile the circuit/program
	console.log("compiling Card circuit...");
	await CardGen.compile();
	console.log("compiling finised");

	console.log("compiling Deck circuit...");
	await DeckGen.compile();
	console.log("compiling finised");

	const MAXCARDS = 52;
	let qty = 1, suite, rank;
	let card, cproof;
	let ids = [];
	let proofJson: JsonProof; 

	let deck0 = DeckState.initState();
	let dproof0 = await DeckGen.create(deck0);
	let deck, dproof;

	// Create card proofs 
	for (let i = 1, suite = 1, deck = deck0, dproof = dproof0;
		suite <= 4; suite++) {

		for (rank = 1; rank <= 13; rank++, i++) {
			console.log(`working on card${i}`);
			card = CardState.newCard(Field(1), Field(suite), Field(rank));
			cproof = await CardGen.checkCard(card, Field(1), Field(suite), Field(rank));
			console.log("proving card done");
			ids.push(cproof.publicOutput);

			console.log(`qty:${cproof.publicInput.qty.toString()}` +
				` suite:${cproof.publicInput.suite.toString()}` + 
				`rank:${cproof.publicInput.rank.toString()}` + 
				`id:${cproof.publicOutput}`);

			console.log(`cproof.id:${cproof.publicOutput}`);
			console.log(`ids[${i-1}]:`, ids);

			deck = DeckState.add(deck, cproof.publicOutput);
			dproof = await DeckGen.add(deck, dproof, cproof);
			console.log(`numCards:${dproof.publicInput.numCards.toString()}` +
				` cards:${dproof.publicInput.cards.ids}`);

			deck = deck;
			dproof = dproof;
			console.log("Deckcards[0]:", dproof.publicInput.cards.ids[i-1].toBigInt());
		}
	}

	let cards = new CardIds({ids});
	console.log("cards[0]:", cards.ids[0].toBigInt());
} 



//initCards();