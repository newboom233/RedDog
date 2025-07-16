class LCUService {
  constructor() {
    this.baseUrl = null;
    this.port = null;
    this.password = null;
    this.ws = null;
    this.isConnected = false;
    this.gameData = null;
    this.enemyInfo = null;
    this.listeners = [];
    this.connectionStatus = {
      isConnected: false,
      baseUrl: null,
      port: null,
      hasPassword: false,
      error: null
    };
    this.pollingInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.lastGamePhase = null; // 记录上次的游戏阶段
    this.connectionRetryCount = 0; // 连接重试次数
  }

  // 改进的LCU进程检测方法
  async getLCUProcessInfo() {
    try {
      if (!window.require) {
        throw new Error('不在Electron环境中，无法访问Node.js模块');
      }

      const { exec } = window.require('child_process');
      const util = window.require('util');
      const execAsync = util.promisify(exec);

      let commands = [];
      
      // 尝试多种命令来获取进程信息
      if (process.platform === 'win32') {
        commands = [
          'wmic PROCESS WHERE name="LeagueClientUx.exe" GET commandline /format:list',
          'tasklist /FI "IMAGENAME eq LeagueClientUx.exe" /FO CSV',
          'Get-Process LeagueClientUx -ErrorAction SilentlyContinue | Select-Object Commandline'
        ];
      } else {
        commands = [
          'ps aux | grep LeagueClientUx',
          'pgrep -f LeagueClientUx'
        ];
      }

      for (const command of commands) {
        try {
          console.log(`🔍 尝试命令: ${command}`);
          const { stdout } = await execAsync(command);
          
          if (stdout && stdout.trim()) {
            // 解析命令行参数
            const portMatch = stdout.match(/--app-port=([0-9]+)(?= *"| --)/);
            const passwordMatch = stdout.match(/--remoting-auth-token=(.+?)(?= *"| --)/);
            
            if (portMatch && passwordMatch) {
              const port = portMatch[1];
              const password = passwordMatch[1];
              
              console.log('✅ 通过进程命令找到LCU:', { 
                port, 
                hasPassword: !!password
              });
              
              return {
                port,
                password,
                baseUrl: `https://127.0.0.1:${port}`
              };
            }
          }
        } catch (cmdError) {
          console.log(`❌ 命令失败: ${command}`, cmdError.message);
          continue;
        }
      }

    //   // 如果所有命令都失败，尝试通过文件系统查找
    //   console.log('🔍 进程命令失败，尝试通过lockfile查找...');
    //   return await this.findLCUByLockfile();
      
    } catch (error) {
      console.error('❌ 获取LCU进程信息失败:', error);
      return null;
    }
  }

//   // 通过lockfile查找LCU（备用方法）
//   async findLCUByLockfile() {
//     try {
//       if (!window.require) return null;
      
//       const fs = window.require('fs');
//       const path = window.require('path');
//       const os = window.require('os');
      
//       // 常见的lockfile位置
//       const lockfilePaths = [
//         path.join(os.homedir(), 'AppData', 'Roaming', 'League of Legends', 'lockfile'),
//         path.join(os.homedir(), 'AppData', 'Local', 'Riot Games', 'League of Legends', 'lockfile'),
//         path.join('C:', 'Riot Games', 'League of Legends', 'lockfile')
//       ];

//       for (const lockfilePath of lockfilePaths) {
//         try {
//           if (fs.existsSync(lockfilePath)) {
//             const lockfileContent = fs.readFileSync(lockfilePath, 'utf8');
//             const [processName, , port, password] = lockfileContent.split(':');
            
//             if (processName === 'LeagueClientUx' && port && password) {
//               console.log('✅ 通过lockfile找到LCU:', { 
//                 port, 
//                 hasPassword: !!password,
//                 lockfilePath
//               });
              
//               return {
//                 port,
//                 password,
//                 baseUrl: `https://127.0.0.1:${port}`
//               };
//             }
//           }
//         } catch (fileError) {
//           console.log(`❌ 读取lockfile失败: ${lockfilePath}`, fileError.message);
//           continue;
//         }
//       }
      
//       console.log('❌ 未找到有效的lockfile');
//       return null;
//     } catch (error) {
//       console.error('❌ 通过lockfile查找LCU失败:', error);
//       return null;
//     }
//   }

  // 改进的连接方法
  async connect() {
    try {
      console.log('🔗 开始连接LCU...');
      
      // 获取LCU连接信息（包括进程检测和lockfile查找）
      const connectionInfo = await this.getLCUProcessInfo();
      if (!connectionInfo) {
        throw new Error('未找到英雄联盟客户端进程，请确保客户端已启动');
      }
      
      console.log('✅ 找到LCU连接信息:', connectionInfo);
      
      // 设置连接信息
      this.baseUrl = connectionInfo.baseUrl;
      this.port = connectionInfo.port;
      this.password = connectionInfo.password;
      
      console.log('🔐 连接信息:', {
        baseUrl: this.baseUrl,
        port: this.port,
        hasPassword: !!this.password
      });
      
      // 测试连接
      const testResponse = await this.makeRequest('/lol-summoner/v1/current-summoner');
      console.log('LCU API 状态码:', testResponse.status);
      const responseText = await testResponse.text();
      console.log('LCU API 返回内容:', responseText);
      if (!testResponse.ok) {
        throw new Error('LCU连接测试失败');
      }
      
      this.isConnected = true;
      this.connectionStatus = {
        isConnected: true,
        baseUrl: this.baseUrl,
        port: this.port,
        hasPassword: !!this.password,
        error: null
      };
      
      console.log('✅ LCU连接成功！');
      
      // 设置WebSocket连接（可选，用于实时更新）
      await this.setupWebSocket();
      
      // 连接成功后立即获取一次当前游戏状态
      console.log('🎮 连接成功后，获取当前游戏状态...');
      await this.processCurrentGameState();
      
      return true;
    } catch (error) {
      console.error('❌ LCU连接失败:', error);
      this.connectionStatus.error = error.message;
      throw error;
    }
  }

  // 改进的HTTP请求方法
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
      timeout: 10000, // 10秒超时
    };

    try {
      if (window.require) {
        const fetch = window.require('node-fetch');
        const https = window.require('https');
        
        const agent = new https.Agent({
          rejectUnauthorized: false,
          timeout: 10000
        });
        
        return await fetch(url, { 
          ...defaultOptions, 
          ...options,
          agent 
        });
      } else {
        return await fetch(url, { ...defaultOptions, ...options });
      }
    } catch (error) {
      console.error(`❌ 请求失败 ${endpoint}:`, error);
      throw error;
    }
  }

  // 改进的WebSocket设置
  async setupWebSocket() {
    try {
      const wsUrl = `wss://127.0.0.1:${this.port}`;
      
      if (window.require) {
        const WebSocket = window.require('ws');
        const https = window.require('https');
        
        const agent = new https.Agent({
          rejectUnauthorized: false
        });
        
        this.ws = new WebSocket(wsUrl, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`riot:${this.password}`).toString('base64')}`,
          },
          agent,
        });
      } else {
        this.ws = new WebSocket(wsUrl);
      }

      this.ws.on('open', () => {
        console.log('✅ WebSocket连接已建立');
        this.subscribeToEvents();
        this.reconnectAttempts = 0; // 重置重连计数
      });

      this.ws.on('message', (data) => {
        try {
          // 检查数据是否为空或无效
          if (!data || typeof data !== 'string' || data.trim() === '') {
            console.log('⚠️ 收到空的WebSocket消息，跳过处理->', data);
            return;
          }
          console.log('收到socket信息', data)
          const message = JSON.parse(data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('❌ 解析WebSocket消息失败:', error);
          console.log('原始数据:', data);
        }
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket错误:', error);
      });

      this.ws.on('close', () => {
        console.log('🔌 WebSocket连接已关闭');
        this.isConnected = false;
        this.attemptReconnect();
      });

    } catch (error) {
      console.error('❌ 设置WebSocket失败:', error);
    }
  }

  // 重连机制
  async attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(async () => {
        try {
          await this.setupWebSocket();
        } catch (error) {
          console.error('❌ 重连失败:', error);
        }
      }, 2000 * this.reconnectAttempts); // 递增延迟
    } else {
      console.error('❌ 达到最大重连次数，停止重连');
    }
  }

  // 订阅更多事件
  subscribeToEvents() {
    const subscriptions = [
      '/lol-gameflow/v1/session',
      '/lol-champ-select/v1/session',
      '/lol-matchmaking/v1/ready-check',
      '/lol-gameflow/v1/gameflow-phase',
      '/lol-chat/v1/me',
      '/lol-summoner/v1/current-summoner',
      '/lol-ranked/v1/current-ranked-stats'
    ];

    subscriptions.forEach(event => {
      if (this.ws && this.ws.readyState === 1) { // WebSocket.OPEN
        this.ws.send(JSON.stringify([5, event]));
      }
    });
  }

  // 改进的消息处理
  handleWebSocketMessage(message) {
    if (Array.isArray(message) && message.length >= 3) {
      const [, event, data] = message;
      
      switch (event) {
        case '/lol-gameflow/v1/session':
          this.handleGameSession(data);
          break;
        case '/lol-champ-select/v1/session':
          this.handleChampSelect(data);
          break;
        case '/lol-matchmaking/v1/ready-check':
          this.handleReadyCheck(data);
          break;
        case '/lol-gameflow/v1/gameflow-phase':
          this.handleGamePhase(data);
          break;
        case '/lol-chat/v1/me':
          this.handleChatUpdate(data);
          break;
        default:
          // 处理其他事件
          break;
      }
    }
  }

  // 处理游戏会话
  async handleGameSession(sessionData) {
    if (sessionData && sessionData.gameData) {
      this.gameData = sessionData.gameData;
      await this.getEnemyInfo();
    }
  }

  // 处理英雄选择
  async handleChampSelect(champSelectData) {
    if (champSelectData && champSelectData.myTeam && champSelectData.theirTeam) {
      // 获取更详细的英雄信息
      const enrichedData = await this.enrichChampSelectData(champSelectData);
      
      this.enemyInfo = {
        type: 'champ_select',
        theirTeam: enrichedData.theirTeam,
        myTeam: enrichedData.myTeam,
        timestamp: Date.now()
      };
      this.notifyListeners();
    }
  }

  // 获取英雄名称（使用DarkIntaqt的英雄ID对照表）
  getChampionNameById(championId) {
    const championMap = {
      266: 'Aatrox',
      103: 'Ahri',
      84: 'Akali',
      166: 'Akshan',
      12: 'Alistar',
      799: 'Ambessa',
      32: 'Amumu',
      34: 'Anivia',
      1: 'Annie',
      523: 'Aphelios',
      22: 'Ashe',
      136: 'Aurelion Sol',
      893: 'Aurora',
      268: 'Azir',
      432: 'Bard',
      200: 'Bel\'Veth',
      53: 'Blitzcrank',
      63: 'Brand',
      201: 'Braum',
      233: 'Briar',
      51: 'Caitlyn',
      164: 'Camille',
      69: 'Cassiopeia',
      31: 'Cho\'Gath',
      42: 'Corki',
      122: 'Darius',
      131: 'Diana',
      119: 'Draven',
      36: 'Dr. Mundo',
      245: 'Ekko',
      60: 'Elise',
      28: 'Evelynn',
      81: 'Ezreal',
      9: 'Fiddlesticks',
      114: 'Fiora',
      105: 'Fizz',
      3: 'Galio',
      41: 'Gangplank',
      86: 'Garen',
      150: 'Gnar',
      79: 'Gragas',
      104: 'Graves',
      887: 'Gwen',
      120: 'Hecarim',
      74: 'Heimerdinger',
      910: 'Hwei',
      420: 'Illaoi',
      39: 'Irelia',
      427: 'Ivern',
      40: 'Janna',
      59: 'Jarvan IV',
      24: 'Jax',
      126: 'Jayce',
      202: 'Jhin',
      203: 'Jinx',
      240: 'Kaisa',
      245: 'Kalista',
      90: 'Karma',
      164: 'Karthus',
      145: 'Kassadin',
      121: 'Katarina',
      516: 'Kayle',
      141: 'Kayn',
      85: 'Kennen',
      235: 'Kindred',
      246: 'Kled',
      96: 'Kog\'Maw',
      7: 'LeBlanc',
      64: 'Lee Sin',
      89: 'Leona',
      876: 'Lillia',
      127: 'Lissandra',
      236: 'Lucian',
      117: 'Lulu',
      99: 'Lux',
      54: 'Malphite',
      90: 'Malzahar',
      57: 'Maokai',
      11: 'Master Yi',
      902: 'Milio',
      21: 'Miss Fortune',
      62: 'Wukong',
      82: 'Mordekaiser',
      25: 'Morgana',
      267: 'Nami',
      75: 'Nasus',
      111: 'Nautilus',
      518: 'Neeko',
      76: 'Nidalee',
      56: 'Nocturne',
      20: 'Nunu & Willump',
      2: 'Olaf',
      61: 'Orianna',
      516: 'Ornn',
      80: 'Pantheon',
      78: 'Poppy',
      555: 'Pyke',
      246: 'Qiyana',
      133: 'Quinn',
      497: 'Rakan',
      33: 'Rammus',
      421: 'Rek\'Sai',
      526: 'Rell',
      888: 'Renata Glasc',
      58: 'Renekton',
      107: 'Rengar',
      92: 'Riven',
      68: 'Rumble',
      13: 'Ryze',
      360: 'Samira',
      113: 'Sejuani',
      235: 'Senna',
      147: 'Seraphine',
      875: 'Sett',
      35: 'Shaco',
      98: 'Shen',
      102: 'Shyvana',
      27: 'Singed',
      14: 'Sion',
      15: 'Sivir',
      72: 'Skarner',
      37: 'Sona',
      16: 'Soraka',
      50: 'Swain',
      517: 'Sylas',
      134: 'Syndra',
      223: 'Tahm Kench',
      163: 'Taliyah',
      91: 'Talon',
      44: 'Taric',
      17: 'Teemo',
      412: 'Thresh',
      18: 'Tristana',
      48: 'Trundle',
      23: 'Tryndamere',
      4: 'Twisted Fate',
      29: 'Twitch',
      77: 'Udyr',
      6: 'Urgot',
      110: 'Varus',
      67: 'Vayne',
      45: 'Veigar',
      161: 'Vel\'Koz',
      711: 'Vex',
      254: 'Vi',
      234: 'Viego',
      112: 'Viktor',
      8: 'Vladimir',
      106: 'Volibear',
      19: 'Warwick',
      498: 'Xayah',
      101: 'Xerath',
      5: 'Xin Zhao',
      157: 'Yasuo',
      777: 'Yone',
      83: 'Yorick',
      350: 'Yuumi',
      154: 'Zac',
      238: 'Zed',
      221: 'Zeri',
      115: 'Ziggs',
      26: 'Zilean',
      142: 'Zoe',
      143: 'Zyra'
    };
    
    const championName = championMap[championId];
    if (championName) {
      console.log(`🎯 英雄ID ${championId} 对应: ${championName}`);
      return championName;
    } else {
      console.log(`⚠️ 未找到英雄ID ${championId} 对应的名称`);
      return `未知英雄 (ID: ${championId})`;
    }
  }

  // 丰富英雄选择数据
  async enrichChampSelectData(champSelectData) {
    try {
      const enrichTeam = async (team) => {
        if (!team || !Array.isArray(team)) return [];
        
        return await Promise.all(team.map(async (player) => {
          let championName = '未选择';
          let championTitle = '';
          let championIcon = '';
          
          // 获取玩家名称，优先使用gameName字段
          const playerName = player.gameName || player.summonerName || player.displayName || '未知玩家';
          
          if (player.championId) {
            try {
              championName = this.getChampionNameById(player.championId);
            } catch (error) {
              console.log(`⚠️ 获取英雄名称失败 (ID: ${player.championId}):`, error.message);
              championName = `英雄ID: ${player.championId}`;
            }
          }
          
          // 获取召唤师技能信息
          let summonerSpells = { spell1: '未选择', spell2: '未选择' };
          let spell1Id = null;
          let spell2Id = null;
          
          try {
            console.log(`🎯 开始获取玩家 ${playerName} 的召唤师技能...`);
            console.log(`🎯 玩家原始数据:`, player);
            
            // 方法1: 检查玩家对象本身是否包含技能信息（最直接的方法）
            spell1Id = player.spell1Id;
            spell2Id = player.spell2Id;
            console.log(`🎯 方法1 - 从玩家对象获取技能 (${playerName}):`, { spell1Id, spell2Id });
            
            // 方法2: 如果玩家对象没有技能信息，尝试从英雄选择会话中获取
            if (!spell1Id && !spell2Id && player.summonerId) {
              console.log(`🎯 方法2 - 尝试从英雄选择会话获取技能 (${playerName})...`);
              const champSelectResponse = await this.makeRequest('/lol-champ-select/v1/session');
              if (champSelectResponse.ok) {
                const champSelectData = await champSelectResponse.json();
                console.log('🎯 英雄选择会话数据:', champSelectData);
                
                // 查找当前玩家的技能信息
                const allPlayers = [...(champSelectData.myTeam || []), ...(champSelectData.theirTeam || [])];
                const currentPlayer = allPlayers.find(p => p.summonerId === player.summonerId);
                
                if (currentPlayer) {
                  spell1Id = currentPlayer.spell1Id;
                  spell2Id = currentPlayer.spell2Id;
                  
                  console.log(`🎯 方法2 - 从会话中找到玩家 ${playerName} 的技能:`, { spell1Id, spell2Id });
                } else {
                  console.log(`🎯 方法2 - 未在会话中找到玩家 ${playerName}`);
                }
              }
            }
            
            // 方法3: 如果还是没有，尝试从召唤师信息获取
            if (!spell1Id && !spell2Id && player.summonerId) {
              console.log(`🎯 方法3 - 尝试从召唤师信息获取技能 (${playerName})...`);
              const summonerResponse = await this.makeRequest(`/lol-summoner/v1/summoners/${player.summonerId}`);
              if (summonerResponse.ok) {
                const summonerData = await summonerResponse.json();
                console.log(`🎯 召唤师数据 (${playerName}):`, summonerData);
                
                spell1Id = summonerData.spell1Id;
                spell2Id = summonerData.spell2Id;
                console.log(`🎯 方法3 - 从召唤师信息获取技能 (${playerName}):`, { spell1Id, spell2Id });
              }
            }
            
            // 方法4: 尝试从actions中获取技能信息
            if (!spell1Id && !spell2Id) {
              console.log(`🎯 方法4 - 尝试从actions获取技能信息 (${playerName})...`);
              // 重新获取英雄选择会话数据来访问actions
              const champSelectResponse = await this.makeRequest('/lol-champ-select/v1/session');
              if (champSelectResponse.ok) {
                const sessionData = await champSelectResponse.json();
                if (sessionData.actions) {
                  console.log('🎯 从actions获取技能信息...');
                  for (const actionGroup of sessionData.actions) {
                    for (const action of actionGroup) {
                      if (action.summonerId === player.summonerId) {
                        spell1Id = action.spell1Id;
                        spell2Id = action.spell2Id;
                        console.log(`🎯 方法4 - 从actions找到玩家 ${playerName} 的技能:`, { spell1Id, spell2Id });
                        break;
                      }
                    }
                    if (spell1Id || spell2Id) break;
                  }
                }
              }
            }
            
            // 方法5: 尝试从当前召唤师信息获取默认技能
            if (!spell1Id && !spell2Id) {
              console.log(`🎯 方法5 - 尝试获取默认召唤师技能 (${playerName})...`);
              try {
                const currentSummonerResponse = await this.makeRequest('/lol-summoner/v1/current-summoner');
                if (currentSummonerResponse.ok) {
                  const currentSummoner = await currentSummonerResponse.json();
                  console.log(`🎯 当前召唤师信息:`, currentSummoner);
                  
                  // 如果当前召唤师ID匹配，使用其技能
                  if (currentSummoner.summonerId === player.summonerId) {
                    spell1Id = currentSummoner.spell1Id;
                    spell2Id = currentSummoner.spell2Id;
                    console.log(`🎯 方法5 - 从当前召唤师获取技能 (${playerName}):`, { spell1Id, spell2Id });
                  }
                }
              } catch (error) {
                console.log(`🎯 方法5 - 获取当前召唤师信息失败:`, error.message);
              }
            }
            
            // 更新召唤师技能信息
            summonerSpells = {
              spell1: spell1Id ? this.getSummonerSpellName(spell1Id) : '未选择',
              spell2: spell2Id ? this.getSummonerSpellName(spell2Id) : '未选择'
            };
            
            console.log(`🎯 最终技能信息 (${playerName}):`, summonerSpells);
            console.log(`🎯 技能ID (${playerName}):`, { spell1Id, spell2Id });
            console.log(`🎯 技能名称映射 (${playerName}):`, {
              spell1: spell1Id ? `${spell1Id} -> ${summonerSpells.spell1}` : 'null',
              spell2: spell2Id ? `${spell2Id} -> ${summonerSpells.spell2}` : 'null'
            });
          } catch (error) {
            console.log(`⚠️ 获取召唤师技能失败 (玩家: ${playerName}):`, error.message);
          }
          
          return {
            ...player,
            playerName, // 添加标准化的玩家名称
            summonerName: playerName, // 确保summonerName字段存在
            championName,
            championTitle,
            championIcon,
            summonerSpells,
            spell1Id,
            spell2Id
          };
        }));
      };

      const theirTeam = await enrichTeam(champSelectData.theirTeam);
      const myTeam = await enrichTeam(champSelectData.myTeam);
      
      console.log('🎯 丰富后的敌方队伍:', theirTeam);
      console.log('🎯 丰富后的我方队伍:', myTeam);

      return {
        theirTeam,
        myTeam
      };
    } catch (error) {
      console.error('❌ 丰富英雄数据失败:', error);
      return champSelectData;
    }
  }

  // 处理准备检查
  handleReadyCheck(readyCheckData) {
    console.log('🎮 准备检查:', readyCheckData);
  }

  // 处理游戏阶段
  handleGamePhase(phase) {
    console.log('🎯 游戏阶段:', phase);
  }

  // 处理聊天更新
  handleChatUpdate(chatData) {
    console.log('💬 聊天更新:', chatData);
  }

  // 获取敌方信息
  async getEnemyInfo() {
    try {
      console.log('⚔️ 开始获取游戏中的敌方信息...');
      const gameResponse = await this.makeRequest('/lol-gameflow/v1/session');
      if (gameResponse.ok) {
        const gameData = await gameResponse.json();
        console.log('🎮 游戏会话数据:', gameData);
        
        if (gameData.gameData && gameData.gameData.gameId) {
          console.log('🎮 游戏ID:', gameData.gameData.gameId);
          const gameDetailsResponse = await this.makeRequest(`/lol-gameflow/v1/games/${gameData.gameData.gameId}`);
          if (gameDetailsResponse.ok) {
            const gameDetails = await gameDetailsResponse.json();
            console.log('🎮 游戏详情数据:', gameDetails);
            
            const enemyTeam = gameDetails.participants?.filter(p => p.teamId !== gameData.myTeam?.teamId) || [];
            const myTeam = gameDetails.participants?.filter(p => p.teamId === gameData.myTeam?.teamId) || [];
            
            console.log('👥 敌方队伍数量:', enemyTeam.length);
            console.log('👥 我方队伍数量:', myTeam.length);
            
            // 丰富英雄信息
            const enrichedEnemyTeam = await this.enrichGameParticipants(enemyTeam);
            const enrichedMyTeam = await this.enrichGameParticipants(myTeam);
            
            this.enemyInfo = {
              type: 'in_progress', // 修正类型名
              theirTeam: enrichedEnemyTeam, // 修正字段名
              myTeam: enrichedMyTeam,
              rawData: gameDetails, // 保存原始数据
              timestamp: Date.now()
            };
            
            console.log('✅ 设置游戏中的enemyInfo:', this.enemyInfo);
            this.notifyListeners();
          } else {
            console.log('⚠️ 获取游戏详情失败');
            // 设置空状态
            this.enemyInfo = {
              type: 'in_progress',
              theirTeam: [],
              myTeam: [],
              rawData: null,
              timestamp: Date.now()
            };
            this.notifyListeners();
          }
        } else {
          console.log('⚠️ 游戏数据不完整，可能不在游戏中');
          // 设置空状态
          this.enemyInfo = {
            type: 'in_progress',
            theirTeam: [],
            myTeam: [],
            rawData: null,
            timestamp: Date.now()
          };
          this.notifyListeners();
        }
      } else {
        console.log('⚠️ 获取游戏会话失败');
        // 设置空状态
        this.enemyInfo = {
          type: 'in_progress',
          theirTeam: [],
          myTeam: [],
          rawData: null,
          timestamp: Date.now()
        };
        this.notifyListeners();
      }
    } catch (error) {
      console.error('❌ 获取敌方信息失败:', error);
      // 错误时也设置空状态
      this.enemyInfo = {
        type: 'in_progress',
        theirTeam: [],
        myTeam: [],
        rawData: null,
        timestamp: Date.now()
      };
      this.notifyListeners();
    }
  }

  // 丰富游戏参与者信息
  async enrichGameParticipants(participants) {
    try {
      return await Promise.all(participants.map(async (player) => {
        let championName = '未知英雄';
        let championTitle = '';
        let championIcon = '';
        
        // 获取玩家名称，优先使用gameName字段
        const playerName = player.gameName || player.summonerName || player.displayName || '未知玩家';
        
        if (player.championId) {
          try {
            // 尝试从多个端点获取英雄信息
            const championResponse = await this.makeRequest(`/lol-champions/v1/inventories/${player.championId}`);
            if (championResponse.ok) {
              const championData = await championResponse.json();
              championName = championData.name || championData.displayName || '未知英雄';
              championTitle = championData.title || '';
              championIcon = championData.squarePortraitPath || '';
            } else {
              // 备用方案：使用本地英雄ID映射
              championName = this.getChampionNameById(player.championId);
            }
          } catch (error) {
            console.log(`⚠️ 获取英雄信息失败 (ID: ${player.championId}):`, error.message);
            championName = this.getChampionNameById(player.championId);
          }
        }
        
        return {
          ...player,
          playerName, // 添加标准化的玩家名称
          summonerName: playerName, // 确保summonerName字段存在
          championName,
          championTitle,
          championIcon,
          // 添加更多游戏中的信息
          summonerSpells: {
            spell1: player.spell1Id ? this.getSummonerSpellName(player.spell1Id) : '未知',
            spell2: player.spell2Id ? this.getSummonerSpellName(player.spell2Id) : '未知'
          },
          spell1Id: player.spell1Id, // 添加技能ID
          spell2Id: player.spell2Id, // 添加技能ID
          runes: player.perks ? this.parseRunes(player.perks) : null,
          items: player.items || [],
          cs: player.stats?.cs || 0,
          kills: player.stats?.kills || 0,
          deaths: player.stats?.deaths || 0,
          assists: player.stats?.assists || 0,
          gold: player.stats?.gold || 0,
          level: player.stats?.level || 1
        };
      }));
    } catch (error) {
      console.error('❌ 丰富参与者信息失败:', error);
      return participants;
    }
  }

  // 获取召唤师技能名称（使用DataDragon和DarkIntaqt的官方数据）
  getSummonerSpellName(spellId) {
    const spellMap = {
      // 主要召唤师技能 - 使用正确的ID映射
      21: '屏障', // SummonerBarrier
      1: '净化', // SummonerBoost (Cleanse)
      14: '点燃', // SummonerDot (Ignite)
      3: '治疗术', // SummonerFlash
      6: '幽灵疾步', // SummonerHaste (Ghost) - 修正
      4: '闪现', // SummonerHeal - 修正
      7: '清晰术', // SummonerMana
      11: '惩戒', // SummonerSmite
      12: '传送', // SummonerTeleport
      13: '洞察', // SummonerClarity
      32: '标记', // SummonerSnowball (Mark)
      
      // 其他召唤师技能
      39: '标记', // SummonerSnowURFSnowball_Mark
      2201: '逃跑', // SummonerCherryHold (Flee)
      2202: '闪现', // SummonerCherryFlash (Flash)
      54: '占位符', // Summoner_UltBookPlaceholder
      55: '占位符惩戒', // Summoner_UltBookSmitePlaceholder
      
      // 未知技能ID的映射
      0: '未知技能',
      2: '未知技能',
      5: '未知技能',
      8: '未知技能',
      9: '未知技能',
      10: '未知技能',
      15: '未知技能',
      16: '未知技能',
      17: '未知技能',
      18: '未知技能',
      19: '未知技能',
      20: '未知技能',
      22: '未知技能',
      23: '未知技能',
      24: '未知技能',
      25: '未知技能',
      26: '未知技能',
      27: '未知技能',
      28: '未知技能',
      29: '未知技能',
      30: '未知技能',
      31: '未知技能',
      33: '未知技能',
      34: '未知技能',
      35: '未知技能',
      36: '未知技能',
      37: '未知技能',
      38: '未知技能',
      40: '未知技能',
      41: '未知技能',
      42: '未知技能',
      43: '未知技能',
      44: '未知技能',
      45: '未知技能',
      46: '未知技能',
      47: '未知技能',
      48: '未知技能',
      49: '未知技能',
      50: '未知技能',
      51: '未知技能',
      52: '未知技能',
      53: '未知技能',
      56: '未知技能',
      57: '未知技能',
      58: '未知技能',
      59: '未知技能',
      60: '未知技能',
      61: '未知技能',
      62: '未知技能',
      63: '未知技能',
      64: '未知技能',
      65: '未知技能',
      66: '未知技能',
      67: '未知技能',
      68: '未知技能',
      69: '未知技能',
      70: '未知技能',
      71: '未知技能',
      72: '未知技能',
      73: '未知技能',
      74: '未知技能',
      75: '未知技能',
      76: '未知技能',
      77: '未知技能',
      78: '未知技能',
      79: '未知技能',
      80: '未知技能',
      81: '未知技能',
      82: '未知技能',
      83: '未知技能',
      84: '未知技能',
      85: '未知技能',
      86: '未知技能',
      87: '未知技能',
      88: '未知技能',
      89: '未知技能',
      90: '未知技能',
      91: '未知技能',
      92: '未知技能',
      93: '未知技能',
      94: '未知技能',
      95: '未知技能',
      96: '未知技能',
      97: '未知技能',
      98: '未知技能',
      99: '未知技能',
      100: '未知技能'
    };
    
    const spellName = spellMap[spellId];
    if (spellName) {
      console.log(`🎯 召唤师技能ID ${spellId} 对应: ${spellName}`);
      return spellName;
    } else {
      console.log(`⚠️ 未找到召唤师技能ID ${spellId} 对应的名称`);
      return `技能${spellId}`;
    }
  }

  // 解析符文信息
  parseRunes(perks) {
    try {
      if (!perks || !perks.perkIds) return null;
      
      const primaryStyle = perks.perkIds[0];
      const subStyle = perks.perkIds[5];
      
      return {
        primaryStyle,
        subStyle,
        perkIds: perks.perkIds
      };
    } catch (error) {
      console.error('❌ 解析符文失败:', error);
      return null;
    }
  }

  // 获取当前召唤师信息
  async getCurrentSummoner() {
    try {
      const response = await this.makeRequest('/lol-summoner/v1/current-summoner');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('❌ 获取召唤师信息失败:', error);
    }
    return null;
  }

  // 获取游戏状态
  async getGameStatus() {
    try {
      const response = await this.makeRequest('/lol-gameflow/v1/session');
      if (response.ok) {
        const gameStatus = await response.json();
        console.log('🎮 完整游戏状态数据:', gameStatus);
        
        // 检查并处理playerChampionSelections字段
        if (gameStatus.playerChampionSelections) {
          console.log('🎯 英雄选择映射:', gameStatus.playerChampionSelections);
          await this.processChampionSelections(gameStatus.playerChampionSelections);
        }
        
        // 检查游戏数据
        if (gameStatus.gameData) {
          console.log('🎯 游戏数据:', gameStatus.gameData);
        }
        
        // 检查参与者信息
        if (gameStatus.gameData && gameStatus.gameData.participants) {
          console.log('👥 参与者信息:', gameStatus.gameData.participants);
        }
        
        return gameStatus;
      }
    } catch (error) {
      console.error('❌ 获取游戏状态失败:', error);
    }
    return null;
  }

  // 处理英雄选择映射
  async processChampionSelections(championSelections) {
    try {
      console.log('🎯 处理英雄选择映射...');
      
      // 遍历所有英雄选择
      for (const [playerId, championId] of Object.entries(championSelections)) {
        const championName = this.getChampionNameById(championId);
        console.log(`👤 玩家 ${playerId} 选择了 ${championName} (ID: ${championId})`);
      }
      
      // 如果当前在英雄选择阶段，更新信息
      if (this.enemyInfo && this.enemyInfo.type === 'champ_select') {
        // 更新现有数据中的英雄信息
        this.updateChampionSelections(championSelections);
      }
    } catch (error) {
      console.error('❌ 处理英雄选择映射失败:', error);
    }
  }

  // 更新英雄选择信息
  updateChampionSelections(championSelections) {
    try {
      if (!this.enemyInfo) return;
      
      // 更新我方队伍
      if (this.enemyInfo.myTeam) {
        this.enemyInfo.myTeam = this.enemyInfo.myTeam.map(player => {
          if (player.summonerId && championSelections[player.summonerId]) {
            const championId = championSelections[player.summonerId];
            return {
              ...player,
              championId,
              championName: this.getChampionNameById(championId)
            };
          }
          return player;
        });
      }
      
      // 更新敌方队伍
      if (this.enemyInfo.theirTeam) {
        this.enemyInfo.theirTeam = this.enemyInfo.theirTeam.map(player => {
          if (player.summonerId && championSelections[player.summonerId]) {
            const championId = championSelections[player.summonerId];
            return {
              ...player,
              championId,
              championName: this.getChampionNameById(championId)
            };
          }
          return player;
        });
      }
      
      // 通知监听器更新
      this.notifyListeners();
      console.log('✅ 英雄选择信息已更新');
    } catch (error) {
      console.error('❌ 更新英雄选择信息失败:', error);
    }
  }

  // 获取英雄选择信息
  async getChampSelectInfo() {
    try {
      const response = await this.makeRequest('/lol-champ-select/v1/session');
      if (response.ok) {
        const data = await response.json();
        console.log('🎯 英雄选择完整数据:', data);
        
        if (data) {
          // 检查所有可能的字段
          console.log('📊 数据字段检查:');
          console.log('- myTeam:', data.myTeam);
          console.log('- theirTeam:', data.theirTeam);
          console.log('- actions:', data.actions);
          console.log('- bans:', data.bans);
          console.log('- chatDetails:', data.chatDetails);
          console.log('- isSpectating:', data.isSpectating);
          console.log('- localPlayerCellId:', data.localPlayerCellId);
          console.log('- timer:', data.timer);
          
          // 即使没有队伍信息，也设置基本数据
          let theirTeam = [];
          let myTeam = [];
          
          if (data.myTeam || data.theirTeam) {
            const enrichedData = await this.enrichChampSelectData(data);
            theirTeam = enrichedData.theirTeam || [];
            myTeam = enrichedData.myTeam || [];
          } else {
            console.log('⚠️ 未找到队伍信息，设置空数据');
          }
          
          console.log('👥 处理后的敌方队伍:', theirTeam);
          console.log('👥 处理后的我方队伍:', myTeam);
          
          this.enemyInfo = {
            type: 'champ_select',
            theirTeam,
            myTeam,
            rawData: data, // 保存原始数据用于调试
            timestamp: Date.now()
          };
          
          console.log('✅ 设置enemyInfo:', this.enemyInfo);
          this.notifyListeners();
        } else {
          console.log('⚠️ 英雄选择数据为空');
          // 即使数据为空，也设置一个空的状态
          this.enemyInfo = {
            type: 'champ_select',
            theirTeam: [],
            myTeam: [],
            rawData: null,
            timestamp: Date.now()
          };
          this.notifyListeners();
        }
      } else {
        console.log('⚠️ 英雄选择请求失败');
        // 请求失败时也设置空状态
        this.enemyInfo = {
          type: 'champ_select',
          theirTeam: [],
          myTeam: [],
          rawData: null,
          timestamp: Date.now()
        };
        this.notifyListeners();
      }
    } catch (error) {
      console.error('❌ 获取英雄选择信息失败:', error);
      // 错误时也设置空状态
      this.enemyInfo = {
        type: 'champ_select',
        theirTeam: [],
        myTeam: [],
        rawData: null,
        timestamp: Date.now()
      };
      this.notifyListeners();
    }
  }

  // 新增：处理当前游戏状态的方法
  async processCurrentGameState() {
    try {
      const gameStatus = await this.getGameStatus();
      console.log('🎮 当前游戏状态:', gameStatus);
      
      if (gameStatus) {
        console.log(`🎯 当前游戏阶段: ${gameStatus.phase}`);
        this.lastGamePhase = gameStatus.phase;
        
        // 根据游戏阶段立即获取相应信息
        switch (gameStatus.phase) {
          case 'ChampSelect':
            console.log('🎯 检测到英雄选择阶段，立即获取英雄选择信息...');
            await this.getChampSelectInfo();
            break;
          case 'InProgress':
            console.log('⚔️ 检测到游戏进行中，立即获取游戏信息...');
            await this.getEnemyInfo();
            break;
          case 'None':
            console.log('🏠 在客户端大厅，清空游戏信息');
            this.enemyInfo = null;
            this.notifyListeners();
            break;
          default:
            console.log(`📝 当前阶段: ${gameStatus.phase}，尝试获取英雄选择信息...`);
            // 即使不是主要阶段，也尝试获取信息
            if (gameStatus.phase !== 'None') {
              await this.getChampSelectInfo();
            }
        }
      } else {
        console.log('⚠️ 无法获取游戏状态');
        // 即使无法获取游戏状态，也通知监听器当前状态
        this.enemyInfo = null;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('❌ 处理当前游戏状态失败:', error);
      // 错误时也通知监听器
      this.enemyInfo = null;
      this.notifyListeners();
    }
  }

  // 简化的数据获取方法 - 只在需要时调用
  async refreshGameData() {
    console.log('🔄 手动刷新游戏数据...');
    await this.processCurrentGameState();
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
    console.log('📡 通知监听器，当前enemyInfo:', this.enemyInfo);
    console.log('📡 监听器数量:', this.listeners.length);
    console.log('📡 监听器列表:', this.listeners.map((_, index) => `监听器${index + 1}`));
    
    if (this.listeners.length === 0) {
      console.log('⚠️ 没有注册的监听器');
      return;
    }
    
    // 即使数据为空也通知，让UI知道状态
    if (!this.enemyInfo) {
      console.log('⚠️ enemyInfo为空，通知空状态');
      this.listeners.forEach((callback, index) => {
        try {
          console.log(`📡 调用监听器 ${index + 1}/${this.listeners.length} (空状态)`);
          callback(null);
          console.log(`✅ 监听器 ${index + 1} 调用成功 (空状态)`);
        } catch (error) {
          console.error(`❌ 监听器 ${index + 1} 回调错误:`, error);
        }
      });
      return;
    }
    
    this.listeners.forEach((callback, index) => {
      try {
        console.log(`📡 调用监听器 ${index + 1}/${this.listeners.length}`);
        console.log(`📡 传递的数据类型:`, typeof this.enemyInfo);
        console.log(`📡 传递的数据:`, this.enemyInfo);
        console.log(`📡 数据时间戳:`, this.enemyInfo.timestamp);
        console.log(`📡 数据类型:`, this.enemyInfo.type);
        
        // 确保传递的是数据的副本，避免引用问题
        const dataCopy = JSON.parse(JSON.stringify(this.enemyInfo));
        callback(dataCopy);
        
        console.log(`✅ 监听器 ${index + 1} 调用成功`);
      } catch (error) {
        console.error(`❌ 监听器 ${index + 1} 回调错误:`, error);
        console.error(`❌ 错误详情:`, error.stack);
      }
    });
  }

  // 断开连接
  disconnect() {
    this.isConnected = false;
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.connectionStatus = {
      isConnected: false,
      baseUrl: null,
      port: null,
      hasPassword: false,
      error: null
    };
    
    this.baseUrl = null;
    this.port = null;
    this.password = null;
    this.gameData = null;
    this.enemyInfo = null;
    this.lastGamePhase = null;
    
    console.log('🔌 LCU连接已断开');
  }

  // 获取连接状态
  getConnectionStatus() {
    return this.connectionStatus;
  }
}

const lcuService = new LCUService();
export default lcuService; 