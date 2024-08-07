import { TestingAppChain } from '@proto-kit/sdk';
import { log } from '@proto-kit/common';
import { UInt64, PrivateKey, PublicKey, Field, } from 'o1js';
import { DeckState, CardIds, } from '../src/house/cardDeck';
import { PlayerInfo, } from '../src/player';
import { BBBluff, GameStatus, GameSubStatus } from '../src/house/bbbluff';
import { Player } from '../src/player';
import { Hands, HandState } from '../src/player/hand';
import { Balances } from "@proto-kit/library";
import "reflect-metadata";

log.setLevel("ERROR");

describe('bbbluff test', () => {
/*    let appChain: TestingAppChain<{
        RuntimeModule{
        Balances: typeof Balances;
        Player: typeof Player;
        Hands: typeof Hands;
        BBBluff: typeof BBBluff;
        }
    }>;
*/
    let appChain = TestingAppChain.fromRuntime({
            Balances,
            Player,
            Hands,
            BBBluff,
        });

    appChain.configurePartial({
        Runtime: {
            Balances: {
                totalSupply: UInt64.from(10000),
            },
            BBBluff: {},
            Player: {},
            Hands: {},
        }
    })

    const dealerPrivateKey = PrivateKey.random();
    const dealer = dealerPrivateKey.toPublicKey();

    let playerPrivateKey: PrivateKey;
    let player: PublicKey;
    let playerCards: CardIds;

    beforeAll(async () => { 

        await appChain.start();
    });

    it('Start with assigning dealer.', async () => {
        
        appChain.setSigner(dealerPrivateKey);
        
        const bbbluff = appChain.runtime.resolve("BBBluff");

        const tx = await appChain.transaction(dealer, () => {
            bbbluff.init();
        });

        await tx.sign();
        await tx.send();

        await appChain.produceBlock();

        const gameState = await appChain.query.runtime.BBBluff.gameState.get();
        expect(gameState?.status).toEqual(UInt64.from(GameStatus.INIT));
        expect(gameState?.subStatus).toEqual(UInt64.from(GameSubStatus.NONE));

    }, 60000 * 10);

    it('Create the deck and add it.', async () => {
        
        appChain.setSigner(dealerPrivateKey);
        
        const bbbluff = appChain.runtime.resolve("BBBluff");

        const deck = new DeckState({
            numCards: Field(52),
            cards: new CardIds({ ids: [...new Array(52)]
                    .map((e) => Field.random())}),
            root: Field.random(),
        });

        playerCards = new CardIds({ ids: [...new Array(13)]});
        for (let i = 0; i < 13; i++) {
            playerCards.ids[i] = deck.cards.ids[i];
            //playerCards.ids[i] = deck.cards.ids.shift()!;
            console.log("Player Card[0]:"+ playerCards.ids[i]);
        }

        const tx = await appChain.transaction(dealer, () => {
            bbbluff.addDeck(deck);
        });

        await tx.sign();
        await tx.send();

        await appChain.produceBlock();

        const gameState = await appChain.query.runtime.BBBluff.gameState.get();
        expect(gameState?.status).toEqual(UInt64.from(GameStatus.SETUP));
        expect(gameState?.subStatus).toEqual(UInt64.from(GameSubStatus.DECKADDED));

    }, 60000 * 10);

    it('Should add a Player 1', async () => {

        const bbbluff = appChain.runtime.resolve("BBBluff");
        
        let addPlayers = async function () {
            let _privateKey = PrivateKey.random();
            let _player = _privateKey.toPublicKey();
            playerPrivateKey = _privateKey;
            player = _player;

            appChain.setSigner(_privateKey);  
          
            let info = new PlayerInfo({
                publicKey: _player,
                sessionKey: Field.random(),
                secret: Field.random(),
                root: Field.random(),
            });
           
            let tx = await appChain.transaction(_player, () => {
                bbbluff.join(info);
            });
           
            await tx.sign();
            await tx.send();

          let block = await appChain.produceBlock();
          expect(block!.transactions[0].status.toBoolean()).toBeTruthy();
        }

        await addPlayers();

        const gameState = await appChain.query.runtime.BBBluff.gameState.get();

        expect(gameState?.status).toEqual(UInt64.from(GameStatus.SETUP));
        expect(gameState?.subStatus).toEqual(UInt64.from(GameSubStatus.ADDINGPLAYERS));
        expect(gameState?.players.toBigInt()).toBe(1n);

    }, 60000 * 10);

    it('Should add a Player 2', async () => {

        const bbbluff = appChain.runtime.resolve("BBBluff");
        
        let addPlayers = async function () {
            let _privateKey = PrivateKey.random();
            let _player = _privateKey.toPublicKey();
            playerPrivateKey = _privateKey;
            player = _player;

            appChain.setSigner(_privateKey);  
          
            let info = new PlayerInfo({
                publicKey: _player,
                sessionKey: Field.random(),
                secret: Field.random(),
                root: Field.random(),
            });
           
            let tx = await appChain.transaction(_player, () => {
                bbbluff.join(info);
            });
           
            await tx.sign();
            await tx.send();

            let block = await appChain.produceBlock();
            expect(block!.transactions[0].status.toBoolean()).toBeTruthy();
        }

        await addPlayers();

        const gameState = await appChain.query.runtime.BBBluff.gameState.get();

        expect(gameState?.status).toEqual(UInt64.from(GameStatus.SETUP));
        expect(gameState?.subStatus).toEqual(UInt64.from(GameSubStatus.ADDINGPLAYERS));
        expect(gameState?.players.toBigInt()).toBe(2n);
        
    }, 60000 * 10);

    it('Should add a Player 3', async () => {

        const bbbluff = appChain.runtime.resolve("BBBluff");
        
        let addPlayers = async function () {
            let _privateKey = PrivateKey.random();
            let _player = _privateKey.toPublicKey();
            playerPrivateKey = _privateKey;
            player = _player;

            appChain.setSigner(_privateKey);  
          
            let info = new PlayerInfo({
                publicKey: _player,
                sessionKey: Field.random(),
                secret: Field.random(),
                root: Field.random(),
            });
           
            let tx = await appChain.transaction(_player, () => {
                bbbluff.join(info);
            });
           
            await tx.sign();
            await tx.send();

            let block = await appChain.produceBlock();
            expect(block!.transactions[0].status.toBoolean()).toBeTruthy();
        }

        await addPlayers();

        const gameState = await appChain.query.runtime.BBBluff.gameState.get();
        expect(gameState?.status).toEqual(UInt64.from(GameStatus.SETUP));
        expect(gameState?.subStatus).toEqual(UInt64.from(GameSubStatus.ADDINGPLAYERS));
        expect(gameState?.players.toBigInt()).toBe(3n);

    }, 60000 * 10);

    it('Should add a Player 4', async () => {

        const bbbluff = appChain.runtime.resolve("BBBluff");
        
        let addPlayers = async function () {
            let _privateKey = PrivateKey.random();
            let _player = _privateKey.toPublicKey();
            playerPrivateKey = _privateKey;
            player = _player;

            appChain.setSigner(_privateKey);  
          
            let info = new PlayerInfo({
                publicKey: _player,
                sessionKey: Field.random(),
                secret: Field.random(),
                root: Field.random(),
            });
           
            let tx = await appChain.transaction(_player, () => {
                bbbluff.join(info);
            });
           
            await tx.sign();
            await tx.send();

            let block = await appChain.produceBlock();
            expect(block!.transactions[0].status.toBoolean()).toBeTruthy();
        }

        await addPlayers();

        const gameState = await appChain.query.runtime.BBBluff.gameState.get();
        expect(gameState?.status).toEqual(UInt64.from(GameStatus.SETUP));
        expect(gameState?.subStatus).toEqual(UInt64.from(GameSubStatus.ADDINGPLAYERS));
        expect(gameState?.players.toBigInt()).toBe(4n);
        console.log("players:" + gameState?.players);

    }, 60000 * 10);

    it('Player should be able to claim cards from deck', async () => {
      
        appChain.setSigner(playerPrivateKey);

        const bbbluff = appChain.runtime.resolve("BBBluff");

        const tx = await appChain.transaction(player, async () => {
            await bbbluff.claimCards(dealer);
        });

        await tx.sign();
        await tx.send();

        let block = await appChain.produceBlock();
        expect(block!.transactions[0].status.toBoolean()).toBeTruthy();

        const gameState = await appChain.query.runtime.BBBluff.gameState.get();
        expect(gameState?.status).toEqual(UInt64.from(GameStatus.SETUP));
        expect(gameState?.subStatus).toEqual(UInt64.from(GameSubStatus.DISTRIBUTINGCARDS));

        let playerDeck = await appChain.query.runtime.BBBluff.deck.get(player);
        expect(playerDeck?.numCards).toEqual(Field(13));
        for (let i = 0; i < 13; i++) {
            expect(playerDeck?.cards.ids[i]).toEqual(playerCards.ids[i]);
        }

        let dealerDeck = await appChain.query.runtime.BBBluff.deck.get(dealer);
        expect(dealerDeck?.numCards).toEqual(Field(39));
    })

    it('Should start the game', async () => {
        appChain.setSigner(dealerPrivateKey);

        const bbbluff = appChain.runtime.resolve("BBBluff");

        const tx = await appChain.transaction(dealer, async () => {
            await bbbluff.start();
        });

        await tx.sign();
        await tx.send();

        let block = await appChain.produceBlock();
        console.log("Status:", block!.transactions[0].status.toBoolean());

        expect(block!.transactions[0].status.toBoolean()).toBeTruthy();

        const gameState = await appChain.query.runtime.BBBluff.gameState.get();
        expect(gameState?.status).toEqual(UInt64.from(GameStatus.START));
        expect(gameState?.subStatus).toEqual(UInt64.from(GameSubStatus.NONE));

    }, 60000 * 10);

    it('Should add hand', async () => {
        appChain.setSigner(playerPrivateKey);

        const bbbluff = appChain.runtime.resolve("BBBluff");

        const hand = new HandState({
            numCards: Field(1),
            rank: Field(1),
            cards: new CardIds({ ids: [...new Array(1)].map((e) => Field.random()) }),
        });

        const tx = await appChain.transaction(player, async () => {
            await bbbluff.addHand(hand);
        });

        await tx.sign();
        await tx.send();

        let block = await appChain.produceBlock();
        console.log("Status:", block!.transactions[0].status.toBoolean());
        expect(block!.transactions[0].status.toBoolean()).toBeTruthy();

        const gameState = await appChain.query.runtime.BBBluff.gameState.get();
        expect(gameState?.status).toEqual(UInt64.from(GameStatus.START));
        expect(gameState?.subStatus).toEqual(UInt64.from(GameSubStatus.PLAYINGHAND));

    }, 60000 * 10);

});
