class LCUServiceDemo {
  constructor() {
    this.isConnected = false;
    this.enemyInfo = null;
    this.listeners = [];
    this.connectionStatus = {
      isConnected: false,
      baseUrl: null,
      port: null,
      hasPassword: false
    };
  }

  // 模拟连接到LCU
  async connect() {
    try {
      // 模拟连接延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟成功连接
      this.isConnected = true;
      this.connectionStatus = {
        isConnected: true,
        baseUrl: 'https://127.0.0.1:12345',
        port: '12345',
        hasPassword: true
      };
      
      // 模拟获取召唤师信息
      this.simulateSummonerInfo();
      
      // 模拟游戏状态更新
      this.simulateGameUpdates();
      
      return true;
    } catch (error) {
      console.error('连接LCU失败:', error);
      this.isConnected = false;
      return false;
    }
  }

  // 模拟召唤师信息
  simulateSummonerInfo() {
    this.summonerInfo = {
      displayName: 'DemoPlayer',
      summonerLevel: 30,
      summonerId: 123456789
    };
  }

  // 模拟游戏状态更新
  simulateGameUpdates() {
    // 模拟英雄选择阶段
    setTimeout(() => {
      this.enemyInfo = {
        type: 'champ_select',
        theirTeam: [
          {
            summonerName: 'EnemyPlayer1',
            championId: 103, // 阿狸
            assignedPosition: 'MIDDLE'
          },
          {
            summonerName: 'EnemyPlayer2',
            championId: 157, // 亚索
            assignedPosition: 'TOP'
          },
          {
            summonerName: 'EnemyPlayer3',
            championId: 64, // 李青
            assignedPosition: 'JUNGLE'
          },
          {
            summonerName: 'EnemyPlayer4',
            championId: 22, // 艾希
            assignedPosition: 'BOTTOM'
          },
          {
            summonerName: 'EnemyPlayer5',
            championId: 412, // 锤石
            assignedPosition: 'UTILITY'
          }
        ],
        myTeam: [
          {
            summonerName: 'DemoPlayer',
            championId: 245, // 艾克
            assignedPosition: 'MIDDLE'
          },
          {
            summonerName: 'AllyPlayer1',
            championId: 266, // 奥拉夫
            assignedPosition: 'TOP'
          },
          {
            summonerName: 'AllyPlayer2',
            championId: 121, // 卡兹克
            assignedPosition: 'JUNGLE'
          },
          {
            summonerName: 'AllyPlayer3',
            championId: 51, // 凯特琳
            assignedPosition: 'BOTTOM'
          },
          {
            summonerName: 'AllyPlayer4',
            championId: 53, // 布隆
            assignedPosition: 'UTILITY'
          }
        ],
        timestamp: Date.now()
      };
      this.notifyListeners();
    }, 2000);

    // 模拟游戏中状态
    setTimeout(() => {
      this.enemyInfo = {
        type: 'in_game',
        enemyTeam: [
          {
            summonerName: 'EnemyPlayer1',
            championName: '阿狸',
            level: 18,
            rank: { tier: 'GOLD', division: 'II' }
          },
          {
            summonerName: 'EnemyPlayer2',
            championName: '亚索',
            level: 17,
            rank: { tier: 'PLATINUM', division: 'IV' }
          },
          {
            summonerName: 'EnemyPlayer3',
            championName: '李青',
            level: 16,
            rank: { tier: 'GOLD', division: 'I' }
          },
          {
            summonerName: 'EnemyPlayer4',
            championName: '艾希',
            level: 15,
            rank: { tier: 'SILVER', division: 'I' }
          },
          {
            summonerName: 'EnemyPlayer5',
            championName: '锤石',
            level: 14,
            rank: { tier: 'GOLD', division: 'III' }
          }
        ],
        gameDetails: {
          gameId: 123456789,
          queue: { description: '召唤师峡谷 5v5 排位赛' }
        },
        timestamp: Date.now()
      };
      this.notifyListeners();
    }, 8000);
  }

  // 获取当前召唤师信息
  async getCurrentSummoner() {
    return this.summonerInfo;
  }

  // 获取游戏状态
  async getGameStatus() {
    return {
      phase: this.enemyInfo?.type === 'champ_select' ? 'ChampSelect' : 'InProgress',
      gameData: this.enemyInfo?.gameDetails
    };
  }

  // 添加监听器
  addListener(callback) {
    this.listeners.push(callback);
  }

  // 移除监听器
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 通知所有监听器
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.enemyInfo);
      } catch (error) {
        console.error('监听器回调错误:', error);
      }
    });
  }

  // 断开连接
  disconnect() {
    this.isConnected = false;
    this.connectionStatus = {
      isConnected: false,
      baseUrl: null,
      port: null,
      hasPassword: false
    };
    this.enemyInfo = null;
    this.summonerInfo = null;
  }

  // 获取连接状态
  getConnectionStatus() {
    return this.connectionStatus;
  }
}

const lcuServiceDemo = new LCUServiceDemo();
export default lcuServiceDemo; 