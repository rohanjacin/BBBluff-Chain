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
} from 'o1js';

import {
	DeckState,
	initCards,
} from './cardDeck';

import {
	HandProof,
} from '../player/hand';

class BBBluff extends SmartContract {
	@method async verifyHand(proof: HandProof) {
		proof.verify();
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

let bbbluff = new BBBluff(dealer.publicKey);
let deck: DeckState = await initCards();
