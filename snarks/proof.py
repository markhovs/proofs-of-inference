import os
import ezkl

proof_path = os.path.join('test.pf')
witness_path = os.path.join('gan_witness.json')
compiled_model_path = os.path.join('network.compiled')
pk_path = os.path.join('test.pk')

res = ezkl.prove(
        witness_path,
        compiled_model_path,
        pk_path,
        proof_path,
        
        "single",
    )

print(res)