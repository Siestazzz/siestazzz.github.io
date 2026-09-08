"""Reproducible, read-only ARM64 IL2CPP audit of the supplied 6.8.1 files."""
import argparse, hashlib, json, struct, sqlite3
from pathlib import Path
from elftools.elf.elffile import ELFFile
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_ARM
ROOT=Path(__file__).resolve().parent/'analysis-6.8.1'
LIB=ROOT/'libil2cpp.so'
META=ROOT/'unpacked/assets/bin/Data/Managed/Metadata/global-metadata.dat'
OUT=ROOT/'il2cpp-audit'
OUT.mkdir(exist_ok=True)
parser=argparse.ArgumentParser()
parser.add_argument('mode',choices=['inventory','xref','disasm'])
parser.add_argument('--address',type=lambda s:int(s,0))
parser.add_argument('--size',type=lambda s:int(s,0),default=512)
parser.add_argument('--string',default='global-metadata.dat')
args=parser.parse_args()
raw=LIB.read_bytes()
stream=LIB.open('rb')
elf=ELFFile(stream)
def section_at(address):
    return next(s for s in elf.iter_sections() if s['sh_addr']<=address<s['sh_addr']+s['sh_size'] and s['sh_type']!='SHT_NOBITS')
def disasm(address,size):
    s=section_at(address); offset=s['sh_offset']+address-s['sh_addr']
    md=Cs(CS_ARCH_ARM64,CS_MODE_ARM)
    dbpath=ROOT/'il2cpp-dump/symbols.sqlite'
    db=sqlite3.connect(dbpath) if dbpath.exists() else None
    lines=[]
    for i in md.disasm(raw[offset:offset+size],address):
        annotation=''
        if db and i.mnemonic in ['bl','b'] and i.op_str.startswith('#0x'):
            hit=db.execute('SELECT t.declaration,m.signature FROM methods m JOIN types t USING(type_id) WHERE m.rva=? LIMIT 1',(int(i.op_str[1:],16),)).fetchone()
            if hit: annotation=' ; '+' / '.join(hit)
        lines.append(f'{i.address:016x}  {i.mnemonic:8} {i.op_str}'+annotation)
    if db: db.close()
    return '\n'.join(lines)
if args.mode=='inventory':
    meta=META.read_bytes()
    symbols=[]
    dyn=elf.get_section_by_name('.dynsym')
    if dyn:
        symbols=[dict(name=s.name,address=hex(s['st_value']),size=s['st_size']) for s in dyn.iter_symbols() if s.name.startswith('il2cpp_')]
    result=dict(lib_sha256=hashlib.sha256(raw).hexdigest(),metadata_sha256=hashlib.sha256(meta).hexdigest(),
                metadata_size=len(meta),metadata_header=meta[:32].hex(),standard_magic=meta[:4]==bytes.fromhex('af1bb1fa'),
                architecture=elf['e_machine'],sections=[dict(name=s.name,address=hex(s['sh_addr']),offset=s['sh_offset'],size=s['sh_size']) for s in elf.iter_sections()],
                exports=symbols)
    (OUT/'inventory.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    print('metadata standard:',result['standard_magic'],'IL2CPP exports:',len(symbols))
    print([s for s in symbols if s['name'] in ['il2cpp_init','il2cpp_domain_get','il2cpp_class_get_fields']])
elif args.mode=='xref':
    offset=raw.find(args.string.encode()+b'\0')
    if offset<0: raise ValueError('String not found')
    sec=next(s for s in elf.iter_sections() if s['sh_offset']<=offset<s['sh_offset']+s['sh_size'])
    address=sec['sh_addr']+offset-sec['sh_offset']; page=address&~4095
    text=elf.get_section_by_name('.text'); hits=[]
    for n,(word,) in enumerate(struct.iter_unpack('<I',text.data())):
        if word & 0x9f000000 != 0x90000000: continue
        imm=((word>>5)&0x7ffff)<<2 | ((word>>29)&3)
        if imm & (1<<20): imm-=1<<21
        pc=text['sh_addr']+n*4
        if (pc&~4095)+(imm<<12)==page: hits.append(pc)
    report=dict(string=args.string,address=hex(address),page_candidates=[hex(a) for a in hits])
    (OUT/'metadata-xrefs.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(report)
    for a in hits[:40]: print(disasm(a-8,48))
else:
    output=disasm(args.address,args.size)
    (OUT/(hex(args.address)+'.asm')).write_text(output,encoding='utf-8')
    print(output)
