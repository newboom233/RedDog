"""
Hotkey Manager
Handles global hotkey registration for overlay window
"""

import threading
import time
from typing import Callable
import sys

# Platform detection
try:
    import platform
    WINDOWS = platform.system() == "Windows"
except:
    WINDOWS = False


class HotkeyManager:
    """Manages global hotkeys for the application"""
    
    def __init__(self, callback: Callable[[], None]):
        self.callback = callback
        self.running = False
        self.thread = None
        
        # Hotkey configuration
        self.hotkey_id = 1
        self.modifiers = win32con.MOD_CONTROL | win32con.MOD_SHIFT if WINDOWS else 0
        self.key = ord('O')  # Ctrl+Shift+O
        
    def start(self):
        """Start hotkey monitoring"""
        if not WINDOWS:
            print("Warning: Hotkeys only supported on Windows")
            return
            
        if self.running:
            return
            
        self.running = True
        self.thread = threading.Thread(target=self._monitor_hotkeys, daemon=True)
        self.thread.start()
        
        # Register hotkey
        self._register_hotkey()
    
    def stop(self):
        """Stop hotkey monitoring"""
        if not WINDOWS:
            return
            
        self.running = False
        self._unregister_hotkey()
        
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1)
    
    def _register_hotkey(self):
        """Register global hotkey using Windows API"""
        if not WINDOWS:
            return
            
        try:
            # Use ctypes for hotkey registration
            import ctypes
            from ctypes import wintypes
            
            # Constants
            self.MOD_CONTROL = 0x0002
            self.MOD_SHIFT = 0x0004
            self.VK_O = 0x4F  # 'O' key
            
            # Register hotkey
            result = ctypes.windll.user32.RegisterHotKey(
                None, self.hotkey_id, 
                self.MOD_CONTROL | self.MOD_SHIFT, 
                self.VK_O
            )
            
            if result:
                print("Hotkey Ctrl+Shift+O registered successfully")
            else:
                print("Failed to register hotkey - using fallback")
                self._use_fallback()
                
        except Exception as e:
            print(f"Error registering hotkey: {e}")
            self._use_fallback()
    
    def _use_fallback(self):
        """Use keyboard library as fallback"""
        try:
            import keyboard
            keyboard.add_hotkey('ctrl+shift+o', self.callback)
            print("Using keyboard library for hotkey")
        except ImportError:
            print("Warning: keyboard library not available")
            print("Install with: pip install keyboard")
    
    def _unregister_hotkey(self):
        """Unregister global hotkey"""
        if not WINDOWS:
            return
            
        try:
            import ctypes
            ctypes.windll.user32.UnregisterHotKey(None, self.hotkey_id)
        except Exception as e:
            print(f"Error unregistering hotkey: {e}")
        
        # Also try to remove keyboard fallback
        try:
            import keyboard
            keyboard.remove_hotkey('ctrl+shift+o')
        except:
            pass
    
    def _monitor_hotkeys(self):
        """Monitor for hotkey events"""
        if not WINDOWS:
            return
            
        try:
            import ctypes
            from ctypes import wintypes
            
            # Message loop for hotkey
            msg = wintypes.MSG()
            while self.running:
                if ctypes.windll.user32.GetMessageA(ctypes.byref(msg), None, 0, 0) != 0:
                    if msg.message == 0x0312:  # WM_HOTKEY
                        if msg.wParam == self.hotkey_id:
                            if self.callback:
                                self.callback()
                    ctypes.windll.user32.TranslateMessage(ctypes.byref(msg))
                    ctypes.windll.user32.DispatchMessageA(ctypes.byref(msg))
                else:
                    break
                    
        except Exception as e:
            print(f"Error in hotkey monitoring: {e}")


class SimpleHotkeyManager:
    """Fallback hotkey manager using keyboard hooks"""
    
    def __init__(self, callback: Callable[[], None]):
        self.callback = callback
        self.running = False
        self.thread = None
        
    def start(self):
        """Start monitoring keyboard events"""
        if self.running:
            return
            
        try:
            import keyboard
            self.running = True
            
            # Register hotkey
            keyboard.add_hotkey('ctrl+shift+o', self.callback)
            print("Hotkey Ctrl+Shift+O registered using keyboard library")
            
        except ImportError:
            print("Warning: keyboard library not available")
            print("Please install: pip install keyboard")
        except Exception as e:
            print(f"Error setting up hotkey: {e}")
    
    def stop(self):
        """Stop monitoring"""
        if not self.running:
            return
            
        try:
            import keyboard
            keyboard.remove_hotkey('ctrl+shift+o')
            self.running = False
        except:
            pass


def create_hotkey_manager(callback: Callable[[], None]) -> HotkeyManager:
    """Factory function to create appropriate hotkey manager"""
    
    # Try to use Windows API first
    if WINDOWS:
        return HotkeyManager(callback)
    
    # Fallback to keyboard library
    try:
        import keyboard
        return SimpleHotkeyManager(callback)
    except ImportError:
        print("Warning: No hotkey support available")
        print("Install keyboard library: pip install keyboard")
        return None


if __name__ == "__main__":
    # Test hotkey functionality
    def test_callback():
        print("Hotkey pressed!")
    
    manager = create_hotkey_manager(test_callback)
    if manager:
        manager.start()
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            manager.stop()