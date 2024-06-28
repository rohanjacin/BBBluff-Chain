import { Field,
		 Experimental,
		 verify,
		 Struct,
		 Proof,
		 JsonProof,
		 Provable,
		 UInt64,
		 Poseidon,
		 SelfProof,
		 Bool,
} from 'o1js';


const test =  Experimental.ZkProgram({

	name: "Test",
	publicInput: Field,
	publicOutput: Field,

	methods: {

		test1: {
			privateInputs: [Field, Field],

			method(answer: Field, x: Field, y: Field): Field {

				const result = x.add(y);

				result.assertEquals(answer);

				return Provable.if(result.equals(answer), new Field(1), new Field(2));
			}
		}
	}
});

console.log("Compiling..");
const { verificationKey } = await test.compile();
console.log("done.");

console.log("Creating proof..");
const proof = await test.test1(Field(5), Field(2), Field(3));
console.log("Done creating proof..");

console.log("Output is:", proof.publicOutput.toString());

console.log("Verifying..");
const ret = await verify(proof, verificationKey);
console.log("done:", ret);


