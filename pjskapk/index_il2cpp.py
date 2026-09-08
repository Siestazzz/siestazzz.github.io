"""Build or query a reusable SQLite index of the locally generated IL2CPP declarations."""
import argparse,hashlib,json,re,sqlite3
from pathlib import Path
ROOT=Path(__file__).resolve().parent/'analysis-6.8.1'
dump=ROOT/'il2cpp-dump'
parser=argparse.ArgumentParser()
parser.add_argument('--query')
parser.add_argument('--limit',type=int,default=12)
args=parser.parse_args()
db=sqlite3.connect(dump/'symbols.sqlite')
if args.query:
    for row in db.execute('SELECT type_id,namespace,declaration,start_line,body FROM types WHERE declaration LIKE ? LIMIT ?',('%'+args.query+'%',args.limit)):
        print('TYPE',row[:4]); print(row[4])
    raise SystemExit()
db.executescript('DROP TABLE IF EXISTS types; DROP TABLE IF EXISTS methods; CREATE TABLE types(type_id INTEGER PRIMARY KEY,namespace TEXT,declaration TEXT,start_line INTEGER,body TEXT); CREATE TABLE methods(type_id INTEGER,rva INTEGER,signature TEXT,line INTEGER); CREATE INDEX methods_rva ON methods(rva);')
text=(dump/'dump.cs').read_text(encoding='utf-8-sig')
blocks=re.split(r'(?m)^// Namespace: ',text)
line=1; nt=nm=0
for block in blocks:
    match=re.search(r'(?m)^([^\n]+)// TypeDefIndex: (\d+)',block)
    if match:
        tid=int(match[2]); namespace=block.split('\n',1)[0].strip()
        declaration=match[1].strip()
        start=line+block[:match.start()].count('\n')
        body=block[match.start():].strip()
        db.execute('INSERT OR REPLACE INTO types VALUES(?,?,?,?,?)',(tid,namespace,declaration,start,body));nt+=1
        for m in re.finditer(r'// RVA: (0x[0-9A-Fa-f]+) Offset:[^\n]*\n\s*([^\n]+)',block):
            db.execute('INSERT INTO methods VALUES(?,?,?,?)',(tid,int(m[1],16),m[2].strip(),line+block[:m.start()].count('\n')));nm+=1
    line+=block.count('\n')
db.commit()
lib=ROOT/'libil2cpp.so'; meta=ROOT/'unpacked/assets/bin/Data/Managed/Metadata/global-metadata.dat'
stamp=dict(input_sha256=hashlib.sha256(lib.read_bytes()+meta.read_bytes()).hexdigest(),
           tool='Il2CppDumper 6.7.46',dump_sha256=hashlib.sha256((dump/'dump.cs').read_bytes()).hexdigest(),
           types=nt,methods=nm,dummy_dlls=len(list((dump/'DummyDll').glob('*.dll'))))
(dump/'completed.json').write_text(json.dumps(stamp,indent=2),encoding='utf-8')
print(json.dumps(stamp,indent=2))
