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

import { Struct, Field, PublicKey, PrivateKey, Scalar, Provable, UInt64 } from 'o1js';

class HandInfo extends Struct({
	numOfCards: UInt64,
	player: PublicKey
}) {}

@runtimeModule()
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

export const HandGen = Experimental.ZkProgram({

	// Name and state of deck 
	name: "Hand",
	publicInput: CardState,
	publicOutput: CardState,

	methods: {



	}
}

