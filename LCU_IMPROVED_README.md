# 英雄联盟LCU监控功能 - 改进版

## 🎯 功能概述

基于[Riot API Libraries](https://riot-api-libraries.readthedocs.io/en/latest/)和[lol-helper](https://github.com/za123/lol-helper)项目的最佳实践，我们改进了LCU (League Client Update) API监控功能，提供更稳定、更强大的英雄联盟游戏数据获取能力。

## 🚀 主要改进

### 1. 更稳定的进程检测
- ✅ 多种命令尝试：`wmic`、`tasklist`、PowerShell命令
- ✅ 备用方案：通过lockfile文件检测
- ✅ 更好的错误处理和重试机制
- ✅ 详细的调试日志输出

### 2. 增强的连接管理
- ✅ 自动重连机制（最多3次重试）
- ✅ 连接状态实时监控
- ✅ 详细的错误信息显示
- ✅ 超时处理（10秒）

### 3. 更完善的API支持
- ✅ 更多WebSocket事件订阅
- ✅ 英雄数据丰富化
- ✅ 轮询检查机制
- ✅ 更好的数据格式化

### 4. 改进的用户界面
- ✅ 实时状态指示器
- ✅ 详细的错误信息显示
- ✅ 更好的视觉反馈
- ✅ 响应式设计

## 📋 使用说明

### 环境要求
- Windows 10/11
- 英雄联盟客户端正在运行
- 以管理员权限运行应用（推荐）

### 启动步骤
1. 启动英雄联盟客户端
2. 运行应用：`npm run electron-dev`
3. 切换到"游戏监控"标签页
4. 点击"🔗 连接到LCU"按钮
5. 等待连接成功

### 功能特性

#### 连接状态监控
- 实时显示连接状态
- 端口和认证信息
- 详细的错误信息
- 自动重连提示

#### 召唤师信息
- 当前召唤师名称
- 召唤师等级
- 召唤师ID

#### 游戏状态监控
- 当前游戏阶段
- 游戏ID
- 队列类型
- 实时状态更新

#### 敌方信息获取
- 英雄选择阶段敌方队伍
- 游戏中敌方队伍
- 英雄名称和图标
- 位置信息

## 🔧 技术实现

### 进程检测方法
```javascript
// 主要方法：命令行检测
const commands = [
  'wmic PROCESS WHERE name="LeagueClientUx.exe" GET commandline /format:list',
  'tasklist /FI "IMAGENAME eq LeagueClientUx.exe" /FO CSV',
  'Get-Process LeagueClientUx -ErrorAction SilentlyContinue'
];

// 备用方法：lockfile检测
const lockfilePaths = [
  path.join(os.homedir(), 'AppData', 'Roaming', 'League of Legends', 'lockfile'),
  path.join(os.homedir(), 'AppData', 'Local', 'Riot Games', 'League of Legends', 'lockfile')
];
```

### API端点支持
- `/lol-summoner/v1/current-summoner` - 召唤师信息
- `/lol-gameflow/v1/session` - 游戏会话
- `/lol-champ-select/v1/session` - 英雄选择
- `/lol-champions/v1/owned-champions-minimal` - 英雄数据
- `/lol-matchmaking/v1/ready-check` - 准备检查
- `/lol-chat/v1/me` - 聊天信息
- `/lol-ranked/v1/current-ranked-stats` - 排位信息

### WebSocket事件
```javascript
const subscriptions = [
  '/lol-gameflow/v1/session',
  '/lol-champ-select/v1/session',
  '/lol-matchmaking/v1/ready-check',
  '/lol-gameflow/v1/gameflow-phase',
  '/lol-chat/v1/me',
  '/lol-summoner/v1/current-summoner',
  '/lol-ranked/v1/current-ranked-stats'
];
```

## 📊 数据格式

### 连接状态
```javascript
{
  isConnected: boolean,
  baseUrl: string,
  port: string,
  hasPassword: boolean,
  error: string | null
}
```

### 敌方信息
```javascript
{
  type: 'champ_select' | 'in_game',
  theirTeam: [
    {
      summonerName: string,
      championId: number,
      championName: string,
      championTitle: string,
      championIcon: string,
      assignedPosition: string,
      level: number,
      rank: { tier: string, division: string }
    }
  ],
  myTeam: [...],
  timestamp: number
}
```

### 召唤师信息
```javascript
{
  displayName: string,
  summonerLevel: number,
  summonerId: number,
  accountId: number,
  puuid: string
}
```

## ⚠️ 注意事项

### 安全提醒
1. **仅用于学习目的**：此功能仅用于学习和研究LCU API
2. **遵守游戏规则**：使用第三方工具可能违反游戏服务条款
3. **风险自负**：使用此功能的风险由用户自行承担
4. **不要用于作弊**：严禁用于任何形式的游戏作弊

### 技术限制
1. **SSL证书**：LCU使用自签名证书，已自动处理
2. **进程检测**：需要LeagueClientUx.exe进程运行
3. **端口动态**：LCU端口每次启动都会变化
4. **认证令牌**：需要从进程参数中提取认证令牌
5. **权限要求**：可能需要管理员权限

## 🛠️ 故障排除

### 常见问题

#### 1. 连接失败
**症状**：显示"未找到英雄联盟客户端进程"
**解决方案**：
- 确保英雄联盟客户端正在运行
- 以管理员权限运行应用
- 检查防火墙设置
- 重启英雄联盟客户端

#### 2. SSL证书错误
**症状**：显示SSL相关错误
**解决方案**：
- 已在新版本中自动处理
- 使用HTTPS Agent忽略证书验证

#### 3. 端口被占用
**症状**：显示端口3000被占用
**解决方案**：
```bash
# 查找占用端口的进程
netstat -ano | findstr :3000

# 终止进程
taskkill /PID <进程ID> /F
```

#### 4. 模块未找到
**症状**：显示node-fetch、child_process等模块错误
**解决方案**：
- 确保安装了所有依赖：`npm install`
- 检查Node.js版本兼容性
- 重启开发服务器

### 调试模式
在浏览器控制台中查看详细日志：
```javascript
// 查看连接状态
console.log(lcuService.getConnectionStatus());

// 查看敌方信息
console.log(lcuService.enemyInfo);

// 查看WebSocket状态
console.log(lcuService.ws?.readyState);
```

### 日志级别
- 🔍 信息：进程检测和连接过程
- ✅ 成功：连接成功和数据获取
- ❌ 错误：连接失败和API错误
- 🔄 重连：WebSocket重连尝试
- 🎮 游戏：游戏状态更新

## 🔮 未来计划

- [ ] 添加英雄图标显示
- [ ] 集成OP.GG数据
- [ ] 添加胜率统计
- [ ] 支持多语言
- [ ] 添加数据导出功能
- [ ] 优化UI/UX设计
- [ ] 添加更多游戏模式支持
- [ ] 实现数据缓存机制

## 📞 技术支持

如果遇到问题，请按以下顺序检查：

1. **控制台错误信息**：查看详细的错误日志
2. **网络连接状态**：确保网络连接正常
3. **英雄联盟客户端版本**：确保使用最新版本
4. **系统权限设置**：尝试以管理员权限运行
5. **防火墙设置**：检查防火墙是否阻止连接

## 📚 参考资料

- [Riot API Libraries Documentation](https://riot-api-libraries.readthedocs.io/en/latest/)
- [lol-helper GitHub项目](https://github.com/za123/lol-helper)
- [League of Legends Client API](https://developer.riotgames.com/docs/lol)
- [LCU WebSocket API](https://riot-api-libraries.readthedocs.io/en/latest/lcu.html)

---

**免责声明**：此工具仅用于学习和研究目的，使用者需自行承担使用风险，开发者不承担任何法律责任。 