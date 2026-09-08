---
title: "强网杯s9初赛 PolyEncryption wp"
date: 2025-10-20 19:41:39
updated: 2025-10-20 19:41:39
categories:
  - "CTF"
tags:
  - "CTF"
  - "强网杯"
  - "逆向工程"
  - ".NET"
  - "Python"
  - "密码分析"
excerpt: "PolyEncryption 题解：从异步状态机反编译到内嵌 Python 程序与加密逻辑分析。"
source_date_basis: file-mtime
---
## 逆向过程

给了个docker，实际运行的只有一个dll，按道理应该能直接在windows跑起来，但不知道为啥报错，所以这次几乎都是做的静态分析

首先比较坑的一点，因为dll用了异步编程，所以编译的时候会编译成状态机的形式，用dnspy看的话只能反编译到状态机的代码，用ilspy才能完整反编译

dll提示需要输入16字节的16进制，然后起了一个python进程，但附件下没有别的文件，说明dll内还有没提取出来的文件

![image-20251020103759920](/media/posts/qwb-s9-polyencryption/499320651b38c108.png)

用die提取出文件

![image-20251020105334136](/media/posts/qwb-s9-polyencryption/543dc886182d97a7.png)

saw.py首先和dll进行了socket连接，然后以调试模式启动了所有java文件，并向java传入了调试端口，传入后调用了set_trace

![image-20251020105444469](/media/posts/qwb-s9-polyencryption/72f908856f3bbdb1.png)

一开始看python和java的时候比较迷惑，因为python中的a和iv没有声明，但是java这里又有看起来很像a和iv的代码，dll中也有一个a，估计这几个应该是相同的变量。看到global和continue后基本确定是java通过调试的方法对python代码进行修改，其中java通过第三方python库remote_pdb对python进行调试

首先Saw.main通过python传入的端口与python进行通信，java调用bufferedReader.readLine();后，会阻塞等待python的回复，回复通过调用set_trace实现。收到回复后java便可以通过printWriter.println对python进行调试，这点从java调用bufferedReader.readLine()的次数和python中调用set_trace的次数一致可以得到验证

然后Saw.main通过反射调用获取了jdwp调试的端口，并将其赋值到python的a变量中，然后对iv也进行了赋初值，随后就进行了休眠

![image-20251020110800809](/media/posts/qwb-s9-polyencryption/9f5b530b77fa8e97.png)

python恢复运行后，向dll发送了一个int 0和刚刚从java得到的端口a

![image-20251020110845564](/media/posts/qwb-s9-polyencryption/f87261a36104d91e.png)

dll起完python进程后调用了Hack()方法，等待python的回信。首先收到python发送的\x00\x00\x00\x00，即len为0，然后将读取到的内容复制给a，也就是java的jwdp调试端口，接着调用了Slash()方法

![image-20251020111135171](/media/posts/qwb-s9-polyencryption/5bc95acaa5de9a50.png)

Slash()与刚获得的jdwp调试端口建立连接，然后发送了JDWP-Handshake与java握手

![image-20251020111725982](/media/posts/qwb-s9-polyencryption/9ff86c0dbf284459.png)

