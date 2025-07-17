import React, { useState, useEffect, useCallback } from "react";
import lcuService from "../services/lcuService";
import "./LCUMonitor.css";

// 新增：美化对阵面板的假数据
const previewMyTeam = [
  {
    nickname: "我-top",
    spells: ["闪现", "点燃"],
    avatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=top",
  },
  {
    nickname: "我-jug",
    spells: ["闪现", "惩戒"],
    avatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=jug",
  },
  {
    nickname: "我-mid",
    spells: ["闪现", "点燃"],
    avatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=mid",
  },
  {
    nickname: "我-ad",
    spells: ["闪现", "治疗"],
    avatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=ad",
  },
  {
    nickname: "我-sup",
    spells: ["闪现", "虚弱"],
    avatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=sup",
  },
];
const previewEnemyTeam = [
  {
    nickname: "敌-top",
    spells: ["闪现", "传送"],
    avatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=etop",
  },
  {
    nickname: "敌-jug",
    spells: ["闪现", "惩戒"],
    avatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=ejug",
  },
  {
    nickname: "敌-mid",
    spells: ["闪现", "点燃"],
    avatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=emid",
  },
  {
    nickname: "敌-ad",
    spells: ["闪现", "治疗"],
    avatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=ead",
  },
  {
    nickname: "敌-sup",
    spells: ["闪现", "虚弱"],
    avatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=esup",
  },
];

