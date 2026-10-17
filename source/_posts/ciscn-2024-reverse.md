---
stats_id: ciscn-2024-reverse
title: "ciscn2024初赛 Reverse全题解 复盘"
date: 2024-05-23 00:00:00
updated: 2025-09-14 15:53:35
categories:
  - "CTF"
tags:
  - "CTF"
  - "CISCN"
  - "逆向工程"
  - "ARM"
  - "Android"
  - "Rust"
  - "Go"
excerpt: "CISCN 2024 Reverse 题目复盘，涵盖 ARM、Android native、Rust、GDB 与 Go 逆向。"
source_date_basis: user-cnblogs-publication
---
## Reverse

萌新第一篇博客，如有错误请多指正

这次本同校的队伍打爆了，争取明年能进决赛吧

### asm_re

打开是一段ida里复制出来的汇编，但是把源文件的十六进制也复制出来了。

![image-20240522172813282](/media/posts/ciscn-2024-reverse/257d1c612c861357.png)

将十六进制写进新的文件，选择arm小端序，ida反编译

![image-20240522173152262](/media/posts/ciscn-2024-reverse/1614b631433e59b8.png)

![image-20240518173317231](/media/posts/ciscn-2024-reverse/eb7582050c4b66f3.png)

能看出对每一个字符ch做了((80 * ch + 20) ^ 0x4D) + 30的操作，解密即可

``` c++
#include <bits/stdc++.h>
using namespace std;
        
int main()
{
	int enc[]={0x1FD7,0x21B7,0x1E47,0x2027,0x26E7,0x10D7,0x1127,0x2007,0x11C7,
			   0x1E47,0x1017,0x1017,0x11F7,0x2007,0x1037,0x1107,0x1F17,0x10D7,
			   0x1017,0x1017,0x1F67,0x1017,0x11C7,0x11C7,0x1017,0x1FD7,0x1F17,
			   0x1107,0x0F47,0x1127,0x1037,0x1E47,0x1037,0x1FD7,0x1107,0x1FD7,
			   0x1107,0x2787};
	for (int i=0;i<40;i++)
		printf("%c",((enc[i]-30^0x4d)-20)/80);
}

```



### androidso_re

这apk根本跑不起来，不然谁还静态做啊

![image-20240518173742831](/media/posts/ciscn-2024-reverse/1811f46b1258b4bd.png)

密文和加密方式已知，需要获取密钥和偏移，都在so中生成

![image-20240518173845917](/media/posts/ciscn-2024-reverse/72fa326f09faf182.png)

iv先对F2IjBOh1mRW=进行简单的变换，然后base64解码得到

![image-20240518173954193](/media/posts/ciscn-2024-reverse/5dbb7b73a5ecc90d.png)

密钥先对"TFSecret_Key" rc4加密，然后异或前8位获得

最后解密即可

``` java
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.util.UUID;
import java.io.UnsupportedEncodingException;

public class a {

    public static void main(String[] args) throws Exception{
        byte[] enc=Base64.getDecoder().decode("JqslHrdvtgJrRs2QAp+FEVdwRPNLswrnykD/sZMivmjGRKUMVIC/rw==");
        byte[] arr_b1 = "A8UdWaeq".getBytes();
        SecretKeySpec key = new SecretKeySpec(arr_b1, "DES");
        // System.out.println(key);
        byte[] arr_b2 = "Wf3DLups".getBytes();
        IvParameterSpec iv = new IvParameterSpec(arr_b2);
       
        Cipher cipher0 = Cipher.getInstance("DES/CBC/PKCS5Padding");
        cipher0.init(Cipher.DECRYPT_MODE, key, iv);
        byte[] decoded=cipher0.doFinal(enc);
        for (int i=0;i<32;i++)
        {
            char ch=(char)decoded[i];
            System.out.print(ch);
        }
    }
}
```



### rust_baby

这段先将输入的字符串8bytes一组送入加密函数中，加密完后对每一位异或0x33

![image-20240518174238222](/media/posts/ciscn-2024-reverse/5087e0b97b2125ee.png)

加密函数大致逻辑为将输入的两个64位key转化为小端存储的字节，然后进行加减操作加密，还原成c代码如下

