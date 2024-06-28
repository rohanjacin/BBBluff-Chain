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
		 verify,
		 VerificationKey,
} from 'o1js';

import { hkdf } from '@panva/hkdf';

import { CardState,
		 CardGen,
		 CardProof,
		 DeckState,
		 DeckProof,
		 CardIds,
		 Player,
} from '../house/cardDeck.js';

/*import { PlayerDeck,
		 Player,
		 alice, 
} from './player.js';
*/
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

export async function createHand(rank: Field): Promise<HandProof> {

	let deckRoot = PlayerInfo.root;
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
	card = CardState.newCard(Field(1), suite, rank, PlayerInfo.sessionKey);
	console.log(`new card :${rank}`);
	cproof = await CardGen.checkCard(card, Field(1), suite, rank,
													PlayerInfo.sessionKey);
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

var PlayerInfo: Player;

async function _initPlayers () {

	const privateKey = PrivateKey.random();
	const secret = Field.random();
	const counter = "1";
	const _sessionKey = await hkdf('sha256', secret.toString(), '', counter, 32);
	const sessionKey = Field.from(__bytesToBigint(_sessionKey));

	PlayerInfo = new Player({
		publicKey: privateKey.toPublicKey(),
		sessionKey: sessionKey,
		secret: Field.random(),
		root: Field.random(), //PlayerDeckMap.getRoot(),
	});

	console.log("hand:PublicKey:", PlayerInfo.publicKey.toJSON());
	console.log("hand:Secret:", PlayerInfo.secret.toString());
	console.log("hand:SessionKey:", PlayerInfo.sessionKey.toString());
}

console.log("hand:compiling Card circuit...");
await CardGen.compile();
console.log("hand:compiling finised");

console.log("hand:compiling Hand circuit...");
const { verificationKey } = await HandGen.compile();
console.log("hand:compiling finised");

console.log("\nContinuing..");
await _initPlayers();
console.log("\nContinuing..");
const proof = await createHand(Field(2));
const ret = await verify(proof, verificationKey);
console.log("Ret:", ret);
