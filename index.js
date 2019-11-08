

const line = require('@line/bot-sdk');
const express = require('express');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const request = require("request");
const cjkConv = require("cjk-conv");

const cheerio = require("cheerio");
const async = require('async');

const isNumeric = require("isnumeric");

const debug=false;

var google = require('googleapis');
var googleAuth = require('google-auth-library');

//讀環境變數
const config = {

  //line chhanel 金鑰
  channelSecret:process.env.ChannelSecret,
  //line 獲取token
  channelAccessToken:process.env.ChannelAccessToken,
  //google installed Client Id
  googleInstalledClientId:process.env.GoogleInstalledClientId,
  //google installed client secret
  googleInstalledClientSecret:process.env.GoogleInstalledClientSecret,
  //google oauth2Client
  googleOauth2AccessToken:process.env.GoogleOauth2AccessToken,
  googleOauth2RefreshToken:process.env.GoogleOauth2RefreshToken,
   //google sheet
  googleSheetId:process.env.GoogleSheetId
  
  }



//功略網相關
var timer;//定期更新
var stageData=[];  
jpGamewithWeb();

//回覆對話相關
var Spell_Command ="小拿 ";


/**
* GOOGLE API for 問答功能
* 初版採取問卷表單模式做練習
* TODO: 之後改成一行指令處理；問卷可以改採用教學
*/
  //底下輸入client_secret.json檔案的內容
var myClientSecret={"installed":{"client_id":config.googleInstalledClientId,"project_id":"lithe-sonar-195513","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://accounts.google.com/o/oauth2/token",
"auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_secret":config.googleInstalledClientSecret,"redirect_uris":["urn:ietf:wg:oauth:2.0:oob","http://localhost"]}}
var auth = new googleAuth();
var oauth2Client = new auth.OAuth2(myClientSecret.installed.client_id,myClientSecret.installed.client_secret, myClientSecret.installed.redirect_uris[0]);

//底下輸入sheetsapi.json檔案的內容
oauth2Client.credentials ={"access_token":config.googleOauth2AccessToken,"refresh_token":config.googleOauth2RefreshToken,"token_type":"Bearer","expiry_date":1518881082672}

//試算表的ID，引號不能刪掉
var mySheetId=config.googleSheetId;

//問答功能需要的參數
var myQuestions=[];//問題
var myAnswers=[];//回答
var users=[];//建立人
var usersGoogleMode=[];//問答模式
var totalSteps=0;

//程式啟動後會去讀取試算表內的問題
getQuestions();


//讀取'問題'表單(固定對話)
function getQuestions() {
  var sheets = google.sheets('v4');
  sheets.spreadsheets.values.get({
     auth: oauth2Client,
     spreadsheetId: mySheetId,
     range:encodeURI('問題'),
  }, function(err, response) {
     if (err) {
		
        console.log('讀取問題檔的API產生問題：' + err);
        return;
     }
     var rows = response.values;
     if (rows.length == 0) {
        console.log('No data found.');
     } else {
       myQuestions=rows;
       totalSteps=myQuestions[0].length;
       console.log('要問的問題已下載完畢！');
     }
  });
}


//讀取'問卷'表單
async function getAnswers() {
	return new Promise((resolve, reject) => {
		 if(debug)console.log("debug: start getAnswers");
		var sheets = google.sheets('v4');
		sheets.spreadsheets.values.get({
		 auth: oauth2Client,
		 spreadsheetId: mySheetId,
		 range:encodeURI('問卷'),
	  }, function(err, response) {
			if (err) return console.log('The API returned an error: ' + err);
			var rows = response.values;
				if (rows.length == 0) {
				console.log('No data found.');
				} else {
					myAnswers=rows;
					console.log('回答已更新！');
				}
			 if(debug)console.log("debug: end getAnswers");
			resolve(response);//確認收到
	  });
	});  
}

