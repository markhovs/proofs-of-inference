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
    
    args = parser.parse_args()
    model_base = f"models/{args.model}"
    proof_path = "proof.json"
    
    proof_path = os.path.join(proof_path)
    settings_path = os.path.join(f'{model_base}-settings.json')
    vk_path = os.path.join(f'{model_base}-test.vk')

    res = ezkl.verify(proof_path, settings_path, vk_path)

    assert res == True
    print("verified")
    
if __name__ == "__main__":
    main()