``` c++
void someenc(char *input, unsigned __int64 key, unsigned __int64 num)
{
	unsigned char keyarr[100]={0},numarr[100]={0};
	for (int i=0;i<64;i+=8)
		keyarr[i/8]=(key>>i)&0xff;
	for (int i=0;i<64;i+=8)
		numarr[i/8]=(num>>i)&0xff;
	for (int i=0;i<4;i++)
	{
		char v8=keyarr[2*i+1];
		char v9=(keyarr[2*i]^numarr[2*i] | v8^numarr[2*i+1]) & 1;
		input[2*i]=i+input[keyarr[2*i]&7]-v9;
		input[2*i+1]=i+input[v8&7]-v9;
		
	}
}
```

对该加密函数动调可以发现，传入的第三个参数为依次为1,1,4,5,1,4,1,9,1,9,8,1,0，且对input赋值时可以发现keyarr[2 * i]&7和2 * i相等，2*i+1和v8&7相等。

下硬件断点跟踪，发现对加密过后的字符串和一个数组进行了异或，动调取出数组的所有值

![image-20240518174723789](/media/posts/ciscn-2024-reverse/a957880b5fbb9a20.png)



最后进行了一次base64，和密文进行比较

![image-20240518174840245](/media/posts/ciscn-2024-reverse/f4e8354660106920.png)

exp

``` c++
#include <bits/stdc++.h>
using namespace std;

unsigned long long key[] =
{
	0x0E71675B493928150,
	0x37C65D4C7BA24118,
	0x2F6E0584C3B26920,
	0x0C74625ECF3321978,
	0x9FFE15F4FB724940,
	0x27C69D1453F2E1B0
};

unsigned long long senpai[] = { 1,1,4,5,1,4,1,9,1,9,8,1,0 };

void someenc(char *input, unsigned __int64 key, unsigned __int64 num)
{
	unsigned char keyarr[100]={0},numarr[100]={0};
	for (int i=0;i<64;i+=8)
		keyarr[i/8]=(key>>i)&0xff;
	for (int i=0;i<64;i+=8)
		numarr[i/8]=(num>>i)&0xff;
	for (int i=0;i<4;i++)
	{
		char v8=keyarr[2*i+1];
		char v9=(keyarr[2*i]^numarr[2*i] | v8^numarr[2*i+1]) & 1;
		input[2*i]=-i+input[keyarr[2*i]&7]+v9;
		input[2*i+1]=-i+input[v8&7]+v9;
	}
}

int main()
{
	unsigned char xornum[] =
	{
	  0xDC, 0x5F, 0x20, 0x22, 0xC2, 0x79, 0x19, 0x56, 0x35, 0xDA, 
  	  0x8B, 0x47, 0xD3, 0x19, 0xFC, 0x55,0x14, 0xCD, 0xD2, 0x7B, 0x58, 0x59, 0x09, 0x42, 0xDE, 0x2C, 
	  0xB4, 0x48, 0xD9, 0xF2, 0x1B, 0xA9,0x40, 0xE1, 0xA6, 0xFB, 0xFF, 0x38, 0xC1, 0xD5, 0xE2, 0xE8, 
	  0x77, 0x78, 0x6F, 0x22, 0x04, 0xE6,0x16, 0x3E, 0x0C, 0x35, 0x52, 0x5C, 0xFD, 0xC1, 0xE5, 0x59, 
	  0x1C, 0xD0, 0xAE, 0x5A, 0xB2, 0xDD,0x19, 0xF8, 0x42, 0xE6, 0x2C, 0x89, 0x59, 0xE5, 0x11, 0x9C, 
	  0xC8, 0x7B, 0x81, 0x70, 0x7F, 0x6F,0xBC, 0x6F, 0x02, 0x8F, 0xF7, 0xF4, 0xC8, 0x70, 0xAE, 0x02, 
	  0xF8, 0x5B, 0xE2, 0x72, 0x08, 0x09,0x6F, 0xBF, 0x4B, 0x39, 0xB5, 0xD0, 0x1E, 0xA3, 0x23, 0xAB, 
	  0x9B, 0x43, 0xB1, 0x15, 0xD7, 0xBE
	};
	char enc[1000] = {0x8a,0x07,0x72,0x76,0x8d,0x7d,0x4d,0x51,0x35,0xde,0x88,0x16,0xd4,0x04,0xf9,0x0e,0x08,0xcf,0xcc,0x7c,0x0f,0x0d,0x09,0x5e,0xd5,0x7e,0xe4,0x4b,0xc4,0xf3,0x1c,0xaf,0x12,0xe4,0xa0,0xae,0xf6,0x69,0xc9,0xd2,0xe0,0xa7,0x01,0x0e,0x1a,0x57,0x70,0x92,0x61,0x49,0x7a,0x43,0x27,0x29,0x89,0xb5,0x92,0x2e,0x6a,0xa6,0xdb,0x2f,0xc6,0xa9,0x6e,0x8f,0x34,0x90,0x59,0xfc,0x2d,0x91,0x66,0xeb,0xbe,0x0d,0xf4,0x05,0x0b,0x1b,0xcb,0x18,0x74,0xf9,0x82,0x81,0xbc,0x04,0xd9,0x75,0x8e,0x2d,0x97,0x07,0x7c,0x7d,0x18,0xc8,0x3d,0x4f,0xc0,0xa5,0x6a,0xd7};		//base64解码得到的密文
	for (int i=0;i<13*8;i++)
		enc[i]^=xornum[i];
	
	int idx = 0;
	for (int i = 0; i < 13; i++)
	{
		char tmp[15] = { 0 };
		for (int j=0;j<8;j++)
			tmp[j]=enc[idx+j]^0x33;
		someenc(tmp, key[(unsigned __int8)(i - 3 * (((unsigned __int8)i / 3u) & 0xFE))], senpai[i]);
		for (int j=0;j<8;j++)
			printf("%c",tmp[j]);
		idx += 8;
	}	
}
```



