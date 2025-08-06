"""
Simplified Hotkey Manager
Uses keyboard library for cross-platform hotkey support
"""

import threading
import time
from typing import Callable
import sys


class SimpleHotkeyManager:
    """Simple hotkey manager using keyboard library"""
    
    def __init__(self, callback: Callable[[], None]):
        self.callback = callback
        self.running = False
        self.thread = None
        self.keyboard_available = False
        
    def start(self):
        """Start hotkey monitoring"""
        if self.running:
            return
            
        try:
            import keyboard
            self.keyboard_available = True
            
            # Register hotkey
            keyboard.add_hotkey('ctrl+shift+o', self.callback)
            print("✅ Hotkey Ctrl+Shift+O registered successfully")
            self.running = True
            
        except ImportError:
            print("⚠️  keyboard library not available")
            print("   Install with: pip install keyboard")
            print("   Hotkey functionality disabled")
            self.keyboard_available = False
        except Exception as e:
            print(f"❌ Error setting up hotkey: {e}")
            self.keyboard_available = False
    
    def stop(self):
        """Stop hotkey monitoring"""
        if not self.running:
            return
            
        try:
            import keyboard
            keyboard.remove_hotkey('ctrl+shift+o')
            self.running = False
            print("Hotkey unregistered")
        except:
            pass
    
    def is_available(self) -> bool:
        """Check if hotkey functionality is available"""
        return self.keyboard_available


def create_hotkey_manager(callback: Callable[[], None]) -> SimpleHotkeyManager:
    """Factory function to create hotkey manager"""
    return SimpleHotkeyManager(callback)


if __name__ == "__main__":
    # Test hotkey functionality
    def test_callback():
        print("🎯 Hotkey pressed! Overlay would toggle here.")
    
    manager = create_hotkey_manager(test_callback)
    manager.start()
    
    print("Testing hotkey... Press Ctrl+Shift+O to test")
    print("Press Ctrl+C to exit")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        manager.stop()
        print("\nTest completed")