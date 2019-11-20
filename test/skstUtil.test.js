const should = require('should')
const skstUtil = require('../lib/skstUtil')


describe('#test isPlayChoice', () => {
    // 測試文字: {事情} choice {選項1} {選項2}
    it('should return true when {事情} choice {選項1} {選項2} ', done => {
        let text=" {事情} choice {選項1} {選項2} ";
        let ret = skstUtil.isPlayChoice(text);
        ret.should.equal(true);
        done()
    })
    // 測試文字: choice {選項1} {選項2}
    it('should return true when choice {選項1} {選項2}', done => {
        let text=" {事情} choice {選項1} {選項2} ";
        let ret = skstUtil.isPlayChoice(text);
        ret.should.equal(true);
        done()
    })

    // 測是文字: null
    it('should return undefined when array is empty', done => {
        const ret = skstUtil.isPlayChoice(null);
        ret.should.equal(false);
        done()
    })
});


describe('#test strContain', () => {
    // 測試文字: 'a' 'aa'
    it('should return true when strContain("a","aa") ', done => {
        let ret = skstUtil.strContain('a','aa');
        ret.should.equal(false);
        done()
    })
    // 測試文字: 'aa' 'a'
    it('should return true when strContain("aa","a") ', done => {
        let ret = skstUtil.strContain('aa','a');
        ret.should.equal(true);
        done()
    })
    // 測試文字: 'a' 'a'
    it('should return true when strContain("a","a") ', done => {
        let ret = skstUtil.strContain('a','a');
        ret.should.equal(true);
        done()
    })

});