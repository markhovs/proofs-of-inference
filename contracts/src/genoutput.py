byt = open("calldata.bytes", "rb").read()
calldata_hex = "0x" + ''.join(f"{byte:02x}" for byte in byt)
print(calldata_hex)
