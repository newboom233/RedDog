import sys
from PyQt5.QtWidgets import QWidget, QApplication, QLabel
from PyQt5.QtCore import Qt

class OverlayWindow(QWidget):
    def __init__(self):
        super().__init__()
        # 设置窗口属性：无边框、置顶、不接受焦点
        self.setWindowFlags(
            Qt.FramelessWindowHint |  # 无边框
            Qt.WindowStaysOnTopHint |  # 始终置顶
            Qt.WindowDoesNotAcceptFocus  # 不接受焦点（避免影响游戏操作）
        )
        # 设置半透明红色背景，便于观察
        self.setStyleSheet("background-color: rgba(255, 0, 0, 0.5);")
        self.resize(300, 200)  # 设置窗口大小
        
        # 移动到屏幕中央
        screen_geometry = QApplication.desktop().screenGeometry()
        self.move(
            (screen_geometry.width() - self.width()) // 2,
            (screen_geometry.height() - self.height()) // 2
        )
        
        # 添加标签显示文字
        label = QLabel("这是一个测试窗口", self)
        label.setStyleSheet("color: white; font-size: 24px; font-weight: bold;")
        label.setAlignment(Qt.AlignCenter)
        label.resize(self.size())

if __name__ == '__main__':
    app = QApplication(sys.argv)
    
    # 创建并显示窗口
    overlay = OverlayWindow()
    overlay.show()  # 直接显示窗口
    
    print("窗口已显示！按 Ctrl+C 退出程序")
    sys.exit(app.exec_())