//儲存'問卷'表單
function appendMyRow(userId,userName) {
   //紀錄userID
   users[userId].replies[totalSteps+1]=userId;
   users[userId].replies[totalSteps+2]=userName;
   var request = {
      auth: oauth2Client,
      spreadsheetId: mySheetId,
      range:encodeURI('問卷'),
      insertDataOption: 'INSERT_ROWS',
      valueInputOption: 'RAW',
      resource: {
        "values": [
          users[userId].replies
        ]
      }
   };
   var sheets = google.sheets('v4');
   sheets.spreadsheets.values.append(request, function(err, response) {
      if (err) {
         console.log('The API returned an error: ' + err);
         return;
      }
   });
   
  
}

function appendMyRowV2(question,answer,userId,userName) {
   var data=[];
   data[0]=new Date();
   data[1]=question;
   data[2]=answer;
   data[3]=userId,
   data[4]=userName
   var request = {
      auth: oauth2Client,
      spreadsheetId: mySheetId,
      range:encodeURI('問卷'),
      insertDataOption: 'INSERT_ROWS',
      valueInputOption: 'RAW',
      resource: {
        "values": [
			data
        ]
      }
   };
   var sheets = google.sheets('v4');
   sheets.spreadsheets.values.append(request, function(err, response) {
      if (err) {
         console.log('The API returned an error: ' + err);
         return;
      }
   });
   
   
}


//============GOOGLE API END============


/**
/* LINE API 核心 
*/

// create LINE SDK client
const client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// serve static and downloaded files
//app.use('/static', express.static('static'));
//app.use('/downloaded', express.static('downloaded'));

// webhook callback
app.post('/', line.middleware(config), (req, res) => {
  // req.body.events should be an array of events
  //if (!Array.isArray(req.body.events)) {
  //  return res.status(500).end();
  //}

  // handle events separately
  Promise
    .all(req.body.events.map(handleEvent))
	 .then((result) => res.json(result))
     //.then(() => res.end())
	.catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});


// simple reply function
const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  return client.replyMessage(
    token,
    texts.map((text) => ({ type: 'text', text }))
  );
};


