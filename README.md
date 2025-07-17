# RedDog App

一个基于 React 和 Electron 的现代化桌面应用程序。

## 🚀 功能特性

- ✅ React 18 支持
- ✅ Electron 25 支持
- ✅ 现代化 UI 设计
- ✅ 跨平台支持 (Windows, macOS, Linux)
- ✅ 热重载开发
- ✅ 应用打包
- ✅ 响应式设计
- ✅ 英雄联盟LCU监控 (演示模式)

## 📦 安装

```bash
# 安装依赖
npm install
```

## 🛠️ 开发

```bash
# 需要管理员权限运行，不然无法获取进程启动参数
# 启动开发模式 (同时启动 React 开发服务器和 Electron)
npm run electron-dev

# 或者分别启动
npm start          # 启动 React 开发服务器
npm run electron   # 启动 Electron
```

## 📱 打包

```bash
# 构建生产版本并打包
npm run dist

# 或者分步执行
npm run build      # 构建 React 应用
npm run electron-pack  # 打包 Electron 应用
```

## 📁 项目结构

```
reddog/
├── public/
│   ├── electron.js      # Electron 主进程
│   ├── index.html       # HTML 模板
│   └── manifest.json    # Web 应用清单
├── src/
│   ├── components/
│   │   ├── LCUMonitor.js    # LCU监控组件
│   │   └── LCUMonitor.css   # 监控组件样式
│   ├── services/
│   │   ├── lcuService.js    # 真实LCU服务
│   │   └── lcuServiceDemo.js # 演示LCU服务
│   ├── App.js           # 主 React 组件
│   ├── App.css          # 组件样式
│   ├── index.js         # React 入口
│   ├── index.css        # 全局样式
│   └── reportWebVitals.js # 性能监控
├── package.json         # 项目配置
├── README.md           # 项目说明
└── LCU_README.md       # LCU功能详细说明
```

## 🎯 可用的脚本

- `npm start` - 启动 React 开发服务器
- `npm run build` - 构建生产版本
- `npm test` - 运行测试
- `npm run eject` - 弹出配置 (不可逆)
- `npm run electron` - 启动 Electron
- `npm run electron-dev` - 开发模式 (推荐)
- `npm run electron-pack` - 打包应用
- `npm run dist` - 构建并打包

## 🔧 技术栈

- **前端框架**: React 18
- **桌面框架**: Electron 25
- **构建工具**: Create React App
- **样式**: CSS3 (现代化设计)
- **打包工具**: electron-builder

## 🌟 特色功能

1. **现代化 UI**: 使用渐变背景和毛玻璃效果
2. **响应式设计**: 适配不同屏幕尺寸
3. **平台检测**: 自动检测运行平台
4. **交互式计数器**: 演示 React 状态管理
5. **中文界面**: 完全中文化的用户界面
6. **LCU监控**: 英雄联盟游戏状态监控 (演示模式)
7. **标签页导航**: 多功能模块化设计

## 📝 开发说明

### 开发模式
开发模式下，应用会同时启动 React 开发服务器和 Electron，支持热重载。

### 生产模式
生产模式下，React 应用会被构建为静态文件，然后由 Electron 加载。

### 打包配置
应用支持打包为 Windows (.exe)、macOS (.dmg) 和 Linux (.AppImage) 格式。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## �� 许可证

MIT License 