class LCUServiceReal {
  constructor() {
    this.baseUrl = null;
    this.port = null;
    this.password = null;
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

  // 获取LCU进程信息
  async getLCUProcessInfo() {
    try {
      // 在Electron环境中使用Node.js模块
      if (window.require) {
        const { exec } = window.require('child_process');
        const util = window.require('util');
        const execAsync = util.promisify(exec);

        let command;
        if (process.platform === 'win32') {
          command = 'wmic PROCESS WHERE name="LeagueClientUx.exe" GET commandline /format:list';
        } else {
          command = 'ps aux | grep LeagueClientUx';
        }

        const { stdout } = await execAsync(command);
        
        // 解析命令行参数
        const portMatch = stdout.match(/--app-port=(\d+)/);
        const passwordMatch = stdout.match(/--remoting-auth-token=([a-zA-Z0-9]+)/);
        
        if (portMatch && passwordMatch) {
          this.port = portMatch[1];
          this.password = passwordMatch[1];
          this.baseUrl = `https://127.0.0.1:${this.port}`;
          console.log('✅ 找到LCU进程:', { port: this.port, hasPassword: !!this.password });
          return true;
        } else {
          console.log('❌ 未找到LCU进程或参数不完整');
          console.log('stdout:', stdout);
        }
      } else {
        console.log('❌ 不在Electron环境中，无法访问Node.js模块');
      }
      
      return false;
    } catch (error) {
      console.error('❌ 获取LCU进程信息失败:', error);
      return false;
    }
  }

  // 连接到LCU
  async connect() {
    try {
      console.log('🔍 正在查找LCU进程...');
      const found = await this.getLCUProcessInfo();
      if (!found) {
        throw new Error('未找到英雄联盟客户端进程，请确保游戏正在运行');
      }

      console.log('🔗 正在测试LCU连接...');
      // 测试连接
      const response = await this.makeRequest('/lol-summoner/v1/current-summoner');
      if (response.ok) {
        this.isConnected = true;
        this.connectionStatus = {
          isConnected: true,
          baseUrl: this.baseUrl,
          port: this.port,
          hasPassword: !!this.password
        };
        console.log('✅ LCU连接成功！');
        return true;
      } else {
        throw new Error(`无法连接到LCU API，状态码: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ 连接LCU失败:', error);
      this.isConnected = false;
      throw error;
    }
  }

  // 发送HTTP请求到LCU
  async makeRequest(endpoint, options = {}) {
    if (!this.baseUrl) {
      throw new Error('LCU未连接');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const auth = Buffer.from(`riot:${this.password}`).toString('base64');

    const defaultOptions = {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'LeagueOfLegendsClient/12.1.1.1234567890 (CEF 91)',
      },
    };

    // 在Electron环境中使用Node.js的fetch
    if (window.require) {
      const fetch = window.require('node-fetch');
      const https = window.require('https');
      
      // 创建自定义的HTTPS代理来忽略SSL证书验证
      const agent = new https.Agent({
        rejectUnauthorized: false
      });
      
      return fetch(url, { 
        ...defaultOptions, 
        ...options,
        agent 
      });
    } else {
      // 在浏览器环境中使用原生fetch
      return fetch(url, { ...defaultOptions, ...options });
    }
  }

  // 获取当前召唤师信息
  async getCurrentSummoner() {
    try {
      const response = await this.makeRequest('/lol-summoner/v1/current-summoner');
      if (response.ok) {
        const summoner = await response.json();
        console.log('📊 获取召唤师信息成功:', summoner.displayName);
        return summoner;
      } else {
        console.error('❌ 获取召唤师信息失败:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ 获取召唤师信息失败:', error);
      return null;
    }
  }

  // 获取游戏状态
  async getGameStatus() {
    try {
      const response = await this.makeRequest('/lol-gameflow/v1/session');
      if (response.ok) {
        const status = await response.json();
        console.log('🎮 获取游戏状态成功:', status.phase);
        return status;
      } else {
        console.error('❌ 获取游戏状态失败:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ 获取游戏状态失败:', error);
      return null;
    }
  }

  // 获取英雄选择信息
  async getChampSelectInfo() {
    try {
      const response = await this.makeRequest('/lol-champ-select/v1/session');
      if (response.ok) {
        const champSelect = await response.json();
        console.log('🎯 获取英雄选择信息成功');
        
        if (champSelect && champSelect.myTeam && champSelect.theirTeam) {
          this.enemyInfo = {
            type: 'champ_select',
            theirTeam: champSelect.theirTeam,
            myTeam: champSelect.myTeam,
            timestamp: Date.now()
          };
          this.notifyListeners();
        }
        
        return champSelect;
      } else {
        console.error('❌ 获取英雄选择信息失败:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ 获取英雄选择信息失败:', error);
      return null;
    }
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
    this.baseUrl = null;
    this.port = null;
    this.password = null;
    this.gameData = null;
    this.enemyInfo = null;
    console.log('🔌 LCU连接已断开');
  }

  // 获取连接状态
  getConnectionStatus() {
    return this.connectionStatus;
  }

  // 定期检查游戏状态
  startPolling() {
    this.pollingInterval = setInterval(async () => {
      if (this.isConnected) {
        try {
          // 检查游戏状态
          const gameStatus = await this.getGameStatus();
          if (gameStatus && gameStatus.phase === 'ChampSelect') {
            await this.getChampSelectInfo();
          }
        } catch (error) {
          console.error('轮询检查失败:', error);
        }
      }
    }, 5000); // 每5秒检查一次
  }

  // 停止轮询
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}

const lcuServiceReal = new LCUServiceReal();
export default lcuServiceReal; 