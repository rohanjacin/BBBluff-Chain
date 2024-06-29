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
} from 'o1js';

import {
	RuntimeModule, runtimeModule, runtimeMethod, state
} from '@proto-kit/module';

import { State, StateMap } from '@proto-kit/protocol';

import {
	DeckState,
	CardProof,
	initCards,
} from './cardDeck.js';

import {
	PlayerInfo,
	initPlayers,
} from '../player.js';

import {
	HandProof,
	initHand,
	createHand,
} from '../player/hand.js';

@runtimeModule()
class BBBluff extends RuntimeModule {
	@state() public deck = StateMap.from<PublicKey, DeckState>(
		PublicKey,
		DeckState
	);

	@runtimeMethod()
	public addDeck(address: PublicKey, deck: DeckState): void {
		this.deck.set(address, deck);
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

let Players: PlayerInfo[] = await initPlayers();
let deck: DeckState = await initCards(Players);
let vk = await initHand();
let proof = await createHand(Field(1), Field(1), 
					Field.random(), Players[0]);

/*let bbbluff = new BBBluff(dealer.publicKey);
console.log("Creating transaction");
let tx = await Mina.transaction(async () => {
				await bbbluff.verifyHand(proof)});
let [contractProof] = await tx.prove();
console.log("DONEE:", contractProof);*/