// callback function to handle a single event
function handleEvent(event) {
  switch (event.type) {
    case 'message':
      const message = event.message;
      switch (message.type) {
        case 'text':
		if(event.source.type=='group' ){
			  console.log("groupId: "+event.source.groupId);
			  console.log("userId: "+event.source.userId);
			   console.log("userName: "+client.getGroupMemberProfile(event.source.groupId,event.source.userId).displayName);
			return client.getGroupMemberProfile(event.source.groupId,event.source.userId)
          .then((group) => handleText(
		  
			message, event.replyToken, event.source,group.displayName)
            
          );
		}else if(event.source.type=='room'){
			 console.log("roomId: "+event.source.roomId);
			  console.log("userId: "+event.source.userId);
			   console.log("userName: "+client.getGroupMemberProfile(event.source.groupId,event.source.userId).displayName);
			return client.getRoomMemberProfile(event.source.roomId,event.source.userId)
          .then((room) => handleText(
		
			message, event.replyToken, event.source,room.displayName)
            
          );
		}else{
			 //return handleText(message, event.replyToken, event.source);
			   console.log("userId: "+event.source.userId);
		   return client.getProfile(event.source.userId)
          .then((profile) => handleText(
			message, event.replyToken, event.source,profile.displayName)
            
          );
		}
         
        case 'image':
          //return handleImage(message, event.replyToken);
		   return Promise.resolve(null);
        case 'video':
          //return handleVideo(message, event.replyToken);
		   return Promise.resolve(null);
        case 'audio':
          //return handleAudio(message, event.replyToken);
		   return Promise.resolve(null);
        case 'location':
          //return handleLocation(message, event.replyToken);
		   return Promise.resolve(null);
        case 'sticker':
          //return handleSticker(message, event.replyToken);
		   return Promise.resolve(null);
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`);
      }

    case 'follow':
         client.replyMessage(event.replyToken,getDefaultMsgHello());

    case 'unfollow':
      return console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);

    case 'join':
	     client.replyMessage(event.replyToken,getDefaultMsgHello());

    case 'leave':
      return console.log(`Left: ${JSON.stringify(event)}`);

   /*
   case 'postback':
      let data = event.postback.data;
      if (data === 'DATE' || data === 'TIME' || data === 'DATETIME') {
        data += `(${JSON.stringify(event.postback.params)})`;
      }
      return replyText(event.replyToken, `Got postback: ${data}`);
*/
    /*
	case 'beacon':
      return replyText(event.replyToken, `Got beacon: ${event.beacon.hwid}`);
*/
    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
}

async function handleText(message, replyToken, source,userName) {
 // const buttonsImageURL = `${baseURL}/static/buttons/1040.jpg`;
   console.log(message.text);
	//檢查身分(懲罰)
	//if(source.userId=="U080990787746c9f9c7c9d64d524a911c"){
		/*replyText(replyToken,"他是陳密分身");*/
	//}
	
    //攻略url
	var statgeUrl= excuteMomstrikeUrlStatgeStr(message.text,source,userName);
	if(statgeUrl!=null){
		return   client.replyMessage(
			replyToken,
			statgeUrl
		);
	}
	
	//玩選擇遊戲
	else if(isPlayChoice(message.text)){
		var str = message.text.replace(/[\s\S]+choice/g, '');//指令格式保留選項
		var items=str.split(/[\s+,+]/).filter(e=>e!='') //選擇項目陣列
		var item=items[Math.floor(Math.random()*(items.length))] //隨機選一個項目
		var msg=userName+": "+message.text+"->"+item; // 回答內容
		
		replyText(replyToken,msg);
	}
	
	//如果是指令
	else if(checkCommand( message.text)){
		
		var msg=message.text;
		return   client.replyMessage(
			replyToken,
			excuteCommand(msg,source,userName)
		);
	}
	//GOOGLE問卷模式
	/*
	else if(usersGoogleMode[source.userId]==1){
		replyText(replyToken,googleAsk(message.text,source,userName));
	}*/
	
	else { //對話模式
		return new Promise((resolve, reject) => {
			getAnswers().then(async client => {
			    if(debug)console.log("debug: after getAnswers");
				 var ret="";
				 var answersSet=googleAnswerSet(myAnswers,message.text);
				 console.log("answersSet:"+answersSet);
				if(answersSet.length>0){
					 var x = Math.floor((Math.random() * answersSet.length));
					 ret=answersSet[x][2];
					  //console.log(ret) ;
					replyText(replyToken,ret);//ret不能為空
				}
				
					
				
			  }).catch(console.error);
		}).catch((error) => {console.error(error);});  	 
		
		
	}
   
   
  switch (message.text) {
/*
   case '自我介紹':
      if (source.userId) {
        return client.getProfile(source.userId)
          .then((profile) => replyText(
            replyToken,
            [
              `Display name: ${profile.displayName}`,
              `Status message: ${profile.statusMessage}`,
            ]
          ));
      } else {
        return replyText(replyToken, 'Bot can\'t use profile API without user ID');
      }
	  */
	  /*
    case 'buttons':
      return client.replyMessage(
        replyToken,
        {
          type: 'template',
          altText: 'Buttons alt text',
          template: {
            type: 'buttons',
            thumbnailImageUrl: 'https://goo.gl/mR5nMT',
            title: 'My button sample',
            text: 'Hello, my button',
            actions: [
              { label: 'Go to line.me', type: 'uri', uri: 'https://line.me' },
              { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
              { label: '言 hello2', type: 'postback', data: 'hello こんにちは', text: 'hello こんにちは' },
              { label: 'Say message', type: 'message', text: 'Rice=米' },
            ],
          },
        }
      );
	  */
	  /*
    case 'confirm':
      return client.replyMessage(
        replyToken,
        {
          type: 'template',
          altText: 'Confirm alt text',
          template: {
            type: 'confirm',
            text: 'Do it?',
            actions: [
              { label: 'Yes', type: 'message', text: 'Yes!' },
              { label: 'No', type: 'message', text: 'No!' },
            ],
          },
        }
      )
	  */
	  /*
    case 'carousel':
      return client.replyMessage(
        replyToken,
        {
          type: 'template',
          altText: 'Carousel alt text',
          template: {
            type: 'carousel',
            columns: [
              {
                thumbnailImageUrl: 'https://goo.gl/mR5nMT',
                title: 'hoge',
                text: 'fuga',
                actions: [
                  { label: 'Go to line.me', type: 'uri', uri: 'https://line.me' },
                  { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
                ],
              },
              {
                thumbnailImageUrl: 'https://goo.gl/mR5nMT',
                title: 'hoge',
                text: 'fuga',
                actions: [
                  { label: '言 hello2', type: 'postback', data: 'hello こんにちは', text: 'hello こんにちは' },
                  { label: 'Say message', type: 'message', text: 'Rice=米' },
                ],
              },
            ],
          },
        }
      );
	  */
	  /*
    case 'image carousel':
      return client.replyMessage(
        replyToken,
        {
          type: 'template',
          altText: 'Image carousel alt text',
          template: {
            type: 'image_carousel',
            columns: [
              {
                imageUrl: 'https://goo.gl/mR5nMT',
                action: { label: 'Go to LINE', type: 'uri', uri: 'https://line.me' },
              },
              {
                imageUrl: 'https://goo.gl/mR5nMT',
                action: { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
              },
              {
                imageUrl: 'https://goo.gl/mR5nMT',
                action: { label: 'Say message', type: 'message', text: 'Rice=米' },
              },
              {
                imageUrl: 'https://goo.gl/mR5nMT',
                action: {
                  label: 'datetime',
                  type: 'datetimepicker',
                  data: 'DATETIME',
                  mode: 'datetime',
                },
              },
            ]
          },
        }
      );
    case 'datetime':
      return client.replyMessage(
        replyToken,
        {
          type: 'template',
          altText: 'Datetime pickers alt text',
          template: {
            type: 'buttons',
            text: 'Select date / time !',
            actions: [
              { type: 'datetimepicker', label: 'date', data: 'DATE', mode: 'date' },
              { type: 'datetimepicker', label: 'time', data: 'TIME', mode: 'time' },
              { type: 'datetimepicker', label: 'datetime', data: 'DATETIME', mode: 'datetime' },
            ],
          },
        }
      );
    case 'imagemap':
      return client.replyMessage(
        replyToken,
        {
          type: 'imagemap',
          baseUrl: 'https://goo.gl/mR5nMT',
          altText: 'Imagemap alt text',
          baseSize: { width: 1040, height: 1040 },
          actions: [
            { area: { x: 0, y: 0, width: 520, height: 520 }, type: 'uri', linkUri: 'https://store.line.me/family/manga/en' },
            { area: { x: 520, y: 0, width: 520, height: 520 }, type: 'uri', linkUri: 'https://store.line.me/family/music/en' },
            { area: { x: 0, y: 520, width: 520, height: 520 }, type: 'uri', linkUri: 'https://store.line.me/family/play/en' },
            { area: { x: 520, y: 520, width: 520, height: 520 }, type: 'message', text: 'URANAI!' },
          ],
        }
      );
	  */
    case '小拿掰掰':
      switch (source.type) {
        case 'user':
          return replyText(replyToken, '請把我封鎖,再刪除QQ');
        case 'group':
          return replyText(replyToken, '我會想念你們的><')
            .then(() => client.leaveGroup(source.groupId));
        case 'room':
          return replyText(replyToken, '我會想念你們的><')
            .then(() => client.leaveRoom(source.roomId));
      }
	  
    default:
      console.log(`Echo message to ${replyToken}: ${message.text}`);
      return   Promise.resolve(null);
  }
}
/*
function handleImage(message, replyToken) {
  const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.jpg`);
  const previewPath = path.join(__dirname, 'downloaded', `${message.id}-preview.jpg`);

  return downloadContent(message.id, downloadPath)
    .then((downloadPath) => {
      // ImageMagick is needed here to run 'convert'
      // Please consider about security and performance by yourself
      cp.execSync(`convert -resize 240x jpeg:${downloadPath} jpeg:${previewPath}`);

      return client.replyMessage(
        replyToken,
        {
          type: 'image',
          originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
          previewImageUrl: baseURL + '/downloaded/' + path.basename(previewPath),
        }
      );
    });
}
*/
/*
function handleVideo(message, replyToken) {
  const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.mp4`);
  const previewPath = path.join(__dirname, 'downloaded', `${message.id}-preview.jpg`);

  return downloadContent(message.id, downloadPath)
    .then((downloadPath) => {
      // FFmpeg and ImageMagick is needed here to run 'convert'
      // Please consider about security and performance by yourself
      cp.execSync(`convert mp4:${downloadPath}[0] jpeg:${previewPath}`);

      return client.replyMessage(
        replyToken,
        {
          type: 'video',
          originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
          previewImageUrl: baseURL + '/downloaded/' + path.basename(previewPath),
        }
      );
    });
}
*/
/*
function handleAudio(message, replyToken) {
  const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.m4a`);

  return downloadContent(message.id, downloadPath)
    .then((downloadPath) => {
      return client.replyMessage(
        replyToken,
        {
          type: 'audio',
          originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
          duration: 1000,
        }
      );
    });
}
*/
/*
function downloadContent(messageId, downloadPath) {
  return client.getMessageContent(messageId)
    .then((stream) => new Promise((resolve, reject) => {
      const writable = fs.createWriteStream(downloadPath);
      stream.pipe(writable);
      stream.on('end', () => resolve(downloadPath));
      stream.on('error', reject);
    }));
}
*/
/*
function handleLocation(message, replyToken) {
  return client.replyMessage(
    replyToken,
    {
      type: 'location',
      title: message.title,
      address: message.address,
      latitude: message.latitude,
      longitude: message.longitude,
    }
  );
}
*/
/*
function handleSticker(message, replyToken) {
  return client.replyMessage(
    replyToken,
    {
      type: 'sticker',
      packageId: message.packageId,
      stickerId: message.stickerId,
    }
  );
}
*/

// listen on port
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
//==============


//確認是否為command
var checkCommand = function( msg) {
  if(msg.indexOf(Spell_Command)==0){
	return true;
  }else{
	  return false;
  }
};

//獲得指令參數(去除 Spell_Command)
var getCommandParameter = function( msgCommand){
	var ret = msgCommand.replace(Spell_Command, '');//指令格式保留選項
	//var ret=msgCommand.substring(1);
	return ret;
}

//攻略url
var excuteMomstrikeUrlStatgeStr=function(inputMsg,source,userName){
	 //攻略網址偵測
	 var statgeStr=getMomstrikeUrlStatgeStr(inputMsg);
	if(statgeStr!=null){
		//TODO 獨立成一個方法
		var ansData=findKeySet(stageData,statgeStr);
			var msg="";
			if(ansData.length>0){
				ansData=ansData.slice(0,5);
				var body=  ansData.map((data) => ({ 
								thumbnailImageUrl: data[2],
								title: data[0],
								text: data[1],
								actions:
									[
										{ label: '圖鑑資料', type: 'uri', uri: data[4] },
										{ label: '前往攻略', type: 'uri', uri: data[3] },
									],
							}));
				
				//line回話
				 msg=[{
						  type: 'template',
						  altText: '此指令無法顯示><',
						  template: {
							type: 'carousel',
							columns:body,
						  },
						},
						]
			}
				return msg; 
	}
	return null;
				
}

 //觸發不同工作
 var excuteCommand = function( msgCommand,source,userName){
	 var command=getCommandParameter(msgCommand);
	 
	 /* 先不讀台版攻略
	if(isNumeric(command)){
		var url=twGamertbWeb(command);
		var commandUrl="怪物編號"+command+": "+url;
		var msg={ 
			type:'text',
			text:commandUrl,
		};
		
		return msg;
	}else
	*/
	if(strCompare(command,"獸神")){
		var picNumber= Math.floor((Math.random() * 3));
		var msg=[
			{ 
				type:'text',
				text:"等很久了>///<"
			},
			{
				type: 'image',
				originalContentUrl: getNaploeonPic(picNumber),
				previewImageUrl: getNaploeonPic(picNumber),
			}
        ]
		return msg;
		
	}else if(strCompare(command,"測試")){
		var msg=[
			{ 
				type:'text',
				text:"1"
			},
			{
				type:'text',
				text:"2"
			},
			{
				type:'text',
				text:"3"
			},
			{
				type:'text',
				text:"4"
			},
			{
				type:'text',
				text:"最多只能5次QQ"
			},
			
        ]
		return msg;
	}else if(strCompare(command,"help") || strCompare(command,"教學")){ //教學目錄
		 var msg=[
					{
						  type: 'template',
						  altText: '已顯示教學內容',
						  template: {
							type: 'buttons',
							thumbnailImageUrl: 'https://imgur.com/eSZ6TTu.jpg',
							title: '我目前會...',
							text: '指令教學',
							actions: [
							  { label: '幫你做決定~', type: 'message', text: '小拿 choice 可愛 超可愛' },
							  { label: 'line邀請關卡連結來找攻略', type: 'message', text: 'モンストでマルチしない？\n「玉楼-暴威の鬼神、乱逆の咎（超絶）」' },
							  { label: '看到特定文字回話', type: 'message', text: '小拿 學習 小拿好可愛 謝謝你>///<' }
							]
						  }
					}
				]
		return   msg;
		
	}else if(strCompare(command,"學習 ")){
		/*
		usersGoogleMode[source.userId]=1;
		var msg=[	
			{ 
				type:'text',
				text:googleAsk(command,source,userName)
			},
		]
		*/
		command=command.replace("學習 ",'');
		var items=command.split(/[\s+]/).filter(e=>e!=''); //選擇項目陣列
		var msgText="學習指令規格不對喔!<p>範例: 小拿 學習 小拿好可愛 謝謝你>///<";
		if(items.length>=2){
			
			appendMyRowV2(items[0],items[1],source.userId,userName);
			msgText="記住~當「"+items[0]+"」回「"+items[1]+"」";
		}
		var msg=[	
			{ 
				type:'text',
				text:msgText
			},
		]
		return msg;
	}else if(strCompare(command,"攻略")){
		var rawData;
		var excelData;

		//去找攻略查詢字段
		var newstr=command.replace("攻略", '').trim();
		if(newstr.length<=0){
			 var msg=[	
				{ 
					type:'text',
					text:'請在!攻略後輸入要找的字串喔!'
				},
			]
			return msg;
		}else{
			var ansData=findKeySet(stageData,newstr);
			var msg;
			if(ansData.length>0){
				ansData=ansData.slice(0,5);
				var body=  ansData.map((data) => ({ 
								thumbnailImageUrl: data[2],
								title: data[0],
								text: data[1],
								actions:
									[
										{ label: '圖鑑資料', type: 'uri', uri: data[4] },
										{ label: '前往攻略', type: 'uri', uri: data[3] },
									],
							}));
				
				//line回話不能超過5個
				if(ansData.length>5){
					 msg=[{
						  type: 'template',
						  altText: 'Carousel alt text',
						  template: {
							type: 'carousel',
							columns:body,
						  },
						},
						]
				}else{
					 msg={
						  type: 'template',
						  altText: 'Carousel alt text',
						  template: {
							type: 'carousel',
							columns:body,
						  },
						}
				}
				
							
			}else{
				 msg=[	
				{ 
					type:'text',
					text:'目前 '+newstr+' 找不到喔 換別的試試看~~'
				},]
					
			}
			return msg;
		
		
		}
		
		
	}else{
		var ret="目前小拿看不懂喔><!";
		return { 
			type:'text',
			text:ret,
		};
	
	}
}

/**
* 預設對話內容
*/
function getDefaultMsgHello(){
	 var msg=[{ 
			type:'text',
			text:'你好~我是怪物彈珠BOT~我叫小拿!',
			}, 
			{
					  type: 'template',
					  altText: '請輸入「小拿 help」為你做教學',
					  template: {
						type: 'buttons',
						text: '請按教學或輸入「小拿 help」',
						 "actions": [
						  {
							"type": "message",
							"label": "教學",
							"text": "小拿 help"
						  }
						]
					  },
					},
			]
		return   msg;
}

/**
* 網站部分
*/
//=======gamewith=======

//爬蟲怪物攻略
function jpGamewithWeb() {
	//var callback = typeof arguments[arguments.length - 1] === "function" ? arguments[arguments.length - 1] : function() {};
	clearTimeout(timer);
	 new Promise((resolve, reject) => {
		request({
			url:'https://xn--eckwa2aa3a9c8j8bve9d.gamewith.jp/article/show/3054',
			method:'get'
		},(err,res,data)=>{
			if (err){
				console.log(err) ;
				reject(err);
				//return ;
			}else if(res && res.statusCode === 200){
				$ = cheerio.load(data);
				var item=[];
				var item2=[];
				//console.log("data:"+data);
				var index=0;
				var index2=0;
				$("tr").has('data-col3')
				//第一種規則
				$(".js-lazyload-fixed-size-img.c-blank-img.w-article-img").each(function(i, elem){

					var temp1=($(this).parents('a').text().replace(/<[^>]*>/g, ''));//名稱
					var temp2=($(this).parents('td').next().text());//關卡
					var temp3=($(this).attr('data-original'));//圖片
					var temp4=($(this).parents('td').next().children('a').attr('href'));//關卡連結
					var temp5=($(this).parent('a').attr('href'));//圖鑑連結

					 if ( !isEmpty(temp1) && !isEmpty(temp2) && !isEmpty(temp3) && !isEmpty(temp4))
					 {
							item2[index] = new Array();
							item2[index][0]=temp1;
							item2[index][1]=temp2;
							item2[index][2]=temp3;
							item2[index][3]=temp4;
							item2[index][4]=temp5;
							index++;
					 }
					
				});
				//第二種規則
				index2=0;
				var data2 = $("tr").filter(function(){
                   return $(this).attr('data-col1') !==undefined
                });
				data2.each(function(i, elem){

					var temp1=($(this).data('col1'));//名稱
					var temp2=($(this).data('col2'));//關卡
					var temp3=($(this).children('td').children('div').children('a').children('img').attr('src'));//圖片
					var temp4=($(this).children("td").next().children("a").attr("href"));//關卡連結
					var temp5=($(this).children("td").children("a").attr("href"));//圖鑑連結

					
					 if ( !isEmpty(temp1) && !isEmpty(temp2) && !isEmpty(temp3) && !isEmpty(temp4))
					 {
							item[index2] = new Array();
							item[index2][0]=temp1;
							item[index2][1]=temp2;
							item[index2][2]=temp3;
							item[index2][3]=temp4;
							item[index2][4]=temp5;
							index2++;
					 }
					
				});
				//合併
				for (var i = 0; i < item.length; i ++) {
					//去掉重複
					item2=item2.filter(n => item[i][0].indexOf(n[0])<0);
				}
				for (var i = 0; i < item2.length; i ++) {
					item[index+i]=item2[i]					
				}
				
				//console.log(item2);
				//callback( undefined,item);
				//先暫存為global變數
				stageData=item;
				resolve(item);
				console.log('攻略資料更新完畢!目前共'+stageData.length+'筆');
			}
			
			
		});
	}).catch((error) => {console.error(error);}); ;

	 timer = setInterval(jpGamewithWeb, 30*60*1000); //每半小時抓取一次新資料
	
}

//=======gamertb=======

//回傳怪物編號網址
var twGamertbWeb = function( number) {
  return "http://www.gamertb.com/ms/m"+number;
};

/**
*  表情符號
*/
function getNaploeonPic( number) {
	//獸神化
	if(number==0)return "https://imgur.com/QTijwU7.jpg"; 
	//獸神化
	if(number==1)return "https://imgur.com/CbTB9Ms.jpg"
	if(number==2)return "https://imgur.com/e1eEXpC.jpg"
};

/**
*圖片處理
*/
function lineReplyPicture(imageUrl) {
	var messages= { type  : 'image',
                    originalContentUrl:  imageUrl.replace("http", "https"),
                    previewImageUrl:  imageUrl.replace("http", "https")
	}
	return messages;
 };

 /**
 *Google問卷處理
 */
 
 //記憶功能(問卷功能先不用)
function googleAsk(msg,source,userName){
      var myId=source.userId;

	  var ret;
      if (users[myId]==undefined){
         users[myId]=[];
         users[myId].userId=myId;
         users[myId].step=-1;
         users[myId].replies=[];
      }
      var myStep=users[myId].step;
      if (myStep===-1)
         ret=("哈囉! "+userName+","+myQuestions[0][0]);
      else{
         if (myStep==(totalSteps-1))
            ret=myQuestions[1][myStep];
         else
            ret=(myQuestions[1][myStep]+'\n'+userName+","+myQuestions[0][myStep+1]);
         users[myId].replies[myStep+1]=msg;
      }
      myStep++;
      users[myId].step=myStep;
      if (myStep>=totalSteps){
         myStep=-1;
		 usersGoogleMode[source.userId]=0;
         users[myId].step=myStep;
         users[myId].replies[0]=new Date();
         appendMyRow(myId,userName);
	  }
	return ret;
      
 }
 //尋找相同關鍵字
function googleAnswerSet(answerArray,keyword){
	return answerArray.filter(answers => (answers[1].indexOf(keyword)>=0) && (keyword.indexOf(answers[1])>=0));
  }
  
   //尋找攻略相同關鍵字
function findKeySet(data,keyword){
	return data.filter(answers =>  strCompare(answers[1],keyword) || strCompare(answers[0],keyword));
  }
  
  //偵測攻略網址
function getMomstrikeUrlStatgeStr (str){
	 //去掉換行
	 str = str.replace(/(\r\n\t|\n|\r\t)/gm,"");
	//正規表示法
	var re=/(モンストでマルチしない？「)(.*-)?(.*)(（.*)/; 
	
	var ret=null;
	if(str.match(re)!=null){ret= str.match(re)[3];}
	 console.log('getMomstrikeUrlStatgeStr:'+ret);
	return ret;
  }
  
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



/**
* util
*/
function isEmpty(value){
  return (value == null || value.length === 0);
}

function strCompare(a,b){
	a=a.replace('・','');
	b=b.replace('・','');
	return (cjk(a).indexOf(cjk(b))>=0);
}

//中日韓編碼轉換
function cjk(t){
	return cjkConv.jpConvert['cjk2zht'](t);
}

// debug使用
process.on('unhandledRejection', (reason, promise) => {
   if(debug) console.log('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});