### gdb_debug

一堆随机数的操作，但是没有种子，种子and了一个0xF0000000,最多只有16种情况，直接爆破种子就行。注意windows和linux随机数生成不同，要在linux上跑

``` c++
#include <stdio.h>
#include <stdlib.h>

void breakit(unsigned int seed)
{
    unsigned char rand1[40]={0};
    unsigned int rand2[40]={0};
    unsigned int rand3[40]={0};
    unsigned int idx[40]={0};

    srand(seed);
    for (int i=0;i<38;i++)
        rand1[i]=rand();
    for (int i=0;i<37;i++)
        rand2[i]=rand();
    for (int i=0;i<38;i++)
        rand3[i]=rand();
    
    for (int i=0;i<38;i++)
        idx[i]=i;
    for (int i=37;i>0;i--)
    {
        int v18=rand2[37-i]%(i+1);
        int v19=idx[i];
        idx[i]=idx[v18];
        idx[v18]=v19;
    }
    unsigned char enc[] ="congratulationstoyoucongratulationstoy";
    unsigned char xorr[] =
    {
        0xBF, 0xD7, 0x2E, 0xDA, 0xEE, 0xA8, 0x1A, 0x10, 0x83, 0x73, 
        0xAC, 0xF1, 0x06, 0xBE, 0xAD, 0x88, 0x04, 0xD7, 0x12, 0xFE, 
        0xB5, 0xE2, 0x61, 0xB7, 0x3D, 0x07, 0x4A, 0xE8, 0x96, 0xA2, 
        0x9D, 0x4D, 0xBC, 0x81, 0x8C, 0xE9, 0x88, 0x78, 0x00, 0x00
    };
    for (int i=0;i<38;i++)
    {
        enc[i]^=xorr[i];
        enc[i]^=rand3[i];
    }
    char flag[40]={0};
    for (int i=0;i<38;i++)
    {
        flag[idx[i]]=enc[i];
    }
    for (int i=0;i<38;i++)
        flag[i]^=rand1[i];
    printf("%s\n",flag);
}

int main()
{
    for (int i=0;i<0xf;i++)
        breakit(0x10000000*i);
}
```



### whereThel1b

随便输入一个格式正确的flag，发现加密后前面一段正确

![image-20240522175012851](/media/posts/ciscn-2024-reverse/4163e1dd8ab77767.png)

在so中发现了base64encode，猜测对输入做了三个字符为一组的加密，直接爆破。flag有两种格式，一种类似flag{1234567890123456789012345678901234}，长度40；另一种flag{7f9a2d3c-07de-11ef-be5e-cf1e88674c0b}长度42，都试一遍

![image-20240522175230356](/media/posts/ciscn-2024-reverse/21f2b89763b3a818.png)

