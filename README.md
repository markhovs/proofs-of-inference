# zkML Proof Marketplace - ETHGlobal Prague 2025


## Overview

This project is a decentralized marketplace for Zero-Knowledge Machine Learning (zkML) proofs. It enables users to request, verify, and pay for cryptographic proofs of model inferences, using decentralized storage and smart contracts for persistence and escrow. Designed for ETHGlobal Prague 2025, it leverages cutting-edge technologies like Filecoin, Akave, and Ethereum smart contracts to provide trustless, auditable, and privacy-preserving ML proof generation.

## Key Components

### 1. AI Model Training (Model Provider)

- **Train a Machine Learning Model**: Simple model architectures are supported.
- **Quantize & Compile**: Models are quantized and compiled into zk-SNARK circuits using [ezkl](https://github.com/zkonduit/ezkl).
- **Key Generation**: Generates proving and verifying keys required for zero-knowledge proof generation and verification.

### 2. Proof Generation Backend (Model Provider)

- **Request Handling**: Receives proof requests from users or contracts.
- **Inference Matching**: Matches input and model hash, re-executes model inference.
- **Proof Generation**: Generates a new zkML proof.
- **Persistence & Notification**: Uploads the proof to Filecoin/Akave and notifies the verifier.

### 3. Decentralized Persistence (Akave/Filecoin)

- **Model Commitment**: Stores hashed model weights (commitment).
- **Proof Logs**: Stores proof logs (`proof.json`), input/output hashes, and timestamps.
- **Audit Trail**: Enables both the frontend and contract verifier to audit and trace proofs and model commitments.

### 4. Smart Contract: "Proof Requester & Payment Escrow"

- **Escrow Mechanism**: Users stake payments and hash their input.
- **Request Indexing**: Model providers see requests (off-chain indexed).
- **Proof Delivery**: Providers upload proof and outputs hash.
- **Verification & Settlement**: 
  - If valid, payment is released to provider.
  - If invalid or unfulfilled, user receives a refund.

### 5. Frontend Interface

- **Historical Proofs**: View all past proofs and their status.
- **Proof Requests**: Request new proofs for past or current inputs via contract interaction.
- **Verification**: Verify proofs locally or on-chain using the verifier.

---

## Usage

1. **Model providers** train and upload their models, then generate and upload proving/verifying keys.
2. **Users** request a proof by staking a payment and providing a hashed input.
3. **Proof Backend** processes the request, generates a proof, and uploads it to decentralized storage.
4. The **smart contract** manages payment escrow and unlocks payment to the provider upon successful verification.
5. **Frontend** allows for proof requests, historical audit, and on/off-chain verification.

---

## Tech Stack

- **Ethereum**: Smart contracts for escrow and proof request management.
- **Filecoin/Akave**: Decentralized storage for models, proofs, and logs.
- **ezkl**: Quantization and zkML circuit compilation.
- **Frontend**: React/Next.js (assumed; adapt as appropriate for your codebase).
- **Backend**: Node.js/Python for proof orchestration (adapt as appropriate for your codebase).

---

## Architecture

See the diagram above for a high-level overview of the system architecture and component interactions.

---

## Getting Started

1. **Clone the repository**
2. **Install dependencies** for each subcomponent (contracts, backend, frontend).
3. **Deploy** the smart contracts (see `/contracts`).
4. **Run** the backend service for proof generation.
5. **Start** the frontend to interface with users and verifiers.

---

## License

MIT

---

## Acknowledgements

- ETHGlobal Prague 2025
- Filecoin & Akave for decentralized storage
- ezkl for zkML tooling
