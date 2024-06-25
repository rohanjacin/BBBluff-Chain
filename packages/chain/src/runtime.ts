import { Balance } from "@proto-kit/library";
import { Balances } from "./balances";
import { Deck } from "./deck";
import { CardBalances } from "./cardBalances";
import { PlayerDeck } from "./playerDeck";
//import { Hands } from "./hand";

import { ModulesConfig } from "@proto-kit/common";

export const modules = {
  Balances,
  CardBalances,
  Deck,
  //Hands,
  PlayerDeck,
};

export const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: Balance.from(10_000),
  },
  CardBalances: {},
  Deck: {},
  //Hands: {},
  PlayerDeck: {},
};

export default {
  modules,
  config,
};