``` python
import whereThel1b
import string
from time import sleep

enc=[108, 117, 72, 80, 64, 49, 99, 19, 69, 115, 94, 93, 94, 115, 71, 95, 84, 89, 56, 101, 70, 2, 84, 75, 127, 68, 103, 85, 105, 113, 80, 103, 95, 67, 81, 7, 113, 70, 47, 73, 92, 124, 93, 120, 104, 108, 106, 17, 80, 102, 101, 75, 93, 68, 121, 26]
flag='XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
idx=0
cnt=0
table=string.ascii_lowercase+string.digits+'{'+'}'+'-'

while idx<len(flag):
     for i in table:
          for j in table:
               for k in table:
                    tmpflag=list(flag)
                    tmpflag[idx]=i
                    tmpflag[idx+1]=j
                    tmpflag[idx+2]=k
                    # print(tmpflag)
                    tmpflag=("".join(tmpflag)).encode()
                    
                    whereThel1b.whereistheflag(tmpflag)
                    ret = whereThel1b.trytry(tmpflag)
                    tmpcnt=0
                    for m in range(len(enc)):
                         if ret[m]==enc[m]:
                              tmpcnt+=1
                         else:
                              break
                    
                    if tmpcnt>cnt:
                         flag=tmpflag.decode()
                         print(flag)
                         cnt=tmpcnt
                         with open('flag.txt','w') as f:
                              f.write(f'{idx} {flag}')
     idx+=3
print(flag)
#flag{7f9a2d3c-07de-11ef-be5e-cf1e88674c0b}
```



### GoReverse

这题到比赛结束我都不知道密文到底在哪，看了wp才发现原来要连远端......

#### 程序分析

通过字符串定位出主体部分。程序主体逻辑比较清晰，先打开flag文件读取flag，然后依次对flag依次进行逐位异或、魔改xxtea、sm4 CTR加密、AES256 CBC加密、base32最后输出

![image-20240523161726492](/media/posts/ciscn-2024-reverse/24fecdc1909d5282.png)

程序中有两处反调试，需要先patch掉

main函数中的反调试较为明显

![image-20240523162017704](/media/posts/ciscn-2024-reverse/2963216875ee05c9.png)

另一段在0x0438E28，也就是在调用main_main函数的runtime_main函数中，动调的时候发现执行这个call之后程序就退出了，nop掉之后程序正常运行。（尚未知道原理，请大佬们多指教）

![image-20240523162357931](/media/posts/ciscn-2024-reverse/f46b978cc2a52a38.png)

异或部分将flag与"D7BJLsOk9@f&1dWIn53IDlJqUS6\$^WhkAk2kk*2GaqmLwiLX^bGGE\$&dmqR^g5bL3lCA5^HGK$9qo5T@Bwom9vEXya0HAV3LrWW"异或

![image-20240523162624583](/media/posts/ciscn-2024-reverse/3c132e6e51942201.png)

xxtea有两处魔改，DELTA改为0x7FAB4CAD，MX对运算顺序进行了一些改变，即

``` c
#define MX ((((z>>5 ^ y<<2) + (y>>3 ^ z<<4)) ^ (sum^y)) + (key[(p&3)^e]^z))
#define DELTA 0x7FAB4CAD
```

![image-20240523162825573](/media/posts/ciscn-2024-reverse/bde648aa61d11498.png)

![image-20240523162929555](/media/posts/ciscn-2024-reverse/c6bf35fe59675fa9.png)

sm4部分ida反编译不全，需要看汇编，Go CTR模式的加密可以参照<https://pkg.go.dev/crypto/cipher#example-NewCTR>

对照源码可知该call    github_com_tjfoc_gmsm_sm4_NewCipher对应block, err := aes.NewCipher(key)，则key为pg5g#k6Qo3L&1EzT

![image-20240523163139365](/media/posts/ciscn-2024-reverse/22ba5c761bfb5002.png)

然后产生了16bytes的随机数，作为sm4 CTR mode的iv

![image-20240523163557491](/media/posts/ciscn-2024-reverse/fe3cbe01f755f706.png)

![image-20240523163618505](/media/posts/ciscn-2024-reverse/01efa19fbf7e4a09.png)

call    crypto_cipher_NewCTR对应源码的stream := cipher.NewCTR(block, iv)

![image-20240523164135305](/media/posts/ciscn-2024-reverse/3900a139f24225c4.png)

call    rdx对应stream.XORKeyStream(ciphertext[aes.BlockSize:], plaintext)

![image-20240523164320037](/media/posts/ciscn-2024-reverse/1c480c0432d33a48.png)

注意此处的sm4 CTR模式将原来的iv拼接到了加密之后的结果，所以最终sm4的结果是随机生成的16字节iv+加密过后的结果



AES同样对照源码动调出key和iv，其中key为dPGWgcLpqmxw3uOXhKpKV009Cql@@XE6，iv为key的前16位

![image-20240523164739398](/media/posts/ciscn-2024-reverse/9be9f50636c609c1.png)

