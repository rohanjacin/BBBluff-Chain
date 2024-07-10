import Header from "@/components/header";
import { Toaster } from "@/components/ui/toaster";
import { useChainStore, usePollBlockHeight } from "@/lib/stores/chain";
import { useClientStore } from "@/lib/stores/client";
import { useNotifyTransactions, useWalletStore } from "@/lib/stores/wallet";
import { ReactNode, useEffect, useMemo } from "react";

export default function AsyncLayout({ children }: { children: ReactNode }) {
  const wallet = useWalletStore();
  const client = useClientStore();
  const chain = useChainStore();

  usePollBlockHeight();
  //useObserveBalance();
  useNotifyTransactions();

  useEffect(() => {
    client.start();
  }, []);

  useEffect(() => {
    wallet.initializeWallet();
    wallet.observeWalletChange();
  }, []);

  const loading = useMemo(
    () => client.loading,
    [client.loading],
  );

  return (
    <>
      <Header
        loading={client.loading}
        wallet={wallet.wallet}
        onConnectWallet={wallet.connectWallet}
        blockHeight={chain.block?.height ?? "-"}
      />
      {children}
      <Toaster />
    </>
  );
}
