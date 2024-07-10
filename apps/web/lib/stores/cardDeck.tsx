import { create } from "zustand";
import { Client, useClientStore } from "./client";
import { immer } from "zustand/middleware/immer";
import { PendingTransaction, UnsignedTransaction } from "@proto-kit/sequencer";
import { BalancesKey, TokenId } from "@proto-kit/library";
import { PublicKey, UInt64 } from "o1js";
import { useCallback, useState, useEffect } from "react";
import { useChainStore } from "./chain";
import { useWalletStore } from "./wallet";

export class DeckState {
  constructor(numCards, cards, root) {
    this.numCards = numCards;
    this.cards = cards;
    this.root = root;    
  }
};

export interface DeckStore {
  Deck: DeckState;
  add: (client: Client, address: string, deck: DeckState) => Promise<void>;
}

function isPendingTransaction(
  transaction: PendingTransaction | UnsignedTransaction | undefined,
): asserts transaction is PendingTransaction {
  if (!(transaction instanceof PendingTransaction))
    throw new Error("Transaction is not a PendingTransaction");
}

export var deck = new DeckState(); 

export const useCardDeckStore = create<
  DeckStore,
  [["zustand/immer", never]]
>(
  immer((set) => ({
    Deck: { numCards: 0, cards: [...new Array(52)], root: 0n },
    async add(client: Client, address: string, deck: DeckState) {
      set((state) => {
      });

      const bbbluff = client.runtime.resolve("BBBluff");
      const dealer = PublicKey.fromBase58(address);

      const tx = await client.transaction(dealer, (deck) => {
        bbbluff.addDeck(dealer, deck);
      });

      await tx.sign();
      await tx.send();

      isPendingTransaction(tx.transaction);
      return tx.transaction;

      set((state) => {
      });
    },
  })),
);

export const addDeck = () => {
  const client = useClientStore();
  const wallet = useWalletStore();
  let cardDeck;

  console.log("Addddddeck");
  try {
    console.log("in try catch");

    cardDeck = useCardDeckStore();
  }
  catch(e) {
    console.log("e:", e);
  }

  return useCallback(async () => {
    if (!client.client || !wallet.wallet) return;

    const pendingTransaction = await cardDeck.add(
      client.client,
      wallet.wallet,
      deck,
    );

    wallet.addPendingTransaction(pendingTransaction);
  }, [client.client, wallet.wallet]);
};

export const uploadDeck = (file) => {
  const client = useClientStore();
  const wallet = useWalletStore();

  return useCallback(async (file) => {
    if (!client.client || !wallet.wallet) return;

      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        const obj = JSON.parse(reader.result);
        deck.numCards = obj.numCards;
        deck.cards = obj.cards;
        deck.root = obj.root;
      }
      reader.onerror = () => {
        console.log("Error");        
      }
  }, [client.client, wallet.wallet]);
};

import defaultImage from '@/public/clubs.png';

export const getCardImage = (idx) => { 
  const cardDeck = useCardDeckStore();
  const [error, setError] = useState(null)
  const [image, setImage] = useState(defaultImage)

  useEffect(() => {
      const fetchImage = async () => {
          try {
              console.log("deck.cards[idx]:", deck.cards[idx-1]);
              const response = await import(`@/public/${deck.cards[idx-1]}.png`) // change relative path to suit your needs
              setImage(response.default)
          } catch (err) {
              setError(err)
          } finally {
          }
      }

      fetchImage()
  }, [idx])

  console.log("Card image is:", image);
  return image;
}