"use strict";
cc._RFpush(module, '74868lChLJHkqxOmGjhUhkk', 'duel');
// Script\duel.js

//处理对战流程的关键类

var Player = require('player');
var ChatWnd = require('ChatWnd');
var PlayerSprite = require('PlayerSprite');
var GameConn = require('./NetWork/GameConn');
//var EventProcess = require('./Network/EventProcess');

//对战状态
var DUEL_STATE_REST = 0;
var DUEL_STATE_PLAYING = 1;

//分组
var TEAM_COLOR_NONE = -1;
var TEAM_COLOR_RED = 1;
var TEAM_COLOR_BLUE = 2;

cc.Class({
    'extends': cc.Component,

    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...

        playerVec: [],
        state: DUEL_STATE_REST,

        turn: 0, //每个玩家一回合加一次
        round: 0, //每个玩家都行动过一回合加一次

        //-----------------------控件-------------------------------------------
        cardPrefab: {
            'default': null,
            type: cc.Prefab
        },

        playerSpriteVec: [PlayerSprite], //玩家控件

        //聊天窗口脚本
        chatWnd: {
            'default': null,
            type: ChatWnd
        }
    },

    setInputControl: function setInputControl() {
        var self = this;
        this.node.on('touchstart', function (event) {
            cc.log('1231312321313213123');
            cc.log(event.getLocationX());
        }, this);
    },

    addPlayer: function addPlayer(param) {
        var idx = param;
        var player = this.duel.playerVec[idx];
        //玩家数据已存在
        if (player) {
            cc.log('WC_PLAYER_ADD error! player(%d) is already exited.', idx);
            return;
        }

        //创建玩家并加入玩家数组
        createPlayer(param);

        GameConn.sendPacket(CW_DUELREADY_REQUEST, {}); //直接准备
    },

    createPlayer: function createPlayer(param) {
        var player = new Player();
        player.init(this);
        player.unpackDataAll(param);
        this.playerVec[idx] = player;
    },

    getPlayer: function getPlayer(idx) {
        return this.playerVec[idx];
    },

    getPlayerSprite: function getPlayerSprite(idx) {
        return this.playerSpriteVec[idx];
    },

    refreshPlayerSprite: function refreshPlayerSprite(playerIdx) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = this.playerSpriteVec[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var playerSprite = _step.value;

                if (playerSprite.getIdx() === playerIdx) {
                    playerSprite.refresh();
                    break;
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator['return']) {
                    _iterator['return']();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    },

    //开始游戏
    startGame: function startGame() {
        //玩家初始化
        this.localPlayer.init(this);
        this.opponentPlayer.init(this);

        //根据牌池生成卡组
        this.localPlayer.createDeck(tempDeck);
        this.opponentPlayer.createDeck(tempDeck);

        //初始化对手player,
        this.localPlayer._opponentPlayer = this.opponentPlayer;
        this.opponentPlayer._opponentPlayer = this.localPlayer;

        var isFirstPlayer = true; //先手后手

        if (isFirstPlayer) {
            this.turnPlayer = this.localPlayer;
            this.turnOpponent = this.opponentPlayer;
        } else {
            this.turnPlayer = this.opponentPlayer;
            this.turnOpponent = this.localPlayer;
        }

        this.turn = 1;

        this.turnPlayer.drawDeck(3);
        this.turnOpponent.drawDeck(3);
        this.changePhase(PHASE_BEGIN_TURN);

        //showTipLabel('开始游戏');
    },

    //交换行动
    turnPlayerChange: function turnPlayerChange() {
        //cc.log('turnPlayerChange, turnPlayer:%s, turnOpponent:%s', this.turnPlayer.heroName, this.turnOpponent.heroName);
        var tempPlayer = this.turnPlayer;
        //cc.log('tempPlayerName:%s', tempPlayer.heroName);
        this.turnPlayer = this.turnOpponent;
        //cc.log('turnPlayer:%s', this.turnPlayer.heroName);

        this.turnOpponent = tempPlayer;
        //cc.log('turnopponent:%s', this.turnOpponent.heroName);
    },

    //随从攻击玩家
    monsterAtkPlayer: function monsterAtkPlayer(monster, player) {
        if (!monster || monster.atk <= 0 || monster.isAtked === true) return;

        monster.isAtked = true;
        player.reduceHp(monster.atk);
        player.refreshMonsterField();

        showTipLabel(monster._player.heroName + '的' + monster.cardName + ' 攻击了玩家 ' + player.heroName);

        this.checkWin();
    },

    //随从攻击随从
    monsterAtkMonster: function monsterAtkMonster(src, dest) {
        if (!src || !dest || src.atk <= 0 || src.isAtked === true) return;

        src.isAtked = true;
        var damage = src.atk;
        dest.reduceHp(damage);

        damage = dest.atk;
        src.reduceHp(damage);

        showTipLabel(src._player.heroName + '的' + src.cardName + ' 攻击了 ' + dest._player.heroName + '的' + dest.cardName, cc.Color.RED);
    },

    //判断输赢
    checkWin: function checkWin() {
        if (this.turnPlayer.hp <= 0 && this.turnOpponent.hp <= 0) {
            showTipLabel("平局");
        } else if (this.turnPlayer.hp <= 0) {
            showTipLabel("%s 胜利", this.opponentPlayer.heroName);
        } else if (this.turnOpponent.hp <= 0) {
            showTipLabel("% 胜利", this.turnPlayer.heroName);
        }
    },

    //回合结束（按钮调用）
    turnEnd_BtnEvent: function turnEnd_BtnEvent(event) {
        //不是MainPhase这个按钮不能按
        if (this.phaseState !== PHASE_MAIN_TURN) return;

        this.changePhase(PHASE_END_TURN);
    },

    addChatItem: function addChatItem(message, color) {
        this.chatWnd.addChatItem(message, color);
        //this.chatWnd.addChatItem('[系统]:用户' + GameConn.getAccountName() + '进入了房间.', cc.Color.RED);
    },

    enterBeginTurn: function enterBeginTurn() {
        cc.log('is enter BeginTurn?');
        ++this.turn;
        this.turnPlayerChange();

        showTipLabel(this.turnPlayer.heroName + '的回合');
        this.turnPlayer.setTurnActive(true); //可以行动
        this.turnPlayer.criticalPlus(1); //增加水晶
        this.turnPlayer.criticalRecover(); //回复水晶
        this.turnPlayer.awakenMonster(); //重置随从攻击次数
        this.turnPlayer.drawDeck(1); //抽1张卡
    },

    beginTurn: function beginTurn() {
        //进入主流程

        this.changePhase(PHASE_MAIN_TURN);
    },

    leaveBeginTurn: function leaveBeginTurn() {},

    enterMainTurn: function enterMainTurn() {},

    mainTurn: function mainTurn() {},

    leaveMainTurn: function leaveMainTurn() {},

    enterEndTurn: function enterEndTurn() {},

    endTurn: function endTurn() {
        this.changePhase(PHASE_BEGIN_TURN);
    },

    leaveEndTurn: function leaveEndTurn() {

        this.turnPlayer.setTurnActive(false);
    },

    changePhase: function changePhase(nextTurnType) {
        if (this.phaseState !== 0) {
            this.leaveTurnFunc[this.phaseState]();
        }

        this.enterTurnFunc[nextTurnType]();
        this.phaseState = nextTurnType;
    },

    // use this for initialization
    onLoad: function onLoad() {
        //this.setInputControl();
        //初始化玩家控件
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = this.playerSpriteVec[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var playerSprite = _step2.value;

                playerSprite.init(this);
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                    _iterator2['return']();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }
    },

    start: function start() {
        //this.startGame();
        EventProcess.setDuel(this);
        GameConn.sendPacket(CW_ENTERROOM_REQUEST, {}); //用户进入房间请求
    },

    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        //this.turnFunc[this.phaseState]();
    }
});

cc._RFpop();