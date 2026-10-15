# Live2D 首帧与淡入修正 · 2026-09-20

## 根因（覆盖之前“预演已成功”的结论）

`tools/live2d-deps/node_modules/@sekai-world/pixi-live2d-display-mulmotion/dist/cubism4.js`：

- 13393 的 `Live2DModel.update(dt)` **仅累加** deltaTime / elapsedTime。
- 13428 的 `_render` 才调用 `internalModel.update(deltaTime, elapsedTime)`，然后清空 deltaTime。
- 旧版连续45次update却不render，实际只在fit时求解一次；动作开始时间也到这一次才初始化。之前“参数不全是默认值”的测试无法排除身体仍接近展开姿势，CSS关键帧采样也不能证明真实入口可见。

当前 `live2d-character.js/warmPose` 每步调用内部更新并清空待处理deltaTime：45步基础姿势，再45步首条台词动作/表情，16.667ms/步。第一次揭示前已求解90步，最后fit实际绘制。避免预热90次GPU draw；内部接口依赖锁定的mulmotion 0.5.1。仍是网页适配，不声称Unity使用90步预热。首条台词动作可见时已到约0.75秒位置，目的是隐藏模型装配/淡入混合，不改动原动作文件。

## 原游戏淡入：已检查方法体

原包6.8.1 ARM64 `analysis-6.8.1/libil2cpp.so`，既有SHA见il2cpp-audit/inventory.json。

1. `UIPartsLive2DCharacterViewer.OnLoadModelFinished` RVA **0x4C49CF4**：检查预留加载与IsShowWait，非等待路径跳转ShowCharacter。
2. `ShowCharacter` RVA **0x4C484D0**：contentRoot CanvasGroup.alpha=1；`0x4C48520`设置target=1，`0x4C48524`设置duration=**0.25秒**，随后调用`0x8A2A684`（Live2DModelView<object>.FadeOpacity）；之后status=6并调用onShowedModel。
3. `Live2DModelView.<FadeOpacityCoroutine>d__29<object>.MoveNext` RVA **0x9A1695C**：先WaitForSeconds(delay)，记录当前透明度；`0x9A16A40–0x9A16A64`计算 `start + (target-start)*clamp(time/duration,0,1)`，写回textureColor.a并更新RawImage；用Time.deltaTime推进，结束显式设为target。

可复查方法体而非仅dump.cs签名：

```powershell
pjskapk/analysis-tools/Scripts/python.exe pjskapk/il2cpp_audit.py disasm --address 0x4C484D0 --size 156
pjskapk/analysis-tools/Scripts/python.exe pjskapk/il2cpp_audit.py disasm --address 0x4C49CF4 --size 144
pjskapk/analysis-tools/Scripts/python.exe pjskapk/il2cpp_audit.py disasm --address 0x9A1695C --size 508
```

输出保存在`analysis-6.8.1/il2cpp-audit/0x4c484d0.asm`、`0x4c49cf4.asm`、`0x9a1695c.asm`。

网页对应 `live2d-character.css/live2d-ready-in`：**250ms linear，opacity0→1**，替换旧180ms ease-out。游戏方法证明角色RawImage淡入，不证明台词框同样淡入；网页将台词同步淡入是适配。减少动画直接显示。入口白色`.title-entry-route-veil`尚在/标签不可见时等待，不提前消耗淡入；50ms检查周期为网页调度，离页ticket失效则退出。

## 实机与验证边界

本次ADB查看游戏当前Live页，`analysis-6.8.1/live2d-check.png`为铃、动作与台词已显示的终态。尝试录制`live2d-entrance.mp4`实际录到了地图切换，不作为角色淡入时长证据；随后设备休眠锁屏，后续截图为空，未取得有效角色入场逐帧录屏。精确250ms/linear来自上述方法体而非对这段视频估计。

回归改进：`tools/verify-live2d-random.cjs` 在ready首次出现的MutationObserver中保存全部参数，读取原首条motion里恒定非零ParamArm曲线，经模型min/max限制后逐项比较（容差0.1模型参数单位）；不再仅断言任意参数非默认。四角色首屏台词配对、实际CSS动画0/125/250ms线性采样、后续点击/复用/失败重试/减少动画仍保留。一歌ready截图已查看：手在脸侧，不再展臂。

最终实际验证：build、四角色首帧Arm曲线断言/台词/点击/返回/250ms线性采样、减少动画/失败重试通过；额外遮罩回归确认预热完成仍ready=false，移除入口遮罩后才ready=true。verify-entry-screen.cjs通过；一歌与初音ready截图已查看。git diff --check通过（仅已有换行风格警告）。未提交/推送。
