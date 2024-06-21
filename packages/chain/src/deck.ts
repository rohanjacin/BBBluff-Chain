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

import { Field, PublicKey, PrivateKey, Scalar } from 'o1js';

const tmp:Scalar = Scalar.from(1);
const Owner:PublicKey = new PrivateKey(tmp).toPublicKey();

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

