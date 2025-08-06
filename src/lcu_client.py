"""
LCU (League Client Update) API Client
Handles communication with the League of Legends client
"""

import requests
import urllib3
from urllib3.exceptions import InsecureRequestWarning
import base64
import os
import re
import json
import threading
import time
from typing import Dict, Optional, Any, Callable
import psutil

# Disable SSL warnings for LCU API
urllib3.disable_warnings(InsecureRequestWarning)


class LCUClient:
    """Client for interacting with the League Client Update API"""
    
    def __init__(self, mock_mode: bool = False, mock_port: int = 2999):
        self.base_url = None
        self.auth = None
        self.connected = False
        self.mock_mode = mock_mode
        self.mock_port = mock_port
        self._polling_thread = None
        self._polling_interval = 2.0  # seconds
        self._stop_polling = threading.Event()
        self._status_callbacks = []
        self._last_status = None
        
        if self.mock_mode:
            self._setup_mock_connection()
        else:
            self._find_lcu_process()
    
    def _setup_mock_connection(self):
        """Setup connection for mock mode"""
        self.base_url = f"http://localhost:{self.mock_port}"
        self.auth = "bW9jay11c2VyOm1vY2stcGFzcw=="  # mock-user:mock-pass in base64
        self.connected = True
    
    def _find_lcu_process(self) -> bool:
        """Find League Client process and extract connection details"""
        try:
            for process in psutil.process_iter(['pid', 'name', 'cmdline']):
                if process.info['name'] == 'LeagueClientUx.exe':
                    cmdline = process.info['cmdline']
                    
                    # Extract port and auth token from command line
                    port_match = None
                    token_match = None
                    
                    for arg in cmdline:
                        if arg.startswith('--app-port='):
                            port_match = arg.split('=')[1]
                        elif arg.startswith('--remoting-auth-token='):
                            token_match = arg.split('=')[1]
                    
                    if port_match and token_match:
                        self.base_url = f"https://127.0.0.1:{port_match}"
                        auth_string = f"riot:{token_match}"
                        self.auth = base64.b64encode(auth_string.encode()).decode()
                        print(self.auth)
                        self.connected = True
                        return True
            
            return False
            
        except Exception as e:
            print(f"Error finding LCU process: {e}")
            return False
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Optional[Dict[str, Any]]:
        """Make authenticated request to LCU API"""
        if not self.connected:
            return None
        
        try:
            headers = {
                'Authorization': f'Basic {self.auth}',
                'Accept': 'application/json'
            }
            
            url = f"{self.base_url}{endpoint}"

            response = requests.request(
                method, url, headers=headers, verify=False, timeout=5, **kwargs
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                if not self.mock_mode:
                    print(f"{endpoint} error: {response.status_code}")
                return None
                
        except requests.exceptions.RequestException as e:
            if not self.mock_mode:
                print(f"Request error: {e}")
            return None
    
    def get_current_game_session(self) -> Optional[Dict[str, Any]]:
        """Get current game session information"""
        return self._make_request('GET', '/lol-gameflow/v1/session')
    
    def get_current_summoner(self) -> Optional[Dict[str, Any]]:
        return self._make_request('GET', '/lol-summoner/v1/current-summoner')

    def get_champion_select_session(self) -> Optional[Dict[str, Any]]:
        """Get champion select session data"""
        return self._make_request('GET', '/lol-champ-select/v1/session')
    
    def get_summoner_by_id(self, summoner_id: int) -> Optional[Dict[str, Any]]:
        """Get summoner information by ID"""
        return self._make_request('GET', f'/lol-summoner/v1/summoners/{summoner_id}')
    
    def get_champion_details(self, champion_id: int) -> Optional[Dict[str, Any]]:
        """Get champion details"""
        return self._make_request('GET', f'/lol-champions/v1/inventories/{champion_id}/champions')
    
    def get_rune_details(self, rune_id: int) -> Optional[Dict[str, Any]]:
        """Get rune details"""
        return self._make_request('GET', f'/lol-perks/v1/perks/{rune_id}')
    
    def get_summoner_spells(self) -> Optional[Dict[str, Any]]:
        """Get all summoner spells"""
        return self._make_request('GET', '/lol-summoner/v1/summoner-spells')
    
    def get_game_data(self) -> Optional[Dict[str, Any]]:
        """Get comprehensive game data including player information"""
        if not self.connected:
            return None
        
        try:
            # Get champion select session
            champ_select = self.get_champion_select_session()
            if not champ_select:
                return None
            
            # Check if we're in champion select
            game_session = self.get_current_game_session()
            if not game_session or game_session.get('phase') != 'ChampSelect':
                return None
            
            # Process player data
            teams = {'blue': [], 'red': []}
            
            if 'myTeam' in champ_select:
                for player in champ_select['myTeam']:
                    player_data = self._process_player_data(player, 'blue')
                    if player_data:
                        teams['blue'].append(player_data)
            
            if 'theirTeam' in champ_select:
                for player in champ_select['theirTeam']:
                    player_data = self._process_player_data(player, 'red')
                    if player_data:
                        teams['red'].append(player_data)
            
            return {
                'status': 'in_champion_select',
                'teams': teams,
                'localPlayerCellId': champ_select.get('localPlayerCellId', 0),
                'timer': champ_select.get('timer', {}),
                'phase': game_session.get('phase', 'Unknown')
            }
            
        except Exception as e:
            print(f"Error getting game data: {e}")
            return None
    
    def _process_player_data(self, player: Dict[str, Any], team: str) -> Optional[Dict[str, Any]]:
        """Process individual player data"""
        try:
            summoner_id = player.get('summonerId')
            if not summoner_id:
                return None
            
            # Get summoner details
            summoner = self.get_summoner_by_id(summoner_id)
            if not summoner:
                return None
            
            # Get champion info
            champion_id = player.get('championId', 0)
            champion_name = self._get_champion_name(champion_id)
            
            # Get summoner spells
            spell1_id = player.get('spell1Id', 0)
            spell2_id = player.get('spell2Id', 0)
            spell1_name = self._get_summoner_spell_name(spell1_id)
            spell2_name = self._get_summoner_spell_name(spell2_id)
            
            # Get runes
            runes = player.get('perkIds', [])
            rune_details = []
            for rune_id in runes[:6]:  # Primary runes
                rune = self.get_rune_details(rune_id)
                if rune:
                    rune_details.append({
                        'id': rune_id,
                        'name': rune.get('name', 'Unknown'),
                        'icon': rune.get('iconPath', '')
                    })
            
            return {
                'summoner_name': summoner.get('displayName', 'Unknown'),
                'champion': {
                    'id': champion_id,
                    'name': champion_name
                },
                'summoner_spells': [
                    {'id': spell1_id, 'name': spell1_name},
                    {'id': spell2_id, 'name': spell2_name}
                ],
                'runes': rune_details,
                'team': team
            }
            
        except Exception as e:
            print(f"Error processing player data: {e}")
            return None
    
    def _get_champion_name(self, champion_id: int) -> str:
        """Get champion name from ID"""
        # This would normally fetch from game data
        champion_names = {
            1: "安妮", 2: "奥拉夫", 3: "加里奥", 4: "崔斯特", 5: "赵信",
            6: "厄加特", 7: "乐芙兰", 8: "弗拉基米尔", 9: "费德提克", 10: "凯尔",
            11: "易大师", 12: "阿利斯塔", 13: "瑞兹", 14: "赛恩", 15: "希维尔",
            16: "索拉卡", 17: "提莫", 18: "崔丝塔娜", 19: "沃里克", 20: "努努",
            21: "厄运小姐", 22: "艾希", 23: "泰达米尔", 24: "贾克斯", 25: "莫甘娜",
            26: "凯南", 27: "兰博", 28: "菲奥娜", 29: "薇恩", 30: "娑娜",
            31: "塔里克", 32: "拉莫斯", 33: "阿木木", 34: "拉莫斯", 35: "萨科",
            36: "德拉文", 37: "迦娜", 38: "蒙多医生", 39: "伊泽瑞尔", 40: "索拉卡",
            41: "莫德凯撒", 42: "卡西奥佩娅", 43: "卡特琳娜", 44: "潘森", 45: "卡尔萨斯",
            48: "崔斯特", 50: "斯维因", 51: "凯特琳", 53: "布里茨", 54: "玛尔扎哈",
            55: "卡莎", 56: "诺手", 57: "特朗德尔", 58: "卡蜜尔", 59: "奎因",
            60: "艾克", 61: "奥莉安娜", 62: "悟空", 63: "布兰德", 64: "李青",
            67: "维迦", 68: "雷克顿", 69: "厄加特", 72: "斯卡纳", 74: "黑默丁格",
            75: "内瑟斯", 76: "奈德丽", 77: "乌迪尔", 78: "波比", 79: "古拉加斯",
            80: "潘森", 81: "阿兹尔", 82: "莫德凯撒", 83: "易大师", 84: "阿卡丽",
            85: "凯南", 86: "盖伦", 89: "拉莫斯", 90: "马尔扎哈", 91: "艾瑞莉娅",
            92: "锐雯", 96: "克格莫", 98: "慎", 99: "盖伦", 101: "卡尔玛",
            102: "希瓦娜", 103: "阿狸", 104: "格雷夫斯", 105: "菲兹", 106: "沃里克",
            107: "雷恩加尔", 110: "厄运小姐", 111: "娜美", 112: "维克托", 113: "瑟庄妮",
            114: "菲奥娜", 115: "吉格斯", 117: "璐璐", 119: "德莱文", 120: "赫卡里姆",
            121: "卡兹克", 122: "德莱厄斯", 126: "奥瑞利安·索尔", 127: "丽桑卓", 131: "戴安娜",
            133: "奎因", 134: "辛德拉", 136: "奥瑞利安·索尔", 141: "劫", 142: "佐伊",
            143: "婕拉", 145: "凯隐", 150: "卡蜜尔", 154: "烬", 157: "亚索",
            161: "霞", 163: "洛", 164: "奇亚娜", 166: "阿克尚", 200: "千珏",
            201: "布隆", 202: "金克丝", 203: "千珏", 222: "金克丝", 223: "塔姆",
            234: "薇恩", 235: "赛娜", 236: "卢锡安", 238: "劫", 240: "凯南",
            245: "艾克", 246: "卡莉斯塔", 254: "蔚", 266: "亚托克斯", 267: "娜美",
            268: "阿兹尔", 350: "悠米", 412: "锤石", 420: "伊利斯", 421: "雷克塞",
            427: "艾翁", 429: "卡莉斯塔", 432: "巴德", 497: "洛", 498: "霞",
            516: "奥恩", 517: "塞拉斯", 518: "妮蔻", 523: "卡莎", 526: "雷克塞",
            555: "派克", 711: "佛耶戈", 777: "永恩", 875: "瑟提", 876: "莉莉娅",
            887: "萨勒芬妮", 888: "莎弥拉", 876: "莉莉娅", 887: "萨勒芬妮", 888: "莎弥拉"
        }
        return champion_names.get(champion_id, f"英雄{champion_id}")
    
    def _get_summoner_spell_name(self, spell_id: int) -> str:
        """Get summoner spell name from ID"""
        spell_names = {
            1: "幽灵疾步", 3: "净化", 4: "闪现", 6: "鬼步", 7: "治疗术",
            11: "惩戒", 12: "传送", 13: "清晰术", 14: "引燃", 21: "屏障",
            30: "重击", 31: "重击", 32: "标记", 39: "标记"
        }
        return spell_names.get(spell_id, f"技能{spell_id}")
    
    def is_connected(self) -> bool:
        """Check if connected to LCU"""
        return self.connected
    
    def start_status_polling(self, interval: float = 2.0):
        """Start periodic status polling"""
        if self._polling_thread and self._polling_thread.is_alive():
            return
        
        self._polling_interval = interval
        self._stop_polling.clear()
        self._polling_thread = threading.Thread(target=self._polling_loop, daemon=True)
        self._polling_thread.start()
    
    def stop_status_polling(self):
        """Stop periodic status polling"""
        self._stop_polling.set()
        if self._polling_thread and self._polling_thread.is_alive():
            self._polling_thread.join(timeout=1.0)
    
    def add_status_callback(self, callback: Callable[[Dict[str, Any]], None]):
        """Add callback for status updates"""
        if callback not in self._status_callbacks:
            self._status_callbacks.append(callback)
    
    def remove_status_callback(self, callback: Callable[[Dict[str, Any]], None]):
        """Remove callback for status updates"""
        if callback in self._status_callbacks:
            self._status_callbacks.remove(callback)
    
    def _polling_loop(self):
        """Main polling loop"""
        while not self._stop_polling.is_set():
            try:
                current_status = self.get_client_status()
                if current_status != self._last_status:
                    self._last_status = current_status
                    self._notify_status_callbacks(current_status)
            except Exception as e:
                print(f"Error in status polling: {e}")
            
            self._stop_polling.wait(self._polling_interval)
    
    def _notify_status_callbacks(self, status: Dict[str, Any]):
        """Notify all registered callbacks of status update"""
        for callback in self._status_callbacks:
            try:
                callback(status)
            except Exception as e:
                print(f"Error in status callback: {e}")
    
    def get_client_status(self) -> Dict[str, Any]:
        """Get comprehensive client status"""
        if not self.connected:
            return {
                'connected': False,
                'game_phase': 'disconnected',
                'champion_select': None,
                'game_session': None
            }
        
        try:
            game_session = self.get_current_game_session()
            champ_select = self.get_champion_select_session()
            
            status = {
                'connected': True,
                'game_phase': game_session.get('phase', 'unknown') if game_session else 'unknown',
                'champion_select': champ_select,
                'game_session': game_session,
                'timestamp': time.time()
            }
            
            # Add game data if in champion select
            if game_session and game_session.get('phase') == 'ChampSelect':
                game_data = self.get_game_data()
                if game_data:
                    status['game_data'] = game_data
            
            return status
            
        except Exception as e:
            return {
                'connected': False,
                'game_phase': 'error',
                'error': str(e)
            }