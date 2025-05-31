import os   
import ezkl
import argparse

def main():
    parser = argparse.ArgumentParser(description="Run inference and optionally generate a zk proof.")
    parser.add_argument(
        "--model",
        type=str,
        required=True,
        help="Model name, used to locate files under models/<model>-..."
    )
    parser.add_argument(
        "--proof-path",
        type=str,
        help="Path to the proof file",
    )
    args = parser.parse_args()
    model_base = f"models/{args.model}"
    proof_path = f"{args.proof_path}"
    
    
    proof_path = os.path.join(proof_path)
    settings_path = os.path.join(f'{model_base}-settings.json')
    vk_path = os.path.join(f'{model_base}-test.vk')

    print(proof_path)
    print(settings_path)
    #  verify each file
    if not os.path.exists(proof_path):
        raise FileNotFoundError(f"Proof file {proof_path} does not exist.")
    if not os.path.exists(settings_path):
        raise FileNotFoundError(f"Settings file {settings_path} does not exist.")
    if not os.path.exists(vk_path):
        raise FileNotFoundError(f"Verification key file {vk_path} does not exist.")

    res = ezkl.verify(proof_path, settings_path, vk_path)

    assert res == True
    print("verified")
    
if __name__ == "__main__":
    main()