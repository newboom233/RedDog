"""
Test script for LCUClient with mock server
"""

import time
from src.lcu_client import LCUClient
from src.lcu_mock_server import LCUMockServer


def test_mock_client():
    """Test LCUClient with mock server"""
    
    # Start mock server
    mock_server = LCUMockServer()
    port = mock_server.start()
    
    try:
        # Create client in mock mode
        client = LCUClient(mock_mode=True, mock_port=port)
        
        print("Testing LCUClient with mock server...")
        print(f"Connected: {client.connected}")
        
        # Test endpoints
        print("\n1. Testing game session:")
        game_session = client.get_current_game_session()
        if game_session:
            print(f"   Game phase: {game_session.get('phase')}")
            print(f"   Queue ID: {game_session.get('gameData', {}).get('queue', {}).get('id')}")
        
        print("\n2. Testing champion select:")
        champ_select = client.get_champion_select_session()
        if champ_select:
            print(f"   Phase: {champ_select.get('phase')}")
            print(f"   Blue team players: {len(champ_select.get('myTeam', []))}")
            print(f"   Red team players: {len(champ_select.get('theirTeam', []))}")
            
            # Show team details
            if champ_select.get('myTeam'):
                print("\n   Blue Team:")
                for player in champ_select['myTeam']:
                    summoner = client.get_summoner_by_id(player['summonerId'])
                    if summoner:
                        print(f"     {summoner.get('displayName')} - Champion ID: {player['championId']}")
        
        print("\n3. Testing game data:")
        game_data = client.get_game_data()
        if game_data:
            print(f"   Status: {game_data.get('status')}")
            print(f"   Blue team: {len(game_data.get('teams', {}).get('blue', []))} players")
            print(f"   Red team: {len(game_data.get('teams', {}).get('red', []))} players")
            
            # Show player details
            if game_data.get('teams'):
                blue_team = game_data['teams'].get('blue', [])
                if blue_team:
                    print("\n   Blue Team Details:")
                    for player in blue_team:
                        print(f"     {player.get('summoner_name')} - {player.get('champion', {}).get('name')}")
        
        print("\n4. Testing status polling:")
        
        def on_status_update(status):
            print(f"Status update: {status.get('game_phase')}")
        
        client.add_status_callback(on_status_update)
        client.start_status_polling(interval=3.0)
        
        # Let it run for a few updates
        time.sleep(6)
        client.stop_status_polling()
        
        print("\nMock client test completed successfully!")
        
    except Exception as e:
        print(f"Error during testing: {e}")
    
    finally:
        mock_server.stop()


if __name__ == "__main__":
    test_mock_client()