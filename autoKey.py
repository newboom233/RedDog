import keyboard
import pyautogui
import time

def on_key_event(e):
    # 只在按下数字1时触发
    if e.name == '1' and e.event_type == 'down':
        # 模拟按下 Enter
        pyautogui.press('enter')
        time.sleep(0.05)  # 稍微等待，避免粘连
        # 输入内容
        pyautogui.write('你要发送的内容')
        time.sleep(0.05)
        # 再次按下 Enter 发送
        pyautogui.press('enter')

# 监听全局按键
keyboard.hook(on_key_event)

print("全局监听已启动，按数字1会自动输入并发送内容。按 Ctrl+C 退出。")
keyboard.wait()  # 阻塞主线程