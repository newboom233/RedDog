# 英雄联盟LCU监控功能说明

## 🎯 功能概述

这个应用集成了英雄联盟LCU (League Client Update) API监控功能，可以实时获取游戏状态和敌方信息。

## 🚀 当前功能

### 1. 演示模式 (当前启用)
- ✅ 模拟LCU连接
- ✅ 模拟英雄选择阶段
- ✅ 模拟游戏进行中状态
- ✅ 显示敌方队伍信息
- ✅ 显示召唤师信息
- ✅ 实时状态更新

### 2. 真实LCU模式 (需要配置)
- 🔧 连接真实英雄联盟客户端
- 🔧 获取真实游戏数据
- 🔧 实时WebSocket监听
- 🔧 敌方英雄和召唤师信息

## 📋 使用说明

### 演示模式使用
1. 启动应用：`npm run electron-dev`
2. 切换到"游戏监控"标签页
3. 点击"连接到LCU"按钮
4. 等待2秒后显示英雄选择阶段
5. 等待8秒后显示游戏进行中状态

### 真实LCU模式使用 (高级)
1. 确保英雄联盟客户端正在运行
2. 修改 `src/components/LCUMonitor.js` 中的导入：
   ```javascript
   // 从演示模式切换到真实模式
   import lcuService from '../services/lcuService';  // 真实模式
   // import lcuService from '../services/lcuServiceDemo';  // 演示模式
   ```
3. 启动应用并连接

## 🔧 技术实现

### LCU API 端点
- `/lol-summoner/v1/current-summoner` - 当前召唤师信息
- `/lol-gameflow/v1/session` - 游戏会话状态
- `/lol-champ-select/v1/session` - 英雄选择阶段
- `/lol-matchmaking/v1/ready-check` - 准备检查

### WebSocket 事件
- 游戏状态变化
- 英雄选择更新
- 准备检查状态

## 📊 数据格式

### 敌方信息格式
```javascript
{
  type: 'champ_select' | 'in_game',
  theirTeam: [
    {
      summonerName: '玩家名称',
      championId: 103,  // 英雄ID
      championName: '阿狸',  // 英雄名称
      assignedPosition: 'MIDDLE',  // 位置
      level: 18,  // 等级
      rank: { tier: 'GOLD', division: 'II' }  // 段位
    }
  ],
  timestamp: 1234567890
}
```

### 召唤师信息格式
```javascript
{
  displayName: '召唤师名称',
  summonerLevel: 30,
  summonerId: 123456789
}
```

## ⚠️ 注意事项

### 安全提醒
1. **仅用于学习目的**：此功能仅用于学习和研究LCU API
2. **遵守游戏规则**：使用第三方工具可能违反游戏服务条款
3. **风险自负**：使用此功能的风险由用户自行承担

### 技术限制
1. **SSL证书**：LCU使用自签名证书，需要特殊处理
2. **进程检测**：需要检测LeagueClientUx.exe进程
3. **端口动态**：LCU端口每次启动都会变化
4. **认证令牌**：需要从进程参数中提取认证令牌

## 🛠️ 故障排除

### 常见问题
1. **连接失败**
   - 确保英雄联盟客户端正在运行
   - 检查防火墙设置
   - 确认端口和认证信息正确

2. **SSL证书错误**
   - 已在新版本中修复
   - 使用HTTPS Agent忽略证书验证

3. **模块未找到**
   - 确保安装了所有依赖
   - 检查Node.js版本兼容性

### 调试模式
在浏览器控制台中查看详细日志：
```javascript
// 查看连接状态
console.log(lcuService.getConnectionStatus());

// 查看敌方信息
console.log(lcuService.enemyInfo);
```

## 🔮 未来计划

- [ ] 添加英雄图标显示
- [ ] 集成OP.GG数据
- [ ] 添加胜率统计
- [ ] 支持多语言
- [ ] 添加数据导出功能
- [ ] 优化UI/UX设计

## 📞 技术支持

如果遇到问题，请检查：
1. 控制台错误信息
2. 网络连接状态
3. 英雄联盟客户端版本
4. 系统权限设置

---

**免责声明**：此工具仅用于学习和研究目的，使用前请确保遵守相关法律法规和游戏服务条款。 