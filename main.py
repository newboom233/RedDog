#!/usr/bin/env python3
"""
LCU (League Client Update) Monitor Application
Main entry point for the tkinter-based LCU monitoring GUI
"""

import tkinter as tk
from tkinter import ttk, messagebox
import threading
import time
import json
import os
import sys

from src.lcu_client import LCUClient
from src.data_manager import DataManager
from src.main_window import MainWindow
from src.overlay_window import OverlayWindow
from src.hotkey_manager_simple import create_hotkey_manager


class LCUMonitorApp:
    """Main application class"""
    
    def __init__(self):
        self.root = None
        self.lcu_client = None
        self.data_manager = None
        self.main_window = None
        self.overlay_window = None
        self.hotkey_manager = None
        self.running = False
        
    def initialize(self):
        """Initialize all components"""
        try:
            # Initialize LCU client
            self.lcu_client = LCUClient(mock_mode=False, mock_port=1947)
            
            # Initialize data manager
            self.data_manager = DataManager(self.lcu_client)
            
            # Create main window
            self.root = tk.Tk()
            self.root.title("LCU Monitor")
            self.root.geometry("800x600")
            
            # Initialize main window
            self.main_window = MainWindow(self.root, self.data_manager)
            
            # Create overlay window (initially hidden)
            self.overlay_window = OverlayWindow(self.data_manager)
            
            # Initialize hotkey manager
            self.hotkey_manager = create_hotkey_manager(self.toggle_overlay)
            if self.hotkey_manager:
                self.hotkey_manager.start()
            
            # Set up window closing handler
            self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
            
            return True
            
        except Exception as e:
            messagebox.showerror("初始化错误", f"无法初始化应用程序: {str(e)}")
            return False
    
    def toggle_overlay(self):
        """Toggle overlay window visibility"""
        if self.overlay_window:
            self.overlay_window.toggle_visibility()
    
    def start_monitoring(self):
        """Start the monitoring loop"""
        self.running = True
        threading.Thread(target=self.monitoring_loop, daemon=True).start()
    
    def monitoring_loop(self):
        """Background thread for periodic data updates"""
        while self.running:
            try:
                # Update game data
                self.data_manager.update_game_data()
                
                # Update UI components
                if self.main_window:
                    self.main_window.update_display()
                if self.overlay_window and self.overlay_window.is_visible():
                    self.overlay_window.update_display()
                
                # Wait for next update (3 seconds)
                time.sleep(3)
                
            except Exception as e:
                print(f"监控错误: {e}")
                time.sleep(5)  # Wait longer on error
    
    def on_closing(self):
        """Handle application closing"""
        self.running = False
        if self.hotkey_manager:
            self.hotkey_manager.stop()
        if self.overlay_window:
            self.overlay_window.destroy()
        self.root.quit()
        self.root.destroy()
    
    def run(self):
        """Run the application"""
        if not self.initialize():
            return
        
        self.start_monitoring()
        self.root.mainloop()


def main():
    """Main entry point"""
    if getattr(sys, 'frozen', False):
        # Running as compiled executable
        application_path = sys._MEIPASS
    else:
        # Running as script
        application_path = os.path.dirname(os.path.abspath(__file__))
    
    os.chdir(application_path)
    
    app = LCUMonitorApp()
    app.run()


if __name__ == "__main__":
    main()