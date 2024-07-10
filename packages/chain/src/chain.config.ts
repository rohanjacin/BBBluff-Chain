import { ClientAppChain } from '@proto-kit/sdk';
import runtime from "./runtime";

export const client = ClientAppChain.fromRuntime(runtime.modules);

client.configurePartial({
  Runtime: runtime.config,
  GraphqlClient: {
    url: 'http://127.0.0.1:8080/graphql',
  }
});
