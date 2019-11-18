'use strict'//使用strict mode(嚴格模式)

//skstUtil (strikeshoot util )

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


// Keep the `exports =` so that various functions can still be monkeypatched
module.exports = {
	isPlayChoice,
	isEmpty: isEmpty,
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