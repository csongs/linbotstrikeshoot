'use strict'//使用strict mode(嚴格模式)

//skstUtil (strikeshoot util )
const cjkConv = require("cjk-conv");//中日韓編碼轉換
const fs = require('fs');

function writeFile(path,context){
	fs.writeFile(path,context, function(err) {
	//	//fs.writeFileSync('/tmp/test-sync', 'Hey there!');
		if(err) {
			return console.log(err);
		}
		console.log("The file was saved!");
	}); 
}

/**
* 是否玩選擇遊戲
*/
function isPlayChoice(text){
	let re=/\S+\s*choice\s+(\s?,?\S+)+/;

	let ret=false;
	if(String(text).match(re)!=null){
		ret= true
	}
	console.log("isPlayChoice:"+text+':'+ret);
	return ret;
}

/**
* 是否為圖片指令
*/
function isImageCmd(text){
	let re=/.image\s+(\s?,?\S+)+/;
	let ret=false;
	if(String(text).match(re)!=null){
		ret= true
	}
	console.log("isImageCmd:"+text+':'+ret);
	return ret;
}
/**
* 判斷是否為空
*/
function isEmpty(value){
  return (value == null || value.length === 0);
}

/**
 * 是否包含字串(中日韓轉換+去特殊符號)
 */
function strContain(a,b){
	a=a.replace('・','');
	b=b.replace('・','');
	return (cjk(a).indexOf(cjk(b))>=0);
}


/**
 * 找出含有關鍵字的資料
 * @param data
 * @param keyword
 * @returns {*}
 */
function selectKeySet(data,keyword){
	if(data!=undefined && keyword!=undefined){
		return data.filter(answers => { 
			return this.strContain(answers.name,keyword) || this.strContain(answers.stage,keyword)
		});
	}else{
		return "";
	}
}



/**
 * 中日韓編碼轉換
 */
function cjk(t){
	return cjkConv.jpConvert['cjk2zht'](t);
}

/**
 * 偵測攻略網址
 */
function getMonstrikeUrlStageStr (str){
	//去掉換行
	str = str.replace(/(\r\n\t|\n|\r\t)/gm,"");
	//正規表示法
	let re=/(モンストでマルチしない？「)(.*-)?(.*)(（.*)/;

	let ret=null;
	if(str.match(re)!=null){ret= str.match(re)[3];}
	console.log('getMonstrikeUrlStageStr:'+ret);
	return ret;
}

/**
 *圖片處理
 */
function lineReplyPicture(imageUrl) {
	let messages = {
		type: 'image',
		originalContentUrl: imageUrl.replace("http", "https"),
		previewImageUrl: imageUrl.replace("http", "https")
	};
	return messages;
};


// Keep the `exports =` so that various functions can still be monkeypatched
module.exports = {
	isPlayChoice:isPlayChoice,
	strContain:strContain,
	isEmpty: isEmpty,
	getMonstrikeUrlStageStr:getMonstrikeUrlStageStr,
	selectKeySet:selectKeySet,
	lineReplyPicture:lineReplyPicture,
	isImageCmd:isImageCmd,
	writeFile:writeFile,

};