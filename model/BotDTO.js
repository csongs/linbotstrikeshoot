/**
 * BOT 屬性
 * @type {{}}
 */

/**
 * 確認是否為command
 */
function checkCommand(msg) {
    if (msg.indexOf(this.spellCommand) == 0) {
        return true;
    } else {
        return false;
    }
}

/**
 * 預設對話內容
 */
function getDefaultMsg() {
    let ret = "目前小拿看不懂喔><!";
    return {
        type: 'text',
        text: ret,
    };
}

/**
 * 預設對話內容-Hello
 */
function getDefaultMsgHello() {
    let msg = [{
        type: 'text',
        text: '你好~我是怪物彈珠BOT~我叫小拿!',
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
    return msg;
}

/**
 * 預設對話內容 :Test
 */
function getDefaultMsgTest() {
    let msg = [
        {
            type: 'text',
            text: "1"
        },
        {
            type: 'text',
            text: "2"
        },
        {
            type: 'text',
            text: "3"
        },
        {
            type: 'text',
            text: "4"
        },
        {
            type: 'text',
            text: "最多只能5次QQ"
        },

    ]
    return msg;
}


/**
 * 預設對話內容 :help
 */
function getDefaultMsgHelp() {
    let msg = [
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
    return msg;
}

/**
 * 預設對話內容 :獸神
 */
function getDefaultMsgCustom01() {
    let picNumber = Math.floor((Math.random() * 3));
    let msg = [
        {
            type: 'text',
            text: "等很久了>///<"
        },
        {
            type: 'image',
            originalContentUrl: this.getSticker(picNumber),
            previewImageUrl: this.getSticker(picNumber),
        }
    ]
    return msg;
}

/**
 *  表情符號
 */
function getSticker(number) {
    if (number == 0) return "https://imgur.com/QTijwU7.jpg";
    if (number == 1) return "https://imgur.com/CbTB9Ms.jpg"
    if (number == 2) return "https://imgur.com/e1eEXpC.jpg"
};


module.exports = {
    spellCommand: "小拿 ",
    //-------------
    checkCommand: checkCommand,
    getSticker: getSticker,
    //-------------
    getDefaultMsg: getDefaultMsg,
    getDefaultMsgHello: getDefaultMsgHello,
    getDefaultMsgTest: getDefaultMsgTest,
    getDefaultMsgHelp: getDefaultMsgHelp,
    getDefaultMsgCustom01: getDefaultMsgCustom01,

}
