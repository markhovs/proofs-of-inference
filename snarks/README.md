# Little Transformer Example

This is a **minimal, educational transformer model** implemented in PyTorch Lightning. It is designed to learn simple sequence-to-sequence tasks using transformer architecture.


Proof keys are too large to store on github download them from [this google drive](https://drive.google.com/drive/folders/1hM5NMIlcBYmYgpe5m1P0l9pX8LHl0XnQ?usp=sharing)

Presentation of the project is in file *PragueHackathon2025@ETHGlobal.pptx*. and also avalible at [Pitch](https://pitch.com/v/prague-hackathon-2025-ethglobal-vmvuwv)

## Overview

This model is trying to learn **sequence transformations**, like:

* Reversing sequences
* Adding numbers
* Computing parity bits
* Predicting the next character in a text (Wikipedia)

It uses a small transformer architecture and trains it on synthetic tasks to show that transformers can learn patterns like addition, reversing, or parity.

---

## Datasets & Tasks

There are 4 toy datasets defined, each wrapped in a PyTorch Lightning `DataModule`:

### 1. **AdditionDataModule**

Task: Learn to perform **digit-wise addition** of two numbers.

```python
[i1, i2, j1, j2, s1, s2, s3]
# Example: i = 23 → [2, 3], j = 41 → [4, 1], i+j = 64 → [0, 6, 4]
# Input:   [2, 3, 4, 1, ?, ?, ?]
# Target:     [3, 4, 1, 0, 6, 4]
```

* Inputs: first 6 digits
* Targets: last 6 digits (sliding window by 1)
* Small vocabulary: digits (0–9)
* Useful to show if the model can "learn addition" just from patterns.


### 2. **ReverseDataModule**

Task: **Reverse a sequence** of digits

```python
Input:  [1, 2, 3, 4, 5, 6]
Target: [6, 5, 4, 3, 2, 1]
```

* Sequence reversal
* Easy to learn with attention.

### 3. **ParityDataModule**

Task: Compute the **cumulative parity** of bits

```python
Input:  [1, 0, 1, 1, 0]
Target: [1, 1, 0, 1, 1]
# Target[i] = parity of input[0:i+1]
```

* Hardest task (non-local pattern, non-linear)
* Requires reasoning across positions
* Needs multiple transformer layers to learn

---

### 4. **WikipediaDataModule**

Task: Predict the **next character** in an English text

* Downloads and extracts `enwik8`
* Input: sequences of 50 characters
* Target: same sequence, shifted by 1 position (next-token prediction)

```python
Input:  [‘T’, ‘h’, ‘e’, ‘ ’, ‘c’, ‘a’, …]
Target:      [‘h’, ‘e’, ‘ ’, ‘c’, ‘a’, …]
```

---

## Model Architecture: `LittleTransformer`

```text
Input sequence of tokens (integers) →
[Token + Positional Embedding] →
[N × TransformerBlock] →
[Linear layer to vocab size] →
[LogSoftmax] → log-probabilities
```

Components:

* `TokenAndPositionEmbedding`: learns token and position embeddings.
* `TransformerBlock`: standard transformer block with:

  * Multi-head self-attention
  * Feedforward network (2-layer MLP)
  * LayerNorms and residuals
* `nn.Linear(embed_dim, vocab_size)` for final logits
* `LogSoftmax` for output (used with `F.nll_loss`)
