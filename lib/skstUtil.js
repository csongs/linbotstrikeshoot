'use strict'//使用strict mode(嚴格模式)

//skstUtil (strikeshoot util )
const cjkConv = require("cjk-conv");//中日韓編碼轉換

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
* 判斷是否為空
*/
function isEmpty(value){
  return (value == null || value.length === 0);
}

/**
 * 是否包含字串
 */
function strContain(a,b){
	a=a.replace('・','');
	b=b.replace('・','');
	return (cjk(a).indexOf(cjk(b))>=0);
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

// Keep the `exports =` so that various functions can still be monkeypatched
module.exports = {
	isPlayChoice:isPlayChoice,
	strContain:strContain,
	isEmpty: isEmpty,
	getMonstrikeUrlStageStr:getMonstrikeUrlStageStr,

  //isArray: Array.isArray,

  /*
  isDeepStrictEqual(a, b) {
    if (internalDeepEqual === undefined) {
      internalDeepEqual = require('internal/util/comparisons')
        .isDeepStrictEqual;
    }
    return internalDeepEqual(a, b);
  },*/

};