"""
LCU Mock Server
Generates mock data for League Client Update API testing
"""

import json
import random
import time
from typing import Dict, Any, Optional, List
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import socket


class LCUMockServer:
    """Mock server for LCU API testing"""
    
    def __init__(self, port: int = 2999):
        self.port = port
        self.server = None
        self.server_thread = None
        self.running = False
        self.mock_data = self._generate_mock_data()
        
    def _generate_mock_data(self) -> Dict[str, Any]:
        """Generate comprehensive mock data"""
        
        # Champion data
        champions = [
            {"id": 1, "name": "安妮", "title": "黑暗之女"},
            {"id": 2, "name": "奥拉夫", "title": "狂战士"},
            {"id": 3, "name": "加里奥", "title": "哨兵之殇"},
            {"id": 4, "name": "崔斯特", "title": "卡牌大师"},
            {"id": 5, "name": "赵信", "title": "德邦总管"},
            {"id": 6, "name": "厄加特", "title": "首领之傲"},
            {"id": 7, "name": "乐芙兰", "title": "诡术妖姬"},
            {"id": 8, "name": "弗拉基米尔", "title": "猩红收割者"},
            {"id": 9, "name": "费德提克", "title": "末日使者"},
            {"id": 10, "name": "凯尔", "title": "审判天使"},
            {"id": 11, "name": "易大师", "title": "无极剑圣"},
            {"id": 12, "name": "阿利斯塔", "title": "牛头酋长"},
            {"id": 13, "name": "瑞兹", "title": "流浪法师"},
            {"id": 14, "name": "赛恩", "title": "亡灵战神"},
            {"id": 15, "name": "希维尔", "title": "战争女神"},
            {"id": 16, "name": "索拉卡", "title": "众星之子"},
            {"id": 17, "name": "提莫", "title": "迅捷斥候"},
            {"id": 18, "name": "崔丝塔娜", "title": "麦林炮手"},
            {"id": 19, "name": "沃里克", "title": "祖安怒兽"},
            {"id": 20, "name": "努努", "title": "雪原双子"}
        ]
        
        # Summoner spells
        summoner_spells = [
            {"id": 1, "name": "幽灵疾步", "cooldown": 180},
            {"id": 3, "name": "净化", "cooldown": 210},
            {"id": 4, "name": "闪现", "cooldown": 300},
            {"id": 6, "name": "鬼步", "cooldown": 210},
            {"id": 7, "name": "治疗术", "cooldown": 270},
            {"id": 11, "name": "惩戒", "cooldown": 15},
            {"id": 12, "name": "传送", "cooldown": 360},
            {"id": 14, "name": "引燃", "cooldown": 180},
            {"id": 21, "name": "屏障", "cooldown": 180}
        ]
        
        # Runes
        runes = [
            {"id": 8005, "name": "致命节奏", "iconPath": "/lol-game-data/assets/v1/perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png"},
            {"id": 8008, "name": "强攻", "iconPath": "/lol-game-data/assets/v1/perk-images/Styles/Precision/LethalTempo/LethalTempoTemp.png"},
            {"id": 8021, "name": "迅捷步法", "iconPath": "/lol-game-data/assets/v1/perk-images/Styles/Precision/FleetFootwork/FleetFootwork.png"},
            {"id": 8112, "name": "电刑", "iconPath": "/lol-game-data/assets/v1/perk-images/Styles/Domination/Electrocute/Electrocute.png"},
            {"id": 8124, "name": "掠食者", "iconPath": "/lol-game-data/assets/v1/perk-images/Styles/Domination/Predator/Predator.png"},
            {"id": 8128, "name": "黑暗收割", "iconPath": "/lol-game-data/assets/v1/perk-images/Styles/Domination/DarkHarvest/DarkHarvest.png"},
            {"id": 8214, "name": "奥术彗星", "iconPath": "/lol-game-data/assets/v1/perk-images/Styles/Sorcery/ArcaneComet/ArcaneComet.png"},
            {"id": 8230, "name": "相位猛冲", "iconPath": "/lol-game-data/assets/v1/perk-images/Styles/Sorcery/PhaseRush/PhaseRush.png"},
            {"id": 8437, "name": "不灭之握", "iconPath": "/lol-game-data/assets/v1/perk-images/Styles/Resolve/GraspOfTheUndying/GraspOfTheUndying.png"},
            {"id": 8465, "name": "守护者", "iconPath": "/lol-game-data/assets/v1/perk-images/Styles/Resolve/Guardian/Guardian.png"}
        ]
        
        # Generate summoner names
        summoner_names = [
            "FakerGod", "UziCarry", "TheShyTop", "RookieMid", "JackeyLove",
            "MingSupport", "NingJungle", "TianJungle", "DoinbMid", "LwxADC",
            "CrispSupport", "ZoomTop", "YagaoMid", "LokenADC", "LvMaoSupport",
            "KnightMid", "369Top", "KarsaJungle", "JiumengADC", "MissingSupport"
        ]
        
        return {
            "champions": champions,
            "summoner_spells": summoner_spells,
            "runes": runes,
            "summoner_names": summoner_names
        }
    
    def _generate_champion_select_session(self) -> Dict[str, Any]:
        """Generate mock champion select session"""
        summoner_names = self.mock_data["summoner_names"].copy()
        random.shuffle(summoner_names)
        
        champions = self.mock_data["champions"]
        summoner_spells = self.mock_data["summoner_spells"]
        runes = self.mock_data["runes"]
        
        blue_team = []
        red_team = []
        
        for i in range(5):
            # Blue team
            blue_champ = random.choice(champions)
            blue_spells = random.sample(summoner_spells, 2)
            blue_runes = random.sample(runes, 6)
            
            blue_team.append({
                "summonerId": 1000 + i,
                "championId": blue_champ["id"],
                "spell1Id": blue_spells[0]["id"],
                "spell2Id": blue_spells[1]["id"],
                "perkIds": [r["id"] for r in blue_runes],
                "cellId": i,
                "team": 100
            })
            
            # Red team
            red_champ = random.choice(champions)
            red_spells = random.sample(summoner_spells, 2)
            red_runes = random.sample(runes, 6)
            
            red_team.append({
                "summonerId": 2000 + i,
                "championId": red_champ["id"],
                "spell1Id": red_spells[0]["id"],
                "spell2Id": red_spells[1]["id"],
                "perkIds": [r["id"] for r in red_runes],
                "cellId": i + 5,
                "team": 200
            })
        
        return {
            "myTeam": blue_team,
            "theirTeam": red_team,
            "localPlayerCellId": 0,
            "timer": {
                "phaseTimeRemaining": random.randint(10, 90),
                "totalTimeInPhase": 30,
                "isInfinite": False
            },
            "phase": "BAN_PICK"
        }
    
    def _generate_game_session(self) -> Dict[str, Any]:
        """Generate mock game session"""
        phases = ["None", "Lobby", "Matchmaking", "ChampSelect", "GameStart", "InProgress", "WaitingForStats", "PreEndOfGame", "EndOfGame"]
        
        return {
            "phase": "ChampSelect",
            "gameData": {
                "queue": {
                    "id": random.choice([420, 430, 440, 450]),
                    "mapId": random.choice([11, 12]),
                    "gameMode": "CLASSIC",
                    "gameType": "MATCHED_GAME"
                }
            }
        }
    
    def _generate_summoner_data(self, summoner_id: int) -> Dict[str, Any]:
        """Generate mock summoner data"""
        summoner_names = self.mock_data["summoner_names"]
        
        return {
            "accountId": summoner_id,
            "displayName": random.choice(summoner_names),
            "internalName": f"summoner_{summoner_id}",
            "nameChangeFlag": False,
            "percentCompleteForNextLevel": random.randint(0, 99),
            "privacy": "PUBLIC",
            "profileIconId": random.randint(1, 100),
            "puuid": f"mock-puuid-{summoner_id}",
            "summonerId": summoner_id,
            "summonerLevel": random.randint(30, 500),
            "unnamed": False,
            "xpSinceLastLevel": random.randint(1000, 5000),
            "xpUntilNextLevel": random.randint(100, 1000)
        }
    
    def _generate_champion_details(self, champion_id: int) -> Dict[str, Any]:
        """Generate mock champion details"""
        champions = self.mock_data["champions"]
        champion = next((c for c in champions if c["id"] == champion_id), None)
        
        if not champion:
            champion = {"id": champion_id, "name": f"英雄{champion_id}", "title": "未知英雄"}
        
        return {
            "id": champion_id,
            "name": champion["name"],
            "alias": champion["name"].lower(),
            "title": champion["title"],
            "squarePortraitPath": f"/lol-game-data/assets/v1/champion-icons/{champion_id}.png",
            "roles": ["Fighter", "Assassin"],
            "passive": {
                "name": "被动技能",
                "description": "这是一个被动技能描述"
            },
            "spells": [
                {
                    "spellKey": "Q",
                    "name": f"{champion['name']}的Q技能",
                    "description": "这是一个技能描述"
                },
                {
                    "spellKey": "W",
                    "name": f"{champion['name']}的W技能",
                    "description": "这是一个技能描述"
                },
                {
                    "spellKey": "E",
                    "name": f"{champion['name']}的E技能",
                    "description": "这是一个技能描述"
                },
                {
                    "spellKey": "R",
                    "name": f"{champion['name']}的R技能",
                    "description": "这是一个技能描述"
                }
            ]
        }
    
    def _generate_rune_details(self, rune_id: int) -> Dict[str, Any]:
        """Generate mock rune details"""
        runes = self.mock_data["runes"]
        rune = next((r for r in runes if r["id"] == rune_id), None)
        
        if not rune:
            rune = {"id": rune_id, "name": f"符文{rune_id}", "iconPath": ""}
        
        return {
            "id": rune_id,
            "name": rune["name"],
            "majorChangePatchVersion": "",
            "tooltip": f"{rune['name']}的效果描述",
            "shortDesc": f"{rune['name']}的简单描述",
            "longDesc": f"{rune['name']}的详细描述",
            "recommendationDescriptor": "",
            "iconPath": rune["iconPath"],
            "endOfGameStatDescs": []
        }
    
    def _generate_summoner_spells(self) -> Dict[str, Any]:
        """Generate mock summoner spells"""
        return {
            "summonerSpells": self.mock_data["summoner_spells"]
        }
    
    def start(self):
        """Start the mock server"""
        if self.running:
            return
            
        self.running = True
        
        # Find available port
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.bind(('localhost', 0))
        port = sock.getsockname()[1]
        sock.close()
        
        self.port = port
        
        handler = self._create_request_handler()
        self.server = HTTPServer(('localhost', port), handler)
        
        self.server_thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.server_thread.start()
        
        print(f"LCU Mock Server started on http://localhost:{port}")
        return port
    
    def stop(self):
        """Stop the mock server"""
        if not self.running:
            return
            
        self.running = False
        if self.server:
            self.server.shutdown()
            self.server.server_close()
        
        if self.server_thread:
            self.server_thread.join(timeout=1)
    
    def _create_request_handler(self):
        """Create request handler for mock server"""
        mock_server = self
        
        class MockRequestHandler(BaseHTTPRequestHandler):
            def do_GET(self):
                """Handle GET requests"""
                path = self.path
                
                # Mock responses for LCU API endpoints
                if path == '/lol-gameflow/v1/session':
                    response = mock_server._generate_game_session()
                elif path == '/lol-champ-select/v1/session':
                    response = mock_server._generate_champion_select_session()
                elif path.startswith('/lol-summoner/v1/summoners/'):
                    summoner_id = int(path.split('/')[-1])
                    response = mock_server._generate_summoner_data(summoner_id)
                elif path.startswith('/lol-champions/v1/inventories/'):
                    champion_id = int(path.split('/')[-2])
                    response = mock_server._generate_champion_details(champion_id)
                elif path.startswith('/lol-perks/v1/perks/'):
                    rune_id = int(path.split('/')[-1])
                    response = mock_server._generate_rune_details(rune_id)
                elif path == '/lol-summoner/v1/summoner-spells':
                    response = mock_server._generate_summoner_spells()
                else:
                    self.send_error(404, "Endpoint not found")
                    return
                
                # Send response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response_json = json.dumps(response, ensure_ascii=False, indent=2)
                self.wfile.write(response_json.encode('utf-8'))
            
            def log_message(self, format, *args):
                """Suppress log messages"""
                pass
        
        return MockRequestHandler


if __name__ == "__main__":
    # Test the mock server
    mock_server = LCUMockServer()
    port = mock_server.start()
    
    try:
        print("Mock server is running. Press Ctrl+C to stop.")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        mock_server.stop()
        print("Mock server stopped.")