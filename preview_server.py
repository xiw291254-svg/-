"""
SlipNotify Pro - Local HTTP Preview Server
專用本機測試伺服器
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_server():
    os.chdir(DIRECTORY)
    # Allow port reuse
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}/index.html"
        print("=" * 60)
        print("📋 回條繳繳通 SlipNotify Pro 本機伺服器已啟動！")
        print(f"🌐 瀏覽器請造訪：{url}")
        print("💡 您也可以直接在檔案總管中「雙擊 index.html」直接開啟！")
        print("⌨️  按下 Ctrl + C 即可關閉伺服器。")
        print("=" * 60)
        
        # Try to automatically open in default browser if run directly
        if len(sys.argv) > 1 and sys.argv[1] == '--open':
            webbrowser.open(url)
            
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n伺服器已安全停止。")

if __name__ == '__main__':
    run_server()
