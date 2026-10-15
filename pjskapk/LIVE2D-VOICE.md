# LIVE2D-VOICE · 2026-09-20

## 原始证据链

`analysis-6.8.1/il2cpp-dump/dump.cs`常量SYSTEM_LIVE2D_VOICE_BUNDLE_NAME=`sound/system_live2d/voice/{0}`（仅路径常量，不当作已恢复方法体）→当前各角色talks.json的assetbundleName/voice→设备19bd96b8的缓存包→TextAsset ACB按同名Cue提取。

|角色|bundle后缀|ACB TextAsset path_id|子流|
|---|---|---|---|
|一歌|voicepack_1|6266940652636138789|130/131/132|
|铃|voicepack_22|-7709158939598009920|13/10/1|
|连|voicepack_23|-6917725530240085784|20/10/4|
|初音|voicepack_21_piapro|4989480589541615878|2/3/20|

完整包路径、包SHA256、缓存名、语音名、talkId、采样数/率及导出SHA256见`themes/sekai-next/source/game-assets/live2d/voice-sources.json`。ACB本地证据在`analysis-6.8.1/live2d-voice/`；复现脚本`export_live2d_voice.py`，UnityPy只读提取，vgmstream r2117按Cue子流解码，ffmpeg libvorbis q5转换。

台词/动作/语音配对来自先前保存的社区systemLive2ds快照（不是本次设备master）。实际波形来自设备。铃/连/初音是原记录的partvoice短语音，不声称整段字幕逐字朗读，也不添加合成台词。

## 网页实现

- `live2d-character.js`加载角色时预载其3条音频；首个可见ready时播放开场对应语音，隐藏预演期间不播放。点击台词/角色后按相同记录的voice播放，同时更新原动作/表情/字幕。没有新增音量驱动口型算法。
- `site-audio.js`共享既有AudioContext，preloadVoice/playVoice/stopVoice独立单声道播放槽；替换时停止前声，版本号阻止过期异步请求迟到播放。离开Live2D页、开始换角色、静音均停止语音。后台随已有AudioContext挂起。
- 网页语音Gain=.4（沿用用户40%音量要求，不是游戏原始混音参数）；BGM原.112不变。音频只播一次，不循环；取消静音不补播已经结束的台词，下一次点击继续。
- 浏览器仍需要用户手势才能发声，直达页面受自动播放策略限制。网络失败不阻断角色/台词，控制台报告语音不可用；不伪造替代声。
- 当前最多四人12条，解码Promise缓存；仅加载选中角色3条。不新增常驻动画RAF。

## 验证

构建成功。专项`tools/verify-live2d-voice.cjs`检查四人每条voice与talkId一致、静音/取消静音、切页清理；同时检查选文手机标签hover/单击归档及搜索按钮hover。自动化验证播放节点/源与配对，不等同于人工听辨或游戏混音逐帧对齐。

最终结果：上述专项四人全部通过；入口verify-entry-screen.cjs通过。已查看WELCOME TO入口截图及选文搜索hover截图。短语音测试以lastVoice记录确认实际start，避免轮询时短句已经结束产生假失败；当前voice仍在结束/停止时清空。未做人工听辨。
