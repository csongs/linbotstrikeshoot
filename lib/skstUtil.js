'use strict'//使用strict mode(嚴格模式)

//skstUtil (strikeshoot util )
const cjkConv = require("cjk-conv");//中日韓編碼轉換
const fs = require('fs');
const axios = require('axios');// axios 取代request
const cheerio = require("cheerio"); //爬蟲需要的套件
const tinyURL = require('tinyurl');
const GamewithWebDTO=require('../model/GamewithWebDTO');

//global variable
var gachGlobalVal = 0; //紀錄目前抽卡機率
var isWaitGachaWeb=0; //notify開關

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
	str = str.replace(/(\r\n\t|\n|\r\t)/gm, "");
	//正規表示法
	let re = /(モンストでマルチしない？「)(.*-)?(.*)(（.*)/;

	let ret = null;
	//去掉換行
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

/**
 * 抽抽回傳格式 
 */
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

/**
 * 監聽抽抽網站
 */
function waitGachaWeb() {
	try {
		gachaWeb().then((ret) => {
			//console.log('from GachaWeb:' + ret[2] + ",gachGlobalVal:" + gachGlobalVal)
			if (ret[2] >= 20 && gachGlobalVal != ret[2] && isWaitGachaWeb==1) {
				tinyURL.shorten(ret[0]).then(function (imgUrl) {
					//console.log('imgUrl:' + imgUrl)
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

/**
 * 抽抽Notify啟動
 */
function openNotifyWaitGachaWeb(){
	isWaitGachaWeb=1;
}

/**
 * 抽抽Notify關閉
 */
function closeNotifyWaitGachaWeb(){
	isWaitGachaWeb=0;
}

/**
 * 推送Notify
 */
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



/**
 * 爬蟲怪物攻略
 */
async function jpGamewithWeb() {
	var stageData=[];
	try {
		var url = 'https://xn--eckwa2aa3a9c8j8bve9d.gamewith.jp/article/show/3054';
		const { data } = await axios.get(url);
		const $ = cheerio.load(data);
		var item = [];
		var item2 = [];
		//console.log("data:"+data);

		$("tr").has('data-col3')
		//第一種規則
		$(".js-lazyload-fixed-size-img.c-blank-img.w-article-img").each(function (i, elem) {
			let gamewithWebDTO = new GamewithWebDTO(
				($(this).parents('a').text().replace(/<[^>]*>/g, '')),//名稱
				($(this).parents('td').next().text()),//關卡
				($(this).attr('data-original')),//圖片
				($(this).parents('td').next().children('a').attr('href')),//關卡連結
				($(this).parent('a').attr('href')),//圖鑑連結
			);


			if (gamewithWebDTO.check()) {
				//console.log(gamewithWebDTO)
				item.push(gamewithWebDTO);
			}

		});
		//第二種規則
		var data2 = $("tr").filter(function () {
			return $(this).attr('data-col1') !== undefined
		});
		data2.each(function (i, elem) {

			let gamewithWebDTO = new GamewithWebDTO(
				($(this).data('col1')),//名稱
				($(this).data('col2')),//關卡
				($(this).children('td').children('div').children('a').children('img').attr('src')),//圖片
				($(this).children("td").next().children("a").attr("href")),//關卡連結
				($(this).children("td").children("a").attr("href")),//圖鑑連結
			);


			if (gamewithWebDTO.check()) {
				//console.log(gamewithWebDTO)
				item.push(gamewithWebDTO);
			}

		});

		//合併
		for (var i = 0; i < item.length; i++) {
			//去掉重複
			item2 = item2.filter(n => item[i][0].indexOf(n[0]) < 0);
		}
		for (var i = 0; i < item2.length; i++) {
			item[index + i] = item2[i]
		}

		//console.log(item2);
		//callback( undefined,item);
		//先暫存為global變數
		stageData = item;
		//skstUtil.writeFile('./stage.txt',JSON.stringify(stageData));
		console.log('攻略資料更新完畢!目前共' + stageData.length + '筆');

		return stageData;
	} catch (error) {
		console.log(error);
	}

}


// Keep the `exports =` so that various functions can still be monkeypatched
module.exports = {
	strContain: strContain,
	isEmpty: isEmpty,
	getMonstrikeUrlStageStr: getMonstrikeUrlStageStr,
	selectKeySet: selectKeySet,
	lineReplyPicture: lineReplyPicture,
	writeFile: writeFile,
	gachaWeb: gachaWeb,
	waitGachaWeb: waitGachaWeb,
	openNotifyWaitGachaWeb:openNotifyWaitGachaWeb,
	closeNotifyWaitGachaWeb,closeNotifyWaitGachaWeb,
	jpGamewithWeb:jpGamewithWeb
};