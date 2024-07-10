import { Balance } from "@proto-kit/library";
import { Balances } from "./balances";
import { Player } from "./player";
import { BBBluff } from "./house/bbbluff";

import { ModulesConfig } from "@proto-kit/common";

export const modules = {
  Balances,
  Player,
  BBBluff,
};

export const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: Balance.from(10_000),
  },
  Player: {},
  BBBluff: {},
};

export default {
  modules,
  config,
};
