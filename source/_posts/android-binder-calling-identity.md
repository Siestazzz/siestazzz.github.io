---
stats_id: android-binder-calling-identity
title: "Binder.getCallingPid()和Binder.getCallingUid()漏洞分析"
date: 2025-10-11 13:16:00
updated: 2025-10-11 13:15:41
categories:
  - "Android"
tags:
  - "Android"
  - "漏洞挖掘"
  - "Binder"
  - "IPC"
  - "权限校验"
  - "漏洞分析"
excerpt: "结合 Ghera 示例分析 Binder 调用身份与组件权限校验问题。"
source_date_basis: user-cnblogs-publication
---
最近在学习安卓漏挖，在分析ghera数据集时发现一个很有意思的binder特性，但还没搞懂底层原理，先挖个坑

## 漏洞分析

> EnforceCallingOrSelfPermission-PrivilegeEscalation-Lean

以下代码使用Binder.getCallingPid()和Binder.getCallingUid()对调用方进行了权限检查

```java
// MyService.java
public int onStartCommand(Intent intent, int flags, int startId) {
    Log.d("MyService", "Calling PID = " + Binder.getCallingPid() + " Calling UID  = " + Binder.getCallingUid());
    if (checkPermission("santos.benign.permission", Binder.getCallingPid(), Binder.getCallingUid()) == PackageManager.PERMISSION_GRAN
        Log.d("MyService", "Service Started");
        Intent activityIntent = new Intent(this, SensitiveActivity.class);
        activityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        activityIntent.putExtra("status_msg", "SUCCESS");
        this.startActivity(activityIntent);
    } else {
        Log.d("MyService", "Failed to start the service");
    }
    return super.onStartCommand(intent, flags, startId);
}
```

其中调用方如下

```java
// MainActivity.java
protected void onResume() {
    super.onResume();
    if (checkPermission("santos.benign.permission", android.os.Process.myPid(), android.os.Process.myUid()) == PackageM
        Log.d("MyService", "permission to service already granted");
        startService(new Intent(getApplicationContext(), MyService.class));
    } else {
        Log.d("MyService", "component does not have permission to call service");
        ActivityCompat.requestPermissions(this, new String[]{"santos.benign.permission"}, 100);
    }
}
```

可以看到，MyService是由MainActivity启动的，也就是他们都属于主线程。而在主线程调用Binder.getCallingPid()和Binder.getCallingUid()不会返回调用方的信息，只会返回自身进程的信息，这样上面代码的权限校验相当于只对自身权限做了检查，正确的做法应该是在manifest中静态声明权限或使用EnforceCallingPermission方法进行校验

