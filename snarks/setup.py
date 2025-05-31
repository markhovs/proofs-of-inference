import torch
import os 
import asyncio
import json
import ezkl 
import argparse
from train_model import LittleTransformer

async def main():
    parser = argparse.ArgumentParser(description="Run inference and optionally generate a zk proof.")
    parser.add_argument(
        "--model",
        type=str,
        required=True,
        help="Model name, used to locate files under models/<model>-..."
    )
    
    model = LittleTransformer(seq_len=6, max_value=10, layer_count=1, embed_dim=32, num_heads=1, ff_dim=32)
    # model = LittleTransformer(seq_len=6, max_value=10, layer_count=1, embed_dim=16, num_heads=2, ff_dim=16)

    args = parser.parse_args()
    name = args.model
    model_base = f"models/{args.model}"
    model.load_state_dict(torch.load(f"models/{args.model}.pt"))

    model_path = os.path.join(f'{model_base}-network.onnx')
    compiled_model_path = os.path.join(f'{model_base}-network.compiled')
    pk_path = os.path.join(f'{model_base}-test.pk')
    vk_path = os.path.join(f'{model_base}-test.vk')
    settings_path = os.path.join(f'{model_base}-settings.json')
    data_path = os.path.join('input.json')

    shape = [1, 6]
    # After training, export to onnx (network.onnx) and create a data file (input.json)
    x = torch.zeros(shape, dtype=torch.long)
    x = x.reshape(shape)

    # Flips the neural net into inference mode
    model.eval()
    model.to('cpu')

    # # Export the model
    # torch.onnx.export(model,               # model being run
    #                     x,                   # model input (or a tuple for multiple inputs)
    #                     model_path,            # where to save the model (can be a file or file-like object)
    #                     export_params=True,        # store the trained parameter weights inside the model file
    #                     opset_version=10,          # the ONNX version to export the model to
    #                     do_constant_folding=True,  # whether to execute constant folding for optimization
    #                     input_names = ['input'],   # the model's input names
    #                     output_names = ['output'], # the model's output names
    #                     dynamic_axes={'input' : {0 : 'batch_size'},    # variable length axes
    #                                 'output' : {0 : 'batch_size'}})
    
    torch.onnx.export(model, x, model_path, opset_version=10)

    data_array = ((x).detach().numpy()).reshape([-1]).tolist()

    data_json = dict(input_data = [data_array])

    # Serialize data into file:
    json.dump(data_json, open(data_path, 'w' ))

    # TODO: Dictionary outputs
    res = ezkl.gen_settings(model_path, settings_path)
    assert res == True

    cal_path = os.path.join("calibration.json")

    data_array = (torch.randn(20, *shape).detach().numpy()).reshape([-1]).tolist()

    data = dict(input_data = [data_array])

    # Serialize data into file:
    json.dump(data, open(cal_path, 'w'))

    res = await ezkl.calibrate_settings(data_path, model_path, settings_path, "accuracy")
    assert res == True

    res = ezkl.compile_circuit(model_path, compiled_model_path, settings_path)
    assert res == True

    res = await ezkl.get_srs( settings_path)


    res = ezkl.setup(
            compiled_model_path,
            vk_path,
            pk_path,
            
        )

if __name__ == "__main__":
    asyncio.run(main())