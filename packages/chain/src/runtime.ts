import { Balance } from "@proto-kit/library";
import { Balances } from "./balances";
import { Player } from "./player";
import { Hands } from "./player/hand";
import { BBBluff } from "./house/bbbluff";

import { ModulesConfig } from "@proto-kit/common";

export const modules = {
  Balances,
  Player,
  Hands,
  BBBluff,
};

export const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: Balance.from(10_000),
  },
  Hands: {},
  Player: {},
  BBBluff: {},
};

export default {
  modules,
  config,
};
