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

import { Struct, Field, PublicKey, PrivateKey, Scalar, Provable } from 'o1js';

const MAX_CARDS = 52;
class Cards extends Struct({
	cards: Provable.Array(Field, MAX_CARDS),
}) {}

@runtimeModule()
export class PlayerDeck extends RuntimeModule<unknown> {
	@state() public playerDeck = StateMap.from<PublicKey, Cards>(
		PublicKey,
		Cards,
	);

	@runtimeMethod()
	public add(player: PublicKey, cardId: Field) {

		const curPlayerDeck = this.playerDeck.get(player).value;
		curPlayerDeck.cards.push(cardId);
	}

	@runtimeMethod()
	public transfer(player: PublicKey, cardId: Field) {
	}
}

