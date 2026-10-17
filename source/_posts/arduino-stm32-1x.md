---
stats_id: arduino-stm32-1x
title: "Arduino下载1.x版本stm32方法"
date: 2025-08-07 19:08:00
updated: 2025-09-14 15:53:35
categories:
  - "其他"
tags:
  - "其他"
  - "Arduino"
  - "STM32"
  - "嵌入式"
  - "环境搭建"
excerpt: "在 Arduino 中安装旧版 STM32 开发板支持包的操作记录。"
source_date_basis: user-cnblogs-publication
---
Arduino现在提供的package.json中只包含2.x版本的stm32，旧版本的json文件为https://raw.githubusercontent.com/stm32duino/BoardManagerFiles/master/STM32/package_stm_index.json

具体使用方法为：File-Preferences，然后将链接填到Addtional boards manager URLS中

<img src="/media/posts/arduino-stm32-1x/72dcb8c9e1b726b1.png" alt="image-20250807185634957" style="zoom: 67%;" />

确认之后在开发板的选项中可以搜到对应的版本

<img src="/media/posts/arduino-stm32-1x/6763d98770c64422.png" alt="image-20250807185726291" style="zoom: 80%;" />

如果这里直接install的话大概率是安装不了，我设置了代理也是慢的不行，这里使用直接下载的方法

我们需要手动下载以下5个文件，并放到C:\Users\用户名\AppData\Local\Arduino15\staging\packages目录中

![image-20250807190438406](/media/posts/arduino-stm32-1x/039a24ef74a3056c.png)

这些文件的下载链接在上面提到的链接里都有，具体应该下载哪个版本可以先在ide里install，他会显示具体需要的版本，然后在json里搜索就行，均下载完之后直接install即可完成安装

![image-20250807190615560](/media/posts/arduino-stm32-1x/4caf3360b533a987.png)
