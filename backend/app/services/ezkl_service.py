import os
import ezkl
import torch
import json
import asyncio
from typing import List, Dict, Any, Tuple
from app.services.akave import AkaveService


class EzklService:
    def __init__(self):
        self.akave = AkaveService()
        # Get absolute paths for artifacts and temp directories
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.artifacts_dir = os.path.join(self.base_dir, "artifacts", "models")
        self.temp_dir = os.path.join(self.base_dir, "artifacts", "temp")
        
        # Ensure temp directory exists
        os.makedirs(self.temp_dir, exist_ok=True)
        
        # Store the latest prediction metadata for proof generation
        self.latest_prediction = None

    def _get_model_paths(self, model_id: str) -> Dict[str, str]:
        """Get file paths for a specific model."""
        model_dir = os.path.join(self.artifacts_dir, model_id)
        
        if not os.path.exists(model_dir):
            raise FileNotFoundError(f"Model directory not found: {model_dir}")
        
        paths = {
            "compiled": os.path.join(model_dir, f"{model_id}-network.compiled"),
            "pk": os.path.join(model_dir, f"{model_id}-test.pk"),
            "model": os.path.join(model_dir, f"{model_id}.pt"),
            "onnx": os.path.join(model_dir, f"{model_id}-network.onnx")
        }
        
        # Check that critical files exist
        for name, path in paths.items():
            if not os.path.exists(path):
                if name in ["compiled", "pk"]:
                    raise FileNotFoundError(f"Required {name} file not found: {path}")
        
        return paths

    def _get_temp_paths(self) -> Dict[str, str]:
        """Get temporary file paths."""
        return {
            "input": os.path.join(self.temp_dir, "input.json"),
            "witness": os.path.join(self.temp_dir, "witness.json"),
            "proof": os.path.join(self.temp_dir, "proof.json")
        }

    async def predict(self, input_vector: List[int], model_id: str) -> Dict[str, Any]:
        """
        Run inference on input vector using the specified model.
        
        Args:
            input_vector: List of 6 integers
            model_id: Model identifier
            
        Returns:
            Dict containing predicted digits and witness data
        """
        if len(input_vector) != 6:
            raise ValueError("Input vector must contain exactly 6 integers")
        
        # Validate input ranges based on model type
        if model_id == "parity":
            # Parity model expects binary inputs (0 or 1)
            if not all(x in [0, 1] for x in input_vector):
                raise ValueError("Parity model requires binary inputs (0 or 1 only). Example: [1, 0, 1, 0, 1, 0]")
        elif model_id == "reverse":
            # Reverse model expects digit inputs (0-9)
            if not all(0 <= x <= 9 for x in input_vector):
                raise ValueError("Reverse model requires digit inputs (0-9 only). Example: [1, 2, 3, 4, 5, 6]")
        else:
            # For unknown models, assume digit range
            if not all(0 <= x <= 9 for x in input_vector):
                raise ValueError(f"Model '{model_id}' likely requires inputs in range 0-9. Example: [1, 2, 3, 4, 5, 6]")
        
        try:
            # Get model and temp paths
            model_paths = self._get_model_paths(model_id)
            temp_paths = self._get_temp_paths()
            
            # Clean up any previous temp files
            for temp_file in temp_paths.values():
                if os.path.exists(temp_file):
                    os.remove(temp_file)
            
            # Prepare input tensor
            shape = [1, 6]
            x = torch.tensor(input_vector, dtype=torch.float32)
            x = x.reshape(shape)
            data_array = x.detach().numpy().reshape([-1]).tolist()
            
            # Try different input formats until one works
            formats_to_try = [
                {"input_data": [data_array]},
                {"input_data": data_array},
                {"input_data": [[[data_array]]]},
                {"input_data": [[data_array]]},
            ]
            
            witness_generated = False
            last_error = None
            
            for format_data in formats_to_try:
                if witness_generated:
                    break
                
                # Write this format to file
                with open(temp_paths["input"], 'w') as f:
                    json.dump(format_data, f)
                
                # Generate witness with timeout
                try:
                    res = await asyncio.wait_for(
                        ezkl.gen_witness(
                            temp_paths["input"], 
                            model_paths["compiled"], 
                            temp_paths["witness"]
                        ),
                        timeout=30.0
                    )
                    
                    # Check if witness file was created
                    if os.path.isfile(temp_paths["witness"]):
                        witness_generated = True
                        break
                        
                except asyncio.TimeoutError:
                    last_error = "Witness generation timed out"
                    continue
                except Exception as e:
                    last_error = f"Witness generation failed: {str(e)}"
                    continue
            
            if not witness_generated:
                raise Exception(f"All input formats failed. Last error: {last_error}")
            
            # Parse witness and extract predictions
            with open(temp_paths["witness"], 'r') as f:
                W = json.load(f)
            
            rescaled_list = W["pretty_elements"]["rescaled_outputs"][0]
            
            # Group into 6 chunks of 10
            groups = [rescaled_list[i:i+10] for i in range(0, len(rescaled_list), 10)]
            
            # Find argmax for each chunk
            predicted_digits = []
            for grp in groups:
                float_vals = [float(s) for s in grp]
                argmax_index = int(float_vals.index(max(float_vals)))
                predicted_digits.append(argmax_index)
            
            # Read witness data for potential later use
            with open(temp_paths["witness"], 'r') as f:
                witness_data = f.read()
            
            # Store this prediction as the latest for potential proof generation
            self.latest_prediction = {
                "predicted_digits": predicted_digits,
                "input_vector": input_vector,
                "model_id": model_id,
                "witness_file_exists": True
            }
            
            return {
                "predicted_digits": predicted_digits,
                "input_vector": input_vector,
                "model_id": model_id,
                "witness_data": witness_data
            }
            
        except Exception as e:
            raise Exception(f"Prediction failed: {str(e)}")

    async def generate_proof(self, witness_data: str, model_id: str) -> Dict[str, Any]:
        """
        Generate a ZK proof from witness data.
        
        Args:
            witness_data: JSON string containing witness
            model_id: Model identifier
            
        Returns:
            Dict containing proof data and metadata
        """
        try:
            # Get model and temp paths
            model_paths = self._get_model_paths(model_id)
            temp_paths = self._get_temp_paths()
            
            # Write witness data to file
            with open(temp_paths["witness"], 'w') as f:
                f.write(witness_data)
            
            # Run mock verification first
            res = ezkl.mock(temp_paths["witness"], model_paths["compiled"])
            if not res:
                raise Exception("Mock run failed: constraints not satisfied")
            
            # Generate proof
            res = ezkl.prove(
                temp_paths["witness"],
                model_paths["compiled"],
                model_paths["pk"],
                temp_paths["proof"],
                "single",
            )
            
            if not os.path.isfile(temp_paths["proof"]):
                raise Exception("Proof file was not created")
            
            # Read the generated proof
            with open(temp_paths["proof"], 'r') as f:
                proof_data = f.read()
            
            return {
                "proof_data": proof_data,
                "model_id": model_id,
                "proof_file_path": temp_paths["proof"]
            }
            
        except Exception as e:
            raise Exception(f"Proof generation failed: {str(e)}")

    async def generate_proof_for_latest_prediction(self) -> Dict[str, Any]:
        """
        Generate a ZK proof for the latest prediction.
        This assumes the witness.json file still exists in temp directory.
        
        Returns:
            Dict containing proof data and metadata
        """
        if not self.latest_prediction:
            raise Exception("No recent prediction found. Please run a prediction first.")
        
        if not self.latest_prediction.get("witness_file_exists"):
            raise Exception("Witness file for latest prediction no longer exists. Please run prediction again.")
        
        try:
            # Get model and temp paths
            model_paths = self._get_model_paths(self.latest_prediction["model_id"])
            temp_paths = self._get_temp_paths()
            
            # Check if witness file exists
            if not os.path.isfile(temp_paths["witness"]):
                raise Exception("Witness file not found. Please run prediction again.")
            
            # Run mock verification first
            res = ezkl.mock(temp_paths["witness"], model_paths["compiled"])
            if not res:
                raise Exception("Mock run failed: constraints not satisfied")
            
            # Generate proof
            res = ezkl.prove(
                temp_paths["witness"],
                model_paths["compiled"],
                model_paths["pk"],
                temp_paths["proof"],
                "single",
            )
            
            if not os.path.isfile(temp_paths["proof"]):
                raise Exception("Proof file was not created")
            
            # Read the generated proof
            with open(temp_paths["proof"], 'r') as f:
                proof_data = f.read()
            
            return {
                "proof_data": proof_data,
                "model_id": self.latest_prediction["model_id"],
                "predicted_digits": self.latest_prediction["predicted_digits"],
                "input_vector": self.latest_prediction["input_vector"],
                "proof_file_path": temp_paths["proof"]
            }
            
        except Exception as e:
            raise Exception(f"Proof generation failed: {str(e)}")

    async def verify_proof(self, proof_data: str, model_id: str) -> Dict[str, Any]:
        """
        Verify a ZK proof.
        
        Args:
            proof_data: JSON string containing the proof
            model_id: Model identifier
            
        Returns:
            Dict containing verification result
        """
        try:
            # Get temp paths
            temp_paths = self._get_temp_paths()
            
            # Write proof data to file
            with open(temp_paths["proof"], 'w') as f:
                if isinstance(proof_data, bytes):
                    f.write(proof_data.decode('utf-8'))
                else:
                    f.write(proof_data)
            
            # Download settings and verification key from Akave
            settings_result = await self.akave.download_model_settings(model_id)
            vk_result = await self.akave.download_verification_key(model_id)
            
            if "error" in settings_result or "error" in vk_result:
                return {
                    "verified": False,
                    "error": "Failed to download settings or verification key from Akave"
                }
            
            # Save settings and vk to temp files
            settings_path = os.path.join(self.temp_dir, "settings.json")
            vk_path = os.path.join(self.temp_dir, "test.vk")
            
            with open(settings_path, 'w') as f:
                if isinstance(settings_result["data"], str):
                    f.write(settings_result["data"])
                else:
                    json.dump(settings_result["data"], f)
            
            # Handle binary data for verification key
            if isinstance(vk_result["data"], bytes):
                with open(vk_path, 'wb') as f:
                    f.write(vk_result["data"])
            else:
                with open(vk_path, 'w') as f:
                    f.write(vk_result["data"])
            
            # Verify proof
            res = ezkl.verify(temp_paths["proof"], settings_path, vk_path)
            
            return {
                "verified": True,
                "proof_valid": bool(res),
                "model_id": model_id
            }
            
        except Exception as e:
            return {
                "verified": False,
                "error": f"Verification failed: {str(e)}"
            }

    async def predict_and_prove(self, input_vector: List[int], model_id: str) -> Dict[str, Any]:
        """
        Run inference and generate proof in one step.
        
        Args:
            input_vector: List of 6 integers
            model_id: Model identifier
            
        Returns:
            Dict containing predictions, proof, and metadata
        """
        try:
            # Step 1: Run prediction
            prediction_result = await self.predict(input_vector, model_id)
            
            # Step 2: Generate proof for the latest prediction
            proof_result = await self.generate_proof_for_latest_prediction()
            
            return {
                "predicted_digits": prediction_result["predicted_digits"],
                "input_vector": input_vector,
                "model_id": model_id,
                "proof_data": proof_result["proof_data"],
                "status": "completed"
            }
            
        except Exception as e:
            return {
                "status": "failed",
                "error": str(e),
                "model_id": model_id,
                "input_vector": input_vector
            }
    
    def cleanup_temp_files(self):
        """Clean up temporary files to prevent disk space issues."""
        temp_paths = self._get_temp_paths()
        for file_path in temp_paths.values():
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception:
                pass  # Silently ignore cleanup errors
    
    def encode_evm_calldata(self, proof_data: str) -> str:
        """
        Encode proof data as EVM calldata for smart contract verification.
        
        Args:
            proof_data: JSON string containing the proof
            
        Returns:
            Hex-encoded calldata string with 0x prefix
        """
        try:
            # Get temp paths
            temp_paths = self._get_temp_paths()
            
            # Write proof data to temporary file
            proof_path = temp_paths["proof"]
            with open(proof_path, 'w') as f:
                if isinstance(proof_data, bytes):
                    f.write(proof_data.decode('utf-8'))
                else:
                    f.write(proof_data)
            
            # Generate calldata using ezkl
            calldata_path = os.path.join(self.temp_dir, "calldata.bin")
            
            # Generate EVM calldata
            res = ezkl.encode_evm_calldata(
                proof_path,
                calldata_path,
            )
            
            # Convert to hex string
            if isinstance(res, bytes):
                calldata_hex = "0x" + ''.join(f"{byte:02x}" for byte in res)
            else:
                # If ezkl.encode_evm_calldata returns the calldata directly
                with open(calldata_path, 'rb') as f:
                    calldata_bytes = f.read()
                calldata_hex = "0x" + ''.join(f"{byte:02x}" for byte in calldata_bytes)
            
            return calldata_hex
            
        except Exception as e:
            raise Exception(f"EVM encoding failed: {str(e)}")
