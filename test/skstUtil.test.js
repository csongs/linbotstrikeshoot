const should = require('should');
const skstUtil = require('../lib/skstUtil');

describe('#test strContain', () => {
    // 測試文字: 'a' 'aa'
    it('should return true when strContain("a","aa") ', done => {
        let ret = skstUtil.strContain('a', 'aa');
        ret.should.equal(false);
        done()
    })
    // 測試文字: 'aa' 'a'
    it('should return true when strContain("aa","a") ', done => {
        let ret = skstUtil.strContain('aa', 'a');
        ret.should.equal(true);
        done()
    })
    // 測試文字: 'a' 'a'
    it('should return true when strContain("a","a") ', done => {
        let ret = skstUtil.strContain('a', 'a');
        ret.should.equal(true);
        done()
    })

});