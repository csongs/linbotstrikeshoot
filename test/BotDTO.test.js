const should = require('should');
const botDTO = require('../model/BotDTO');

describe('#test isPlayChoice', () => {
    // 測試文字: {事情} choice {選項1} {選項2}
    it('should return true when {事情} choice {選項1} {選項2} ', done => {
        let text = " {事情} choice {選項1} {選項2} ";
        let ret = botDTO.isPlayChoice(text);
        ret.should.equal(true);
        done()
    })
    // 測試文字: choice {選項1} {選項2}
    it('should return true when choice {選項1} {選項2}', done => {
        let text = " {事情} choice {選項1} {選項2} ";
        let ret = botDTO.isPlayChoice(text);
        ret.should.equal(true);
        done()
    })

    // 測是文字: null
    it('should return undefined when array is empty', done => {
        const ret = botDTO.isPlayChoice(null);
        ret.should.equal(false);
        done()
    })
});

describe('#test isGachaCmd', () => {
    // 測是文字: 抽抽
    it('should return true when 抽抽 ', done => {
        let text = "抽抽";
        let ret = botDTO.isGachaCmd(text);
        ret.should.equal(true);
        done()
    })

    // 測是文字: 抽抽開
    it('should return false when 抽抽開 ', done => {
        let text = "抽抽開";
        let ret = botDTO.isGachaCmd(text);
        ret.should.equal(false);
        done()
    })
});