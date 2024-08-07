"use client";

import { useEffect, useMemo } from 'react';
import { DealerPage } from "@/components/dealerPage";
//import { useWalletStore } from "@/lib/stores/wallet";
//import { type ClientAppChain } from 'bbbluff-chain';
import { client } from 'bbbluff-chain';

const role = "dealer";

export default function BBBluff() {
  //const wallet = useWalletStore();
  const client1 = useMemo(() => client(), []);

  useEffect(() => {
    console.log('Starting client');

    client1.start();
  }, []);

  return (
    <div className="mx-auto -mt-32 h-full pt-16">
      <div className="flex h-full w-full items-center justify-center pt-16">
        <div className="flex basis-4/12 flex-col items-center justify-center 2xl:basis-3/12">
        </div>
      </div>
    </div>
  );
}