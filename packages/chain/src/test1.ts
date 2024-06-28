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
		 MerkleMap,
		 MerkleTree,
		 MerkleWitness,
} from 'o1js';

const key = Field.random();
const value = Field(12);


/*const map = new MerkleMap();
map.set(key, value);
const root = map.getRoot();
console.log("root:", root);

const witness = map.getWitness(key);
console.log("witness:", witness);

const [computedRoot, computedKey] = witness.computeRootAndKey(value);
console.log("computedRoot:", computedRoot);
console.log("computedKey:", computedKey);
*/

const treeHeight = 2;

// creates a tree of height 8
const Tree = new MerkleTree(treeHeight);

// creates the corresponding MerkleWitness class that is circuit-compatible
class MyMerkleWitness extends MerkleWitness(treeHeight) {}

// sets a value at position 0n
Tree.setLeaf(0n, Field(121));
Tree.setLeaf(1n, Field(122));
console.log("Tree:", Tree);

// gets the current root of the tree
const root = Tree.getRoot();
console.log("root:", root);
// gets a plain witness for leaf at index 0n
const witness = Tree.getWitness(0n);
console.log("witness:", witness);

// creates a circuit-compatible witness
const circuitWitness = new MyMerkleWitness(witness);
console.log("circuitWitness:", circuitWitness);

// calculates the root of the witness
const calculatedRoot = circuitWitness.calculateRoot(Field(121));
console.log("calculatedRoot:", calculatedRoot);
console.log("ret:", calculatedRoot.equals(root));