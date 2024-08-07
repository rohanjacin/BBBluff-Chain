import { 
	DealerWorkerTasks,
	DealerWorkerRequest
} from './dealerWorker';

import { 
	DeckProof
} from './cardDeck';

export default class DealerWorkerClient {

	worker: Worker;
	tasks: {
		[id: number]: { resolve: (res: any) => void ; reject: (res: any) => void }; 	
	}
	taskId: number;
	ready: Promise<void>;

	constructor() {
		this.tasks = {};
		this.taskId = 1;
		this.ready = new Promise((resolve, reject) => {
			this.tasks[0] = { resolve, reject };
		});

		this.worker = new Worker(new URL('./dealerWorker.ts', import.meta.url));
		(window as any).workerDealer = this.worker;

		this.worker.onmessage = (event) => {
			console.log("Message received");
		};
	}


	_callWorker(fn: DealerWorkerTasks, args: any) {
		return new Promise((resolve, reject) => {
			this.tasks[this.taskId] = { resolve, reject };

		  	const message: DealerWorkerRequest = { id: this.taskId, fn, args};

		  	this.worker.postMessage(message);

		  	this.taskId++;
		});
	}

	async init(): Promise<void> {
		await this.ready;
	}

	async initDeck() {
		const result = await this._callWorker("initDeck", {});
		console.log("Deck init:", result);

		return result;
	}

	async proveDeck() {
		const deckProofJSON = await this._callWorker("proveDeck", {});
		console.log("Deck proof:", deckProofJSON);

		const proof = DeckProof.fromJSON(deckProofJSON);

		return proof;
	}		
}