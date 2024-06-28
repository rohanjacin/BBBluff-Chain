import { Field,
		 UInt64,
		 PublicKey,
		 Struct,
} from 'o1js';

export class Player extends Struct({
	publicKey: PublicKey,
	sessionKey: Field,
	secret: Field,
}){}