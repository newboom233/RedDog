"""
Main Window
Modern tkinter-based main application window
"""

import tkinter as tk
from tkinter import ttk, messagebox
import threading
from typing import Dict, Any, List
from .data_manager import DataManager


class MainWindow:
    """Main application window with modern UI"""
    
    def __init__(self, root: tk.Tk, data_manager: DataManager):
        self.root = root
        self.data_manager = data_manager
        
        # Configure window
        self.root.title("LCU Monitor - 英雄联盟对战信息监控")
        self.root.geometry("1000x700")
        self.root.minsize(800, 600)
        
        # Performance optimization
        self.update_pending = False
        self.last_update_time = 0
        self.update_interval = 100  # ms
        
        # Configure style
        self.setup_styles()
        
        # Create widgets
        self.create_widgets()
        
        # Register as data listener
        self.data_manager.add_listener(self.on_data_update)
        
        # Start update timer
        self.start_update_timer()
    
    def setup_styles(self):
        """Setup modern ttk styles"""
        self.style = ttk.Style()
        
        # Configure colors
        self.colors = {
            'bg': '#1e1e2e',
            'bg_light': '#2a2a3a',
            'bg_lighter': '#3a3a4a',
            'primary': '#89b4fa',
            'secondary': '#94e2d5',
            'accent': '#f38ba8',
            'text': '#cdd6f4',
            'text_dim': '#7f849c',
            'border': '#585b70',
            'success': '#a6e3a1',
            'warning': '#fab387',
            'error': '#f38ba8'
        }
        
        # Configure window
        self.root.configure(bg=self.colors['bg'])
        
        # Configure ttk styles
        self.style.theme_use('clam')
        
        # Configure frame styles
        self.style.configure(
            'Main.TFrame',
            background=self.colors['bg']
        )
        
        self.style.configure(
            'Card.TFrame',
            background=self.colors['bg_light'],
            relief='raised',
            borderwidth=1
        )
        
        # Configure label styles
        self.style.configure(
            'Header.TLabel',
            background=self.colors['bg'],
            foreground=self.colors['text'],
            font=('Segoe UI', 14, 'bold')
        )
        
        self.style.configure(
            'Title.TLabel',
            background=self.colors['bg_light'],
            foreground=self.colors['text'],
            font=('Segoe UI', 12, 'bold')
        )
        
        self.style.configure(
            'Body.TLabel',
            background=self.colors['bg_light'],
            foreground=self.colors['text'],
            font=('Segoe UI', 10)
        )
        
        self.style.configure(
            'Dim.TLabel',
            background=self.colors['bg_light'],
            foreground=self.colors['text_dim'],
            font=('Segoe UI', 9)
        )
        
        # Configure button styles
        self.style.configure(
            'Primary.TButton',
            background=self.colors['primary'],
            foreground=self.colors['bg'],
            font=('Segoe UI', 10, 'bold'),
            borderwidth=0,
            focusthickness=0,
            padding=8
        )
        
        self.style.map(
            'Primary.TButton',
            background=[('active', self.colors['secondary'])]
        )
        
        # Configure notebook (tabbed interface)
        self.style.configure(
            'TNotebook',
            background=self.colors['bg'],
            borderwidth=0
        )
        
        self.style.configure(
            'TNotebook.Tab',
            background=self.colors['bg_light'],
            foreground=self.colors['text'],
            padding=[20, 8],
            font=('Segoe UI', 10)
        )
        
        self.style.map(
            'TNotebook.Tab',
            background=[('selected', self.colors['primary'])]
        )
    
    def create_widgets(self):
        """Create and layout all widgets"""
        # Main container
        main_frame = ttk.Frame(self.root, style='Main.TFrame')
        main_frame.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Header frame
        self.create_header(main_frame)
        
        # Content area with tabs
        self.create_notebook(main_frame)
        
        # Status bar
        self.create_status_bar(main_frame)
    
    def create_header(self, parent):
        """Create header section"""
        header_frame = ttk.Frame(parent, style='Main.TFrame')
        header_frame.pack(fill='x', pady=(0, 10))
        
        # Title
        title = ttk.Label(
            header_frame,
            text="LCU Monitor",
            style='Header.TLabel'
        )
        title.pack(side='left')
        
        # Connection status
        self.status_label = ttk.Label(
            header_frame,
            text="● 连接中...",
            style='Header.TLabel',
            foreground=self.colors['warning']
        )
        self.status_label.pack(side='right')
        
        # Refresh button
        refresh_btn = ttk.Button(
            header_frame,
            text="刷新",
            style='Primary.TButton',
            command=self.manual_refresh
        )
        refresh_btn.pack(side='right', padx=(0, 10))
    
    def create_notebook(self, parent):
        """Create tabbed interface"""
        self.notebook = ttk.Notebook(parent)
        self.notebook.pack(fill='both', expand=True)
        
        # Champion Select tab
        self.champ_select_frame = ttk.Frame(self.notebook, style='Main.TFrame')
        self.notebook.add(self.champ_select_frame, text="英雄选择")
        self.create_champ_select_tab()
        
        # Settings tab
        self.settings_frame = ttk.Frame(self.notebook, style='Main.TFrame')
        self.notebook.add(self.settings_frame, text="设置")
        self.create_settings_tab()
    
    def create_champ_select_tab(self):
        """Create champion select tab with two-column layout"""
        # Main container for two-column layout
        main_container = ttk.Frame(self.champ_select_frame, style='Main.TFrame')
        main_container.pack(fill='both', expand=True)
        
        # Configure grid layout
        main_container.grid_columnconfigure(0, weight=1, uniform='team')
        main_container.grid_columnconfigure(1, weight=1, uniform='team')
        
        # Blue team column
        blue_container = ttk.Frame(main_container, style='Card.TFrame')
        blue_container.grid(row=0, column=0, sticky='nsew', padx=5, pady=5)
        
        blue_header = ttk.Label(
            blue_container,
            text="蓝色方",
            style='Title.TLabel'
        )
        blue_header.pack(fill='x', pady=(10, 5))
        
        # Create fixed 5-player widgets
        self.blue_player_widgets = []
        blue_players_frame = ttk.Frame(blue_container, style='Card.TFrame')
        blue_players_frame.pack(fill='both', expand=True, padx=10, pady=(0, 10))
        
        for i in range(5):
            player_widget = self.create_fixed_player_widget(blue_players_frame, i, 'blue')
            self.blue_player_widgets.append(player_widget)
        
        # Red team column
        red_container = ttk.Frame(main_container, style='Card.TFrame')
        red_container.grid(row=0, column=1, sticky='nsew', padx=5, pady=5)
        
        red_header = ttk.Label(
            red_container,
            text="红色方",
            style='Title.TLabel'
        )
        red_header.pack(fill='x', pady=(10, 5))
        
        # Create fixed 5-player widgets
        self.red_player_widgets = []
        red_players_frame = ttk.Frame(red_container, style='Card.TFrame')
        red_players_frame.pack(fill='both', expand=True, padx=10, pady=(0, 10))
        
        for i in range(5):
            player_widget = self.create_fixed_player_widget(red_players_frame, i, 'red')
            self.red_player_widgets.append(player_widget)
        
        # Timer info below teams
        self.timer_label = ttk.Label(
            main_container,
            text="等待英雄选择阶段...",
            style='Header.TLabel'
        )
        self.timer_label.grid(row=1, column=0, columnspan=2, pady=10)
    
    def create_fixed_player_widget(self, parent, position: int, team: str) -> Dict[str, Any]:
        """Create fixed player widget that will be updated with data"""
        player_frame = ttk.Frame(parent, style='Card.TFrame')
        player_frame.pack(fill='x', padx=2, pady=1)
        
        # Position label (1-5)
        pos_label = ttk.Label(
            player_frame,
            text=f"{position + 1}",
            style='Body.TLabel',
            foreground=self.colors['accent'],
            font=('Segoe UI', 10, 'bold'),
            width=3
        )
        pos_label.pack(side='left', padx=(5, 2))
        
        # Champion icon placeholder
        champ_frame = ttk.Frame(player_frame, style='Card.TFrame')
        champ_frame.pack(side='left', padx=5, pady=2)
        
        champ_label = ttk.Label(
            champ_frame,
            text="???",
            style='Title.TLabel',
            width=6,
            anchor='center'
        )
        champ_label.pack(padx=3, pady=2)
        
        # Player info container
        info_frame = ttk.Frame(player_frame, style='Card.TFrame')
        info_frame.pack(side='left', fill='x', expand=True, padx=5)
        
        # Player name
        name_label = ttk.Label(
            info_frame,
            text="等待玩家数据...",
            style='Body.TLabel',
            font=('Segoe UI', 10, 'bold')
        )
        name_label.pack(anchor='w')
        
        # Spells container
        spells_frame = ttk.Frame(info_frame, style='Card.TFrame')
        spells_frame.pack(fill='x', pady=1)
        
        spells_label = ttk.Label(
            spells_frame,
            text="技能: -- + --",
            style='Dim.TLabel'
        )
        spells_label.pack(side='left')
        
        # Runes container
        runes_frame = ttk.Frame(info_frame, style='Card.TFrame')
        runes_frame.pack(fill='x', pady=1)
        
        runes_label = ttk.Label(
            runes_frame,
            text="符文: --",
            style='Dim.TLabel'
        )
        runes_label.pack(side='left')
        
        return {
            'frame': player_frame,
            'pos_label': pos_label,
            'champ_label': champ_label,
            'name_label': name_label,
            'spells_label': spells_label,
            'runes_label': runes_label
        }
    
    def create_settings_tab(self):
        """Create settings tab"""
        settings_container = ttk.Frame(self.settings_frame, style='Card.TFrame')
        settings_container.pack(fill='both', expand=True, padx=20, pady=20)
        
        # Settings title
        title = ttk.Label(
            settings_container,
            text="设置",
            style='Title.TLabel'
        )
        title.pack(pady=(0, 20))
        
        # Update interval setting
        interval_frame = ttk.Frame(settings_container, style='Card.TFrame')
        interval_frame.pack(fill='x', pady=5)
        
        ttk.Label(
            interval_frame,
            text="更新间隔 (秒):",
            style='Body.TLabel'
        ).pack(side='left', padx=10)
        
        self.interval_var = tk.StringVar(value="3")
        interval_entry = ttk.Entry(
            interval_frame,
            textvariable=self.interval_var,
            width=5,
            font=('Segoe UI', 10)
        )
        interval_entry.pack(side='left', padx=10)
        
        # Hotkey info
        hotkey_frame = ttk.Frame(settings_container, style='Card.TFrame')
        hotkey_frame.pack(fill='x', pady=5)
        
        ttk.Label(
            hotkey_frame,
            text="快捷键: Ctrl+Shift+O (显示/隐藏悬浮窗)",
            style='Body.TLabel'
        ).pack(pady=10)
    
    def create_status_bar(self, parent):
        """Create status bar"""
        status_frame = ttk.Frame(parent, style='Card.TFrame')
        status_frame.pack(fill='x', pady=(10, 0))
        
        self.status_text = ttk.Label(
            status_frame,
            text="准备就绪",
            style='Body.TLabel'
        )
        self.status_text.pack(side='left', padx=10, pady=5)
        
        self.update_time_label = ttk.Label(
            status_frame,
            text="最后更新: 从未",
            style='Dim.TLabel'
        )
        self.update_time_label.pack(side='right', padx=10, pady=5)
    
    def create_player_card(self, parent, player_data: Dict[str, Any]) -> ttk.Frame:
        """Create individual player card"""
        card = ttk.Frame(parent, style='Card.TFrame')
        card.pack(fill='x', padx=5, pady=2)
        
        # Champion icon placeholder
        champ_frame = ttk.Frame(card, style='Card.TFrame')
        champ_frame.pack(side='left', padx=10, pady=5)
        
        champ_label = ttk.Label(
            champ_frame,
            text=player_data.get('champion', {}).get('name', 'Unknown')[:4],
            style='Title.TLabel',
            width=8,
            anchor='center'
        )
        champ_label.pack(padx=5, pady=5)
        
        # Player info
        info_frame = ttk.Frame(card, style='Card.TFrame')
        info_frame.pack(side='left', fill='x', expand=True, padx=10)
        
        # Summoner name
        name_label = ttk.Label(
            info_frame,
            text=player_data.get('summoner_name', 'Unknown'),
            style='Title.TLabel'
        )
        name_label.pack(anchor='w')
        
        # Spells
        spells_frame = ttk.Frame(info_frame, style='Card.TFrame')
        spells_frame.pack(fill='x', pady=2)
        
        spells = player_data.get('summoner_spells', [])
        spell_text = " + ".join([spell.get('name', 'Unknown') for spell in spells])
        
        spells_label = ttk.Label(
            spells_frame,
            text=f"技能: {spell_text}",
            style='Body.TLabel'
        )
        spells_label.pack(side='left')
        
        # Runes
        runes = player_data.get('runes', [])
        if runes:
            runes_text = ", ".join([rune.get('name', 'Unknown') for rune in runes[:3]])
            runes_label = ttk.Label(
                info_frame,
                text=f"符文: {runes_text}",
                style='Dim.TLabel'
            )
            runes_label.pack(anchor='w')
        
        return card
    
    def update_display(self):
        """Update the display with current data"""
        try:
            # Update connection status
            status = self.data_manager.get_connection_status()
            if status['connected']:
                self.status_label.config(
                    text="● 已连接",
                    foreground=self.colors['success']
                )
            else:
                self.status_label.config(
                    text="● 未连接",
                    foreground=self.colors['error']
                )
            
            # Update timer
            self.update_time_label.config(
                text=f"最后更新: {self.data_manager.get_last_update_time()}"
            )
            
            # Update teams
            self.update_teams_display()
            
            # Update timer info
            if self.data_manager.is_in_champion_select():
                timer = self.data_manager.get_timer_info()
                phase = self.data_manager.get_game_phase()
                self.timer_label.config(
                    text=f"当前阶段: {phase} | 计时器: {timer.get('adjustedTimeLeftInPhase', 'N/A')}"
                )
            else:
                self.timer_label.config(text="等待英雄选择阶段...")
            
        except Exception as e:
            self.status_text.config(text=f"更新错误: {str(e)}")
    
    def update_teams_display(self):
        """Update team displays with data-only updates"""
        # Update blue team
        blue_data = self.data_manager.get_team_data('blue')
        for i in range(5):
            if i < len(blue_data):
                self.update_player_widget(self.blue_player_widgets[i], blue_data[i])
            else:
                self.clear_player_widget(self.blue_player_widgets[i])
        
        # Update red team
        red_data = self.data_manager.get_team_data('red')
        for i in range(5):
            if i < len(red_data):
                self.update_player_widget(self.red_player_widgets[i], red_data[i])
            else:
                self.clear_player_widget(self.red_player_widgets[i])
    
    def update_player_widget(self, widget: Dict[str, Any], player_data: Dict[str, Any]):
        """Update player widget with new data"""
        # Update champion name
        champ_name = player_data.get('champion', {}).get('name', '未知')
        widget['champ_label'].config(text=champ_name[:4])
        
        # Update summoner name
        widget['name_label'].config(text=player_data.get('summoner_name', '未知'))
        
        # Update spells
        spells = player_data.get('summoner_spells', [])
        spell_text = " + ".join([spell.get('name', '--') for spell in spells]) if spells else "-- + --"
        widget['spells_label'].config(text=f"技能: {spell_text}")
        
        # Update runes
        runes = player_data.get('runes', [])
        runes_text = ", ".join([rune.get('name', '--') for rune in runes[:2]]) if runes else "--"
        widget['runes_label'].config(text=f"符文: {runes_text}")
    
    def clear_player_widget(self, widget: Dict[str, Any]):
        """Clear player widget to default state"""
        widget['champ_label'].config(text="???")
        widget['name_label'].config(text="等待玩家数据...")
        widget['spells_label'].config(text="技能: -- + --")
        widget['runes_label'].config(text="符文: --")
    
    def manual_refresh(self):
        """Manually refresh data"""
        self.status_text.config(text="正在刷新...")
        self.data_manager.update_game_data()
        self.update_display()
    
    def on_data_update(self):
        """Called when data manager has new data"""
        self.root.after(0, self.update_display)
    
    def start_update_timer(self):
        """Start automatic update timer"""
        def update_loop():
            self.data_manager.update_game_data()
            self.root.after(3000, update_loop)  # Update every 3 seconds
        
        self.root.after(1000, update_loop)
    
    def destroy(self):
        """Clean up resources"""
        self.data_manager.remove_listener(self.on_data_update)