搜索jdwp协议，可以找到[官方的说明手册](https://docs.oracle.com/javase/8/docs/platform/jpda/jdwp/jdwp-protocol.html)，对照官方文档可以知道具体操作只需关注header的第10和11字节，根据command set和command就可以知道dll发包具体都在做什么，下面只对影响分析的包进行分析

![image-20251020112205845](/media/posts/qwb-s9-polyencryption/03b8652f15b29de3.png)

首先是1-7，对应的操作是获取各种数据类型的大小，如fieldIDSize、methodIDSize，存入vals中，用作初始化

![image-20251020112349305](/media/posts/qwb-s9-polyencryption/3c6a756a92567d37.png)

然后是1-3，返回已加载的类的所有信息，存入swcl、ccl、hcl中（看名字也能懂，swcl=SawClass）这步的作用主要是获得类的referenceTypeID留作后续和java通信用

![image-20251020112634452](/media/posts/qwb-s9-polyencryption/8ea55f80c4fdbdcc.png)

2-4查询所有字段的信息，这里记录下了Saw.calc和Curse.hack的id，存入swcm和ccm

![image-20251020113902619](/media/posts/qwb-s9-polyencryption/baa4fadcd2590549.png)

2-5获取所有方法的信息，存入hcm

![image-20251020114345682](/media/posts/qwb-s9-polyencryption/0a603e29d9eff111.png)

然后dll调用了Track方法，3-2是设置字段值，这里根据刚刚Slash中获得的calc的id设置其值为0，让Saw.main停止休眠开始运行

![image-20251020114643357](/media/posts/qwb-s9-polyencryption/2c75e68bf7583754.png)

然后dll主循环开始，Shreck和Breck对我们理解逻辑意义不大。一开始先将我们的输入存入s[32:26]中，然后调用了多次Stop(Crack())，最后循环调用Hack()方法

Crack与python进行通信，将传入的msg长度和msg发送到python，然后读取python的回复

![image-20251020115237136](/media/posts/qwb-s9-polyencryption/056c05e88cd13e1a.png)

python端的处理是将传入的msg进行aes解密

![image-20251020115619855](/media/posts/qwb-s9-polyencryption/70eb87d141551660.png)

解密脚本如下：

```python
from Crypto.Cipher import AES
from hashlib import sha256
from Crypto.Util.Padding import unpad
a = [
    [34, 38, 13, 204, 106, 91, 87, 35, 115, 198, 124, 92, 83, 151, 127, 227, 60, 108, 237, 212, 71, 88, 37, 39, 222, 28, 237, 242, 207, 61, 89, 65], 
    [54, 26, 153, 43, 207, 163, 66, 102, 1, 251, 172, 137, 133, 103, 252, 200, 133, 6, 227, 185, 100, 190, 49, 220, 132, 230, 14, 201, 184, 28, 84, 127], 
    [132, 17, 89, 19, 158, 87, 26, 91, 138, 184, 20, 203, 22, 142, 33, 67],
    [98, 124, 165, 114, 4, 73, 122, 239, 35, 224, 182, 58, 230, 239, 169, 171],
    [181, 158, 168, 62, 5, 218, 108, 22, 225, 44, 69, 4, 169, 112, 225, 186, 212, 234, 186, 217, 245, 102, 219, 46, 107, 236, 2, 37, 80, 8, 162, 183],
    [71, 166, 143, 191, 134, 170, 65, 147, 11, 69, 123, 125, 140, 156, 32, 225, 68, 85, 198, 59, 6, 58, 62, 75, 142, 62, 22, 169, 7, 21, 26, 177],
    [88, 244, 228, 34, 209, 136, 53, 33, 174, 103, 199, 211, 90, 244, 91, 46, 98, 141, 50, 45, 70, 160, 34, 209, 131, 19, 95, 66, 187, 185, 87, 236],
    [59, 134, 219, 11, 168, 34, 42, 6, 142, 30, 47, 12, 175, 97, 187, 166, 191, 165, 206, 91, 56, 92, 35, 91, 63, 232, 2, 235, 246, 41, 249, 60],
    [30, 47, 78, 72, 232, 144, 186, 158, 145, 46, 78, 42, 66, 78, 48, 177, 201, 84, 194, 246, 32, 77, 153, 26, 204, 139, 24, 149, 70, 89, 23, 50],
    [88, 244, 228, 34, 209, 136, 53, 33, 174, 103, 199, 211, 90, 244, 91, 46, 98, 141, 50, 45, 70, 160, 34, 209, 131, 19, 95, 66, 187, 185, 87, 236],
    [59, 134, 219, 11, 168, 34, 42, 6, 142, 30, 47, 12, 175, 97, 187, 166, 191, 165, 206, 91, 56, 92, 35, 91, 63, 232, 2, 235, 246, 41, 249, 60],
    [30, 47, 78, 72, 232, 144, 186, 158, 145, 46,78, 42, 66, 78, 48, 177, 201, 84, 194, 246,32, 77, 153, 26, 204, 139, 24, 149, 70, 89,23, 50],
    [88, 244, 228, 34, 209, 136, 53, 33, 174, 103,199, 211, 90, 244, 91, 46, 98, 141, 50, 45,70, 160, 34, 209, 131, 19, 95, 66, 187, 185,87, 236],
    [59, 134, 219, 11, 168, 34, 42, 6, 142, 30,47, 12, 175, 97, 187, 166, 191, 165, 206, 91,56, 92, 35, 91, 63, 232, 2, 235, 246, 41,249, 60],
    [30, 47, 78, 72, 232, 144, 186, 158, 145, 46,78, 42, 66, 78, 48, 177, 201, 84, 194, 246,32, 77, 153, 26, 204, 139, 24, 149, 70, 89,23, 50],
    [47, 110, 238, 143, 41, 255, 113, 160, 229, 92,84, 132, 31, 128, 72, 253, 98, 154, 102, 114,68, 165, 121, 194, 102, 210, 191, 221, 49, 209,210, 215],
    [59, 134, 219, 11, 168, 34, 42, 6, 142, 30,47, 12, 175, 97, 187, 166, 68, 235, 237, 14,9, 156, 105, 253, 49, 93, 204, 138, 86, 162,159, 183],
    [59, 134, 219, 11, 168, 34, 42, 6, 142, 30,47, 12, 175, 97, 187, 166, 191, 165, 206, 91,56, 92, 35, 91, 63, 232, 2, 235, 246, 41,249, 60],
    [30, 47, 78, 72, 232, 144, 186, 158, 145, 46,78, 42, 66, 78, 48, 177, 201, 84, 194, 246,32, 77, 153, 26, 204, 139, 24, 149, 70, 89,23, 50],
    [164, 53, 148, 8, 250, 208, 160, 70, 126, 59,160, 104, 222, 18, 194, 130, 172, 224, 232, 3,9, 43, 214, 128, 13, 213, 251, 91, 231, 216,221, 212],
    [132, 17, 89, 19, 158, 87, 26, 91, 138, 184,20, 203, 22, 142, 33, 67],
    [98, 124, 165, 114, 4, 73, 122, 239, 35, 224,182, 58, 230, 239, 169, 171],
    [41, 105, 145, 250, 243, 41, 66, 60, 57, 250,209, 67, 192, 42, 111, 95],
    [46, 125, 65, 197, 84, 64, 181, 17, 52, 236,114, 213, 42, 180, 217, 142]
]

for enc in a:
    enc=bytes(enc)
    iv=b'YdlvQDCjuS5T89m1'
    curse=open("Curse.dll","rb").read()
    print(unpad(AES.new(sha256(curse).digest(), AES.MODE_CBC, iv).decrypt(enc),16),end=',')
    print()
```

获得了许多类似b'\x04\x00\x00\x00\x02J\x00\x00\x00\x00\x00\x00\x00\x01J\x00\x00\x00\x00\x00\x00\x00\x00'的结果，作为输入传入了Stop()。3-3对应的是InvokeMethod，传入参数并调用方法，这里是根据传入的data调用了Hack类的方法，以上述data为例，首字节data[0]='\x04'代表方法号，\x00\x00\x00\x02代表有两个参数，参数以'J'开头，第一个参数为\x00\x00\x00\x00\x00\x00\x00\x01，即0x1，第二个为\x00\x00\x00\x00\x00\x00\x00\x00，即0x0。方法号应该能有方法具体对应，但在比赛的时候是直接猜0-7就是刚好对应Hack.a~h，事实证明也确实是这样。最后Task()返回Hack方法的执行结果

![image-20251020121113756](/media/posts/qwb-s9-polyencryption/8156a126b8b7077d.png)

而dll这边发送向python发送完**0**之后，开始循环调用Hack()和Horror()

![image-20251020153159062](/media/posts/qwb-s9-polyencryption/22bcc3727e0265ae.png)

Hack()方法与python通信获得一个Curse类并反射调用其Do方法

![image-20251020143328530](/media/posts/qwb-s9-polyencryption/03dbbbe402be935e.png)

这里先分析一下python主循环的逻辑

```python
# Saw.py
while True:
    rlen = u32(hack.recv(4))
    while rlen > 0:
        d = unpad(AES.new(hashlib.sha256(curse).digest(), AES.MODE_CBC, iv).decrypt(hack.recv(rlen)), 16)
        hack.send(p32(len(d)))
        hack.send(d)
        rlen = u32(hack.recv(4))

    
    if rr % 2 == 0:
        if rr == 0:
            lol(crack(b'm\xaa\x1eP3\x02\x16q\x08\xfd\xb6:\x1e\xf9\x0e\xe9'))
            lol(crack(b'\x15\x15\xf3^\x17\xf5v\xd1g\x82*\t\xaex\xcd\xac\x86$\x06\x89X\xf1\x89\xbbI\x90\xa0\x06\x1e5\xd4^'))
        else:
            lol(crack(b'X~\x87\x1fsx\x07\x86\x8bn4\x85\xc8\xe3G\x00'))
            lol(crack(b'>-D\xd4o<\xa1\x90N\x9e\xdc\x8c\x14\x05~\x9a'))
            lol(crack(b'\xfb\xf1}W\x90@\xf4\xb8\x1a\x18\x99\x0eVg\xc7+\xe0\x11tV\xbf\xfc\x9b\xcb\x08V\\\xe083\n\x93'))
            lol(crack(b'X~\x87\x1fsx\x07\x86\x8bn4\x85\xc8\xe3G\x00'))
            lol(crack(b'\n\x8b\x01!\x9d\\+W\x9c|\xbb\xb1\x1d\xf4pt'))
            lol(crack(b'u\x13o\x16vbV\xef\x89=\x1e\xe9Xd\xb9\x99'))

            tmp = lol(crack(b'i\x13%\xbd\x03d\xbd\xd8\xe5\x8d\x8d\xd8\x84i\x88N'))
            tmp = struct.unpack("I", bytes(map(lambda x : s[x], struct.pack("I", tmp))))[0]
            lol(crack(b'qE\nl[\x1eqv\xc5\xbc\xa8wyhL\xae') + p64(tmp) + crack(b'%\xd7}\xa4\x132\x12\xb3\x1ab\xb75\xc4\x01C\x1a'))
            lol(crack(b')\xb7\x05D\x9b\xd7\x94W\xc6\xe5\xeeK(\xab\x83;\xc6_\xdf#\x81\xb4d\x1b\xdb\x81J+\x95\xf1)\xa7'))
            lol(crack(b'\xfczD\xa0\x0f\xd4\xbc\x8b\xe9\x009\xd2u\x10\xe4#\x1d\x9b\x07}\xe8\xd7\x9d\x1dh\xfdy-\x91\xe2\xd3\xdf'))
        

        m[0] = lol(crack(b'Ui1\x92\x8a"\xcb1\xfb>\xd4V@\xaa\xcd\x01'))
        m[1] = lol(crack(b'o\xf8\xc3\x91\x93\xce!H\x08\xb9\x1ee\x8b7\x03\x1e'))
        m[2] = lol(crack(b'\x80\xd7@\x94\xfc\xec\x8f$z\xe8\xd7\xa1@]\x8a\x9e'))
    else:
        lol(crack(b'\x15[\xae\xe9\xb7Q\xd2!D\x18#\xeb\xc4\xce\x0fk'))
        m[:4] = [struct.unpack("I", bytes(map(lambda x : s[x], struct.pack("I", lol(crack(b'i\x13%\xbd\x03d\xbd\xd8\xe5\x8d\x8d\xd8\x84i\x88N'))))))[0] for _ in range(4)][::-1]
    
    hack.send(p32(0))
    r = 0
    while True:
        rdb.set_trace()
        if r == 0:
            break
        exec(r)
    rr += 1
```

首先是上面提到过的aes解密net端传过来的密文，当接收到**0**的时候结束

接下来大量的调用了lol(crack(data))，其中在crack中调用了set_trace与java通信

java被dll设置calc后恢复了执行，开始执行java的主循环，首先进入了一个小循环中，用于处理python crack中的set_trace，这里首先判断了一下python中的r（注意这个r是当前最小作用域中的r，可能是crack中的r，也可能是python主循环中的r）是否为0，不为0就将python中的r进行aes解密并再次赋值给r

![image-20251020154532030](/media/posts/qwb-s9-polyencryption/09d43c83bba17595.png)

python中的lol函数会将解密完的r写入Curse.dll并发送给net端，我们将所有dll用脚本dump下来，再反编译便可以得到Curse.Do具体做了什么，如下：

```python
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
from hashlib import sha256
import struct

s = (
0x9b, 0xac, 0x16, 0x92, 0x5d, 0x9c, 0x1f, 0xed, 0xf8, 0x52, 0x18, 0xc4, 0xd9, 0x59, 0xa0, 0x82,
0x3c, 0x88, 0x69, 0x4a, 0x5a, 0xf6, 0x34, 0xc1, 0xba, 0x27, 0xec, 0x23, 0x10, 0x51, 0x1, 0xe5,
0x5e, 0xb1, 0x12, 0xca, 0xe2, 0x9f, 0x65, 0x22, 0x7b, 0x2f, 0x3b, 0xeb, 0x4c, 0xf3, 0xb6, 0xb8,
0x1d, 0x50, 0xc5, 0x8e, 0x36, 0xd4, 0xd1, 0x89, 0x48, 0xad, 0xfe, 0x6e, 0xc0, 0x37, 0xb2, 0xa4,
0x6f, 0x71, 0x98, 0xa6, 0x49, 0x3a, 0x33, 0xff, 0x31, 0xb0, 0x8f, 0x76, 0xe4, 0xc8, 0x47, 0xab,
0xfd, 0x13, 0xd7, 0xc6, 0xdd, 0x73, 0xb5, 0x90, 0x70, 0x6a, 0xb9, 0x60, 0x1b, 0xfa, 0x1c, 0x45,
0xd8, 0x6, 0x68, 0x99, 0xa2, 0x4f, 0x7, 0x54, 0x4d, 0x17, 0x2a, 0x39, 0xa8, 0xa1, 0x84, 0x83,
0x64, 0x9e, 0x80, 0x7f, 0x29, 0xda, 0x61, 0x58, 0x20, 0x9, 0xdb, 0x8, 0x0f, 0xaf, 0x4, 0xd3,
0xf7, 0x5c, 0xee, 0xc9, 0x0c, 0x9d, 0x5, 0x93, 0xf2, 0x57, 0x4b, 0xf1, 0xcf, 0x15, 0xbf, 0xe8,
0xce, 0xea, 0x0e, 0x67, 0x91, 0x38, 0x6d, 0x3, 0x24, 0x25, 0x32, 0x85, 0xf5, 0xa5, 0x95, 0x5b,
0xbe, 0xbc, 0xdf, 0x0b, 0xbd, 0x7e, 0x35, 0x30, 0xae, 0xde, 0xef, 0x87, 0x8c, 0xb3, 0x1e, 0x28,
0x78, 0x6c, 0x75, 0x0a, 0x8a, 0x0d, 0x66, 0x8d, 0xcd, 0x40, 0x3d, 0xfb, 0x4e, 0xe1, 0xf4, 0x53,
0x2c, 0x77, 0x43, 0x26, 0x74, 0x94, 0x9a, 0xb7, 0x11, 0xa3, 0xe7, 0xfc, 0xd5, 0x96, 0x7c, 0xe0,
0xe6, 0x8b, 0xcb, 0x1a, 0x55, 0x62, 0xdc, 0xaa, 0x2, 0x63, 0x86, 0x7d, 0x14, 0x3f, 0x97, 0xa7,
0x72, 0x2e, 0x19, 0x2b, 0x0, 0x6b, 0xe9, 0x5f, 0xc2, 0x21, 0x2d, 0xd0, 0xf0, 0xd6, 0x7a, 0x3e,
0x46, 0x56, 0xd2, 0xe3, 0xbb, 0xb4, 0x44, 0xf9, 0xc7, 0x79, 0x81, 0x41, 0x42, 0xcc, 0xa9, 0xc3
)

curse=open("Curse.dll","rb").read()
cnt=0
iv=b"getAgentProperties"[:16]
key=bytes.fromhex(sha256(b"jdk.internal.vm.VMSupport").hexdigest())

def p64(i):
    return struct.pack("Q", i)

def lol(data):
	global cnt
	data=curse[:0x25C] + data.ljust(0xDF, b'\x00') + curse[0x33B:]
	open(f'output/Curse{str(cnt).zfill(2)}.dll','wb').write(data)
	cnt+=1
	return 0x11223344
    
def crack(enc):
	aes=AES.new(key=key,iv=iv,mode=AES.MODE_CBC)
	data=unpad(aes.decrypt(bytes(enc)),16)
	return data

lol(crack(b'm\xaa\x1eP3\x02\x16q\x08\xfd\xb6:\x1e\xf9\x0e\xe9'))
# s[sp] = 2427014626L;
# return sp + 1;
lol(crack(b'\x15\x15\xf3^\x17\xf5v\xd1g\x82*\t\xaex\xcd\xac\x86$\x06\x89X\xf1\x89\xbbI\x90\xa0\x06\x1e5\xd4^'))
# s[256] = 1023L;
# return sp;           
lol(crack(b'X~\x87\x1fsx\x07\x86\x8bn4\x85\xc8\xe3G\x00'))
# s[sp] = s[4];
# return sp;
lol(crack(b'>-D\xd4o<\xa1\x90N\x9e\xdc\x8c\x14\x05~\x9a'))
# s[sp] <<= 8;
# return sp;
lol(crack(b'\xfb\xf1}W\x90@\xf4\xb8\x1a\x18\x99\x0eVg\xc7+\xe0\x11tV\xbf\xfc\x9b\xcb\x08V\\\xe083\n\x93'))
# s[sp] &= 4294967295L;
# return sp + 1;
lol(crack(b'X~\x87\x1fsx\x07\x86\x8bn4\x85\xc8\xe3G\x00'))
# s[sp] = s[4];
# return sp;
lol(crack(b'\n\x8b\x01!\x9d\\+W\x9c|\xbb\xb1\x1d\xf4pt'))
# s[sp] >>= 24;
# return sp;
lol(crack(b'u\x13o\x16vbV\xef\x89=\x1e\xe9Xd\xb9\x99'))
# s[sp - 1] = (s[sp] | s[sp - 1]);
# return sp;
tmp = lol(crack(b'i\x13%\xbd\x03d\xbd\xd8\xe5\x8d\x8d\xd8\x84i\x88N'))
# s[0] = s[sp - 1];
# return sp - 1;
tmp = struct.unpack("I", bytes(map(lambda x : s[x], struct.pack("I", tmp))))[0]
print(tmp)
lol(crack(b'qE\nl[\x1eqv\xc5\xbc\xa8wyhL\xae') + p64(tmp) + crack(b'%\xd7}\xa4\x132\x12\xb3\x1ab\xb75\xc4\x01C\x1a'))
# s[1] = (s[1] ^ tmp); tmp为 s[0]
# return sp;
lol(crack(b')\xb7\x05D\x9b\xd7\x94W\xc6\xe5\xeeK(\xab\x83;\xc6_\xdf#\x81\xb4d\x1b\xdb\x81J+\x95\xf1)\xa7'))
# s[1] = (s[1] ^ s[(int)s[256]]);
# return sp;
lol(crack(b'\xfczD\xa0\x0f\xd4\xbc\x8b\xe9\x009\xd2u\x10\xe4#\x1d\x9b\x07}\xe8\xd7\x9d\x1dh\xfdy-\x91\xe2\xd3\xdf'))
# s[256] = s[256] + 1L;
# return sp;
lol(crack(b'Ui1\x92\x8a"\xcb1\xfb>\xd4V@\xaa\xcd\x01'))
# s[0] = s[1];
# return sp;
lol(crack(b'o\xf8\xc3\x91\x93\xce!H\x08\xb9\x1ee\x8b7\x03\x1e'))
# s[0] = s[2];
# return sp;
lol(crack(b'\x80\xd7@\x94\xfc\xec\x8f$z\xe8\xd7\xa1@]\x8a\x9e'))
# s[0] = s[3];
# return sp;
lol(crack(b'\x15[\xae\xe9\xb7Q\xd2!D\x18#\xeb\xc4\xce\x0fk'))
[struct.unpack("I", bytes(map(lambda x : s[x], struct.pack("I", lol(crack(b'i\x13%\xbd\x03d\xbd\xd8\xe5\x8d\x8d\xd8\x84i\x88N'))))))[0] for _ in range(4)][::-1]
# s[0] = s[sp - 1];
# return sp - 1;
```

发送完dll后，python发送了一个0到net端，net开始循环执行horror函数，而python开始循环调用trace函数，这里r一开始是0

![image-20251020155803088](/media/posts/qwb-s9-polyencryption/2b7ec2d1d267b319.png)

java端检测到r=0后退出小循环，开始调试python

![image-20251020155907824](/media/posts/qwb-s9-polyencryption/421391f9e27448d1.png)

这里hack调用了Curse.magic，但这个方法是空的。在比赛的时候一直以为是net通过jdwp动态注入，但过了一遍协议并没有看到合适的，而且在net和python都没有找到相关的代码（写wp写到这我才发现他确实是空的/(ㄒoㄒ)/~~）。但考虑到net端的Horror和java是同步运行的，这里先看Horror具体做了什么

Horror中首先是2-6获取Curse.hack的objectID，然后10-1读取字符串的值，读取后对其进行aes解密，然后1-11 CreateString，最后3-2设置Curse.hack的值

![image-20251020162552475](/media/posts/qwb-s9-polyencryption/a8b8645f1b621c9c.png)

解密的k和iv在net端main函数刚开始的地方，可以看到这里将s[1017:1033]作为iv，但是我在哪都找不到这段赋值在哪，突然想起虽然不能完整的动调但调到这里还是没问题的，于是用dnspy动调取出iv：0000000000008CAB20E0EB5D0E419101和k：F8963561A24B24F219999D30D026F9421CFA89731CAFE47E47560A3AAF557559

<img src="/media/posts/qwb-s9-polyencryption/9c956bcb785feadb.png" alt="image-20251020163216397" style="zoom:80%;" />

脚本解密java的密文

```python
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad

iv=bytes.fromhex("0000000000008CAB20E0EB5D0E419101")
k=bytes.fromhex("F8963561A24B24F219999D30D026F9421CFA89731CAFE47E47560A3AAF557559")

msgs=[
    [28, -63, 46, 26, 25, 58, 31, 97, 30, 59, 58, 108, 61, -84, -112, -59, -34, 5, 109, -20, 51, 15, -39, -51, 4, 65, 37, 121, -65, -78, -75, -117],
    [0, 1, 45, 116, 39, -22, 40, -110, -122, -81, -69, -55, 87, 78, 2, -45, -6, -21, -5, 121, 91, -114, 105, -83, -4, -84, -101, 23, 34, 66, -15, 119, -54, -84, 105, 98, -115, -126, -43, 47, 46, -41, -107, 105, -33, 36, 95, 66, 5, 74, 59, -73, -63, 86, -85, -103, 67, 77, 123, 40, 99, 47, 74, -16, 58, -23, 8, -126, -40, -26, 24, 125, -36, 60, -83, 75, 94, 126, -32, 27],
    [52, -41, -106, -110, 107, 126, -117, -34, -86, 125, 65, 97, 4, 110, -82, 10],
    [69, 32, -33, 106, -77, 65, 91, -31, 27, 96, 113, -105, -24, -99, -26, -52],
    [71, 89, 71, -105, 85, -68, -66, 47, -29, -99, -104, 126, -122, -2, -114, -9],
    [72, -107, 88, -47, 21, 87, -84, 86, 125, 121, -24, 124, -18, -27, -120, -46],
    [-74, -18, 24, 71, -73, 57, 23, 100, -35, 46, -21, -26, 114, -61, 126, 97, -3, -11, -64, 40, -81, 33, 64, 113, 97, -5, -47, 1, 27, -33, -41, 15],
    [-44, -3, 112, 89, -107, 63, -108, 77, -108, 51, 25, -117, -126, -29, -75, 105, 68, -125, 62, 82, 13, 41, -25, 124, -77, 103, -2, 86, -41, 62, 13, 84, -39, 105, -7, 103, 32, 7, 11, -51, 94, -105, -66, 77, 66, -23, -3, -120],
    [120, 30, -36, -125, -53, -13, -54, -6, 31, -111, 3, -106, 6, -111, 65, 80, 28, 125, -81, -57, -107, 82, -106, -61, -26, -47, -36, 107, -32, -109, 49, 126, -70, 41, 13, -7, 117, -110, -79, -12, 50, 10, 21, 92, 118, 76, -13, 39],
    [84, -15, 32, 24, 79, 32, 19, 85, -24, -50, -43, 13, -54, -64, 48, -127, -98, 44, -63, -49, -31, 99, -101, 51, -28, 30, -17, -101, -93, 78, 65, 35, 29, -107, 35, -6, -126, -30, -66, 1, 81, 59, 102, -28, 52, -93, 42, 14, 15, -5, 46, 127, -8, 18, 15, -110, -21, 21, -119, -86, -65, -84, 0, 112, -90, 31, -16, 40, 60, -6, 107, 66, -95, -122, 46, -110, 120, -64, -57, 42, -73, -18, 114, 61, -31, 109, 120, -100, 57, 91, 114, -44, -43, -61, -71, 97, 60, -1, 24, 27, -109, -82, 42, -14, -22, 10, 47, 67, 35, -81, -76, -125, -74, -51, 47, 15, 85, 30, -125, 119, -9, -44, -31, 101, -99, 92, 56, 40, 54, 26, -64, -83, -19, 57, -20, 34, 57, -78, -73, -72, 67, 36, 84, 77, -53, -121, 78, 13, -104, -87, 41, 0, -54, -100, 22, 36, -18, 61, -24, 11],
    [-109, -19, 100, 9, 20, 118, -78, 118, -119, -39, -48, -37, 62, 33, 40, 79],
    [84, -15, 32, 24, 79, 32, 19, 85, -24, -50, -43, 13, -54, -64, 48, -127, 4, -24, 29, 61, 53, 40, 52, 37, 48, 57, 100, 26, 9, -26, 11, -92],
    [22, 38, 5, 69, 64, 16, -17, 49, 93, -19, 72, 100, 50, -65, -110, 12],
    [84, -15, 32, 24, 79, 32, 19, 85, -24, -50, -43, 13, -54, -64, 48, -127, 4, -24, 29, 61, 53, 40, 52, 37, 48, 57, 100, 26, 9, -26, 11, -92],
    [-67, -13, 10, -91, 49, 52, -13, 69, -112, -119, 18, -25, 84, 38, 101, -123],
    [84, -15, 32, 24, 79, 32, 19, 85, -24, -50, -43, 13, -54, -64, 48, -127, 4, -24, 29, 61, 53, 40, 52, 37, 48, 57, 100, 26, 9, -26, 11, -92],
    [61, -93, 69, -74, -70, 49, -95, 121, 64, -70, -45, -48, -44, -119, 1, -95],
    [84, -15, 32, 24, 79, 32, 19, 85, -24, -50, -43, 13, -54, -64, 48, -127, 4, -24, 29, 61, 53, 40, 52, 37, 48, 57, 100, 26, 9, -26, 11, -92],
    [84, -15, 32, 24, 79, 32, 19, 85, -24, -50, -43, 13, -54, -64, 48, -127, 4, -24, 29, 61, 53, 40, 52, 37, 48, 57, 100, 26, 9, -26, 11, -92],
    [109, 82, -84, -48, 54, -41, -91, 47, 32, 88, 51, -49, 89, -37, -113, -8]
]

for msg in msgs:
    aes = AES.new(k, AES.MODE_CBC, iv)
    for i in range(len(msg)):
        if msg[i]<0:
            msg[i]+=256
    print(unpad(aes.decrypt(bytes(msg)),16))

'''
b"!r='m[1]=1166827919'"
b'!xt = lambda a: (((a << 1) ^ 0x1B) & 0xFF) if (a & 0x80) else (a << 1)'
b"!ii = '>I'"
b"!r='m[1]^=m[0]'"
b'p m[1]'
b'p m[2]'
b"!r='m[4]=list()'"
b"!r='m[5]=list(struct.pack(ii,m[len(m[4])]))'"
b"!r='m[6]=m[5][0]^m[5][1]^m[5][2]^m[5][3]'"
b"!r='m[4].append([m[5][0]^m[6]^xt(m[5][0]^m[5][1]),m[5][1]^m[6]^xt(m[5][1]^m[5][2]),m[5][2]^m[6]^xt(m[5][2]^m[5][3]),m[5][3]^m[6]^xt(m[5][3]^m[5][0])])'"
b'p m[4][0][0]'
b"!r='m[4].append(m[4].pop(0))'"
b'p m[4][0][1]'
b"!r='m[4].append(m[4].pop(0))'"
b'p m[4][0][2]'
b"!r='m[4].append(m[4].pop(0))'"
b'p m[4][0][3]'
b"!r='m[4].append(m[4].pop(0))'"
b"!r='m[4].append(m[4].pop(0))'"
b'!r=0'
'''
```

可以看到，最后java执行完调试命令后设置r为0，进行下一轮循环，python检测到r=0后也进入下一轮循环，至此便分析出整个程序一轮的执行流程（不容易啊）



## 代码还原

根据上面的分析，我们可以粗糙的将原程序用整合到一个脚本当中

```python
from Crypto.Cipher import AES
import struct

scmsg=[
    b'\x04\x00\x00\x00\x02J\x00\x00\x00\x00\x00\x00\x00\x01J\x00\x00\x00\x00\x00\x00\x00\x00',
    b'\x02\x00\x00\x00\x02J\x00\x00\x00\x00\x00\x00\x00\x01J\x00\x00\x00\x00I\xe9\x9e\x07',
    b'\x03\x00\x00\x00\x01J\x00\x00\x00\x00\x00\x00\x00\x00',
    b'\x03\x00\x00\x00\x01J\x00\x00\x00\x00\x00\x00\x00\x01',
    b'\x02\x00\x00\x00\x02J\x00\x00\x00\x00\x00\x00\x00\x11J\x00\x00\x00\x00\x00\x00\x00\x01',
    b'\x04\x00\x00\x00\x02J\x00\x00\x00\x00\x00\x00\x00\x10J\x00\x00\x00\x00\x00\x00\x00\x10',
    b'\x05\x00\x00\x00\x02J\x00\x00\x00\x00\x00\x00\x00\x10J\x00\x00\x00\x00\x00\x00\x00\x08',
    b'\x07\x00\x00\x00\x02J\x00\x00\x00\x00\x00\x00\x00\x10J\x00\x00\x00\x00\x00\x00\x00\x11',
    b'\x06\x00\x00\x00\x02J\x00\x00\x00\x00\x00\x00\x00\x11J\x00\x00\x00\x00\x00\x00\x00\x01',
    b'\x05\x00\x00\x00\x02J\x00\x00\x00\x00\x00\x00\x00\x10J\x00\x00\x00\x00\x00\x00\x00\x08',
    b'\x07\x00\x00\x00\x02J\x00\x00\x00\x00\x00\x00\x00\x10J\x00\x00\x00\x00\x00\x00\x00\x11',
    b'\x06\x00\x00\x00\x02J\x00\x00\x00\x00\x00\x00\x00\x11J\x00\x00\x00\x00\x00\x00\x00\x01',
    b'\x05\x00\x00\x00\x02J\x00\x00\x00\x00\x00\x00\x00\x10J\x00\x00\x00\x00\x00\x00\x00\x08',
    b'\x07\x00\x00\x00\x02J\x00\x00\x00\x00\x00\x00\x00\x10J\x00\x00\x00\x00\x00\x00\x00\x11',
    b'\x06\x00\x00\x00\x02J\x00\x00\x00\x00\x00\x00\x00\x11J\x00\x00\x00\x00\x00\x00\x00\x01',
    b'\x06\x00\x00\x00\x02J\x00\x00\x00\x00\x00\x00\x00\x10J\x00\x00\x00\x00\x00\x00\x00\x01',
    b'\x07\x00\x00\x00\x02J\x00\x00\x00\x00\x00\x00\x00\x10J\x00\x00\x00\x00\x00\x00\x00\x10',
    b'\x07\x00\x00\x00\x02J\x00\x00\x00\x00\x00\x00\x00\x10J\x00\x00\x00\x00\x00\x00\x00\x11',
    b'\x06\x00\x00\x00\x02J\x00\x00\x00\x00\x00\x00\x00\x11J\x00\x00\x00\x00\x00\x00\x00\x01',
    b'\x00\x00\x00\x00\x02J\x00\x00\x00\x00\x00\x00\x00\x10J\x00\x00\x00\x00\x00\x00\x00\x01',
    b'\x03\x00\x00\x00\x01J\x00\x00\x00\x00\x00\x00\x00\x00',
    b'\x03\x00\x00\x00\x01J\x00\x00\x00\x00\x00\x00\x00\x01',
    b'\x03\x00\x00\x00\x01J\x00\x00\x00\x00\x00\x00\x00\x02',
    b'\x03\x00\x00\x00\x01J\x00\x00\x00\x00\x00\x00\x00\x03'
]
sbox = (
    0x9b, 0xac, 0x16, 0x92, 0x5d, 0x9c, 0x1f, 0xed, 0xf8, 0x52, 0x18, 0xc4, 0xd9, 0x59, 0xa0, 0x82,
    0x3c, 0x88, 0x69, 0x4a, 0x5a, 0xf6, 0x34, 0xc1, 0xba, 0x27, 0xec, 0x23, 0x10, 0x51, 0x1, 0xe5,
    0x5e, 0xb1, 0x12, 0xca, 0xe2, 0x9f, 0x65, 0x22, 0x7b, 0x2f, 0x3b, 0xeb, 0x4c, 0xf3, 0xb6, 0xb8,
    0x1d, 0x50, 0xc5, 0x8e, 0x36, 0xd4, 0xd1, 0x89, 0x48, 0xad, 0xfe, 0x6e, 0xc0, 0x37, 0xb2, 0xa4,
    0x6f, 0x71, 0x98, 0xa6, 0x49, 0x3a, 0x33, 0xff, 0x31, 0xb0, 0x8f, 0x76, 0xe4, 0xc8, 0x47, 0xab,
    0xfd, 0x13, 0xd7, 0xc6, 0xdd, 0x73, 0xb5, 0x90, 0x70, 0x6a, 0xb9, 0x60, 0x1b, 0xfa, 0x1c, 0x45,
    0xd8, 0x6, 0x68, 0x99, 0xa2, 0x4f, 0x7, 0x54, 0x4d, 0x17, 0x2a, 0x39, 0xa8, 0xa1, 0x84, 0x83,
    0x64, 0x9e, 0x80, 0x7f, 0x29, 0xda, 0x61, 0x58, 0x20, 0x9, 0xdb, 0x8, 0x0f, 0xaf, 0x4, 0xd3,
    0xf7, 0x5c, 0xee, 0xc9, 0x0c, 0x9d, 0x5, 0x93, 0xf2, 0x57, 0x4b, 0xf1, 0xcf, 0x15, 0xbf, 0xe8,
    0xce, 0xea, 0x0e, 0x67, 0x91, 0x38, 0x6d, 0x3, 0x24, 0x25, 0x32, 0x85, 0xf5, 0xa5, 0x95, 0x5b,
    0xbe, 0xbc, 0xdf, 0x0b, 0xbd, 0x7e, 0x35, 0x30, 0xae, 0xde, 0xef, 0x87, 0x8c, 0xb3, 0x1e, 0x28,
    0x78, 0x6c, 0x75, 0x0a, 0x8a, 0x0d, 0x66, 0x8d, 0xcd, 0x40, 0x3d, 0xfb, 0x4e, 0xe1, 0xf4, 0x53,
    0x2c, 0x77, 0x43, 0x26, 0x74, 0x94, 0x9a, 0xb7, 0x11, 0xa3, 0xe7, 0xfc, 0xd5, 0x96, 0x7c, 0xe0,
    0xe6, 0x8b, 0xcb, 0x1a, 0x55, 0x62, 0xdc, 0xaa, 0x2, 0x63, 0x86, 0x7d, 0x14, 0x3f, 0x97, 0xa7,
    0x72, 0x2e, 0x19, 0x2b, 0x0, 0x6b, 0xe9, 0x5f, 0xc2, 0x21, 0x2d, 0xd0, 0xf0, 0xd6, 0x7a, 0x3e,
    0x46, 0x56, 0xd2, 0xe3, 0xbb, 0xb4, 0x44, 0xf9, 0xc7, 0x79, 0x81, 0x41, 0x42, 0xcc, 0xa9, 0xc3
)

input="abe74e3a9c375b3428bf31d1f8fa49c1"
rr=0
sp=1
m = [0] * 128
s=[0]*2024
s[1023] = 3207972492
s[1024] = 1190065579
s[1025] = 4165979424
s[1026] = 2693353696
s[1027] = 3628337899
s[1028] = 1707638109
s[1029] = 1003779598
s[1030] = 2653425729
s[1031] = 795752593
s[1032] = 2469382657

class Hack:
    m = [0] * 128
    def __init__(self):
        pass

    def a(self, j, j2):
        return j + j2

    def b(self, j, j2):
        return j - j2

    def c(self, j, j2):
        self.m[j] = j2
        return 0

    def d(self, j):
        return self.m[j]

    def e(self, j, j2):
        jArr = self.m
        i = j
        jArr[i] = jArr[i] ^ self.m[j2]
        return 0

    def f(self, j, j2):
        jArr = self.m
        i = self.m[j]
        jArr[i] = jArr[i] << (j2)
        return 0

    def g(self, j, j2):
        jArr = self.m
        i = j
        jArr[i] = jArr[i] + j2
        return 0

    def h(self, j, j2):
        jArr = self.m
        i = self.m[j]
        jArr[i] = jArr[i] ^ self.m[self.m[j2]]
        return 0
    
class Curse:
    hack = ""
    i=0
    def __init__(self):
        pass

    def magic(self):
        pass

class Saw:
    i=0
    ii=""
    xt=None
    def __init__(self):
        pass

    def main(self):
        global hack
        global m
        if (self.i % 2 == 0):
            if (self.i == 0):
                m[1]=1166827919
                self.xt = lambda a: (((a << 1) ^ 0x1B) & 0xFF) if (a & 0x80) else (a << 1)
                self.ii = '>I'
            else:
                m[1]^=m[0]
            hack.m[0] = m[1]
            hack.m[1] = m[2]
        else:
            m[4]=list()
            for i2 in range(4):
                m[5]=list(struct.pack(self.ii,m[len(m[4])]))
                m[6]=m[5][0]^m[5][1]^m[5][2]^m[5][3]
                m[4].append([m[5][0]^m[6]^self.xt(m[5][0]^m[5][1]),m[5][1]^m[6]^self.xt(m[5][1]^m[5][2]),m[5][2]^m[6]^self.xt(m[5][2]^m[5][3]),m[5][3]^m[6]^self.xt(m[5][3]^m[5][0])])
            for i3 in range(4):
                hack.m[i3 * 4] = m[4][0][0]
                m[4].append(m[4].pop(0))
                hack.m[(i3 * 4) + 1] = m[4][0][1]
                m[4].append(m[4].pop(0))
                hack.m[(i3 * 4) + 2] = m[4][0][2]
                m[4].append(m[4].pop(0))
                hack.m[(i3 * 4) + 3] = m[4][0][3]
                m[4].append(m[4].pop(0))
                m[4].append(m[4].pop(0))
            # print(hack.m)
            # print(m)
        self.i += 1
    
curse = Curse()
hack = Hack()
saw = Saw()

def get_s():
    global sp, s
    s[0] = s[sp - 1]
    sp -= 1     
    return s[0]

def stopcrack(msg):
    method = msg[0]
    arg0 = struct.unpack("<Q", msg[6:14][::-1])[0]
    if (msg[4]==2):
        arg1 = struct.unpack("<Q", msg[15:23][::-1])[0]
    if method == 0:
        return hack.a(arg0, arg1)
    elif method == 1:
        return hack.b(arg0, arg1)
    elif method == 2:
        return hack.c(arg0, arg1)
    elif method == 3:
        return hack.d(arg0)
    elif method == 4:
        return hack.e(arg0, arg1)
    elif method == 5:
        return hack.f(arg0, arg1)
    elif method == 6:
        return hack.g(arg0, arg1)
    elif method == 7:
        return hack.h(arg0, arg1)

def shreck():
    pass

def breck():
    pass

def hack1():
    global rr, sp
    if rr % 2 == 0:
        if rr == 0:
            s[sp] = 2427014626
            sp +=1
            s[256] = 1023
        else:
            s[sp] = s[4]
            s[sp] <<= 8
            s[sp] &= 4294967295
            sp += 1
            s[sp] = s[4]
            s[sp] >>= 24
            s[sp - 1] = (s[sp] | s[sp - 1])
            s[0] = s[sp - 1]
            sp -= 1
            tmp = s[0]
            # print(tmp)
            tmp = struct.unpack("I", bytes(map(lambda x : sbox[x], struct.pack("I", tmp))))[0]
            s[1] = (s[1] ^ tmp)
            s[1] = (s[1] ^ s[s[256]])
            s[256] = s[256] + 1

        s[0] = s[1]
        m[0] = s[0]
        s[0] = s[2]
        m[1] = s[0]
        s[0] = s[3] 
        m[2] = s[0]
            
    else:
        sp += 31
        m[:4] = [struct.unpack("I", bytes(map(lambda x: sbox[x], struct.pack("I", get_s()))))[0] for _ in range(4)][::-1]
        
    saw.main()
    return False
    
def horror():
    return False

while True:
    print(".",end='')
    shreck()
    if rr == 0:
        s[32] = int(input[0:8], 16)
        s[33] = int(input[8:16], 16)
        s[34] = int(input[16:24], 16)
        s[35] = int(input[24:32], 16)
    elif rr % 2 == 1:
        if rr != 1:
            stopcrack(scmsg[0])
        else:
            stopcrack(scmsg[1])
            sp+=3
        arr2=s
        arr2[2]=stopcrack(scmsg[2])
        arr2=s
        arr2[3]=stopcrack(scmsg[3])
        if rr==1:
            s[4]=1038097261
        else:
            s[4]^=s[3]
        # print(s[:5])
    else:
        sp-=27
        stopcrack(scmsg[4])
        stopcrack(scmsg[5])
        for ii in range(4):
            stopcrack(scmsg[6])
            stopcrack(scmsg[7])
            stopcrack(scmsg[8])
            stopcrack(scmsg[9])
            stopcrack(scmsg[10])
            stopcrack(scmsg[11])
            stopcrack(scmsg[12])
            stopcrack(scmsg[13])
            stopcrack(scmsg[14])
            stopcrack(scmsg[15])
            stopcrack(scmsg[16])
            stopcrack(scmsg[17])
            stopcrack(scmsg[18])
        stopcrack(scmsg[19])
        arr2=s
        num=s[1]
        arr2[32]=num^stopcrack(scmsg[20])
        arr2=s
        num=s[2]
        arr2[33]=num^stopcrack(scmsg[21])
        arr2=s
        num=s[3]
        arr2[34]=num^stopcrack(scmsg[22])
        arr2=s
        num=s[4]
        arr2[35]=num^stopcrack(scmsg[23])
    if rr==22:
        for i in range(4):
            bytes_ = struct.pack('<I', s[32 + i])[::-1]
            print(bytes_.hex().upper(), end="")
        break
    breck()
    while (hack1()):
        pass
    while (horror()):
        pass
    rr+=1
```

经过不断简化之后，可以大致看出是个魔改的aes

```python
from Crypto.Cipher import AES
import struct

sbox = (
    0x9b, 0xac, 0x16, 0x92, 0x5d, 0x9c, 0x1f, 0xed, 0xf8, 0x52, 0x18, 0xc4, 0xd9, 0x59, 0xa0, 0x82,
    0x3c, 0x88, 0x69, 0x4a, 0x5a, 0xf6, 0x34, 0xc1, 0xba, 0x27, 0xec, 0x23, 0x10, 0x51, 0x1, 0xe5,
    0x5e, 0xb1, 0x12, 0xca, 0xe2, 0x9f, 0x65, 0x22, 0x7b, 0x2f, 0x3b, 0xeb, 0x4c, 0xf3, 0xb6, 0xb8,
    0x1d, 0x50, 0xc5, 0x8e, 0x36, 0xd4, 0xd1, 0x89, 0x48, 0xad, 0xfe, 0x6e, 0xc0, 0x37, 0xb2, 0xa4,
    0x6f, 0x71, 0x98, 0xa6, 0x49, 0x3a, 0x33, 0xff, 0x31, 0xb0, 0x8f, 0x76, 0xe4, 0xc8, 0x47, 0xab,
    0xfd, 0x13, 0xd7, 0xc6, 0xdd, 0x73, 0xb5, 0x90, 0x70, 0x6a, 0xb9, 0x60, 0x1b, 0xfa, 0x1c, 0x45,
    0xd8, 0x6, 0x68, 0x99, 0xa2, 0x4f, 0x7, 0x54, 0x4d, 0x17, 0x2a, 0x39, 0xa8, 0xa1, 0x84, 0x83,
    0x64, 0x9e, 0x80, 0x7f, 0x29, 0xda, 0x61, 0x58, 0x20, 0x9, 0xdb, 0x8, 0x0f, 0xaf, 0x4, 0xd3,
    0xf7, 0x5c, 0xee, 0xc9, 0x0c, 0x9d, 0x5, 0x93, 0xf2, 0x57, 0x4b, 0xf1, 0xcf, 0x15, 0xbf, 0xe8,
    0xce, 0xea, 0x0e, 0x67, 0x91, 0x38, 0x6d, 0x3, 0x24, 0x25, 0x32, 0x85, 0xf5, 0xa5, 0x95, 0x5b,
    0xbe, 0xbc, 0xdf, 0x0b, 0xbd, 0x7e, 0x35, 0x30, 0xae, 0xde, 0xef, 0x87, 0x8c, 0xb3, 0x1e, 0x28,
    0x78, 0x6c, 0x75, 0x0a, 0x8a, 0x0d, 0x66, 0x8d, 0xcd, 0x40, 0x3d, 0xfb, 0x4e, 0xe1, 0xf4, 0x53,
    0x2c, 0x77, 0x43, 0x26, 0x74, 0x94, 0x9a, 0xb7, 0x11, 0xa3, 0xe7, 0xfc, 0xd5, 0x96, 0x7c, 0xe0,
    0xe6, 0x8b, 0xcb, 0x1a, 0x55, 0x62, 0xdc, 0xaa, 0x2, 0x63, 0x86, 0x7d, 0x14, 0x3f, 0x97, 0xa7,
    0x72, 0x2e, 0x19, 0x2b, 0x0, 0x6b, 0xe9, 0x5f, 0xc2, 0x21, 0x2d, 0xd0, 0xf0, 0xd6, 0x7a, 0x3e,
    0x46, 0x56, 0xd2, 0xe3, 0xbb, 0xb4, 0x44, 0xf9, 0xc7, 0x79, 0x81, 0x41, 0x42, 0xcc, 0xa9, 0xc3
)

xt=lambda a: (((a << 1) ^ 0x1B) & 0xFF) if (a & 0x80) else (a << 1)

def SubBytes(state_int):
    return [struct.unpack("I", bytes(map(lambda x: sbox[x], struct.pack("I", state_int[3-i]))))[0] for i in range(4)][::-1]

def MixColumns(state):
    arr0=list()
    for i2 in range(4):
        arr1 = list(struct.pack('>I', state[i2]))
        tmp = arr1[0] ^ arr1[1] ^ arr1[2] ^ arr1[3]
        arr0.append([
            arr1[0]^tmp^xt(arr1[0]^arr1[1]),
            arr1[1]^tmp^xt(arr1[1]^arr1[2]),
            arr1[2]^tmp^xt(arr1[2]^arr1[3]),
            arr1[3]^tmp^xt(arr1[3]^arr1[0])
        ])
    return arr0

def ShiftRows(arr0, state):
    for i3 in range(4):
        state[i3 * 4] = arr0[0][0]
        arr0.append(arr0.pop(0))
        state[(i3 * 4) + 1] = arr0[0][1]
        arr0.append(arr0.pop(0))
        state[(i3 * 4) + 2] = arr0[0][2]
        arr0.append(arr0.pop(0))
        state[(i3 * 4) + 3] = arr0[0][3]
        arr0.append(arr0.pop(0))
        arr0.append(arr0.pop(0))

def AddRoundKey(state, state_int, key):
    for i in range(4):
        state[i]<<=8
        state[i]^=state[1+4*i]
        state[i]<<=8
        state[i]^=state[2+4*i]
        state[i]<<=8
        state[i]^=state[3+4*i]
        state[i+1]=state[4+4*i]
    state_int[0]=key[1]^state[0]
    state_int[1]=key[2]^state[1]
    state_int[2]=key[3]^state[2]
    state_int[3]=key[4]^state[3]

input="649D7FA69253342D3601F5B6691EBB397B8248DDE5F8634071BE2CC31EA598A82ECEB619396B08E2F0614092DD8F7087C9E129967CCFF5D41AA6950FB0E5FE7C"[:32]
print(input)

state = [0] * 17
state_int=[int(input[0:8], 16), int(input[8:16], 16), int(input[16:24], 16), int(input[24:32], 16)]
m = [0] * 3
key=[0,2427014626,1166827919,1240047111,1038097261]
box=[3207972492,1190065579,4165979424,2693353696,3628337899,1707638109,1003779598,2653425729,795752593,2469382657]

ShiftRows(MixColumns(SubBytes(state_int)), state)

for j in range(0,11):
    
    AddRoundKey(state, state_int, key)
    if j == 10:
        break
    
    tmp = (key[4]>>24) | (key[4]<<8 & 0xFFFFFFFF)
    tmp = struct.unpack("I", bytes(map(lambda x : sbox[x], struct.pack("I", tmp))))[0]
    key[1] ^= tmp
    key[1] ^= box[j]
    state[0] = key[1] ^ key[2]
    state[1] = key[3] ^ state[0]
    key[4] ^= state[1]
    key[2]=state[0]
    key[3]=state[1] 

    ShiftRows(MixColumns(SubBytes(state_int)), state)

for i in range(4):
    bytes_ = struct.pack('<I', state_int[i])[::-1]
    print(bytes_.hex().upper(), end="")

```

最后不想管了让gpt给我梭（这里只搞了前16字节，由于前后组加密互不影响一组一组解就行）

得到flag：flag{I_ju5t_w0nd3r_1f_y0u_l0v3_C#_j4v4_pyth0n??}

```python
# decrypt_custom_aes_like.py
# 适用于你提供的加密脚本的解密实现

import struct

# ----- sbox（与你给出的一致） -----
sbox = (
    0x9b, 0xac, 0x16, 0x92, 0x5d, 0x9c, 0x1f, 0xed, 0xf8, 0x52, 0x18, 0xc4, 0xd9, 0x59, 0xa0, 0x82,
    0x3c, 0x88, 0x69, 0x4a, 0x5a, 0xf6, 0x34, 0xc1, 0xba, 0x27, 0xec, 0x23, 0x10, 0x51, 0x01, 0xe5,
    0x5e, 0xb1, 0x12, 0xca, 0xe2, 0x9f, 0x65, 0x22, 0x7b, 0x2f, 0x3b, 0xeb, 0x4c, 0xf3, 0xb6, 0xb8,
    0x1d, 0x50, 0xc5, 0x8e, 0x36, 0xd4, 0xd1, 0x89, 0x48, 0xad, 0xfe, 0x6e, 0xc0, 0x37, 0xb2, 0xa4,
    0x6f, 0x71, 0x98, 0xa6, 0x49, 0x3a, 0x33, 0xff, 0x31, 0xb0, 0x8f, 0x76, 0xe4, 0xc8, 0x47, 0xab,
    0xfd, 0x13, 0xd7, 0xc6, 0xdd, 0x73, 0xb5, 0x90, 0x70, 0x6a, 0xb9, 0x60, 0x1b, 0xfa, 0x1c, 0x45,
    0xd8, 0x06, 0x68, 0x99, 0xa2, 0x4f, 0x07, 0x54, 0x4d, 0x17, 0x2a, 0x39, 0xa8, 0xa1, 0x84, 0x83,
    0x64, 0x9e, 0x80, 0x7f, 0x29, 0xda, 0x61, 0x58, 0x20, 0x09, 0xdb, 0x08, 0x0f, 0xaf, 0x04, 0xd3,
    0xf7, 0x5c, 0xee, 0xc9, 0x0c, 0x9d, 0x05, 0x93, 0xf2, 0x57, 0x4b, 0xf1, 0xcf, 0x15, 0xbf, 0xe8,
    0xce, 0xea, 0x0e, 0x67, 0x91, 0x38, 0x6d, 0x03, 0x24, 0x25, 0x32, 0x85, 0xf5, 0xa5, 0x95, 0x5b,
    0xbe, 0xbc, 0xdf, 0x0b, 0xbd, 0x7e, 0x35, 0x30, 0xae, 0xde, 0xef, 0x87, 0x8c, 0xb3, 0x1e, 0x28,
    0x78, 0x6c, 0x75, 0x0a, 0x8a, 0x0d, 0x66, 0x8d, 0xcd, 0x40, 0x3d, 0xfb, 0x4e, 0xe1, 0xf4, 0x53,
    0x2c, 0x77, 0x43, 0x26, 0x74, 0x94, 0x9a, 0xb7, 0x11, 0xa3, 0xe7, 0xfc, 0xd5, 0x96, 0x7c, 0xe0,
    0xe6, 0x8b, 0xcb, 0x1a, 0x55, 0x62, 0xdc, 0xaa, 0x02, 0x63, 0x86, 0x7d, 0x14, 0x3f, 0x97, 0xa7,
    0x72, 0x2e, 0x19, 0x2b, 0x00, 0x6b, 0xe9, 0x5f, 0xc2, 0x21, 0x2d, 0xd0, 0xf0, 0xd6, 0x7a, 0x3e,
    0x46, 0x56, 0xd2, 0xe3, 0xbb, 0xb4, 0x44, 0xf9, 0xc7, 0x79, 0x81, 0x41, 0x42, 0xcc, 0xa9, 0xc3
)

# 反 S-box
inv_sbox = [0]*256
for i, v in enumerate(sbox):
    inv_sbox[v] = i

# xt: 乘以 2（GF(2^8)，多项式 0x11B）
def xt(a):
    return (((a << 1) ^ 0x1B) & 0xFF) if (a & 0x80) else ((a << 1) & 0xFF)

# ----- 原脚本的 SubBytes/MixColumns/ShiftRows 对应实现 -----
def SubBytes_orig(state_int):
    # 和原脚本完全等价的 SubBytes（使用 struct.pack("I", ...) 的本机字节序）
    return [struct.unpack("I", bytes(map(lambda x: sbox[x], struct.pack("I", state_int[3-i]))))[0] for i in range(4)][::-1]

def MixColumns_orig(state):
    arr0 = []
    for i2 in range(4):
        arr1 = list(struct.pack('>I', state[i2]))  # big-endian bytes of state[i2]
        tmp = arr1[0] ^ arr1[1] ^ arr1[2] ^ arr1[3]
        arr0.append([
            (arr1[0] ^ tmp ^ xt(arr1[0] ^ arr1[1])) & 0xFF,
            (arr1[1] ^ tmp ^ xt(arr1[1] ^ arr1[2])) & 0xFF,
            (arr1[2] ^ tmp ^ xt(arr1[2] ^ arr1[3])) & 0xFF,
            (arr1[3] ^ tmp ^ xt(arr1[3] ^ arr1[0])) & 0xFF
        ])
    return arr0

# ShiftRows 的行为（按原脚本原封不动）
def ShiftRows(arr0, state):
    for i3 in range(4):
        state[i3 * 4] = arr0[0][0]
        arr0.append(arr0.pop(0))
        state[(i3 * 4) + 1] = arr0[0][1]
        arr0.append(arr0.pop(0))
        state[(i3 * 4) + 2] = arr0[0][2]
        arr0.append(arr0.pop(0))
        state[(i3 * 4) + 3] = arr0[0][3]
        arr0.append(arr0.pop(0))
        arr0.append(arr0.pop(0))

# AddRoundKey（与原脚本一致）
def AddRoundKey(state, state_int, key):
    for i in range(4):
        state[i] = (state[i] << 8) ^ state[1+4*i]
        state[i] = (state[i] << 8) ^ state[2+4*i]
        state[i] = (state[i] << 8) ^ state[3+4*i]
        state[i+1] = state[4+4*i]
    state_int[0] = key[1] ^ state[0]
    state_int[1] = key[2] ^ state[1]
    state_int[2] = key[3] ^ state[2]
    state_int[3] = key[4] ^ state[3]

# ----- 逆变换部分 -----
# GF(2^8) 乘法（多项式 0x11B）
RED = 0x11B
def gf_mul(a, b):
    res = 0
    while b:
        if b & 1:
            res ^= a
        a <<= 1
        if a & 0x100:
            a ^= RED
        a &= 0xFF
        b >>= 1
    return res

def gf_inv(a):
    if a == 0:
        raise ZeroDivisionError("no inverse for 0")
    # 直接暴力求逆（域很小）
    for b in range(1, 256):
        if gf_mul(a, b) == 1:
            return b
    raise Exception("no inverse found")

# 构造 MixColumns 的矩阵 M（通过对基向量的响应得到）
def mixcol_column(x):
    tmp = x[0] ^ x[1] ^ x[2] ^ x[3]
    return [
        (x[0] ^ tmp ^ xt(x[0] ^ x[1])) & 0xFF,
        (x[1] ^ tmp ^ xt(x[1] ^ x[2])) & 0xFF,
        (x[2] ^ tmp ^ xt(x[2] ^ x[3])) & 0xFF,
        (x[3] ^ tmp ^ xt(x[3] ^ x[0])) & 0xFF
    ]

# 得到 4x4 矩阵 M
M = [[0]*4 for _ in range(4)]
for k in range(4):
    incol = [0,0,0,0]
    incol[k] = 1
    out = mixcol_column(incol)
    for i in range(4):
        M[i][k] = out[i]

# 求逆矩阵 Minv（高斯消元 / 域运算）
def mat_inv_4(mat):
    n = 4
    A = [row[:] + [1 if i==j else 0 for j in range(n)] for i,row in enumerate(mat)]
    for col in range(n):
        pivot = None
        for r in range(col, n):
            if A[r][col] != 0:
                pivot = r; break
        if pivot is None:
            raise Exception("singular matrix")
        A[col], A[pivot] = A[pivot], A[col]
        inv_p = gf_inv(A[col][col])
        for j in range(2*n):
            A[col][j] = gf_mul(A[col][j], inv_p)
        for r in range(n):
            if r == col: continue
            factor = A[r][col]
            if factor == 0: continue
            for j in range(col, 2*n):
                A[r][j] ^= gf_mul(factor, A[col][j])
    inv = [row[n:] for row in A]
    return inv

Minv = mat_inv_4(M)

# ShiftRows 的逆（我们先反向推导出 arr0）
# 由前面分析，ShiftRows 的映射（state index -> arr0[col][row]）如下：
state_to_arr0 = {
    0: (0,0), 1: (1,1), 2: (2,2), 3: (3,3),
    4: (1,0), 5: (2,1), 6: (3,2), 7: (0,3),
    8: (2,0), 9: (3,1), 10: (0,2), 11: (1,3),
    12: (3,0), 13: (0,1), 14: (1,2), 15: (2,3)
}

def InvShiftRows(state_bytes):
    arr0 = [[0]*4 for _ in range(4)]
    for pos, (col, row) in state_to_arr0.items():
        arr0[col][row] = state_bytes[pos]
    return arr0

def InvMixColumns(arr0):
    # arr0 是 MixColumns 的输出列（4 列），对每列用 Minv 反算
    cols = []
    for c in range(4):
        y = arr0[c]
        x = [0]*4
        for i in range(4):
            s = 0
            for j in range(4):
                s ^= gf_mul(Minv[i][j], y[j])
            x[i] = s
        cols.append(x)
    return cols

def cols_to_state_ints(cols):
    # cols[i] 是每列的 4 个字节（big-endian），把它们拼回为整数（和 MixColumns 输入一致）
    res = []
    for col in cols:
        res.append(int.from_bytes(bytes(col), 'big'))
    return res

def InvSubBytes(sub_ints):
    # 逆 SubBytes：根据原脚本的实现细节进行逆变换（顺序、字节序遵照原脚本）
    temp = sub_ints[::-1]
    res = [0]*4
    for i in range(4):
        b = list(struct.pack("I", temp[i]))  # native byte order pack（与原脚本一致）
        b = bytes([inv_sbox[x] for x in b])
        res[3-i] = struct.unpack("I", b)[0]
    return res

# 单轮逆操作：给定轮后 state_int（长度 4 的整数列表）和该轮使用的 key（长度 5 的整数列表）
def decrypt_one_round(state_int_after, key):
    w0 = key[1] ^ state_int_after[0]
    w1 = key[2] ^ state_int_after[1]
    w2 = key[3] ^ state_int_after[2]
    w3 = key[4] ^ state_int_after[3]
    words = [w0, w1, w2, w3]
    # 将每个 word 以 big-endian 拆成 4 字节，按原 AddRoundKey 组装成 state bytes（0..15）
    state_bytes = []
    for w in words:
        state_bytes.extend(list(w.to_bytes(4, 'big')))
    # 逆 ShiftRows -> 得到 arr0（MixColumns 的输出列）
    arr0 = InvShiftRows(state_bytes)
    # 逆 MixColumns -> 得到 SubBytes 的输出（4 个整数）
    cols = InvMixColumns(arr0)
    state_int_before_sub = cols_to_state_ints(cols)
    # 逆 SubBytes -> 恢复上一轮的 state_int
    prev = InvSubBytes(state_int_before_sub)
    return prev

# ----- 生成与原脚本一致的轮密钥序列（密钥调度与原脚本一致） -----
def build_round_keys(key_initial, box):
    key = key_initial.copy()
    keys = [key.copy()]
    for j in range(0, 10):
        tmp = ((key[4] >> 24) | ((key[4] << 8) & 0xFFFFFFFF)) & 0xFFFFFFFF
        tmp = struct.unpack("I", bytes(map(lambda x: sbox[x], struct.pack("I", tmp))))[0]
        key[1] ^= tmp
        key[1] ^= box[j]
        state0 = key[1] ^ key[2]
        state1 = key[3] ^ state0
        key[4] ^= state1
        key[2] = state0
        key[3] = state1
        keys.append(key.copy())
    return keys  # keys[0]..keys[10]

# ----- 主解密入口 -----
def decrypt(cipher_hex, key_initial, box):
    # cipher_hex: 32 hex 字符（16 字节）——与原脚本输出格式一致（每个 word 按大端打印）
    if len(cipher_hex) < 32:
        raise ValueError("cipher_hex 长度应至少为 32（16 字节）")
    # 按原脚本解析成 state_int（4 个 32-bit 整数）
    state_int = [
        int(cipher_hex[0:8], 16),
        int(cipher_hex[8:16], 16),
        int(cipher_hex[16:24], 16),
        int(cipher_hex[24:32], 16)
    ]
    # 生成轮密钥
    keys = build_round_keys(key_initial, box)
    # 逆序逐轮解密（从 10 到 0）
    cur = state_int
    for j in range(10, -1, -1):
        cur = decrypt_one_round(cur, keys[j])
    # cur 即为明文（4 个 32-bit），按与你原脚本相同的打印方式输出（每个 word 先按小端打包再反转以输出大端 hex）
    out_hex = ""
    for i in range(4):
        b = struct.pack('<I', cur[i])[::-1]
        out_hex += b.hex().upper()
    return cur, out_hex

# ----- 示例（使用你在原脚本中给出的 key 和 box） -----
if __name__ == "__main__":
    # 这里的 key 和 box 直接使用你原脚本中的值
    key = [0, 2427014626, 1166827919, 1240047111, 1038097261]
    box = [3207972492, 1190065579, 4165979424, 2693353696, 3628337899,
           1707638109, 1003779598, 2653425729, 795752593, 2469382657]

    # 将 cipher_hex 替换为你要解密的 32 字符 hex（来自原脚本最后打印的输出）
    # 例如用示例密文（注意：示例仅示意；请替换为真实密文）
    cipher_hex = "649D7FA69253342D3601F5B6691EBB39"  # 仅示例 32 hex（16 bytes）
    # 调用解密
    state_int_plain, plain_hex = decrypt(cipher_hex, key, box)
    print("明文（4 x 32-bit 整数）:", [hex(x) for x in state_int_plain])
    print("明文（16 字节 大端 hex） :", plain_hex)

```

## 心得

感觉这道题出题人要比做题的人更加辛苦（）能够差不多纯静态做出来也是相当幸运，在做题的时候关注到C#，python和java之间代码的高度相关性，所以也是很快就理清了整体框架，就是最后被Hack.magic()卡了大半天太难崩了😂