最后base32输出

![image-20240523164826744](/media/posts/ciscn-2024-reverse/b53b28bf7904c5fc.png)



#### 逆向过程 

解密base32和AES，根据对sm4的分析可知，解密过后的前16字节即为sm4随机生成的16字节iv

``` python
from Crypto.Cipher import AES
import base64
import struct

enc=b'UWRSNBMNAHXTHNR4OBUQMY7OSWGU6NNSVQBLAGF4SGM76FSHQPB2KQOH34ZSFD3PPKBAHQCMZEIVBSZ4CSMCTKSEXK7QQCMELIJABJY='

enc=base64.b32decode(enc)

aeskey=b'dPGWgcLpqmxw3uOXhKpKV009Cql@@XE6'
aesiv =b'dPGWgcLpqmxw3uOXhKpKV009Cql@@XE6'[:16]

enc=AES.new(key=aeskey,iv=aesiv,mode=AES.MODE_CBC).decrypt(enc)

print(enc[:16].hex())	#输出sm4的iv
```

将iv放到cyberchef里sm4加密，根据flag长度为40或42可知counter还需要分别+1和+2，总共3*16bytes

![image-20240523165711750](/media/posts/ciscn-2024-reverse/3361b3b02f0cb10b.png)

将sm4加密过后的数据与AES解密的16位以后的数据异或

``` python
ctr=bytes.fromhex('36 f6 50 d4 2e ea c3 78 73 cb 34 97 95 17 8e e4 af 11 e8 ed 25 cb 8d c4 5f fe fa 7c dd a0 4c 2c f5 45 f5 83 2b ed 6b 85 90 fc fa 93 82 5f a7 69 11 ba e2 41 45 1c e9 f6 ea 51 52 63 f5 41 5b 29')
enc=list(enc[16:])
print(len(ctr))
for i in range(len(enc)):
    enc[i]^=ctr[i]
enc=bytes(enc)
for i in range(0, len(enc), 4):
    print(hex(struct.unpack("<I", enc[i:i+4])[0]), end=",")
```

最后xxtea并异或一次

``` c++
#include <bits/stdc++.h>
using namespace std;

#define MX ((((z>>5 ^ y<<2) + (y>>3 ^ z<<4)) ^ (sum^y)) + (key[(p&3)^e]^z))
#define DELTA 0x7FAB4CAD

void xxtea(unsigned int *v,unsigned int *key,int n)
{
	unsigned int y,z,sum;
	unsigned int p,e,round;
	if (n>1)
	{
		round=6+52/n;
		sum=0;
		z=v[n-1];
		while (round--)
		{
			sum+=DELTA;
			e=(sum>>2)&3;
			for (p=0;p<n-1;p++)
			{
				y=v[p+1];
				v[p]+=MX;
				z=v[p];
			}
			y=v[0];
			v[n-1]+=MX;
			z=v[n-1];
		}
	}
	if (n<-1)
	{
		n=-n;
		round=6+52/n;
		sum=DELTA*round;
		y=v[0];
		while (round--)
		{
			e=(sum>>2)&3;
			for (p=n-1;p>0;p--)
			{
				z=v[p-1];
				v[p]-=MX;
				y=v[p];
			}
			z=v[n-1];
			v[0]-=MX;
			y=v[0];
			sum-=DELTA;
		}
	}
}

int main()
{
	char xorr[]="D7BJLsOk9@f&1dWIn53IDlJqUS6$^WhkAk2kk*2GaqmLwiLX^bGGE$&dmqR^g5bL3lCA5^HGK$9qo5T@Bwom9vEXya0HAV3LrWW";
		
	char keybyte[]="Bs^8*wZ4lu8oR&@k";
	unsigned int *key=(unsigned int *)keybyte;
	unsigned int text[]={0xb58534c4,0xf16188a0,0x5371b7a2,0x8a74e847,0x9d0f7d74,0x43b979e3,0x7ee2ee63,0xe0f09400,0x590e2d3c,0xac2d6eb3,0x8b155d9d,0x203b2154};
	
	xxtea(text,key,-11);	
	
	char *enc=(char *)text;
	for (int i=0;i<48;i++)
		enc[i]^=xorr[i%strlen(xorr)];
	for (int i=0;i<40;i++)
		printf("%c",enc[i]);
}
//flag{3a4575cf-c85c-4350-90ca-baef825242}，比赛的时候没做出来，借用了P1umH0师傅的flag，侵删
```
