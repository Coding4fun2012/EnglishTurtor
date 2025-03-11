import requests
import json
from datetime import datetime
import time

API_PORT = 4322  # Astro 默认端口

def send_message(message_data):
    url = f"http://localhost:{API_PORT}/api/message"
    
    try:
        # 使用 requests.post 并明确设置 headers
        response = requests.post(
            url,
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data=json.dumps(message_data)  # 手动序列化 JSON
        )
        
        print(f"URL: {url}")
        print(f"请求头: {dict(response.request.headers)}")
        print(f"发送的消息: {json.dumps(message_data, ensure_ascii=False, indent=2)}")
        print(f"状态码: {response.status_code}")
        
        try:
            response_data = response.json()
            print(f"响应: {json.dumps(response_data, ensure_ascii=False, indent=2)}")
        except json.JSONDecodeError:
            print(f"原始响应: {response.text}")
            
    except requests.exceptions.ConnectionError as e:
        print(f"连接错误: 请确保服务器在端口 {API_PORT} 上运行")
        print(f"错误详情: {e}")
    except requests.exceptions.RequestException as e:
        print(f"请求错误: {e}")
    except Exception as e:
        print(f"其他错误: {e}")

# 测试消息示例
test_messages = [
    {
        "type": "info",
        "message": "Hello from Python!",
        "timestamp": datetime.now().isoformat()
    },
    {
        "type": "warning",
        "message": "This is a test warning",
        "data": {
            "value": 42,
            "status": "active"
        }
    },
    {
        "type": "error",
        "message": "Test error message",
        "code": "E001"
    }
]

if __name__ == "__main__":
    print("开始发送测试消息...")
    print(f"目标URL: http://localhost:{API_PORT}/api/message")
    print("-" * 50)
    
    for i, msg in enumerate(test_messages, 1):
        print(f"\n发送测试消息 {i}/{len(test_messages)}:")
        send_message(msg)
        print("-" * 50)
        time.sleep(2)  # 每条消息之间暂停2秒
    
    print("\n测试完成！") 