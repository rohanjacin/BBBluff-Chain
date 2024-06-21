import { Balance } from "@proto-kit/library";
import { Balances } from "./balances";
import { Deck } from "./deck";
import { CardBalances } from "./cardBalances";

import { ModulesConfig } from "@proto-kit/common";

export const modules = {
  Balances,
  CardBalances,
  Deck,
};

export const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: Balance.from(10_000),
  },
  CardBalances: {},
  Deck: {},
};

export default {
  modules,
  config,
};
