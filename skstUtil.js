'use strict'//使用strict mode(嚴格模式)

//skstUtil (strikeshoot util )

/**
* 是否玩選擇遊戲
*/
function isPlayChoice(text){
	var re=/\S+\s*choice\s+(\s?,?\S+)+/;
	
	var ret=false;
	if(text.match(re)!=null){ret= true}
	 console.log(text+':'+ret);
	 return ret;
}