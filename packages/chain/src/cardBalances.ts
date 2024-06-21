import { 
	state,
	runtimeModule,
	RuntimeModule,
	runtimeMethod
} from "@proto-kit/module";
import {
	State,
	StateMap,
	assert,
} from "@proto-kit/protocol";

import { Bool, UInt64, PublicKey } from 'o1js';

@runtimeModule()
export class CardBalances extends RuntimeModule<unknown> {
	@state() public cardBalances = StateMap.from<PublicKey, UInt64>(
		PublicKey,
		UInt64,
	);

	@runtimeMethod()
	public transfer(from: PublicKey, to: PublicKey, amount: UInt64) {

		// Check for quantity of cards to be transfered
		assert( Bool.and( amount.greaterThanOrEqual(UInt64.from(1)),
						amount.lessThanOrEqual(UInt64.from(4))),
			'Invaid quantity of cards to be transfered'
		);

		const fromBalance = this.cardBalances.get(from).value;
		const toBalance = this.cardBalances.get(to).value;

		const fromBalanceIsSufficient = fromBalance.greaterThanOrEqual(amount);

		assert(fromBalanceIsSufficient, 'Insufficient cards on Player');

		const newFromBalance = fromBalance.sub(amount);

		this.cardBalances.set(from, newFromBalance);
	}
}