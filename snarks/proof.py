import os
import ezkl
import torch
import json
import asyncio

async def main():
    proof_path = os.path.join('test.pf')
    witness_path = os.path.join('witness.json')
    compiled_model_path = os.path.join('network.compiled')
    pk_path = os.path.join('test.pk')
    data_path = os.path.join('input.json')
    witness_path = "witness.json"

    shape = [1, 6]
    x = torch.zeros(shape, dtype=torch.long)
    x = torch.tensor([1, 2, 3, 4, 5, 6], dtype=torch.long)  
    print(x)
    x = x.reshape(shape)
    print(x)
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