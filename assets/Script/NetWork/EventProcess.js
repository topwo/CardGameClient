var ERROR_NOERROR = 0;

var LOGIN_ERROR_NOTFOUND = 1;
var LOGIN_ERROR_PASSWORD_ERROR = 2;

var ERROR_ENTERROOM_INROOM = 1;
var ERROR_DUELREADY_ISPLAYING = 1;

cc.Class({
    extends: cc.Component,

    properties: {
    },

    // use this for initialization
    onLoad: function () {
    },
    
    statics: {
        gameConn: null, //网络连接
        duel: null,     //游戏管理
        
        //设置游戏管理
        setDuel: function(duel) {
            this.duel = duel;
        },
        
        //初始化
        init: function(conn) {
            cc.log('EventProcess 初始化');
            this.gameConn = conn;
            window.WC_ENTERROOM_RESPONSE = 'WC_ENTERROOM_RESPONSE';

            //注册消息处理函数
            this.gameConn.registerHandler('disconnect', this.disconnect.bind(this));
            this.gameConn.registerHandler(WC_CONNECTED, this[WC_CONNECTED].bind(this));
            this.gameConn.registerHandler(WC_LOGIN_RESPONSE, this[WC_LOGIN_RESPONSE].bind(this));
            this.gameConn.registerHandler(WC_ENTERROOM_RESPONSE, this[WC_ENTERROOM_RESPONSE].bind(this));
            this.gameConn.registerHandler(WC_CHAT_ADD_RESPONSE, this[WC_CHAT_ADD_RESPONSE].bind(this));
            this.gameConn.registerHandler(WC_CHAT_ADD, this[WC_CHAT_ADD].bind(this));
            this.gameConn.registerHandler(WC_PLAYER_ADD, this[WC_PLAYER_ADD].bind(this));
            this.gameConn.registerHandler(WC_PLAYER_UPDATE, this[WC_PLAYER_UPDATE].bind(this));
            this.gameConn.registerHandler(WC_DUELREADY_RESPONSE, this[WC_DUELREADY_RESPONSE].bind(this));
            this.gameConn.registerHandler(WC_DUELREADY, this[WC_DUELREADY].bind(this));
             
        },
        
        //服务器断开连接
        disconnect: function() {
            this.gameConn.disconnect();
        },
        
        //连接响应
        WC_CONNECTED: function(param) {
            this.gameConn.connectSuccess(param.idx);
            cc.log('收到服务器连接响应，clientid: %d, name: %s', param.idx, param.name);
        },
        
        //登录响应
        WC_LOGIN_RESPONSE: function(param) {
            if(param.error == ERROR_NOERROR)
            {
                this.gameConn.loginSuccess(param.account);
                cc.log("登录成功,error:%d", param.error);
                cc.director.loadScene('helloworld');    //切换到游戏场景
            }
            else if(param.error == LOGIN_ERROR_PASSWORD_ERROR)
            {
                showTipLabel('登录失败，密码错误');
            }
            else if(param.error == LOGIN_ERROR_NOTFOUND)
            {
                showTipLabel('登录失败，账号不存在');
            }
            else
            {
                showTipLabel('登录失败，未知错误');
            }
        },
        
        //进入房间响应
        WC_ENTERROOM_RESPONSE: function(param) {
            var error = param.error;
            if(error == ERROR_ENTERROOM_INROOM)
                cc.log('您已经进入房间，不可再次进入');
            else if(error === ERROR_NOERROR)
            {
                cc.log('成功进入房间');
            }
        },
        
        //添加聊天信息响应(以后写)
        WC_CHAT_ADD_RESPONSE: function(param) {
        },
        
        //服务端发送聊天信息
        WC_CHAT_ADD: function(param) {
            if(param.isSystem)
                this.duel.addChatItem(param.message, cc.Color.RED);
            else
                this.duel.addChatItem(param.message);
        },
        
        //添加完整玩家数据
        WC_PLAYER_ADD: function(param) {
            duel.addPlayer(param);
        },
        
        //Player更新
        WC_PLAYER_UPDATE: function(param) {
            var idx = param.idx;

            var player = this.duel.getPlayer(idx);
            if(!player)
                return;
            
            player.unPackData(param);
        },
        
         
        //准备游戏响应
        WC_DUELREADY_RESPONSE: function(param) {
            var error = param.error;
            if(error === ERROR_DUELREADY_ISPLAYING)
            {
                showTipLabel('游戏已经开始了，不能准备', cc.Color.RED);
            }
            else
            {
                //第0个玩家控件为玩家自己，设置为玩家IDX
                var playerSprite = this.duel.getPlayerSprte(0);
                playerSprite.setIdx(param.idx);
            }
        }, 
        
        //有玩家准备游戏
        WC_DUELREADY: function(param) {
            var idx = param.idx;
            
            //玩家更新
            var player = this.duel.getPlayer(idx);
            if(!player)
                return;
            
            player.unPackData(param);
            
            //玩家控件更新
            //3种情况 
            //1.玩家自己准备，0控件刷新为玩家；
            //2.第一个准备的玩家，1控件刷新为此玩家；
            //3.第二个准备的玩家，0控件刷新为此玩家；
            var playerSprite = this.duel.getPlayerSprte(0);
            var playerSprite1 = this.duel.getPlayerSprite(1);
            if(playerSprite.getIdx() !== idx)
            {
                if(playerSprite1.getIdx() !== -1)
                {
                    playerSprite.setIdx(idx);
                }
                else
                {
                    playerSprite1.setIdx(idx);
                }
            }
            
            duel.refreshPlayerSprite(idx);
        },
    },
    

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
