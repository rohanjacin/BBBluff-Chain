import { Field,
		 UInt64,
		 PublicKey,
		 PrivateKey,
		 Struct,
} from 'o1js';

import {
	RuntimeModule, runtimeModule, runtimeMethod, state
} from '@proto-kit/module';

import { State, StateMap } from '@proto-kit/protocol';

import { hkdf } from '@panva/hkdf';

export class PlayerInfo extends Struct({
	publicKey: PublicKey,
	sessionKey: Field,
	secret: Field,
	root: Field,
}){}

@runtimeModule()
class Player extends RuntimeModule {
	@state() public players = StateMap.from<PublicKey, PlayerInfo>(
		PublicKey,
		PlayerInfo
	)

	@runtimeMethod()
	public addPlayer(address: PublicKey, info: PlayerInfo): void {
		this.players.set(address, info);
	}
}

export async function initPlayers(): Promise<PlayerInfo[]> {

	const privateKey = PrivateKey.random();
	const secret = Field.random();
	const counter = "1";
	const _sessionKey = await hkdf('sha256', secret.toString(), '', counter, 32);
	const sessionKey = Field.from(_bytesToBigint(_sessionKey));

	let playerInfo = new PlayerInfo({
		publicKey: privateKey.toPublicKey(),
		sessionKey: sessionKey,
		secret: Field.random(),
		root: Field(0),
	});

	console.log("PublicKey:", playerInfo.publicKey.toJSON());
	console.log("Secret:", playerInfo.secret.toString());
	console.log("SessionKey:", playerInfo.sessionKey.toString());

	return [playerInfo];
}

function _bytesToBigint(bytes: Uint8Array | number[]) {
  let x = 0n;
  let bitPosition = 0n;
  for (let byte of bytes) {
    x += BigInt(byte) << bitPosition;
    bitPosition += 8n;
  }
  return x;
}
