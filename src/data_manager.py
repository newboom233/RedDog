"""
Data Manager
Handles data caching, processing, and serving to UI components
"""

from typing import Dict, Any, Optional, List
import time
from datetime import datetime
from .lcu_client import LCUClient


class DataManager:
    """Central data manager for LCU monitoring application"""
    
    def __init__(self, lcu_client: LCUClient):
        self.lcu_client = lcu_client
        self._cached_data: Dict[str, Any] = {}
        self._last_update = 0
        self._update_interval = 3  # seconds
        self._listeners = []
        
    def add_listener(self, callback):
        """Add a listener for data updates"""
        self._listeners.append(callback)
    
    def remove_listener(self, callback):
        """Remove a listener"""
        if callback in self._listeners:
            self._listeners.remove(callback)
    
    def _notify_listeners(self):
        """Notify all listeners of data update"""
        for callback in self._listeners:
            try:
                callback()
            except Exception as e:
                print(f"Error notifying listener: {e}")
    
    def update_game_data(self) -> bool:
        """Update game data from LCU client"""
        try:
            current_time = time.time()
            
            # Check if we should update (rate limiting)
            if current_time - self._last_update < self._update_interval:
                return False
            
            # Get fresh data from LCU
            game_data = self.lcu_client.get_game_data()
            
            if game_data:
                self._cached_data = game_data
                self._cached_data['last_update'] = current_time
                self._cached_data['timestamp'] = datetime.now().strftime("%H:%M:%S")
                self._last_update = current_time
                self._notify_listeners()
                return True
            
            return False
            
        except Exception as e:
            print(f"Error updating game data: {e}")
            return False
    
    def get_game_data(self) -> Dict[str, Any]:
        """Get current game data"""
        return self._cached_data.copy()
    
    def get_team_data(self, team: str) -> List[Dict[str, Any]]:
        """Get data for specific team"""
        if 'teams' in self._cached_data and team in self._cached_data['teams']:
            return self._cached_data['teams'][team]
        return []
    
    def get_player_by_cell_id(self, cell_id: int) -> Optional[Dict[str, Any]]:
        """Get player data by cell ID"""
        for team in ['blue', 'red']:
            players = self.get_team_data(team)
            for player in players:
                if player.get('cell_id') == cell_id:
                    return player
        return None
    
    def get_all_players(self) -> List[Dict[str, Any]]:
        """Get all players from both teams"""
        players = []
        for team in ['blue', 'red']:
            players.extend(self.get_team_data(team))
        return players
    
    def get_player_by_summoner_name(self, summoner_name: str) -> Optional[Dict[str, Any]]:
        """Find player by summoner name"""
        for team in ['blue', 'red']:
            players = self.get_team_data(team)
            for player in players:
                if player.get('summoner_name') == summoner_name:
                    return player
        return None
    
    def is_in_champion_select(self) -> bool:
        """Check if currently in champion select"""
        return self._cached_data.get('status') == 'in_champion_select'
    
    def get_game_phase(self) -> str:
        """Get current game phase"""
        return self._cached_data.get('phase', 'Unknown')
    
    def get_timer_info(self) -> Dict[str, Any]:
        """Get champion select timer information"""
        return self._cached_data.get('timer', {})
    
    def get_last_update_time(self) -> str:
        """Get last update timestamp"""
        return self._cached_data.get('timestamp', 'Never')
    
    def calculate_spell_cooldown(self, spell_name: str, game_start_time: Optional[float] = None) -> Dict[str, Any]:
        """Calculate summoner spell cooldown information"""
        if game_start_time is None:
            game_start_time = time.time()
        
        # Standard cooldowns for summoner spells
        cooldowns = {
            "闪现": 300,
            "引燃": 180,
            "治疗术": 240,
            "传送": 360,
            "幽灵疾步": 210,
            "惩戒": 90,
            "屏障": 180,
            "净化": 210,
            "清晰术": 240,
            "鬼步": 210
        }
        
        cooldown = cooldowns.get(spell_name, 300)
        
        # Calculate when spell will be ready
        ready_time = game_start_time + cooldown
        ready_in = max(0, ready_time - time.time())
        
        return {
            'name': spell_name,
            'cooldown': cooldown,
            'ready_time': ready_time,
            'ready_in': ready_in,
            'ready_at': datetime.fromtimestamp(ready_time).strftime("%H:%M:%S")
        }
    
    def get_player_copy_data(self, summoner_name: str) -> Optional[Dict[str, Any]]:
        """Get formatted data for copy functionality"""
        player = self.get_player_by_summoner_name(summoner_name)
        if not player:
            return None
        
        spells_data = []
        for spell in player.get('summoner_spells', []):
            spell_info = self.calculate_spell_cooldown(spell.get('name', 'Unknown'))
            spells_data.append(spell_info)
        
        return {
            'summoner_name': summoner_name,
            'champion': player.get('champion', {}).get('name', 'Unknown'),
            'spells': spells_data,
            'runes': [rune.get('name', 'Unknown') for rune in player.get('runes', [])]
        }
    
    def get_connection_status(self) -> Dict[str, Any]:
        """Get current connection status"""
        return {
            'connected': self.lcu_client.is_connected(),
            'last_update': self.get_last_update_time(),
            'has_data': bool(self._cached_data)
        }