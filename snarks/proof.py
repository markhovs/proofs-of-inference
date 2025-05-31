import os
import ezkl
import torch
import json
import asyncio
import argparse

async def main():
    parser = argparse.ArgumentParser(description="Run inference and optionally generate a zk proof.")
    parser.add_argument(
        "--input",
        nargs=6,
        type=int,
        required=True,
        help="6 integers representing the input vector"
    )
    parser.add_argument(
        "--prove",
        action="store_true",
        help="Flag to generate a proof"
    )
    args = parser.parse_args()

    proof_path = os.path.join('test.pf')
    witness_path = os.path.join('witness.json')
    compiled_model_path = os.path.join('network.compiled')
    pk_path = os.path.join('test.pk')
    data_path = os.path.join('input.json')
    witness_path = "witness.json"

    shape = [1, 6]
    x = torch.tensor(args.input, dtype=torch.long)  
    x = x.reshape(shape)
    print("Input vector:", x)
    data_array = ((x).detach().numpy()).reshape([-1]).tolist()

    data_json = dict(input_data = [data_array])

    # Serialize data into file:
    json.dump(data_json, open(data_path, 'w' ))


    res = await ezkl.gen_witness(data_path, compiled_model_path, witness_path)
    assert os.path.isfile(witness_path)

    W = json.load(open("witness.json"))
    rescaled_list = W["pretty_elements"]["rescaled_outputs"][0]  

    # Group into 6 chunks of 10
    groups = [ rescaled_list[i:i+10] for i in range(0, len(rescaled_list), 10) ]

    # Find argmax for each chunk
    predicted_digits = []
    for grp in groups:
        float_vals = [float(s) for s in grp]
        argmax_index = int(float_vals.index(max(float_vals)))
        predicted_digits.append(argmax_index)

    print("Predicted digits:", predicted_digits)

    if args.prove:
        res = ezkl.mock(witness_path, compiled_model_path)
        assert res == True

        res = ezkl.prove(
                witness_path,
                compiled_model_path,
                pk_path,
                proof_path,  
                "single",
            )

if __name__ == "__main__":
    asyncio.run(main())