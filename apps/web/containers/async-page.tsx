"use client";
import { Dealer } from "@/components/dealer";
import { Player } from "@/components/player";
import { addDeck, 
         uploadDeck,
        getCardImage
} from "@/lib/stores/cardDeck";
import { addPlayer, claimCards } from "@/lib/stores/playerDeck";

import { useWalletStore } from "@/lib/stores/wallet";

//const role = process.env.REACT_APP_role;
const role = "player";

export default function Home() {
  const wallet = useWalletStore();
  //const add = addDeck;
  //const upload = uploadDeck;
  //const image = getCardImage;
  // Player functions
  const join = addPlayer();
  //const claim = claimCards();

  return (
    <div className="mx-auto -mt-32 h-full pt-16">
      <div className="flex h-full w-full items-center justify-center pt-16">
        <div className="flex basis-4/12 flex-col items-center justify-center 2xl:basis-3/12">
          <Player
            wallet={wallet.wallet}
            onConnectWallet={wallet.connectWallet}
            onJoin={join}
            //onClaim={claim}            
          />
        </div>
      </div>
    </div>
  );
}
