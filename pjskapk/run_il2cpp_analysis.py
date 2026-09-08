"""Repeatable local pipeline. Requires the supplied APKS and local analysis toolchain."""
import hashlib,io,json,subprocess,sys,zipfile
from pathlib import Path
HERE=Path(__file__).resolve().parent
ROOT=HERE/'analysis-6.8.1'
ROOT.mkdir(exist_ok=True)
lib=ROOT/'libil2cpp.so'
metadata=ROOT/'unpacked/assets/bin/Data/Managed/Metadata/global-metadata.dat'
if not lib.exists() or not metadata.exists():
    with zipfile.ZipFile(HERE/'プロセカ_6.8.1.apks') as apks:
        if not lib.exists():
            with zipfile.ZipFile(io.BytesIO(apks.read('split_config.arm64_v8a.apk'))) as apk:
                lib.write_bytes(apk.read('lib/arm64-v8a/libil2cpp.so'))
        if not metadata.exists():
            with zipfile.ZipFile(io.BytesIO(apks.read('base.apk'))) as apk:
                metadata.parent.mkdir(parents=True,exist_ok=True)
                metadata.write_bytes(apk.read('assets/bin/Data/Managed/Metadata/global-metadata.dat'))
subprocess.run([sys.executable,str(HERE/'il2cpp_audit.py'),'inventory'],check=True)
subprocess.run([sys.executable,str(HERE/'decode_il2cpp_metadata.py')],check=True)
tool=HERE/'analysis-tools/il2cppdumper-6.7.46/Il2CppDumper.exe'
if not tool.exists(): raise SystemExit('Install official Il2CppDumper 6.7.46 net6 in analysis-tools/il2cppdumper-6.7.46')
dump=ROOT/'il2cpp-dump'
dump.mkdir(exist_ok=True)
fingerprint=hashlib.sha256(lib.read_bytes()+metadata.read_bytes()).hexdigest()
stamp=dump/'completed.json'
if stamp.exists() and json.loads(stamp.read_text())['input_sha256']==fingerprint and (dump/'dump.cs').exists():
    print('Reusing verified dump for this exact input.')
else:
    # Do not overwrite the original APK, library, metadata or shared tool installations.
    with (ROOT/'il2cpp-audit/dumper.log').open('w',encoding='utf-8') as log:
        process=subprocess.Popen([str(tool),str(lib),str(ROOT/'il2cpp-audit/global-metadata.decoded.dat'),str(dump)],
                                 stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,encoding='utf-8',errors='replace')
        for line in process.stdout:
            print(line,end='',flush=True);log.write(line);log.flush()
        if process.wait()!=0: raise SystemExit('Dumper failed; inspect il2cpp-audit/dumper.log')
    if not (dump/'dump.cs').exists(): raise SystemExit('No dump.cs produced; not marking analysis complete')
    stamp.write_text(json.dumps(dict(input_sha256=fingerprint,tool='Il2CppDumper 6.7.46',
                    dump_sha256=hashlib.sha256((dump/'dump.cs').read_bytes()).hexdigest()),indent=2),encoding='utf-8')
print('Dump:',dump/'dump.cs')
subprocess.run([sys.executable,str(HERE/'index_il2cpp.py')],check=True)
