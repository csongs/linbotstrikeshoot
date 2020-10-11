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