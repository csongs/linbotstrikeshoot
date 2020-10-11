'use strict'//使用strict mode(嚴格模式)

//skstUtil (strikeshoot util )
const cjkConv = require("cjk-conv");//中日韓編碼轉換
const fs = require('fs');
// axios 取代request
const axios = require('axios')
const cheerio = require("cheerio"); //爬蟲需要的套件
const tinyURL = require('tinyurl');


var gachGlobalVal = 0; //紀錄目前抽卡機率

function writeFile(path, context) {
	fs.writeFile(path, context, function (err) {
		//	//fs.writeFileSync('/tmp/test-sync', 'Hey there!');
		if (err) {
			return console.log(err);
		}
		console.log("The file was saved!");
	});
}

/**
* 是否玩選擇遊戲
*/
function isPlayChoice(text) {
	let re = /\S+\s*choice\s+(\s?,?\S+)+/;

	let ret = false;
	if (String(text).match(re) != null) {
		ret = true
	}
	console.log("isPlayChoice:" + text + ':' + ret);
	return ret;
}

/**
* 是否為圖片指令
*/
function isImageCmd(text) {
	let re = /.image\s+(\s?,?\S+)+/;
	let ret = false;
	if (String(text).match(re) != null) {
		ret = true
	}
	console.log("isImageCmd:" + text + ':' + ret);
	return ret;
}

/**
* 是否查詢抽卡機率
*/
function isGachaCmd(text) {
	let re = /抽抽+/;
	let ret = false;
	if (String(text).match(re) != null) {
		ret = true
	}
	console.log("isGachaCmd:" + text + ':' + ret);
	return ret;
}

function isWaitGachaCmd(text) {
	let re = /等抽抽+/;
	let ret = false;
	if (String(text).match(re) != null) {
		ret = true
	}
	console.log("isWaitGachaCmd:" + text + ':' + ret);
	return ret;
}


/**
* 判斷是否為空
*/
function isEmpty(value) {
	return (value == null || value.length === 0);
}

/**
 * 是否包含字串(中日韓轉換+去特殊符號)
 */
function strContain(a, b) {
	a = a.replace('・', '');
	b = b.replace('・', '');
	return (cjk(a).indexOf(cjk(b)) >= 0);
}


/**
 * 找出含有關鍵字的資料
 * @param data
 * @param keyword
 * @returns {*}
 */
function selectKeySet(data, keyword) {
	if (data != undefined && keyword != undefined) {
		return data.filter(answers => {
			return this.strContain(answers.name, keyword) || this.strContain(answers.stage, keyword)
		});
	} else {
		return "";
	}
}



/**
 * 中日韓編碼轉換
 */
function cjk(t) {
	return cjkConv.jpConvert['cjk2zht'](t);
}

/**
 * 偵測攻略網址
 */
function getMonstrikeUrlStageStr(str) {
	//去掉換行
	str = str.replace(/(\r\n\t|\n|\r\t)/gm, "");
	//正規表示法
	let re = /(モンストでマルチしない？「)(.*-)?(.*)(（.*)/;

	let ret = null;
	if (str.match(re) != null) { ret = str.match(re)[3]; }
	console.log('getMonstrikeUrlStageStr:' + ret);
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


/**
 * 抽抽預測
 */
async function gachaWeb() {
	//console.log("gachaWeb") ;
	var message = [];


	try {
		var url = 'http://monstgacha-yosou.xyz/linemulti';
		const { data } = await axios.get(url)
		const $ = cheerio.load(data)
		var obj = $('.img-responsive.animated.rollIn.comment').eq(0)
		//console.log(obj.attr('src'));
		message[0] = url + "/" + obj.attr('src');
		var fifteen = $('.daily').find('td').eq(0)
		var ten = $('.daily').find('td').eq(2)
		var five = $('.daily').find('td').eq(4)
		//console.log(fifteen.text()+":"+fifteen.next().text());
		//console.log(ten.text()+":"+ten.next().text());
		//console.log(five.text()+":"+five.next().text());

		message[1] = five.text() + ":" + five.next().text();
		message[2] = parseInt(five.next().text().replace('%', ''));
	} catch (error) {
		console.log(error);
	}

	return message;

}

function formatGachaMsg(ret) {
	tinyURL.shorten(ret[0]).then(function (imgUrl) {
		console.log("imgUrl:" + imgUrl);
		let msg = [
			{
				type: 'image',
				originalContentUrl: imgUrl,
				previewImageUrl: imgUrl,
			},
			{
				type: 'text',
				text: ret[1]
			}
		]
		return msg;
	});
}

function waitGachaWeb() {
	try {
		gachaWeb().then((ret) => {
			console.log('from GachaWeb:' + ret[2] + ",gachGlobalVal:" + gachGlobalVal)
			if (ret[2] >= 20 && gachGlobalVal != ret[2]) {
				tinyURL.shorten(ret[0]).then(function (imgUrl) {
					console.log('imgUrl:' + imgUrl)
					sendNotify(ret[1], imgUrl);
				});
			}
			gachGlobalVal = ret[2];
		}).catch(e => console.log(e));



	} catch (error) {
		console.error(error)
	}

	setTimeout(waitGachaWeb, 10000);
}

async function sendNotify(message, imgurl) {
	try {
		const response = await axios({
			url: 'https://notify-api.line.me/api/notify',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: 'Bearer ' + process.env.notifyKey,
			},
			data: 'message=' + message + '&imageThumbnail=' + imgurl + '&imageFullsize=' + imgurl
		})

		if (response.data.message == 'ok') {
			console.log('sendNotify success')
		} else {
			console.log('sendNotify fail')
		}


	} catch (error) {
		console.error(error)
	}
}


// Keep the `exports =` so that various functions can still be monkeypatched
module.exports = {
	isPlayChoice: isPlayChoice,
	strContain: strContain,
	isEmpty: isEmpty,
	getMonstrikeUrlStageStr: getMonstrikeUrlStageStr,
	selectKeySet: selectKeySet,
	lineReplyPicture: lineReplyPicture,
	isImageCmd: isImageCmd,
	isGachaCmd: isGachaCmd,
	writeFile: writeFile,
	gachaWeb: gachaWeb,
	isWaitGachaCmd: isWaitGachaCmd,
	waitGachaWeb: waitGachaWeb

};