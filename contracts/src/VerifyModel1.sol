// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


interface Halo2Verifier {
    function verifyProof(bytes calldata proof, uint256[] calldata instances) external view;
}

contract VerifyModel1 {
    address HALO2_VERIFIER = 0x967AfAfb5385dC10c7108bdb580D4644C9f8d8cA;
    struct ProofOnAkave{
        string key;
        bytes32 hash;
    }
    event Proofs(address indexed prover, ProofOnAkave proof);


    function processProof(bytes calldata proofCalldata, string calldata _key) external {
        (bool success, bytes memory data) = HALO2_VERIFIER.call(proofCalldata);
        require(success && data.length == 32 && uint8(data[31]) == 1, "Invalid proof");
        bytes32 _hash = computeAkaveHash(proofCalldata);
        emit Proofs(msg.sender, ProofOnAkave({key: _key, hash: _hash}));
    }

    function computeAkaveHash(bytes calldata proof) public pure returns(bytes32){
        //todo
        return keccak256(abi.encode(proof));
    }

}