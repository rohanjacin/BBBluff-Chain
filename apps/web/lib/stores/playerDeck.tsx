import { create } from "zustand";
import { Client, useClientStore } from "./client";
import { immer } from "zustand/middleware/immer";
import { PendingTransaction, UnsignedTransaction } from "@proto-kit/sequencer";
import { BalancesKey, TokenId } from "@proto-kit/library";
import { PrivateKey, PublicKey, UInt64, Field } from "o1js";
import { useCallback, useState, useEffect } from "react";
import { useChainStore } from "./chain";
import { useWalletStore } from "./wallet";

export class PlayerInfo {
  constructor(publicKey, sessionKey,
      secret, root) {
    this.publicKey = publicKey; 
    this.sessionKey = sessionKey;
    this.secret = secret;
    this.root = root;
  }
};

export class DeckState {
  constructor(numCards, cards, root) {
    this.numCards = numCards;
    this.cards = cards;
    this.root = root;    
  }
};

export interface PlayerStore {
  Deck: DeckState;
  //Player: PlayerInfo;
  //add: (client: Client, address: string, info: PlayerInfo) => Promise<void>;
}

function isPendingTransaction(
  transaction: PendingTransaction | UnsignedTransaction | undefined,
): asserts transaction is PendingTransaction {
  if (!(transaction instanceof PendingTransaction))
    throw new Error("Transaction is not a PendingTransaction");
}

export var bobInfo = new PlayerInfo();
const bobPrivateKey = PrivateKey.random();
const bob = bobPrivateKey.toPublicKey();
bobInfo.publicKey = bob;
bobInfo.sessionKey = Field.random();
bobInfo.secret = Field.random();
bobInfo.root = Field.random();

//export var deck = new DeckState(); 


/*export const usePlayerDeckStore = function () {
  console.log("usePlayerDeckStore");
}
*/
export const usePlayerDeckStore = create<
  PlayerStore,
  [["zustand/immer", never]]
>(
  immer((set) => ({
    Deck: { numCards: 0, cards: [...new Array(52)], root: 0n },
/*    Player: { publicKey: bobInfo.publicKey, 
              sessionKey: bobInfo.sessionKey,
              secret: bobInfo.secret,
              root: bobInfo.root
            },
*/
    async add(client: Client, address: string, info: PlayerInfo) {
      set((state) => {
      });
      console.log("aaddd");

      const bbbluff = client.runtime.resolve("BBBluff");
      const player = PublicKey.fromBase58(address);

      const tx = await client.transaction(player, () => {
        bbbluff.addPlayers(player, info);
      });

      console.log("aaddddone");

      await tx.sign();
      await tx.send();

      console.log("aaddddone1");

      isPendingTransaction(tx.transaction);
      return tx.transaction;

      set((state) => {
      });
    },
  })),
);

async function test () {
  console.log("testing...");
}

export const addPlayer = () => {
  console.log("addplayer");
  const client = useClientStore();
  const wallet = useWalletStore();
  const playerDeck = usePlayerDeckStore();

  return useCallback(async () => {
    if (!client.client || !wallet.wallet) return;
    console.log("In useCallback");

      // await test();

      try {
        const pendingTransaction = await playerDeck.add(
          client.client,
          wallet.wallet,
          bobInfo,
        );
        console.log("Callback done..");
        wallet.addPendingTransaction(pendingTransaction);
      }catch (e) {
        console.log("e:", e);
      }

  }, [client.client, wallet.wallet]);
};

export const claimCards = () => {
  //const client = useClientStore();
  //const wallet = useWalletStore();
  //const playerDeck = usePlayerDeckStore();

};
