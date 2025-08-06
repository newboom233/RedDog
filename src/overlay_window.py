"""
Overlay Window
Layered window with transparent background and opaque fonts for displaying game information
"""

import tkinter as tk
from tkinter import ttk
import pywinstyles
from typing import Dict, Any, List, Optional
import pyperclip
import win32gui
import win32con
import win32api
from .data_manager import DataManager


class OverlayWindow:
    """Semi-transparent overlay window with no title bar"""
    
    def __init__(self, data_manager: DataManager):
        self.data_manager = data_manager
        self.window = None
        self.visible = False
        self.colors = {
            'bg': '#000000',
            'bg_light': '#16213e',
            'bg_lighter': '#0f3460',
            'primary': '#e94560',
            'secondary': '#f39c12',
            'accent': '#3498db',
            'text': '#ffffff',
            'text_dim': '#b2b2b2',
            'border': '#2a2a3a',
            'success': '#00b894',
            'warning': '#fdcb6e',
            'error': '#e17055'
        }
        
        # Player widget references for updates
        self.player_widgets = {}
        
        self.create_window()
    
    def create_window(self):
        """Create the overlay window with transparent background"""
        self.window = tk.Toplevel()
        self.window.title("LCU Overlay")
        
        # Remove window decorations (title bar)
        self.window.overrideredirect(True)
        
        # Set window attributes
        self.window.attributes('-topmost', True)  # Always on top
        
        # Set window size and position (top-right corner)
        self.window.geometry("400x500+1520+100")
        
        # Make window draggable
        self.make_draggable()
        
        # Configure style
        self.setup_styles()
        
        # Create widgets
        self.create_widgets()
        
        # Apply layered window transparency
        self.apply_transparency()
        
        # Hide initially
        self.window.withdraw()
    
    def setup_styles(self):
        """Setup styles for overlay"""
        # Set background to transparent color (magenta as transparency key)
        self.window.configure(bg='magenta')
        
    def apply_transparency(self):
        """Apply layered window transparency with opaque fonts"""
        try:
            # Get window handle
            hwnd = self.window.winfo_id()
            
            # Set window as layered window
            ex_style = win32gui.GetWindowLong(hwnd, win32con.GWL_EXSTYLE)
            win32gui.SetWindowLong(hwnd, win32con.GWL_EXSTYLE, 
                                 ex_style | win32con.WS_EX_LAYERED)
            
            # Set transparency key to magenta (background will be transparent)
            win32gui.SetLayeredWindowAttributes(hwnd, 
                                              win32api.RGB(255, 0, 255),  # Magenta as transparency key
                                              150,  # 0 alpha for transparent areas
                                              win32con.LWA_COLORKEY)
            
        except Exception as e:
            print(f"Failed to apply transparency: {e}")
            # Fallback to regular transparency
            self.window.configure(bg=self.colors['bg'])
            self.window.attributes('-alpha', 0.9)
    
    def make_draggable(self):
        """Make the window draggable"""
        self.drag_data = {"x": 0, "y": 0}
        
        def start_drag(event):
            self.drag_data["x"] = event.x
            self.drag_data["y"] = event.y
        
        def do_drag(event):
            x = self.window.winfo_x() + (event.x - self.drag_data["x"])
            y = self.window.winfo_y() + (event.y - self.drag_data["y"])
            self.window.geometry(f"+{x}+{y}")
        
        # Bind mouse events to window
        self.window.bind('<Button-1>', start_drag)
        self.window.bind('<B1-Motion>', do_drag)
    
    def create_widgets(self):
        """Create overlay widgets with two-column layout"""
        # Main container with transparent background
        main_frame = tk.Frame(
            self.window,
            bg='magenta',  # Use transparency key color
            padx=5,
            pady=5
        )
        main_frame.pack(fill='both', expand=True)
        
        # Header with solid background
        header_frame = tk.Frame(main_frame, bg=self.colors['bg_light'])
        header_frame.pack(fill='x', pady=(0, 5))
        
        title_label = tk.Label(
            header_frame,
            text="LCU 对战信息",
            bg=self.colors['bg_light'],
            fg=self.colors['text'],
            font=('Segoe UI', 11, 'bold'),
            pady=5
        )
        title_label.pack()
        
        # Teams container with two-column layout
        teams_frame = tk.Frame(main_frame, bg='magenta')
        teams_frame.pack(fill='both', expand=True)
        
        # Configure grid for two columns
        teams_frame.grid_columnconfigure(0, weight=1)
        teams_frame.grid_columnconfigure(1, weight=1)
        
        # Blue team column
        blue_container = tk.Frame(teams_frame, bg=self.colors['bg_light'])
        blue_container.grid(row=0, column=0, sticky='nsew', padx=2, pady=2)
        
        blue_header = tk.Label(
            blue_container,
            text="蓝色方",
            bg=self.colors['bg_light'],
            fg=self.colors['text'],
            font=('Segoe UI', 10, 'bold'),
            pady=3
        )
        blue_header.pack(fill='x')
        
        # Create fixed 5-player widgets for blue team
        self.blue_player_widgets = []
        blue_players_frame = tk.Frame(blue_container, bg=self.colors['bg_light'])
        blue_players_frame.pack(fill='both', expand=True, padx=3, pady=3)
        
        for i in range(5):
            player_widget = self.create_fixed_overlay_player(blue_players_frame, i, 'blue')
            self.blue_player_widgets.append(player_widget)
        
        # Red team column
        red_container = tk.Frame(teams_frame, bg=self.colors['bg_lighter'])
        red_container.grid(row=0, column=1, sticky='nsew', padx=2, pady=2)
        
        red_header = tk.Label(
            red_container,
            text="红色方",
            bg=self.colors['bg_lighter'],
            fg=self.colors['text'],
            font=('Segoe UI', 10, 'bold'),
            pady=3
        )
        red_header.pack(fill='x')
        
        # Create fixed 5-player widgets for red team
        self.red_player_widgets = []
        red_players_frame = tk.Frame(red_container, bg=self.colors['bg_lighter'])
        red_players_frame.pack(fill='both', expand=True, padx=3, pady=3)
        
        for i in range(5):
            player_widget = self.create_fixed_overlay_player(red_players_frame, i, 'red')
            self.red_player_widgets.append(player_widget)
        
        # Footer
        footer_frame = tk.Frame(main_frame, bg=self.colors['bg_light'])
        footer_frame.pack(fill='x', pady=(5, 0))
        
        # Close button
        close_btn = tk.Label(
            footer_frame,
            text="✕ 关闭",
            bg=self.colors['bg_light'],
            fg=self.colors['text'],
            font=('Segoe UI', 8),
            cursor='hand2',
            pady=3
        )
        close_btn.pack()
        close_btn.bind('<Button-1>', lambda e: self.hide())
    
    def create_team_display(self, parent, team_name: str, team_key: str) -> tk.Frame:
        """Create team display section"""
        team_frame = tk.Frame(parent, bg=self.colors['bg_light'])
        
        # Team header
        header = tk.Label(
            team_frame,
            text=team_name,
            bg=self.colors['bg_light'],
            fg=self.colors['text'],
            font=('Segoe UI', 11, 'bold'),
            pady=5
        )
        header.pack(fill='x')
        
        # Players container
        players_container = tk.Frame(team_frame, bg=self.colors['bg_light'])
        players_container.pack(fill='x', padx=5, pady=5)
        
        # Store reference
        self.player_widgets[team_key] = players_container
        
        return team_frame
    
    def create_fixed_overlay_player(self, parent, position: int, team: str) -> Dict[str, Any]:
        """Create fixed overlay player widget for data-only updates"""
        player_frame = tk.Frame(parent, bg=self.colors['bg_lighter'] if team == 'red' else self.colors['bg_light'])
        player_frame.pack(fill='x', padx=1, pady=1)
        
        # Position indicator
        pos_label = tk.Label(
            player_frame,
            text=f"{position + 1}",
            bg=player_frame['bg'],
            fg=self.colors['accent'],
            font=('Segoe UI', 8, 'bold'),
            width=2
        )
        pos_label.pack(side='left', padx=1)
        
        # Champion name
        champ_label = tk.Label(
            player_frame,
            text="???",
            bg=player_frame['bg'],
            fg=self.colors['text'],
            font=('Segoe UI', 9, 'bold'),
            width=4
        )
        champ_label.pack(side='left', padx=1)
        
        # Player info
        info_frame = tk.Frame(player_frame, bg=player_frame['bg'])
        info_frame.pack(side='left', fill='x', expand=True, padx=1)
        
        # Name
        name_label = tk.Label(
            info_frame,
            text="等待玩家...",
            bg=info_frame['bg'],
            fg=self.colors['text'],
            font=('Segoe UI', 8, 'bold'),
            anchor='w'
        )
        name_label.pack(fill='x')
        
        # Spells
        spells_label = tk.Label(
            info_frame,
            text="-- + --",
            bg=info_frame['bg'],
            fg=self.colors['text_dim'],
            font=('Segoe UI', 7),
            anchor='w'
        )
        spells_label.pack(fill='x')
        
        return {
            'frame': player_frame,
            'pos_label': pos_label,
            'champ_label': champ_label,
            'name_label': name_label,
            'spells_label': spells_label
        }
    
    def create_player_widget(self, parent, player_data: Dict[str, Any]) -> tk.Frame:
        """Create individual player widget"""
        player_frame = tk.Frame(
            parent,
            bg=self.colors['bg_lighter'],
            relief='raised',
            borderwidth=1
        )
        player_frame.pack(fill='x', padx=2, pady=1)
        
        # Make entire frame clickable
        player_frame.bind('<Button-1>', 
            lambda e: self.copy_player_info(player_data))
        
        # Champion info
        champ_frame = tk.Frame(player_frame, bg=self.colors['bg_lighter'])
        champ_frame.pack(side='left', padx=5, pady=3)
        
        champ_label = tk.Label(
            champ_frame,
            text=player_data.get('champion', {}).get('name', '?')[:4],
            bg=self.colors['bg_lighter'],
            fg=self.colors['text'],
            font=('Segoe UI', 10, 'bold'),
            width=4
        )
        champ_label.pack()
        
        # Make champion label clickable
        champ_label.bind('<Button-1>', 
            lambda e: self.copy_player_info(player_data))
        
        # Player info
        info_frame = tk.Frame(player_frame, bg=self.colors['bg_lighter'])
        info_frame.pack(side='left', fill='x', expand=True, padx=5)
        
        # Summoner name
        name_label = tk.Label(
            info_frame,
            text=player_data.get('summoner_name', 'Unknown'),
            bg=self.colors['bg_lighter'],
            fg=self.colors['text'],
            font=('Segoe UI', 9, 'bold'),
            anchor='w'
        )
        name_label.pack(fill='x')
        
        # Make name clickable
        name_label.bind('<Button-1>', 
            lambda e: self.copy_player_info(player_data))
        
        # Spells frame
        spells_frame = tk.Frame(info_frame, bg=self.colors['bg_lighter'])
        spells_frame.pack(fill='x', pady=1)
        
        spells = player_data.get('summoner_spells', [])
        for spell in spells:
            spell_name = spell.get('name', 'Unknown')
            spell_btn = tk.Label(
                spells_frame,
                text=spell_name,
                bg=self.colors['accent'],
                fg=self.colors['text'],
                font=('Segoe UI', 8),
                cursor='hand2',
                padx=3,
                pady=1
            )
            spell_btn.pack(side='left', padx=1)
            
            # Make spell clickable
            spell_btn.bind('<Button-1>', 
                lambda e, s=spell_name, p=player_data: 
                self.copy_spell_info(p, s))
        
        # Runes (compact)
        runes = player_data.get('runes', [])
        if runes:
            runes_text = ", ".join([rune.get('name', '?') for rune in runes[:2]])
            runes_label = tk.Label(
                info_frame,
                text=runes_text,
                bg=self.colors['bg_lighter'],
                fg=self.colors['text_dim'],
                font=('Segoe UI', 7),
                anchor='w'
            )
            runes_label.pack(fill='x')
            
            # Make runes clickable
            runes_label.bind('<Button-1>', 
                lambda e: self.copy_player_info(player_data))
        
        return player_frame
    
    def copy_player_info(self, player_data: Dict[str, Any]):
        """Copy complete player information to clipboard"""
        try:
            copy_data = self.data_manager.get_player_copy_data(
                player_data.get('summoner_name', 'Unknown')
            )
            
            if copy_data:
                # Format the copy text
                text = f"召唤师: {copy_data['summoner_name']}\n"
                text += f"英雄: {copy_data['champion']}\n"
                
                # Add spells with cooldown info
                for spell in copy_data['spells']:
                    text += f"技能: {spell['name']} (CD: {spell['cooldown']}s)\n"
                    text += f"冷却完成: {spell['ready_at']}\n"
                
                # Add runes
                if copy_data['runes']:
                    text += f"符文: {', '.join(copy_data['runes'])}\n"
                
                pyperclip.copy(text)
                self.show_copy_notification(f"已复制 {copy_data['summoner_name']} 的信息")
                
        except Exception as e:
            self.show_copy_notification(f"复制失败: {str(e)}")
    
    def copy_spell_info(self, player_data: Dict[str, Any], spell_name: str):
        """Copy specific spell information"""
        try:
            cooldown_info = self.data_manager.calculate_spell_cooldown(spell_name)
            
            text = f"召唤师: {player_data.get('summoner_name', 'Unknown')}\n"
            text += f"英雄: {player_data.get('champion', {}).get('name', 'Unknown')}\n"
            text += f"技能: {cooldown_info['name']}\n"
            text += f"冷却时间: {cooldown_info['cooldown']}秒\n"
            text += f"下次可用: {cooldown_info['ready_at']}\n"
            
            pyperclip.copy(text)
            self.show_copy_notification(f"已复制 {spell_name} 技能信息")
            
        except Exception as e:
            self.show_copy_notification(f"复制失败: {str(e)}")
    
    def show_copy_notification(self, message: str):
        """Show copy notification"""
        notification = tk.Label(
            self.window,
            text=message,
            bg=self.colors['success'],
            fg=self.colors['text'],
            font=('Segoe UI', 9),
            padx=10,
            pady=5
        )
        notification.place(relx=0.5, rely=0.9, anchor='center')
        
        # Auto-hide after 2 seconds
        self.window.after(2000, notification.destroy)
    
    def update_display(self):
        """Update display with data-only updates"""
        if not self.visible:
            return
        
        try:
            # Update blue team
            blue_data = self.data_manager.get_team_data('blue')
            for i in range(5):
                if i < len(blue_data):
                    self.update_overlay_player(self.blue_player_widgets[i], blue_data[i])
                else:
                    self.clear_overlay_player(self.blue_player_widgets[i])
            
            # Update red team
            red_data = self.data_manager.get_team_data('red')
            for i in range(5):
                if i < len(red_data):
                    self.update_overlay_player(self.red_player_widgets[i], red_data[i])
                else:
                    self.clear_overlay_player(self.red_player_widgets[i])
            
        except Exception as e:
            print(f"Error updating overlay: {e}")
    
    def update_overlay_player(self, widget: Dict[str, Any], player_data: Dict[str, Any]):
        """Update overlay player widget with new data"""
        # Update champion name
        champ_name = player_data.get('champion', {}).get('name', '未知')
        widget['champ_label'].config(text=champ_name[:4])
        
        # Update summoner name
        widget['name_label'].config(text=player_data.get('summoner_name', '未知'))
        
        # Update spells
        spells = player_data.get('summoner_spells', [])
        spell_text = "+".join([spell.get('name', '--')[:2] for spell in spells]) if spells else "--"
        widget['spells_label'].config(text=spell_text)
    
    def clear_overlay_player(self, widget: Dict[str, Any]):
        """Clear overlay player widget to default state"""
        widget['champ_label'].config(text="???")
        widget['name_label'].config(text="等待玩家...")
        widget['spells_label'].config(text="--")
    
    def toggle_visibility(self):
        """Toggle overlay visibility"""
        if self.visible:
            self.hide()
        else:
            self.show()
    
    def show(self):
        """Show overlay"""
        if not self.visible:
            self.window.deiconify()
            self.visible = True
            self.update_display()
    
    def hide(self):
        """Hide overlay"""
        if self.visible:
            self.window.withdraw()
            self.visible = False
    
    def is_visible(self) -> bool:
        """Check if overlay is visible"""
        return self.visible
    
    def destroy(self):
        """Destroy overlay window"""
        if self.window:
            self.window.destroy()
            self.window = None