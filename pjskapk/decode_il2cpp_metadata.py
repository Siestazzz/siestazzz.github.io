"""Reproduce the 6.8.1 ARM64 metadata loader on a local copy; never modify source."""
import hashlib,json,struct
from pathlib import Path
from elftools.elf.elffile import ELFFile
ROOT=Path(__file__).resolve().parent/'analysis-6.8.1'
lib=ROOT/'libil2cpp.so'
source=ROOT/'unpacked/assets/bin/Data/Managed/Metadata/global-metadata.dat'
out=ROOT/'il2cpp-audit'
out.mkdir(exist_ok=True)
expected='aa183c674cf9fc0c2c4125fc24861ab92f6884df52462c6f9fcd58a68f7317ee'
if hashlib.sha256(lib.read_bytes()).hexdigest()!=expected:
    raise ValueError('Different native build: re-audit the loader before reusing its addresses')
with lib.open('rb') as f:
    elf=ELFFile(f)
    key_va=0x1ed0093
    sec=next(s for s in elf.iter_sections() if s['sh_addr']<=key_va<s['sh_addr']+s['sh_size'])
    f.seek(sec['sh_offset']+key_va-sec['sh_addr'])
    key=f.read(128)
raw=source.read_bytes()
decoded=bytes(v^key[i&127] for i,v in enumerate(raw))
magic,version=struct.unpack_from('<II',decoded)
if magic!=0xfab11baf: raise ValueError(f'Unsupported build: decoded magic {magic:#x}')
if not 24<=version<=31: raise ValueError(f'Unexpected metadata version {version}')
target=out/'global-metadata.decoded.dat'
target.write_bytes(decoded)
(out/'decode-provenance.json').write_text(json.dumps(dict(
    library_sha256=hashlib.sha256(lib.read_bytes()).hexdigest(),
    input_sha256=hashlib.sha256(raw).hexdigest(),output_sha256=hashlib.sha256(decoded).hexdigest(),
    metadata_version=version,bytes=len(decoded),key_virtual_address=hex(key_va),
    loader_function='0x435ff38',xor_loop='0x436006c..0x4360088',
    formula='output[i] = input[i] XOR library_key[i & 0x7f]',
    note='Version-specific address. A new build requires revalidating the loader.'
),indent=2),encoding='utf-8')
print('Decoded metadata version',version,'bytes',len(decoded),'to',target)
