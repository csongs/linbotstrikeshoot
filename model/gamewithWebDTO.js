
class GamewithWebDTO {
    constructor(name, stage,picUrl,stageUrl,dataUrl) {

        this.name = name; //名稱
        this.stage =stage;//關卡
        this.picUrl=picUrl ;//圖片
        this.stageUrl=stageUrl ;//關卡連結
        this.dataUrl=dataUrl ;//圖鑑連結
    }
    check(){
        if ( !this.isEmpty(this.name) && !this.isEmpty(this.stage) && !this.isEmpty(this.picUrl) && !this.isEmpty(this.stageUrl)){
            return true;
        }else{
            return false;
        }
    }

    isEmpty(value){
        return (value == null || value.length === 0);
    }


}



module.exports = GamewithWebDTO;