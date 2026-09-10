# 📋 線上回條簽繳與 Google 試算表即時同步自動催繳系統

專為學校班級、輔導處、機構或活動打造的現代化回條簽核系統。
具備家長線上電子手寫簽章、Google 試算表（Google Sheets）即時寫入，以及智慧自動催繳提醒功能！

---

## ✨ 核心特色亮點

1. ✍️ **家長/學生線上簽繳端 (`/`)**：
   - 美觀直覺的活動通知卡片，支援班級、座號、姓名智慧自動補全。
   - 支援手機觸控、平板與電腦滑鼠的**流暢手寫電子簽章**。
   - 防重複繳交判定，送出後即時產生正式電子收執憑證。

2. 📊 **Google 試算表 (Google Sheets) 即時同步**：
   - 家長在網頁一完成簽署，Google 試算表**即時新增一筆紀錄**！
   - 無需手動匯入匯出，手機或電腦打開 Google 即可隨時查看最新名冊與繳交狀態。

3. ⚡ **智慧雙軌催繳提醒系統 (`/admin`)**：
   - **一鍵 Email 催繳**：自動比對未繳交學生名單，一鍵發送信件給未繳交家長。
   - **LINE 班級群組催交文案生成器**：自動整理未交學生座號姓名與網址，一鍵複製直接轉貼家長群組。
   - **自動定時催繳排程**：可設定每日固定時間（例如 09:00），背景自動排程定時檢查未交名單並發送提醒。
   - **Google 試算表內部催繳**：透過專屬 Apps Script，甚至直接在 Google 試算表選單中就能發送 Gmail 催繳！

---

## 🚀 快速啟動

### 方式一：直接雙擊運行（Windows）
直接雙擊點擊目錄中的 `run.bat` 即可啟動！

### 方式二：終端機指令啟動
```powershell
python app.py
```

啟動後瀏覽器打開：
- **家長簽繳頁面**：[http://localhost:5000/](http://localhost:5000/)
- **管理與催繳後台**：[http://localhost:5000/admin](http://localhost:5000/admin)

---

## 📁 檔案結構說明

- `app.py`：後端伺服器、API 路由、Google Sheets Webhook 轉發與背景自動催繳定時器
- `templates/index.html`：家長/學生回條簽繳前台（含電子簽名板與收執憑證）
- `templates/admin.html`：教師與管理員後台看板（統計儀表板、名冊管理、催繳中心、Google 設定）
- `static/css/style.css`：現代化玻璃擬態 Design System 樣式庫
- `static/js/signature.js`：高解析平滑電子手寫簽名控制器
- `google-sheets-script.js`：Google 試算表專屬擴充腳本 (Google Apps Script)
- `GOOGLE_SHEETS_GUIDE.md`：Google 試算表串接與無伺服器自動催繳圖文指南
- `data/`：本地資料庫 (設定、學生名冊、已繳交回條、催繳發送日誌)
