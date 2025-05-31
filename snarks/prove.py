import os
import ezkl
import torch
import json
import argparse
from datetime import datetime

def main():
    parser = argparse.ArgumentParser(description="Run inference and optionally generate a zk proof.")
    parser.add_argument(
        "--model",
        type=str,
        required=True,
        help="Model name, used to locate files under models/<model>-..."
    )
    args = parser.parse_args()
    model_base = f"models/{args.model}"

    # Paths
    compiled_model_path = f"{model_base}-network.compiled"
    pk_path = f"{model_base}-test.pk"
    data_path = "input.json"
    proof_path = "proof.json"
    witness_path = "witness.json"

    res = ezkl.mock(witness_path, compiled_model_path)
    assert res == True, "Mock run failed: constraints not satisfied"

    res = ezkl.prove(
        witness_path,
        compiled_model_path,
        pk_path,
        proof_path,
        "single",
    )

if __name__ == "__main__":
    # Example usage:
    # python proof.py --input 1 3 3 4 5 6 --model network --prove
    main()
