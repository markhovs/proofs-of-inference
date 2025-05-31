from typing import Optional, List
import boto3
import os
from botocore.exceptions import ClientError
import json
from fastapi import HTTPException
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

class AkaveService:
    def __init__(self):
        self.s3 = boto3.client(
            's3',
            endpoint_url=os.getenv("AKAVE_ENDPOINT"),
            aws_access_key_id=os.getenv("AKAVE_ACCESS_KEY"),
            aws_secret_access_key=os.getenv("AKAVE_SECRET_KEY"),
            region_name="akave-network"
        )
        self.bucket = os.getenv("AKAVE_BUCKET")

    async def test_connection(self) -> dict:
        """Raw test of connection and permissions"""
        try:
            # Try basic operations and return raw responses
            return {
                "list_buckets": self.s3.list_buckets(),
                "bucket_info": self.s3.head_bucket(Bucket=self.bucket),
                "endpoint": self.s3.meta.endpoint_url,
                "bucket": self.bucket
            }
        except ClientError as e:
            # Return the raw error from Akave
            # return {
            #     "error": e.response['Error'],
            #     "endpoint": self.s3.meta.endpoint_url,
            #     "bucket": self.bucket
            # }
            return e.response
        except Exception as e:
            return {"error": str(e)}

    async def upload_json(self, key: str, data: dict) -> dict:
        """Upload JSON data and return raw response"""
        try:
            response = self.s3.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=json.dumps(data),
                ContentType='application/json'
            )
            return {
                "response": response,
                "bucket": self.bucket,
                "key": key
            }
        except ClientError as e:
            return {"error": e.response['Error']}
        except Exception as e:
            return {"error": str(e)}

    async def list_files(self, prefix: Optional[str] = None) -> dict:
        """List files and return raw response"""
        try:
            params = {'Bucket': self.bucket}
            if prefix:
                params['Prefix'] = prefix
            
            response = self.s3.list_objects_v2(**params)
            return {
                "response": response,
                "bucket": self.bucket,
                "prefix": prefix
            }
        except ClientError as e:
            return {"error": e.response['Error']}
        except Exception as e:
            return {"error": str(e)}

    async def download_json(self, key: str) -> dict:
        """Download JSON data and return raw response"""
        try:
            response = self.s3.get_object(Bucket=self.bucket, Key=key)
            data = json.loads(response['Body'].read().decode('utf-8'))
            return {
                "data": data,
                "metadata": response.get('Metadata', {}),
                "bucket": self.bucket,
                "key": key
            }
        except ClientError as e:
            return {"error": e.response['Error']}
        except Exception as e:
            return {"error": str(e)}

    async def create_bucket(self, bucket_name: Optional[str] = None) -> dict:
        """Create a new bucket and return raw response"""
        try:
            bucket = bucket_name or self.bucket
            response = self.s3.create_bucket(Bucket=bucket)
            return response
        except ClientError as e:
            return e.response
        except Exception as e:
            return {"error": str(e)}

    async def upload_model_settings(self, model_id: str, settings: dict) -> dict:
        key = f"settings/{model_id}.json"
        return await self.upload_json(key, settings)

    async def download_model_settings(self, model_id: str) -> dict:
        key = f"settings/{model_id}.json"
        return await self.download_json(key)

    async def upload_verification_key(self, model_id: str, vk_data: bytes) -> dict:
        key = f"verification-keys/{model_id}.vk"
        try:
            response = self.s3.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=vk_data,
                ContentType='application/octet-stream'
            )
            return {"response": response, "bucket": self.bucket, "key": key}
        except ClientError as e:
            return {"error": e.response['Error']}
        except Exception as e:
            return {"error": str(e)}

    async def download_verification_key(self, model_id: str) -> dict:
        key = f"verification-keys/{model_id}.vk"
        try:
            response = self.s3.get_object(Bucket=self.bucket, Key=key)
            vk_data = response['Body'].read()
            return {"data": vk_data, "bucket": self.bucket, "key": key}
        except ClientError as e:
            return {"error": e.response['Error']}
        except Exception as e:
            return {"error": str(e)}

    async def upload_proof(self, model_id: str, proof_id: str, proof_data: bytes) -> dict:
        key = f"proofs/{model_id}/{proof_id}.pf"
        try:
            response = self.s3.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=proof_data,
                ContentType='application/octet-stream',
                Metadata={'model_id': model_id}
            )
            return {"response": response, "bucket": self.bucket, "key": key}
        except ClientError as e:
            return {"error": e.response['Error']}
        except Exception as e:
            return {"error": str(e)}

    async def download_proof(self, model_id: str, proof_id: str) -> dict:
        key = f"proofs/{model_id}/{proof_id}.pf"
        try:
            response = self.s3.get_object(Bucket=self.bucket, Key=key)
            proof_data = response['Body'].read()
            metadata = response.get('Metadata', {})
            return {"data": proof_data, "bucket": self.bucket, "key": key, "metadata": metadata}
        except ClientError as e:
            return {"error": e.response['Error']}
        except Exception as e:
            return {"error": str(e)}

    async def list_proofs(self, model_id: str = None) -> dict:
        prefix = f"proofs/{model_id}/" if model_id else "proofs/"
        result = await self.list_files(prefix=prefix)
        # Optionally, fetch metadata for each proof (requires extra S3 calls)
        return result 