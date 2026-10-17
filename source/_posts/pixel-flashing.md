---
stats_id: pixel-flashing
title: "记录一次pixel刷机的过程"
date: 2026-09-22 12:24:00
categories:
  - Android
tags:
  - Android
  - Pixel
  - 刷机
  - Magisk
  - Root
  - AI
source_date_basis: user-cnblogs-publication
---

起因是跑安卓漏洞benchmark部分样本需要在真机上跑，但实验室的真机坏了进不了系统所以自己刷机了，顺便记录一下（~~感觉自己写的博客越来越像日记了~~）

## 刷机过程

总共有两台手机要刷，一台pixel 2xl无法开机，一台pixel 3xl是安卓10没法无线调试需要刷到安卓12，刷机流程大致相同，这里以pixel 2xl为例。

<img src="/images/posts/pixel-flashing/0b62ab8e9efaf1db48f71baf0cbc9c70.jpg" alt="0b62ab8e9efaf1db48f71baf0cbc9c70" style="zoom: 10%;" />

首先先用sdkmanager下载安卓驱动

```powershell
sdkmanager "extras;google;usb_driver"
```

fastboot能识别手机之后，查看现在能用的slot，发现b槽坏了只能用a槽

```powershell
fastboot -s 711KPMZ0567027 getvar current-slot
fastboot -s 711KPMZ0567027 getvar slot-unbootable:b
fastboot -s 711KPMZ0567027 getvar slot-successful:b
```

在https://developers.google.com/android/drivers?hl=zh-cn下载官方镜像后，刷入bootloader

```powershell
fastboot flash bootloader "D:\WorkSpace\pixel2xl-recovery\firmware\taimen-rp1a.201005.004.a1\bootloader-taimen-tmz30m.img"
fastboot reboot-bootloader
```

输入基带固件

```powershell
fastboot flash radio "D:\WorkSpace\pixel2xl-recovery\firmware\taimen-rp1a.201005.004.a1\radio-taimen-g8998-00034-2006052136.img"
fastboot reboot-bootloader
```

最后刷入系统固件（这步会清掉用户数据）

```powershell
fastboot -w update "D:\WorkSpace\pixel2xl-recovery\firmware\taimen-rp1a.201005.004.a1\image-taimen-rp1a.201005.004.a1.zip"
```

刷入完成之后会自动重启，然后就可以正常使用了

## 碎碎念

这次刷机都是gpt直接一把梭的，不到半小时就把两台机刷机并且root了，方便确实是方便，但是中间的过程却完全没有个人体验，所以特地回顾了一下gpt的工作流程，包括其中一些ai遇到的问题也能从中学到一些东西。以往的学习模式都是只要能用就行，但是现在ai的快速发展迅速的扩大了这个能用就行的范围，导致人能在实践过程能学到的东西越来越少，最后变成了完全向黑盒许愿的过程。也许这是未来不可逆转的趋势，但我还是想成为一个知道自己想做什么，知道ai在做什么的人，因此写下了这篇简短的博客。

