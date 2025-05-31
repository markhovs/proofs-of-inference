import os
import ezkl
import torch
import json
import asyncio
import argparse
from datetime import datetime

async def predict(input, data_path, compiled_model_path, witness_path):
    shape = [1, 6]
    x = torch.tensor(input, dtype=torch.long)
    x = x.reshape(shape)
    print("Input vector:", x)
    data_array = x.detach().numpy().reshape([-1]).tolist()

    # Serialize data into file:
    json.dump({"input_data": [data_array]}, open(data_path, 'w'))

    res = await ezkl.gen_witness(data_path, compiled_model_path, witness_path)
    assert os.path.isfile(witness_path)

    W = json.load(open(witness_path))
    rescaled_list = W["pretty_elements"]["rescaled_outputs"][0]

    # Group into 6 chunks of 10
    groups = [rescaled_list[i:i+10] for i in range(0, len(rescaled_list), 10)]

    # Find argmax for each chunk
    predicted_digits = []
    for grp in groups:
        float_vals = [float(s) for s in grp]
        argmax_index = int(float_vals.index(max(float_vals)))
        predicted_digits.append(argmax_index)

    print("Predicted digits:", predicted_digits)

def main():
    parser = argparse.ArgumentParser(description="Run inference and optionally generate a zk proof.")
    parser.add_argument(
        "--input",
        nargs=6,
        type=int,
        required=True,
        help="6 integers representing the input vector"
    )
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

    asyncio.run(predict(args.input, data_path, compiled_model_path, witness_path))

if __name__ == "__main__":
    # Example usage:
    # python proof.py --input 1 3 3 4 5 6 --model network --prove
    main()
