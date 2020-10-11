const should = require('should');
const skstUtil = require('../lib/skstUtil');
const GamewithWebDTO = require('../model/GamewithWebDTO');

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

describe('#test getMonstrikeUrlStageStr and selectKeySet', () => {
    let dataDTO = new GamewithWebDTO(
        'name',//名稱
        'stage',//關卡
        'imgUrl',//圖片
        'stageUrl',//關卡連結
        'dataUrl',//圖鑑連結
    );

    it('stage  玉楼-暴威の鬼神、乱逆の咎（超絶）', done => {
        let text = "モンストでマルチしない？\n「玉楼-暴威の鬼神、乱逆の咎（超絶）」";
        dataDTO.stage="暴威の鬼神、乱逆の咎";
        let keyword="暴威の鬼神、乱逆の咎";
        let data=[dataDTO];
        let ret1 = skstUtil.getMonstrikeUrlStageStr(text);
        ret1.should.equal(keyword);
        let ret2 = skstUtil.selectKeySet(data,keyword);
        ret1.should.equal(keyword);
        ret2.length.should.equal(1);
        done()
    })

    it('stage  光をもたらす者 ルシファー（超究極）', done => {
        let text = "モンストでマルチしない？\n「光をもたらす者 ルシファー（超究極）」";
        dataDTO.stage="光をもたらす者 ルシファー【超究極】";
        let keyword="光をもたらす者 ルシファー";
        let data=[dataDTO];
        let ret1 = skstUtil.getMonstrikeUrlStageStr(text);
        ret1.should.equal(keyword);
        let ret2 = skstUtil.selectKeySet(data,keyword);
        ret1.should.equal(keyword);
        ret2.length.should.equal(1);
        done()
    })
    
});


describe('#test jpGamewithWeb', function(){
    this.timeout(3000);
    it('should return true when jpGamewithWeb() ', done => {
        skstUtil.jpGamewithWeb().then((ret)=>{
            should.notEqual(ret.length,0);
            done();
        })
        
    })
});