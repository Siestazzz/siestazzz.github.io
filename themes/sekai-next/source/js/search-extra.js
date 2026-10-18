// Loaded with the selection page; results are shown only after search submission.
export function lookup(query){
 if(query!=='Untitled')return null;
 const opening='你说得对，但是《世界计划 彩色舞台 feat. 初音未来》是由 SEGA 与 Colorful Palette 合作研发的一款全新音乐节奏与视觉小说类社交手机卡牌网络游戏。游戏发生在一个被“世界”所连接的现实与虚拟交织的舞台，在这里，被选中的人们将邂逅六位虚拟歌手，引导“心愿”之力。';
 return {title:'Untitled',path:'records/7e4b9c2a/',date:'',statsId:'',categories:[],tags:[],cover:'game-assets/ctf/untitled-cover.png',excerpt:Array.from(opening).slice(0,150).join('')+'…',text:''};
}
