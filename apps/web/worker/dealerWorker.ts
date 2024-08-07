import 'reflect-metadata';

import {
	Field,
	Proof,
	JsonProof,
	Poseidon,
	MerkleMap,
	PublicKey,
	PrivateKey,
} from 'o1js';

import {
	CardState,
	CardGen,
	CardProof,
	DeckState,
	DeckGen,
	DeckProof,
} from 'bbbluff-chain/dist/src/house/cardDeck.js';

import {
	PlayerInfo,
} from 'bbbluff-chain/dist/src/player.js';


export type DealerWorkerTasks = keyof typeof tasks;

export type DealerWorkerRequest = {
  id: number;
  fn: WorkerFunctions;
  args: any;
};

export type DealerWorkerReponse = {
  id: number;
  data: any;
};

const tasks = {

	initDeck: async (args: {}) => {
		// Compile the circuit/program
		console.log("compiling Card circuit...");
		await CardGen.compile();
		console.log("compiling finised");

		console.log("compiling Deck circuit...");
		await DeckGen.compile();
		console.log("compiling finised");

		return true;
	},

	proveDeck: async (args: { players: PlayerInfo[] }) => {

		const MAXCARDS = 52;
		let qty = 1, suite, rank;
		let card, cproof;
		let ids = [];
		let proofJson: JsonProof; 

		let deck0 = DeckState.initState();
		let dproof0 = await DeckGen.create(deck0);
		let deck = deck0;
		let dproof = dproof0;

		// Create card proofs 
		for (let i = 1, suite = 1; suite <= 1; suite++) {

			for (rank = 1; rank <= 1; rank++, i++) {
				console.log(`working on card${i}`);
				card = CardState.newCard(Field(1), Field(suite), Field(rank),
										players[0].sessionKey);
				cproof = await CardGen.checkCard(card, Field(1), Field(suite),
										Field(rank), players[0].sessionKey);
				proofJson = cproof.toJSON();
				console.log("proving card done:", proofJson.proof.length);
				//console.log("\nProof:", proofJson.proof);

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
				//console.log(`key:`, key);
				//console.log(`value:`, PlayerDeckMap.get(key));
				//console.log(`root:`, PlayerDeckMap.getRoot());
				deck = deck;
				dproof = dproof;
				console.log("Deckcards[i]:", dproof.publicInput.cards.ids[i-1].toBigInt());
			}
		}

		//let key = Poseidon.hash(players[0]);
		//let value = PlayerInfo.root;
		//DeckMap.set(key, value);
		deck.root = Field.random(); //DeckMap.getRoot();

		let cards = new CardIds({ids});
		console.log("cards[0]:", cards.ids[0].toBigInt());

		return dproof.toJSON();
	},
};

if (typeof window !== 'undefined') {
	addEventListener(
		'message',
		async (event: MessageEvent<DealerWorkerRequest>) => {
			const respData = await tasks[event.data.fn](event.data.args);

			const response: DealerWorkerReponse = {
				id: event.data.id,
				data: respData,
			} 
			postMessage(response);
		}
	)
}

const initMessage: DealerWorkerReponse = {
	id: 0,
	data: "init_success",
};

postMessage(initMessage);

