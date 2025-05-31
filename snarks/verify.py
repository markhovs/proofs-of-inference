import os   
import ezkl

proof_path = os.path.join('test.pf')
witness_path = os.path.join('gan_witness.json')
settings_path = os.path.join('settings.json')
vk_path = os.path.join('test.vk')

res = ezkl.verify(
        proof_path,
        settings_path,
        vk_path,        
    )

assert res == True
print("verified")