#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
回條簽繳與自動催繳系統 (Notice & Reply Management System)
後端核心伺服器與自動排程催繳引擎
====================================================================
"""

import os
import sys
import json
import time
import datetime
import threading
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header

# 處理 Windows cmd/powershell cp950 編碼問題
if sys.platform == "win32":
    import io
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except Exception:
        pass

import requests
from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
CONFIG_PATH = os.path.join(DATA_DIR, "config.json")
ROSTER_PATH = os.path.join(DATA_DIR, "roster.json")
SUBMISSIONS_PATH = os.path.join(DATA_DIR, "submissions.json")
LOGS_PATH = os.path.join(DATA_DIR, "remind_logs.json")

os.makedirs(DATA_DIR, exist_ok=True)

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# ------------------------------------------------------------------
# 資料存取輔助函數
# ------------------------------------------------------------------
def read_json_file(file_path, default_value):
    if not os.path.exists(file_path):
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(default_value, f, ensure_ascii=False, indent=2)
        return default_value
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return default_value

def write_json_file(file_path, data):
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error writing {file_path}: {e}")
        return False

# ------------------------------------------------------------------
# Google Sheets 非同步同步
# ------------------------------------------------------------------
def sync_to_google_sheets_async(submission_data):
    """背景執行緒將資料推播至 Google Apps Script Webhook"""
    def _worker():
        config = read_json_file(CONFIG_PATH, {})
        webhook_url = config.get("google_sheets", {}).get("webhook_url", "").strip()
        if not webhook_url:
            print("[Google Sheets] 未設定 Webhook URL，略過同步。")
            return
        
        try:
            print(f"[Google Sheets] 正在同步資料至 Google Sheets: {submission_data.get('student_name')}")
            # 準備輕量資料（簽名太長時送出截記或純標註，避免 Webhook 封包過大）
            payload = dict(submission_data)
            if "signature" in payload and len(payload["signature"]) > 200:
                payload["has_signature"] = True
            
            headers = {"Content-Type": "application/json"}
            res = requests.post(webhook_url, json=payload, headers=headers, timeout=10)
            print(f"[Google Sheets] 回應狀態碼: {res.status_code}")
        except Exception as err:
            print(f"[Google Sheets] 同步失敗: {err}")

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()

# ------------------------------------------------------------------
# Email 寄送與催繳邏輯
# ------------------------------------------------------------------
def send_email(to_email, subject, body_text):
    config = read_json_file(CONFIG_PATH, {})
    email_cfg = config.get("email_config", {})
    smtp_server = email_cfg.get("smtp_server", "smtp.gmail.com")
    smtp_port = int(email_cfg.get("smtp_port", 587))
    smtp_user = email_cfg.get("smtp_user", "").strip()
    smtp_password = email_cfg.get("smtp_password", "").strip()
    sender_name = email_cfg.get("sender_name", "輔導處回條通知系統")

    if not smtp_user or not smtp_password:
        return False, "尚未設定寄件者 Email 帳號或應用程式密碼"

    try:
        msg = MIMEMultipart()
        msg['From'] = f"{Header(sender_name, 'utf-8').encode()} <{smtp_user}>"
        msg['To'] = to_email
        msg['Subject'] = Header(subject, 'utf-8').encode()
        msg.attach(MIMEText(body_text, 'plain', 'utf-8'))

        server = smtplib.SMTP(smtp_server, smtp_port, timeout=12)
        server.ehlo()
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, [to_email], msg.as_string())
        server.quit()
        return True, "寄送成功"
    except Exception as e:
        return False, str(e)

def perform_reminder_blast(trigger_type="手動即時催繳"):
    """執行催繳：搜尋未繳交學生，對家長寄信並寫入日誌"""
    config = read_json_file(CONFIG_PATH, {})
    roster = read_json_file(ROSTER_PATH, [])
    submissions = read_json_file(SUBMISSIONS_PATH, [])
    
    # 建立已繳交集合 (比對 班級-座號 或 姓名)
    submitted_keys = set()
    for sub in submissions:
        c = str(sub.get("student_class", "")).strip()
        s = str(sub.get("student_seat", "")).strip()
        name = str(sub.get("student_name", "")).strip()
        if c and s:
            submitted_keys.add(f"{c}-{s}")
        if name:
            submitted_keys.add(name)

    # 找出未繳交學生
    unsubmitted_students = []
    for stu in roster:
        c = str(stu.get("student_class", "")).strip()
        s = str(stu.get("student_seat", "")).strip()
        name = str(stu.get("student_name", "")).strip()
        key_cs = f"{c}-{s}"
        if key_cs not in submitted_keys and name not in submitted_keys:
            unsubmitted_students.append(stu)

    if not unsubmitted_students:
        return {
            "success": True,
            "message": "全員皆已完成回條繳交，無需催繳！",
            "count": 0,
            "recipients": []
        }

    rem_cfg = config.get("reminder_settings", {})
    act_cfg = config.get("activity", {})
    subject_tmpl = rem_cfg.get("email_subject", "【催交提醒】輔導回條尚未填寫通知")
    body_tmpl = rem_cfg.get("email_template", "親愛的家長您好：請儘速填寫回條。")

    sent_list = []
    failed_list = []

    for stu in unsubmitted_students:
        p_email = stu.get("parent_email", "").strip()
        p_name = stu.get("parent_name", "家長")
        s_name = stu.get("student_name", "學生")
        s_class = stu.get("student_class", "")
        s_seat = stu.get("student_seat", "")
        deadline = act_cfg.get("deadline", "近日")
        title = act_cfg.get("title", "輔導活動回條")
        org = act_cfg.get("organization", "輔導處")

        # 替換變數
        body = body_tmpl.replace("{parent_name}", p_name)\
                        .replace("{student_name}", s_name)\
                        .replace("{student_class}", s_class)\
                        .replace("{student_seat}", s_seat)\
                        .replace("{activity_title}", title)\
                        .replace("{deadline}", deadline)\
                        .replace("{organization}", org)\
                        .replace("{form_url}", "http://localhost:5000/")

        subject = subject_tmpl.replace("{student_name}", s_name)

        if p_email and "@" in p_email:
            ok, err_msg = send_email(p_email, subject, body)
            if ok:
                sent_list.append(f"{s_name} ({p_email})")
            else:
                failed_list.append(f"{s_name} ({p_email}) - {err_msg}")
        else:
            failed_list.append(f"{s_name} (未設定有效 Email)")

    # 記錄日誌
    logs = read_json_file(LOGS_PATH, [])
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = {
        "id": f"REM-{int(time.time())}",
        "timestamp": now_str,
        "type": trigger_type,
        "target_count": len(unsubmitted_students),
        "success_count": len(sent_list),
        "failed_count": len(failed_list),
        "recipients": sent_list if sent_list else [f"{s.get('student_name')} (待發)" for s in unsubmitted_students],
        "status": f"已完成提醒發送 (成功: {len(sent_list)}, 待發/無Email: {len(failed_list)})"
    }
    logs.insert(0, log_entry)
    write_json_file(LOGS_PATH, logs[:50]) # 保留最近50筆

    # 更新上次發送日期
    config["reminder_settings"]["last_sent_date"] = datetime.date.today().isoformat()
    write_json_file(CONFIG_PATH, config)

    return {
        "success": True,
        "message": f"催繳處理完畢！共檢查 {len(unsubmitted_students)} 位未交者",
        "target_count": len(unsubmitted_students),
        "success_count": len(sent_list),
        "failed_count": len(failed_list),
        "failed_details": failed_list,
        "unsubmitted_students": unsubmitted_students
    }

# ------------------------------------------------------------------
# 背景自動排程定時器 (每 60 秒檢查一次是否達到每日催繳時間)
# ------------------------------------------------------------------
def background_scheduler_worker():
    print("[Scheduler] 自動催繳排程守護執行緒已啟動...")
    while True:
        try:
            time.sleep(30)
            config = read_json_file(CONFIG_PATH, {})
            rem_cfg = config.get("reminder_settings", {})
            if not rem_cfg.get("auto_enabled", False):
                continue

            target_time_str = rem_cfg.get("daily_time", "09:00").strip()
            now = datetime.datetime.now()
            current_hm = now.strftime("%H:%M")
            today_iso = datetime.date.today().isoformat()
            last_sent_date = rem_cfg.get("last_sent_date", "")

            # 檢查時間是否吻合，且今天尚未執行過
            if current_hm == target_time_str and last_sent_date != today_iso:
                print(f"[Scheduler] 達到預設催繳時間 {target_time_str}，啟動每日自動催繳！")
                perform_reminder_blast(trigger_type="系統每日定時自動催繳")

        except Exception as e:
            print(f"[Scheduler] 排程異常: {e}")

scheduler_thread = threading.Thread(target=background_scheduler_worker, daemon=True)
scheduler_thread.start()

# ------------------------------------------------------------------
# API 路由
# ------------------------------------------------------------------

@app.route("/")
def serve_index():
    return send_from_directory("templates", "index.html")

@app.route("/admin")
@app.route("/admin.html")
def serve_admin():
    return send_from_directory("templates", "admin.html")

@app.route("/google-sheets-script.js")
def serve_gas_script():
    return send_from_directory(BASE_DIR, "google-sheets-script.js")

@app.route("/api/config", methods=["GET"])
def get_config():
    config = read_json_file(CONFIG_PATH, {})
    return jsonify(config)

@app.route("/api/config", methods=["POST"])
def update_config():
    new_config = request.json or {}
    curr_config = read_json_file(CONFIG_PATH, {})
    
    # 深度更新或合併
    for key, val in new_config.items():
        if isinstance(val, dict) and key in curr_config and isinstance(curr_config[key], dict):
            curr_config[key].update(val)
        else:
            curr_config[key] = val
            
    if write_json_file(CONFIG_PATH, curr_config):
        return jsonify({"status": "success", "message": "設定已成功儲存", "config": curr_config})
    return jsonify({"status": "error", "message": "儲存設定失敗"}), 500

@app.route("/api/stats", methods=["GET"])
def get_stats():
    roster = read_json_file(ROSTER_PATH, [])
    submissions = read_json_file(SUBMISSIONS_PATH, [])
    config = read_json_file(CONFIG_PATH, {})

    # 已繳交 Key
    submitted_dict = {}
    choices_count = {}
    for sub in submissions:
        c = str(sub.get("student_class", "")).strip()
        s = str(sub.get("student_seat", "")).strip()
        name = str(sub.get("student_name", "")).strip()
        key = f"{c}-{s}" if (c and s) else name
        submitted_dict[key] = sub
        
        choice = sub.get("choice", "未填寫")
        choices_count[choice] = choices_count.get(choice, 0) + 1

    total_roster = len(roster)
    submitted_count = len(submissions)
    
    # 找出未繳交學生名單
    unsubmitted_list = []
    for stu in roster:
        c = str(stu.get("student_class", "")).strip()
        s = str(stu.get("student_seat", "")).strip()
        name = str(stu.get("student_name", "")).strip()
        key_cs = f"{c}-{s}"
        if key_cs not in submitted_dict and name not in submitted_dict:
            unsubmitted_list.append(stu)

    unsubmitted_count = len(unsubmitted_list)
    completion_rate = round((submitted_count / total_roster * 100), 1) if total_roster > 0 else 0

    return jsonify({
        "total_roster": total_roster,
        "submitted_count": submitted_count,
        "unsubmitted_count": unsubmitted_count,
        "completion_rate": completion_rate,
        "choices_count": choices_count,
        "unsubmitted_list": unsubmitted_list,
        "activity_title": config.get("activity", {}).get("title", ""),
        "deadline": config.get("activity", {}).get("deadline", "")
    })

@app.route("/api/master-status", methods=["GET"])
def get_master_status():
    """回傳整合名冊：每位學生皆有明確的『已繳交』或『未繳交』狀態與繳交詳情"""
    roster = read_json_file(ROSTER_PATH, [])
    submissions = read_json_file(SUBMISSIONS_PATH, [])

    # 建立已繳交索引表 (支援 班級-座號 與 姓名)
    submitted_map = {}
    for sub in submissions:
        c = str(sub.get("student_class", "")).strip()
        s = str(sub.get("student_seat", "")).strip()
        name = str(sub.get("student_name", "")).strip()
        if c and s:
            submitted_map[f"{c}-{s}"] = sub
        if name:
            submitted_map[name] = sub

    master_list = []
    submitted_count = 0
    unsubmitted_count = 0

    for stu in roster:
        c = str(stu.get("student_class", "")).strip()
        s = str(stu.get("student_seat", "")).strip()
        name = str(stu.get("student_name", "")).strip()
        key = f"{c}-{s}"
        
        sub = submitted_map.get(key) or submitted_map.get(name)
        if sub:
            submitted_count += 1
            master_list.append({
                "student_id": stu.get("id"),
                "student_class": c,
                "student_seat": s,
                "student_name": name,
                "parent_name": sub.get("parent_name") or stu.get("parent_name", ""),
                "parent_phone": sub.get("parent_phone") or stu.get("parent_phone", ""),
                "parent_email": stu.get("parent_email", ""),
                "status": "submitted",
                "status_text": "已繳交",
                "submitted_at": sub.get("submitted_at", ""),
                "choice": sub.get("choice", ""),
                "comments": sub.get("comments", ""),
                "has_signature": bool(sub.get("signature")),
                "signature": sub.get("signature", "")
            })
        else:
            unsubmitted_count += 1
            master_list.append({
                "student_id": stu.get("id"),
                "student_class": c,
                "student_seat": s,
                "student_name": name,
                "parent_name": stu.get("parent_name", ""),
                "parent_phone": stu.get("parent_phone", ""),
                "parent_email": stu.get("parent_email", ""),
                "status": "unsubmitted",
                "status_text": "尚未繳交",
                "submitted_at": "",
                "choice": "",
                "comments": "",
                "has_signature": False,
                "signature": ""
            })

    # 排序：先按班級，再按座號排序
    try:
        master_list.sort(key=lambda x: (x["student_class"], int(x["student_seat"]) if x["student_seat"].isdigit() else 999))
    except Exception:
        pass

    return jsonify({
        "total": len(master_list),
        "submitted_count": submitted_count,
        "unsubmitted_count": unsubmitted_count,
        "students": master_list
    })

@app.route("/api/submissions", methods=["GET"])
def get_submissions():
    submissions = read_json_file(SUBMISSIONS_PATH, [])
    return jsonify(submissions)

@app.route("/api/submissions", methods=["POST"])
def submit_reply():
    data = request.json or {}
    student_class = str(data.get("student_class", "")).strip()
    student_seat = str(data.get("student_seat", "")).strip()
    student_name = str(data.get("student_name", "")).strip()
    parent_name = str(data.get("parent_name", "")).strip()
    parent_phone = str(data.get("parent_phone", "")).strip()
    choice = str(data.get("choice", "")).strip()
    comments = str(data.get("comments", "")).strip()
    signature = str(data.get("signature", "")).strip()

    if not student_class or not student_seat or not student_name or not choice:
        return jsonify({"status": "error", "message": "請完整填寫班級、座號、學生姓名與意願選項！"}), 400

    submissions = read_json_file(SUBMISSIONS_PATH, [])

    # 檢查是否已繳交過
    for existing in submissions:
        if (str(existing.get("student_class")).strip() == student_class and 
            str(existing.get("student_seat")).strip() == student_seat):
            return jsonify({
                "status": "error",
                "message": f"該學生（{student_class} 班 {student_seat} 號 {student_name}）已於 {existing.get('submitted_at')} 完成回條繳交，無需重複填寫！"
            }), 409

    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    submission_id = f"SUB-{int(time.time())}-{student_seat.zfill(2)}"

    new_sub = {
        "id": submission_id,
        "student_class": student_class,
        "student_seat": student_seat,
        "student_name": student_name,
        "parent_name": parent_name,
        "parent_phone": parent_phone,
        "choice": choice,
        "comments": comments,
        "signature": signature,
        "submitted_at": now_str,
        "google_synced": False
    }

    submissions.insert(0, new_sub)
    write_json_file(SUBMISSIONS_PATH, submissions)

    # 非同步即時同步至 Google Sheets
    sync_to_google_sheets_async(new_sub)

    return jsonify({
        "status": "success",
        "message": "回條已成功繳交！感謝您的填寫。",
        "submission": {
            "id": new_sub["id"],
            "student_name": new_sub["student_name"],
            "submitted_at": new_sub["submitted_at"]
        }
    })

@app.route("/api/roster", methods=["GET"])
def get_roster():
    roster = read_json_file(ROSTER_PATH, [])
    return jsonify(roster)

@app.route("/api/roster", methods=["POST"])
def add_roster():
    data = request.json or {}
    # 支援批次新增或單筆新增
    students = data.get("students", [])
    if not students and "student_name" in data:
        students = [data]

    roster = read_json_file(ROSTER_PATH, [])
    added = 0
    for s in students:
        s_name = str(s.get("student_name", "")).strip()
        if not s_name:
            continue
        new_stu = {
            "id": s.get("id") or f"STU{int(time.time()*1000)%1000000}",
            "student_class": str(s.get("student_class", "101")).strip(),
            "student_seat": str(s.get("student_seat", "01")).strip().zfill(2),
            "student_name": s_name,
            "parent_name": str(s.get("parent_name", "")).strip(),
            "parent_email": str(s.get("parent_email", "")).strip(),
            "parent_phone": str(s.get("parent_phone", "")).strip()
        }
        roster.append(new_stu)
        added += 1

    write_json_file(ROSTER_PATH, roster)
    return jsonify({"status": "success", "message": f"成功新增 {added} 位學生名單", "total": len(roster)})

@app.route("/api/roster/<student_id>", methods=["DELETE"])
def delete_roster_item(student_id):
    roster = read_json_file(ROSTER_PATH, [])
    new_roster = [s for s in roster if str(s.get("id")) != str(student_id)]
    write_json_file(ROSTER_PATH, new_roster)
    return jsonify({"status": "success", "message": "已自名冊刪除"})

@app.route("/api/remind/trigger", methods=["POST"])
def trigger_reminder():
    res = perform_reminder_blast(trigger_type="管理員手動催繳")
    return jsonify(res)

@app.route("/api/remind/logs", methods=["GET"])
def get_reminder_logs():
    logs = read_json_file(LOGS_PATH, [])
    return jsonify(logs)

@app.route("/api/remind/line-template", methods=["GET"])
def get_line_template():
    """產生適合直接貼至 LINE 班級群組或家長群組的催繳訊息"""
    config = read_json_file(CONFIG_PATH, {})
    roster = read_json_file(ROSTER_PATH, [])
    submissions = read_json_file(SUBMISSIONS_PATH, [])
    
    submitted_keys = set()
    for sub in submissions:
        c = str(sub.get("student_class", "")).strip()
        s = str(sub.get("student_seat", "")).strip()
        submitted_keys.add(f"{c}-{s}")

    unsubmitted_list = []
    for stu in roster:
        c = str(stu.get("student_class", "")).strip()
        s = str(stu.get("student_seat", "")).strip()
        if f"{c}-{s}" not in submitted_keys:
            unsubmitted_list.append(stu)

    act = config.get("activity", {})
    title = act.get("title", "學生輔導活動家長回條")
    deadline = act.get("deadline", "近日")

    msg_lines = [
        "📢【親愛的家長您好，輔導回條催繳提醒】",
        f"主題：{title}",
        f"截止時間：{deadline}",
        "",
        f"目前尚有 {len(unsubmitted_list)} 位同學回條尚未填寫："
    ]

    if unsubmitted_list:
        for u in unsubmitted_list:
            msg_lines.append(f"  ▫️ {u.get('student_class')}班 {u.get('student_seat')}號 {u.get('student_name')}")
    else:
        msg_lines.append("  🎉 全班皆已完成簽署，非常感謝大家！")

    msg_lines.extend([
        "",
        "請尚未填寫的家長，點擊下方網址快速於線上完成簽名確認：",
        "👉 線上簽繳回條：http://localhost:5000/",
        "",
        "如有任何問題，歡迎隨時與我們聯繫，謝謝各位家長的配合！😊"
    ])

    return jsonify({
        "template_text": "\n".join(msg_lines),
        "unsubmitted_count": len(unsubmitted_list)
    })

@app.route("/api/test-google-sheets", methods=["POST"])
def test_google_sheets():
    data = request.json or {}
    webhook_url = data.get("webhook_url", "").strip()
    if not webhook_url:
        return jsonify({"status": "error", "message": "請提供 Webhook 網址"}), 400

    test_payload = {
        "id": "TEST-PING",
        "submitted_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "student_class": "999",
        "student_seat": "99",
        "student_name": "【系統連線測試員】",
        "parent_name": "系統測試",
        "parent_phone": "0900-000-000",
        "choice": "連線測試成功",
        "comments": "這是一筆由系統後台送出的連線測試紀錄，可手動於試算表中刪除。",
        "signature": ""
    }

    try:
        res = requests.post(webhook_url, json=test_payload, timeout=8)
        if res.status_code == 200:
            return jsonify({
                "status": "success",
                "message": "成功連線並寫入 Google 試算表！請開啟您的 Google 試算表確認是否出現【系統連線測試員】一筆資料。"
            })
        else:
            return jsonify({
                "status": "error",
                "message": f"Google 伺服器回傳狀態碼 {res.status_code}，請檢查 Apps Script 是否已公開部署為「網頁應用程式 (所有人可存取)」"
            }), 400
    except Exception as e:
        return jsonify({"status": "error", "message": f"連線失敗: {str(e)}"}), 500

@app.route("/api/test-email", methods=["POST"])
def test_email():
    data = request.json or {}
    test_target = data.get("test_email", "").strip()
    if not test_target:
        return jsonify({"status": "error", "message": "請填寫測試收件 Email"}), 400

    subject = "【回條系統】Email 寄送連線測試信"
    body = "您好：\n這是一封來自「回條確認與自動催繳系統」的測試信件。\n當您收到此信時，代表系統 SMTP Email 發信設定完全正常！"
    ok, msg = send_email(test_target, subject, body)
    if ok:
        return jsonify({"status": "success", "message": f"測試信已成功寄出至 {test_target}！"})
    return jsonify({"status": "error", "message": f"寄信失敗: {msg}"}), 400


if __name__ == "__main__":
    print("=" * 60)
    print(" [Notice & Reply Management System] 回條簽繳與催繳系統啟動中...")
    print(" -> 前台線上簽繳網址: http://localhost:5000/")
    print(" -> 教師/管理後台網址: http://localhost:5000/admin")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5000, debug=False)