// 新增：美化对阵面板组件
function BattlePreview({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="battle-preview-modal">
      <div className="battle-preview-content">
        <button className="battle-preview-close" onClick={onClose}>
          ×
        </button>
        <div className="battle-preview-title">对阵面板预览</div>
        <div className="battle-preview-board">
          <div className="battle-preview-team">
            <div className="battle-preview-team-title">我方阵容</div>
            {previewMyTeam.map((player, idx) => (
              <div className="battle-preview-player" key={idx}>
                <img
                  className="battle-preview-avatar"
                  src={player.avatar}
                  alt="avatar"
                />
                <div className="battle-preview-info">
                  <div className="battle-preview-nickname">
                    {player.nickname}
                  </div>
                  <div className="battle-preview-spells">
                    {player.spells.map((spell, i) => (
                      <span
                        className={`battle-preview-spell spell-${spell}`}
                        key={i}
                      >
                        {spell}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="battle-preview-divider"></div>
          <div className="battle-preview-team">
            <div className="battle-preview-team-title">敌方阵容</div>
            {previewEnemyTeam.map((player, idx) => (
              <div className="battle-preview-player" key={idx}>
                <img
                  className="battle-preview-avatar"
                  src={player.avatar}
                  alt="avatar"
                />
                <div className="battle-preview-info">
                  <div className="battle-preview-nickname">
                    {player.nickname}
                  </div>
                  <div className="battle-preview-spells">
                    {player.spells.map((spell, i) => (
                      <span
                        className={`battle-preview-spell spell-${spell}`}
                        key={i}
                      >
                        {spell}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const LCUMonitor = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    baseUrl: null,
    port: null,
    hasPassword: false,
    error: null,
  });
  const [enemyInfo, setEnemyInfo] = useState(null);
  const [summonerInfo, setSummonerInfo] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0); // 添加强制更新状态
  const [showPreviewUI, setShowPreviewUI] = useState(false);

  // 使用useCallback确保回调函数能正确访问最新状态
  const handleEnemyInfoUpdate = useCallback((info) => {
    console.log("📡 收到游戏信息更新:", info);
    console.log("📡 更新前的enemyInfo状态:", enemyInfo);
    console.log("📡 数据类型:", typeof info);
    console.log("📡 数据是否为null:", info === null);
    console.log("📡 数据是否为undefined:", info === undefined);

    if (info) {
      console.log("📡 数据详情:");
      console.log("- 类型:", info.type);
      console.log("- 时间戳:", info.timestamp);
      console.log("- 敌方队伍数量:", info.theirTeam?.length || 0);
      console.log("- 我方队伍数量:", info.myTeam?.length || 0);
    }

    // 强制更新状态
    console.log("📡 开始更新React状态...");
    setEnemyInfo(info);
    setForceUpdate((prev) => {
      const newCount = prev + 1;
      console.log("📡 强制更新计数从", prev, "增加到", newCount);
      return newCount;
    });

    console.log("📡 已调用setEnemyInfo，新数据:", info);
    console.log("📡 已触发强制更新");
    console.log("📡 更新后的enemyInfo状态将在下次渲染时生效");

    // 添加一个延迟检查，确认状态是否真的更新了
    setTimeout(() => {
      console.log("📡 延迟检查 - 当前enemyInfo状态:", enemyInfo);
      console.log("📡 延迟检查 - 强制更新计数:", forceUpdate);
    }, 100);
  }, []); // 移除enemyInfo依赖，避免无限循环

  useEffect(() => {
    // 添加LCU监听器
    lcuService.addListener(handleEnemyInfoUpdate);

    // 定期检查连接状态（简化版，只检查连接是否断开）
    const interval = setInterval(() => {
      const status = lcuService.getConnectionStatus();
      if (status.isConnected !== connectionStatus.isConnected) {
        setConnectionStatus(status);
        console.log("🔄 连接状态变化:", status);
      }
    }, 5000); // 每5秒检查一次连接状态

    return () => {
      lcuService.removeListener(handleEnemyInfoUpdate);
      clearInterval(interval);
    };
  }, [handleEnemyInfoUpdate, connectionStatus.isConnected]); // 添加连接状态依赖

  // 添加监听enemyInfo状态变化的useEffect
  useEffect(() => {
    console.log("🔄 enemyInfo状态发生变化:", enemyInfo);
    if (enemyInfo) {
      console.log("🔄 新的enemyInfo详情:");
      console.log("- 类型:", enemyInfo.type);
      console.log("- 时间戳:", enemyInfo.timestamp);
      console.log("- 敌方队伍数量:", enemyInfo.theirTeam?.length || 0);
      console.log("- 我方队伍数量:", enemyInfo.myTeam?.length || 0);
    } else {
      console.log("🔄 enemyInfo已清空");
    }
  }, [enemyInfo]);

  // 添加监听forceUpdate变化的useEffect
  useEffect(() => {
    console.log("🔄 forceUpdate计数变化:", forceUpdate);
    console.log("🔄 当前enemyInfo状态:", enemyInfo);
  }, [forceUpdate, enemyInfo]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      console.log("🔗 开始连接LCU...");
      await lcuService.connect();
      console.log("✅ LCU连接成功");

      // 获取召唤师信息
      const summoner = await lcuService.getCurrentSummoner();
      console.log("📊 获取到的召唤师信息:", summoner);
      setSummonerInfo(summoner);

      // 获取游戏状态
      const status = await lcuService.getGameStatus();
      console.log("🎮 获取到的游戏状态:", status);
      setGameStatus(status);

      // 连接成功后，LCU服务会自动处理当前游戏状态
      // 等待一小段时间确保数据已更新
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 强制获取当前LCU服务中的数据
      const currentEnemyInfo = lcuService.enemyInfo;
      console.log("🔄 当前LCU服务中的enemyInfo:", currentEnemyInfo);
      if (currentEnemyInfo) {
        setEnemyInfo(currentEnemyInfo);
        setForceUpdate((prev) => prev + 1);
        console.log("🔄 已更新UI状态");
      }
    } catch (err) {
      setError(err.message);
      console.error("❌ 连接失败:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      console.log("🔄 手动刷新游戏信息...");

      // 使用简化的刷新方法
      await lcuService.refreshGameData();

      // 等待一小段时间确保数据已更新
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 强制更新UI状态
      console.log("🔄 强制更新UI状态...");
      const currentEnemyInfo = lcuService.enemyInfo;
      console.log("🔄 当前LCU服务中的enemyInfo:", currentEnemyInfo);

      if (currentEnemyInfo) {
        console.log("🔄 发现enemyInfo数据，更新React状态");
        setEnemyInfo(currentEnemyInfo);
        setForceUpdate((prev) => prev + 1);
        console.log("🔄 React状态更新完成");
      } else {
        console.log("⚠️ LCU服务中的enemyInfo为空");
        // 即使为空也更新状态，确保UI显示正确的空状态
        setEnemyInfo(null);
        setForceUpdate((prev) => prev + 1);
        console.log("🔄 已设置空状态");
      }
    } catch (err) {
      console.error("❌ 刷新失败:", err);
      setError(err.message);
    }
  };

  const handleDisconnect = () => {
    console.log("🔌 断开LCU连接...");
    lcuService.disconnect();
    setEnemyInfo(null);
    setSummonerInfo(null);
    setGameStatus(null);
    setError(null);
  };

  const renderConnectionStatus = () => (
    <div className="connection-status">
      <h3>连接状态</h3>
      <div className="status-grid">
        <div className="status-item">
          <span className="label">连接状态:</span>
          <span
            className={`value ${
              connectionStatus.isConnected ? "connected" : "disconnected"
            }`}
          >
            {connectionStatus.isConnected ? "✅ 已连接" : "❌ 未连接"}
          </span>
        </div>
        {connectionStatus.port && (
          <div className="status-item">
            <span className="label">端口:</span>
            <span className="value">{connectionStatus.port}</span>
          </div>
        )}
        <div className="status-item">
          <span className="label">认证:</span>
          <span
            className={`value ${
              connectionStatus.hasPassword ? "success" : "error"
            }`}
          >
            {connectionStatus.hasPassword ? "✅ 已配置" : "❌ 未配置"}
          </span>
        </div>
        {connectionStatus.error && (
          <div className="status-item error">
            <span className="label">错误:</span>
            <span className="value error-text">{connectionStatus.error}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="connection-actions">
        {!connectionStatus.isConnected ? (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="connect-btn"
          >
            {isConnecting ? "🔍 连接中..." : "🔗 连接到LCU"}
          </button>
        ) : (
          <>
            <button onClick={handleRefresh} className="refresh-btn">
              🔄 刷新游戏信息
            </button>
            <button
              onClick={() => {
                console.log("🔄 手动强制更新...");
                const currentEnemyInfo = lcuService.enemyInfo;
                console.log("🔄 当前LCU服务数据:", currentEnemyInfo);
                setEnemyInfo(currentEnemyInfo);
                setForceUpdate((prev) => prev + 1);
                console.log("🔄 强制更新完成");
              }}
              className="force-update-btn"
              style={{
                background: "#4CAF50",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              🔄 强制更新
            </button>
            <button
              onClick={async () => {
                console.log("🔄 手动同步状态...");
                try {
                  // 重新获取游戏状态
                  const status = await lcuService.getGameStatus();
                  console.log("🎮 最新游戏状态:", status);
                  setGameStatus(status);

                  // 根据状态重新获取数据
                  if (status) {
                    if (status.phase === "ChampSelect") {
                      await lcuService.getChampSelectInfo();
                    } else if (status.phase === "InProgress") {
                      await lcuService.getEnemyInfo();
                    }
                  }

                  // 同步React状态
                  const currentEnemyInfo = lcuService.enemyInfo;
                  console.log("🔄 同步后的数据:", currentEnemyInfo);
                  setEnemyInfo(currentEnemyInfo);
                  setForceUpdate((prev) => prev + 1);
                  console.log("🔄 状态同步完成");
                } catch (err) {
                  console.error("❌ 状态同步失败:", err);
                }
              }}
              className="sync-btn"
              style={{
                background: "#2196F3",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              🔄 同步状态
            </button>
            <button onClick={handleDisconnect} className="disconnect-btn">
              🔌 断开连接
            </button>
            <button
              onClick={() => {
                console.log("🔍 LCU服务中的enemyInfo:", lcuService.enemyInfo);
                console.log("🔍 React状态中的enemyInfo:", enemyInfo);
                console.log("🔍 强制更新计数:", forceUpdate);
                console.log("🔍 监听器数量:", lcuService.listeners.length);
                console.log("🔍 连接状态:", lcuService.connectionStatus);
                console.log("🔍 轮询状态:", !!lcuService.pollingInterval);
                console.log("🔍 最后游戏阶段:", lcuService.lastGamePhase);

                // 测试监听器回调
                console.log("🔍 测试监听器回调...");
                lcuService.notifyListeners();

                alert(
                  `LCU服务数据: ${JSON.stringify(
                    lcuService.enemyInfo,
                    null,
                    2
                  )}\n\nReact状态: ${JSON.stringify(
                    enemyInfo,
                    null,
                    2
                  )}\n\n强制更新: ${forceUpdate}\n\n监听器数量: ${
                    lcuService.listeners.length
                  }\n\n连接状态: ${JSON.stringify(
                    lcuService.connectionStatus,
                    null,
                    2
                  )}\n\n轮询状态: ${!!lcuService.pollingInterval}\n\n最后游戏阶段: ${
                    lcuService.lastGamePhase
                  }`
                );
              }}
              className="debug-btn"
              style={{
                background: "#ff6b6b",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              🔍 调试数据
            </button>
            <button
              onClick={async () => {
                console.log("🔍 测试召唤师技能获取...");
                try {
                  // 测试当前召唤师技能
                  const currentSummoner = await lcuService.getCurrentSummoner();
                  console.log("🔍 当前召唤师信息:", currentSummoner);

                  // 测试英雄选择会话
                  const champSelectResponse = await lcuService.makeRequest(
                    "/lol-champ-select/v1/session"
                  );
                  if (champSelectResponse.ok) {
                    const champSelectData = await champSelectResponse.json();
                    console.log("🔍 英雄选择数据:", champSelectData);
                  }

                  // 测试游戏状态
                  const gameStatus = await lcuService.getGameStatus();
                  console.log("🔍 游戏状态:", gameStatus);

                  alert(
                    `测试完成！\n\n召唤师信息: ${JSON.stringify(
                      currentSummoner,
                      null,
                      2
                    )}\n\n游戏状态: ${JSON.stringify(gameStatus, null, 2)}`
                  );
                } catch (err) {
                  console.error("❌ 测试失败:", err);
                  alert(`测试失败: ${err.message}`);
                }
              }}
              className="test-btn"
              style={{
                background: "#9c27b0",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              🧪 测试技能
            </button>
            <button
              onClick={async () => {
                console.log("🔍 诊断游戏信息问题...");
                try {
                  // 1. 检查LCU服务状态
                  console.log("🔍 1. LCU服务状态检查:");
                  console.log("- 连接状态:", lcuService.isConnected);
                  console.log("- 当前enemyInfo:", lcuService.enemyInfo);
                  console.log("- 监听器数量:", lcuService.listeners.length);

                  // 2. 手动获取游戏状态
                  console.log("🔍 2. 手动获取游戏状态...");
                  const gameStatus = await lcuService.getGameStatus();
                  console.log("🔍 游戏状态:", gameStatus);

                  // 3. 根据状态手动获取数据
                  if (gameStatus) {
                    console.log("🔍 3. 根据游戏阶段获取数据...");
                    if (gameStatus.phase === "ChampSelect") {
                      console.log("🔍 尝试获取英雄选择信息...");
                      await lcuService.getChampSelectInfo();
                    } else if (gameStatus.phase === "InProgress") {
                      console.log("🔍 尝试获取游戏信息...");
                      await lcuService.getEnemyInfo();
                    }
                  }

                  // 4. 检查获取后的数据
                  console.log("🔍 4. 获取后的数据检查:");
                  console.log("- LCU服务中的enemyInfo:", lcuService.enemyInfo);
                  console.log("- React状态中的enemyInfo:", enemyInfo);

                  // 5. 手动触发监听器
                  console.log("🔍 5. 手动触发监听器...");
                  lcuService.notifyListeners();

                  // 6. 强制更新React状态
                  console.log("🔍 6. 强制更新React状态...");
                  setEnemyInfo(lcuService.enemyInfo);
                  setForceUpdate((prev) => prev + 1);

                  const diagnosis = {
                    lcuConnected: lcuService.isConnected,
                    lcuEnemyInfo: lcuService.enemyInfo,
                    reactEnemyInfo: enemyInfo,
                    listenersCount: lcuService.listeners.length,
                    gameStatus: gameStatus,
                    forceUpdateCount: forceUpdate,
                  };

                  alert(`诊断完成！\n\n${JSON.stringify(diagnosis, null, 2)}`);
                } catch (err) {
                  console.error("❌ 诊断失败:", err);
                  alert(`诊断失败: ${err.message}`);
                }
              }}
              className="diagnose-btn"
              style={{
                background: "#ff9800",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              🔍 诊断问题
            </button>
            <button
              onClick={async () => {
                console.log("🧪 测试数据获取功能...");
                try {
                  // 测试游戏状态获取
                  console.log("🧪 1. 测试游戏状态获取...");
                  const gameStatus = await lcuService.getGameStatus();
                  console.log("🧪 游戏状态:", gameStatus);

                  // 测试英雄选择信息获取
                  console.log("🧪 2. 测试英雄选择信息获取...");
                  const champSelectResponse = await lcuService.makeRequest(
                    "/lol-champ-select/v1/session"
                  );
                  console.log("🧪 英雄选择响应状态:", champSelectResponse.ok);
                  if (champSelectResponse.ok) {
                    const champSelectData = await champSelectResponse.json();
                    console.log("🧪 英雄选择数据:", champSelectData);
                  }

                  // 测试游戏会话获取
                  console.log("🧪 3. 测试游戏会话获取...");
                  const gameSessionResponse = await lcuService.makeRequest(
                    "/lol-gameflow/v1/session"
                  );
                  console.log("🧪 游戏会话响应状态:", gameSessionResponse.ok);
                  if (gameSessionResponse.ok) {
                    const gameSessionData = await gameSessionResponse.json();
                    console.log("🧪 游戏会话数据:", gameSessionData);
                  }

                  // 测试当前召唤师信息
                  console.log("🧪 4. 测试召唤师信息获取...");
                  const summonerInfo = await lcuService.getCurrentSummoner();
                  console.log("🧪 召唤师信息:", summonerInfo);

                  const testResults = {
                    gameStatus: gameStatus,
                    champSelectAvailable: champSelectResponse.ok,
                    gameSessionAvailable: gameSessionResponse.ok,
                    summonerInfo: summonerInfo,
                    currentEnemyInfo: lcuService.enemyInfo,
                  };

                  alert(
                    `数据获取测试完成！\n\n${JSON.stringify(
                      testResults,
                      null,
                      2
                    )}`
                  );
                } catch (err) {
                  console.error("❌ 数据获取测试失败:", err);
                  alert(`测试失败: ${err.message}`);
                }
              }}
              className="test-data-btn"
              style={{
                background: "#673ab7",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              🧪 测试数据
            </button>
            <button
              onClick={() => {
                console.log("🎨 测试UI渲染...");
                // 设置测试数据
                const testData = {
                  type: "champ_select",
                  theirTeam: [
                    {
                      summonerName: "测试玩家1",
                      championId: 103,
                      championName: "阿狸",
                      spell1Id: 4,
                      spell2Id: 3,
                      summonerSpells: {
                        spell1: "治疗术",
                        spell2: "闪现",
                      },
                      assignedPosition: "MIDDLE",
                    },
                    {
                      summonerName: "测试玩家2",
                      championId: 157,
                      championName: "亚索",
                      spell1Id: 4,
                      spell2Id: 3,
                      summonerSpells: {
                        spell1: "治疗术",
                        spell2: "闪现",
                      },
                      assignedPosition: "TOP",
                    },
                  ],
                  myTeam: [
                    {
                      summonerName: "我方玩家1",
                      championId: 266,
                      championName: "德莱厄斯",
                      spell1Id: 4,
                      spell2Id: 3,
                      summonerSpells: {
                        spell1: "治疗术",
                        spell2: "闪现",
                      },
                      assignedPosition: "JUNGLE",
                    },
                  ],
                  timestamp: Date.now(),
                };

                console.log("🎨 设置测试数据:", testData);
                setEnemyInfo(testData);
                setForceUpdate((prev) => prev + 1);
                console.log("🎨 测试数据设置完成");
              }}
              className="test-ui-btn"
              style={{
                background: "#e91e63",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              🎨 测试UI
            </button>
          </>
        )}
      </div>
    </div>
  );

  const renderSummonerInfo = () => {
    if (!summonerInfo) return null;

    console.log("🎯 渲染召唤师信息:", summonerInfo);

    return (
      <div className="summoner-info">
        <h3>召唤师信息</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">名称:</span>
            <span className="value">
              {summonerInfo.gameName ||
                summonerInfo.displayName ||
                summonerInfo.name ||
                "未知"}
            </span>
          </div>
          <div className="info-item">
            <span className="label">等级:</span>
            <span className="value">
              {summonerInfo.summonerLevel || "未知"}
            </span>
          </div>
          <div className="info-item">
            <span className="label">ID:</span>
            <span className="value">{summonerInfo.summonerId || "未知"}</span>
          </div>
          {summonerInfo.accountId && (
            <div className="info-item">
              <span className="label">账号ID:</span>
              <span className="value">{summonerInfo.accountId}</span>
            </div>
          )}
          {summonerInfo.puuid && (
            <div className="info-item">
              <span className="label">PUUID:</span>
              <span className="value">
                {summonerInfo.puuid.substring(0, 8)}...
              </span>
            </div>
          )}
          {summonerInfo.profileIconId && (
            <div className="info-item">
              <span className="label">头像ID:</span>
              <span className="value">{summonerInfo.profileIconId}</span>
            </div>
          )}
        </div>

        {/* 调试信息 */}
        <details className="debug-info">
          <summary>调试信息</summary>
          <pre>{JSON.stringify(summonerInfo, null, 2)}</pre>
        </details>
      </div>
    );
  };

  const renderGameStatus = () => {
    if (!gameStatus) return null;

    return (
      <div className="game-status">
        <h3>游戏状态</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">阶段:</span>
            <span className="value">{gameStatus.phase || "未知"}</span>
          </div>
          {gameStatus.gameData && (
            <>
              <div className="info-item">
                <span className="label">游戏ID:</span>
                <span className="value">{gameStatus.gameData.gameId}</span>
              </div>
              <div className="info-item">
                <span className="label">队列类型:</span>
                <span className="value">
                  {gameStatus.gameData.queue?.description || "未知"}
                </span>
              </div>
            </>
          )}
          {gameStatus.playerChampionSelections && (
            <div className="info-item">
              <span className="label">英雄选择:</span>
              <span className="value">
                {Object.keys(gameStatus.playerChampionSelections).length}个选择
              </span>
            </div>
          )}
        </div>

        {/* 调试信息 */}
        <details className="debug-info">
          <summary>游戏状态调试信息</summary>
          <pre>{JSON.stringify(gameStatus, null, 2)}</pre>
        </details>
      </div>
    );
  };

  const renderEnemyInfo = () => {
    console.log("🎮 renderEnemyInfo 被调用，enemyInfo:", enemyInfo);
    console.log("🎮 enemyInfo类型:", typeof enemyInfo);
    console.log("🎮 enemyInfo是否为null:", enemyInfo === null);
    console.log("🎮 enemyInfo是否为undefined:", enemyInfo === undefined);
    console.log("🎮 强制更新计数:", forceUpdate);
    console.log("🎮 当前时间戳:", Date.now());

    if (!enemyInfo) {
      console.log("⚠️ enemyInfo 为空，不显示游戏信息");
      return (
        <div className="enemy-info">
          <h3>游戏信息</h3>
          <div className="no-data">
            <p>暂无游戏数据</p>
            <p>请确保已连接到LCU并进入游戏</p>
            <p>当前状态: {gameStatus ? gameStatus.phase : "未知"}</p>
            <p>强制更新计数: {forceUpdate}</p>
            <p>最后更新: {new Date().toLocaleTimeString()}</p>
            <button onClick={handleRefresh} className="refresh-btn">
              🔄 手动刷新
            </button>
            <button
              onClick={() => {
                console.log("🔄 强制重新渲染...");
                setForceUpdate((prev) => prev + 1);
                // 强制获取LCU服务中的数据
                const currentData = lcuService.enemyInfo;
                console.log("🔄 LCU服务中的数据:", currentData);
                setEnemyInfo(currentData);
              }}
              className="force-render-btn"
              style={{
                background: "#ff5722",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "4px",
                cursor: "pointer",
                marginLeft: "10px",
              }}
            >
              🔄 强制渲染
            </button>
          </div>
        </div>
      );
    }

    // 显示当前状态信息
    console.log("🎮 渲染游戏信息:", enemyInfo);
    console.log("🎮 数据类型:", enemyInfo.type);
    console.log("🎮 敌方队伍数量:", enemyInfo.theirTeam?.length || 0);
    console.log("🎮 我方队伍数量:", enemyInfo.myTeam?.length || 0);

    const statusText = {
      none: "在客户端大厅",
      lobby: "在游戏大厅",
      matchmaking: "正在匹配中",
      readystart: "准备开始",
      champ_select: "英雄选择阶段",
      gamestart: "游戏开始",
      in_progress: "游戏进行中",
      waitingforstats: "等待统计",
      preendofgame: "游戏即将结束",
      endofgame: "游戏结束",
      unknown: "未知状态",
    };

    return (
      <div className="enemy-info">
        <h3>游戏信息</h3>
        <div className="info-type">
          <span className="type-badge">
            {statusText[enemyInfo.type] || enemyInfo.type}
          </span>
          <span className="timestamp">
            {new Date(enemyInfo.timestamp).toLocaleTimeString()}
          </span>
        </div>

        {/* 显示队伍信息 */}
        {enemyInfo.theirTeam && enemyInfo.theirTeam.length > 0 && (
          <div className="team-info">
            <h4>敌方队伍 ({enemyInfo.theirTeam.length}人)</h4>
            <div className="players-grid">
              {enemyInfo.theirTeam.map((player, index) => (
                <div key={index} className="player-card enemy">
                  <div className="player-header">
                    <div className="player-name">
                      {player.summonerName || player.playerName || "未知玩家"}
                    </div>
                    <div className="player-position">
                      {player.assignedPosition || "未知位置"}
                    </div>
                  </div>
                  <div className="champion-selection">
                    {player.championId ? (
                      <div className="champion-info">
                        <div className="champion-name">
                          {player.championName ||
                            `英雄ID: ${player.championId}`}
                        </div>
                        <div className="champion-id">
                          ID: {player.championId}
                        </div>
                      </div>
                    ) : (
                      <div className="no-champion">未选择英雄</div>
                    )}
                  </div>

                  {/* 召唤师技能显示 */}
                  <div className="spells-info">
                    <div className="spells-header">
                      <span className="spells-title">召唤师技能</span>
                    </div>
                    <div className="spells-grid">
                      <div className="spell-item">
                        <div className="spell-icon">
                          {player.summonerSpells?.spell1 === "闪现"
                            ? "⚡"
                            : player.summonerSpells?.spell1 === "点燃"
                            ? "🔥"
                            : player.summonerSpells?.spell1 === "治疗术"
                            ? "💚"
                            : player.summonerSpells?.spell1 === "屏障"
                            ? "🛡️"
                            : player.summonerSpells?.spell1 === "净化"
                            ? "✨"
                            : player.summonerSpells?.spell1 === "惩戒"
                            ? "⚔️"
                            : player.summonerSpells?.spell1 === "传送"
                            ? "🚪"
                            : player.summonerSpells?.spell1 === "幽灵疾步"
                            ? "👻"
                            : player.summonerSpells?.spell1 === "标记"
                            ? "🎯"
                            : player.summonerSpells?.spell1 === "清晰术"
                            ? "💙"
                            : player.summonerSpells?.spell1 === "洞察"
                            ? "👁️"
                            : "❓"}
                        </div>
                        <div className="spell-details">
                          <span className="spell-name">
                            {player.summonerSpells?.spell1 || "未选择"}
                          </span>
                          <span className="spell-id">
                            {player.spell1Id ? `ID: ${player.spell1Id}` : ""}
                          </span>
                        </div>
                      </div>
                      <div className="spell-item">
                        <div className="spell-icon">
                          {player.summonerSpells?.spell2 === "闪现"
                            ? "⚡"
                            : player.summonerSpells?.spell2 === "点燃"
                            ? "🔥"
                            : player.summonerSpells?.spell2 === "治疗术"
                            ? "💚"
                            : player.summonerSpells?.spell2 === "屏障"
                            ? "🛡️"
                            : player.summonerSpells?.spell2 === "净化"
                            ? "✨"
                            : player.summonerSpells?.spell2 === "惩戒"
                            ? "⚔️"
                            : player.summonerSpells?.spell2 === "传送"
                            ? "🚪"
                            : player.summonerSpells?.spell2 === "幽灵疾步"
                            ? "👻"
                            : player.summonerSpells?.spell2 === "标记"
                            ? "🎯"
                            : player.summonerSpells?.spell2 === "清晰术"
                            ? "💙"
                            : player.summonerSpells?.spell2 === "洞察"
                            ? "👁️"
                            : "❓"}
                        </div>
                        <div className="spell-details">
                          <span className="spell-name">
                            {player.summonerSpells?.spell2 || "未选择"}
                          </span>
                          <span className="spell-id">
                            {player.spell2Id ? `ID: ${player.spell2Id}` : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* 调试信息 */}
                    <div
                      className="spell-debug"
                      style={{
                        fontSize: "10px",
                        color: "#666",
                        marginTop: "5px",
                      }}
                    >
                      <div>
                        技能1: {player.spell1Id || "null"} →{" "}
                        {player.summonerSpells?.spell1 || "null"}
                      </div>
                      <div>
                        技能2: {player.spell2Id || "null"} →{" "}
                        {player.summonerSpells?.spell2 || "null"}
                      </div>
                    </div>
                  </div>

                  <div className="player-details">
                    <div className="detail-item">
                      <span className="label">召唤师ID:</span>
                      <span className="value">
                        {player.summonerId || "未知"}
                      </span>
                    </div>
                    {player.cellId && (
                      <div className="detail-item">
                        <span className="label">位置:</span>
                        <span className="value">{player.cellId}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {enemyInfo.myTeam && enemyInfo.myTeam.length > 0 && (
          <div className="team-info">
            <h4>我方队伍 ({enemyInfo.myTeam.length}人)</h4>
            <div className="players-grid">
              {enemyInfo.myTeam.map((player, index) => (
                <div key={index} className="player-card ally">
                  <div className="player-header">
                    <div className="player-name">
                      {player.summonerName || player.playerName || "未知玩家"}
                    </div>
                    <div className="player-position">
                      {player.assignedPosition || "未知位置"}
                    </div>
                  </div>
                  <div className="champion-selection">
                    {player.championId ? (
                      <div className="champion-info">
                        <div className="champion-name">
                          {player.championName ||
                            `英雄ID: ${player.championId}`}
                        </div>
                        <div className="champion-id">
                          ID: {player.championId}
                        </div>
                      </div>
                    ) : (
                      <div className="no-champion">未选择英雄</div>
                    )}
                  </div>

                  {/* 召唤师技能显示 */}
                  <div className="spells-info">
                    <div className="spells-header">
                      <span className="spells-title">召唤师技能</span>
                    </div>
                    <div className="spells-grid">
                      <div className="spell-item">
                        <div className="spell-icon">
                          {player.summonerSpells?.spell1 === "闪现"
                            ? "⚡"
                            : player.summonerSpells?.spell1 === "点燃"
                            ? "🔥"
                            : player.summonerSpells?.spell1 === "治疗术"
                            ? "💚"
                            : player.summonerSpells?.spell1 === "屏障"
                            ? "🛡️"
                            : player.summonerSpells?.spell1 === "净化"
                            ? "✨"
                            : player.summonerSpells?.spell1 === "惩戒"
                            ? "⚔️"
                            : player.summonerSpells?.spell1 === "传送"
                            ? "🚪"
                            : player.summonerSpells?.spell1 === "幽灵疾步"
                            ? "👻"
                            : player.summonerSpells?.spell1 === "标记"
                            ? "🎯"
                            : player.summonerSpells?.spell1 === "清晰术"
                            ? "💙"
                            : player.summonerSpells?.spell1 === "洞察"
                            ? "👁️"
                            : "❓"}
                        </div>
                        <div className="spell-details">
                          <span className="spell-name">
                            {player.summonerSpells?.spell1 || "未选择"}
                          </span>
                          <span className="spell-id">
                            {player.spell1Id ? `ID: ${player.spell1Id}` : ""}
                          </span>
                        </div>
                      </div>
                      <div className="spell-item">
                        <div className="spell-icon">
                          {player.summonerSpells?.spell2 === "闪现"
                            ? "⚡"
                            : player.summonerSpells?.spell2 === "点燃"
                            ? "🔥"
                            : player.summonerSpells?.spell2 === "治疗术"
                            ? "💚"
                            : player.summonerSpells?.spell2 === "屏障"
                            ? "🛡️"
                            : player.summonerSpells?.spell2 === "净化"
                            ? "✨"
                            : player.summonerSpells?.spell2 === "惩戒"
                            ? "⚔️"
                            : player.summonerSpells?.spell2 === "传送"
                            ? "🚪"
                            : player.summonerSpells?.spell2 === "幽灵疾步"
                            ? "👻"
                            : player.summonerSpells?.spell2 === "标记"
                            ? "🎯"
                            : player.summonerSpells?.spell2 === "清晰术"
                            ? "💙"
                            : player.summonerSpells?.spell2 === "洞察"
                            ? "👁️"
                            : "❓"}
                        </div>
                        <div className="spell-details">
                          <span className="spell-name">
                            {player.summonerSpells?.spell2 || "未选择"}
                          </span>
                          <span className="spell-id">
                            {player.spell2Id ? `ID: ${player.spell2Id}` : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* 调试信息 */}
                    <div
                      className="spell-debug"
                      style={{
                        fontSize: "10px",
                        color: "#666",
                        marginTop: "5px",
                      }}
                    >
                      <div>
                        技能1: {player.spell1Id || "null"} →{" "}
                        {player.summonerSpells?.spell1 || "null"}
                      </div>
                      <div>
                        技能2: {player.spell2Id || "null"} →{" "}
                        {player.summonerSpells?.spell2 || "null"}
                      </div>
                    </div>
                  </div>

                  <div className="player-details">
                    <div className="detail-item">
                      <span className="label">召唤师ID:</span>
                      <span className="value">
                        {player.summonerId || "未知"}
                      </span>
                    </div>
                    {player.cellId && (
                      <div className="detail-item">
                        <span className="label">位置:</span>
                        <span className="value">{player.cellId}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 如果没有队伍信息，显示状态信息 */}
        {(!enemyInfo.theirTeam || enemyInfo.theirTeam.length === 0) &&
          (!enemyInfo.myTeam || enemyInfo.myTeam.length === 0) && (
            <div className="no-data">
              <p>当前状态: {statusText[enemyInfo.type] || enemyInfo.type}</p>
              <p>暂无队伍信息，请等待游戏开始...</p>
              <button onClick={handleRefresh} className="refresh-btn">
                🔄 手动刷新
              </button>
            </div>
          )}

        {/* 调试信息 */}
        <details className="debug-info">
          <summary>游戏数据调试信息</summary>
          <pre>{JSON.stringify(enemyInfo, null, 2)}</pre>
        </details>
      </div>
    );
  };

  return (
    <div className="lcu-monitor">
      <div className="monitor-header">
        <h2>🏆 英雄联盟监控器</h2>
        <p>实时监控游戏状态和敌方信息</p>
      </div>

      {/* 原始数据显示区域 */}
      <div
        className="raw-data-display"
        style={{
          background: "#f5f5f5",
          border: "2px solid #333",
          padding: "15px",
          margin: "10px 0",
          borderRadius: "8px",
          fontFamily: "monospace",
          fontSize: "12px",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>🔍 原始数据显示</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
          }}
        >
          {/* LCU服务数据 */}
          <div>
            <h4 style={{ margin: "0 0 5px 0", color: "#e74c3c" }}>
              LCU服务数据:
            </h4>
            <div
              style={{
                background: "#fff",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                maxHeight: "300px",
                overflow: "auto",
              }}
            >
              <div>
                <strong>连接状态:</strong>{" "}
                {lcuService.isConnected ? "✅ 已连接" : "❌ 未连接"}
              </div>
              <div>
                <strong>端口:</strong> {lcuService.port || "null"}
              </div>
              <div>
                <strong>enemyInfo:</strong>{" "}
                {lcuService.enemyInfo ? "✅ 有数据" : "❌ 无数据"}
              </div>
              <div>
                <strong>监听器数量:</strong> {lcuService.listeners.length}
              </div>
              <div>
                <strong>最后游戏阶段:</strong>{" "}
                {lcuService.lastGamePhase || "null"}
              </div>
              <hr style={{ margin: "10px 0" }} />
              <div>
                <strong>enemyInfo详情:</strong>
              </div>
              <pre
                style={{
                  margin: "5px 0",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  fontSize: "10px",
                }}
              >
                {JSON.stringify(lcuService.enemyInfo, null, 2)}
              </pre>
            </div>
          </div>

          {/* React状态数据 */}
          <div>
            <h4 style={{ margin: "0 0 5px 0", color: "#3498db" }}>
              React状态数据:
            </h4>
            <div
              style={{
                background: "#fff",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                maxHeight: "300px",
                overflow: "auto",
              }}
            >
              <div>
                <strong>enemyInfo:</strong>{" "}
                {enemyInfo ? "✅ 有数据" : "❌ 无数据"}
              </div>
              <div>
                <strong>gameStatus:</strong>{" "}
                {gameStatus ? gameStatus.phase : "null"}
              </div>
              <div>
                <strong>summonerInfo:</strong>{" "}
                {summonerInfo ? "✅ 有数据" : "❌ 无数据"}
              </div>
              <div>
                <strong>强制更新计数:</strong> {forceUpdate}
              </div>
              <div>
                <strong>连接状态:</strong>{" "}
                {connectionStatus.isConnected ? "✅ 已连接" : "❌ 未连接"}
              </div>
              <hr style={{ margin: "10px 0" }} />
              <div>
                <strong>enemyInfo详情:</strong>
              </div>
              <pre
                style={{
                  margin: "5px 0",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  fontSize: "10px",
                }}
              >
                {JSON.stringify(enemyInfo, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* 状态摘要 */}
        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>
            📊 状态摘要:
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "10px",
            }}
          >
            <div>
              <strong>LCU连接:</strong>{" "}
              <span
                style={{
                  color: lcuService.isConnected ? "#27ae60" : "#e74c3c",
                }}
              >
                {lcuService.isConnected ? "✅ 已连接" : "❌ 未连接"}
              </span>
            </div>
            <div>
              <strong>LCU数据:</strong>{" "}
              <span
                style={{ color: lcuService.enemyInfo ? "#27ae60" : "#e74c3c" }}
              >
                {lcuService.enemyInfo ? "✅ 有数据" : "❌ 无数据"}
              </span>
            </div>
            <div>
              <strong>React数据:</strong>{" "}
              <span style={{ color: enemyInfo ? "#27ae60" : "#e74c3c" }}>
                {enemyInfo ? "✅ 有数据" : "❌ 无数据"}
              </span>
            </div>
            <div>
              <strong>游戏阶段:</strong>{" "}
              <span style={{ color: gameStatus ? "#27ae60" : "#e74c3c" }}>
                {gameStatus ? gameStatus.phase : "❌ 未知"}
              </span>
            </div>
            <div>
              <strong>数据同步:</strong>{" "}
              <span
                style={{
                  color:
                    lcuService.enemyInfo && enemyInfo ? "#27ae60" : "#e74c3c",
                }}
              >
                {lcuService.enemyInfo && enemyInfo ? "✅ 已同步" : "❌ 未同步"}
              </span>
            </div>
            <div>
              <strong>更新次数:</strong>{" "}
              <span style={{ color: "#3498db" }}>{forceUpdate}</span>
            </div>
          </div>
        </div>

        {/* 实时更新按钮 */}
        <div style={{ marginTop: "10px", textAlign: "center" }}>
          <button
            onClick={() => {
              console.log("🔄 强制刷新原始数据...");
              // 强制重新渲染
              setForceUpdate((prev) => prev + 1);
              // 强制获取LCU数据
              const currentData = lcuService.enemyInfo;
              console.log("🔄 当前LCU数据:", currentData);
              setEnemyInfo(currentData);
            }}
            style={{
              background: "#e74c3c",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              marginRight: "10px",
            }}
          >
            🔄 强制刷新数据
          </button>
          <button
            onClick={() => {
              console.log("🎨 设置测试数据...");
              const testData = {
                type: "champ_select",
                theirTeam: [
                  {
                    summonerName: "测试敌方1",
                    championId: 103,
                    championName: "阿狸",
                    spell1Id: 4,
                    spell2Id: 3,
                    summonerSpells: { spell1: "治疗术", spell2: "闪现" },
                    assignedPosition: "MIDDLE",
                  },
                  {
                    summonerName: "测试敌方2",
                    championId: 157,
                    championName: "亚索",
                    spell1Id: 4,
                    spell2Id: 3,
                    summonerSpells: { spell1: "治疗术", spell2: "闪现" },
                    assignedPosition: "TOP",
                  },
                ],
                myTeam: [
                  {
                    summonerName: "测试我方1",
                    championId: 266,
                    championName: "德莱厄斯",
                    spell1Id: 4,
                    spell2Id: 3,
                    summonerSpells: { spell1: "治疗术", spell2: "闪现" },
                    assignedPosition: "JUNGLE",
                  },
                ],
                timestamp: Date.now(),
              };

              // 同时设置到LCU服务和React状态
              lcuService.enemyInfo = testData;
              setEnemyInfo(testData);
              setForceUpdate((prev) => prev + 1);
              console.log("🎨 测试数据设置完成:", testData);
            }}
            style={{
              background: "#27ae60",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            🎨 设置测试数据
          </button>
        </div>
      </div>

      {/* 调试状态显示 */}
      <div
        className="debug-status"
        style={{
          background: "#f0f0f0",
          padding: "10px",
          margin: "10px 0",
          borderRadius: "5px",
          fontSize: "12px",
        }}
      >
        <strong>调试状态:</strong>
        <div>
          enemyInfo: {enemyInfo ? `有数据 (${enemyInfo.type})` : "null"}
        </div>
        <div>gameStatus: {gameStatus ? gameStatus.phase : "null"}</div>
        <div>
          connectionStatus: {connectionStatus.isConnected ? "已连接" : "未连接"}
        </div>
        <div>summonerInfo: {summonerInfo ? "有数据" : "null"}</div>
        <div>强制更新计数: {forceUpdate}</div>
        <div>监听器数量: {lcuService.listeners.length}</div>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="monitor-content">
        {renderConnectionStatus()}
        {renderSummonerInfo()}
        {renderGameStatus()}
        {renderEnemyInfo()}
      </div>

      {/* 新增：预览新版UI按钮 */}
      <button className="preview-ui-btn" onClick={() => setShowPreviewUI(true)}>
        🎨 预览新版对阵UI
      </button>
      <BattlePreview
        open={showPreviewUI}
        onClose={() => setShowPreviewUI(false)}
      />

      {!connectionStatus.isConnected && !isConnecting && (
        <div className="help-section">
          <h4>使用说明</h4>
          <ul>
            <li>确保英雄联盟客户端已启动</li>
            <li>点击"连接到LCU"按钮</li>
            <li>系统将自动检测游戏状态</li>
            <li>在英雄选择或游戏中获取敌方信息</li>
          </ul>
        </div>
      )}
    </div>
  );
};
export default LCUMonitor;
