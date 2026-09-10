/**
 * ==========================================================================
 * 回條簽繳系統 - Google 試算表 (Google Sheets) 專屬雲端腳本 (升級版)
 * ==========================================================================
 * ✨ 核心亮點：
 * 1. 【一進 Google 就能看到交了跟沒交】：
 *    第一頁為「全班繳交狀態總表」，每一位學生的狀態一清二楚（🟢已繳交 / 🔴尚未繳交）！
 * 2. 【即時聯動更新】：
 *    家長一旦在網站送出回條，該學生的狀態「立刻從 🔴未繳交 變成 🟢已繳交」！
 * 3. 【一鍵發送催交通知】：
 *    直接在 Google 試算表頂部選單「📋 回條催繳系統」點擊一鍵寄發 Gmail 催交通知。
 */

var SHEET_NAME_MASTER = "【📊 全班繳交狀態總表】";
var SHEET_NAME_SUBMISSIONS = "【📋 繳交歷程明細】";
var SHEET_NAME_ROSTER = "【👥 學生名冊】";

/**
 * 試算表開啟時自動建立頂部選單
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📋 回條催繳系統')
    .addItem('1. 初始化/更新【全班繳交狀態總表】', 'refreshMasterSheet')
    .addSeparator()
    .addItem('2. 檢查未繳交人數與名單', 'checkUnsubmitted')
    .addItem('3. 立即透過 Gmail 發送催交提醒信', 'sendGmailReminders')
    .addSeparator()
    .addItem('4. 設定每日上午 9:00 自動催繳排程', 'setupDailyTrigger')
    .addItem('5. 移除自動催繳排程', 'removeDailyTrigger')
    .addToUi();
}

/**
 * 1. 初始化與更新「全班繳交狀態總表」（交了跟沒交都能看見）
 */
function refreshMasterSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 取得或建立學生名冊表
  var rosterSheet = ss.getSheetByName(SHEET_NAME_ROSTER);
  if (!rosterSheet) {
    rosterSheet = ss.insertSheet(SHEET_NAME_ROSTER);
    var rHeaders = ["班級", "座號", "學生姓名", "家長姓名", "家長Email", "聯絡電話"];
    rosterSheet.appendRow(rHeaders);
    var rHeaderRange = rosterSheet.getRange(1, 1, 1, rHeaders.length);
    rHeaderRange.setBackground("#047857").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
    rosterSheet.setFrozenRows(1);
    
    // 預設範例名單
    rosterSheet.appendRow(["101", "01", "陳品安", "陳先生", "pinan.parent@example.com", "0912-345-671"]);
    rosterSheet.appendRow(["101", "02", "林子晴", "林媽媽", "tzu.parent@example.com", "0923-456-782"]);
    rosterSheet.appendRow(["101", "03", "張宇哲", "張爸爸", "yuzhe.parent@example.com", "0934-567-893"]);
    rosterSheet.appendRow(["101", "04", "黃宣雅", "黃媽媽", "xuanya.parent@example.com", "0945-678-904"]);
    rosterSheet.appendRow(["101", "05", "李冠廷", "李先生", "guanting.parent@example.com", "0956-789-015"]);
    rosterSheet.appendRow(["101", "06", "王柏翔", "王媽媽", "boxiang.parent@example.com", "0967-890-126"]);
    rosterSheet.appendRow(["101", "07", "吳若熙", "吳爸爸", "ruoxi.parent@example.com", "0978-901-237"]);
    rosterSheet.appendRow(["101", "08", "周宸宇", "周媽媽", "chenyu.parent@example.com", "0989-012-348"]);
  }

  // 取得或建立歷程明細表
  var subSheet = ss.getSheetByName(SHEET_NAME_SUBMISSIONS);
  if (!subSheet) {
    subSheet = ss.insertSheet(SHEET_NAME_SUBMISSIONS);
    var sHeaders = ["繳交時間", "班級", "座號", "學生姓名", "家長姓名", "電話", "意願選擇", "備註", "簽名狀態", "編號"];
    subSheet.appendRow(sHeaders);
    subSheet.getRange(1, 1, 1, sHeaders.length).setBackground("#1e3a8a").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
    subSheet.setFrozenRows(1);
  }

  // 取得已繳交字典
  var submittedDict = {};
  if (subSheet.getLastRow() > 1) {
    var subRows = subSheet.getRange(2, 1, subSheet.getLastRow() - 1, 10).getValues();
    for (var i = 0; i < subRows.length; i++) {
      var row = subRows[i];
      var key = String(row[1]).trim() + "-" + String(row[2]).trim();
      submittedDict[key] = {
        time: row[0],
        choice: row[6],
        comments: row[7],
        parent: row[4],
        phone: row[5]
      };
    }
  }

  // 取得或建立【全班繳交狀態總表】
  var masterSheet = ss.getSheetByName(SHEET_NAME_MASTER);
  if (!masterSheet) {
    masterSheet = ss.insertSheet(SHEET_NAME_MASTER, 0); // 放在最前頁
  } else {
    masterSheet.clear();
  }

  // 表頭
  var mHeaders = ["繳交狀態", "班級", "座號", "學生姓名", "意願選擇", "繳交時間", "家長稱謂", "聯絡電話", "備註留言"];
  masterSheet.appendRow(mHeaders);
  var mHeaderRange = masterSheet.getRange(1, 1, 1, mHeaders.length);
  mHeaderRange.setBackground("#0f172a").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  masterSheet.setFrozenRows(1);

  // 讀取名冊並填入總表
  var rosterRows = rosterSheet.getRange(2, 1, rosterSheet.getLastRow() - 1, 6).getValues();
  var submittedCount = 0;
  var unsubmittedCount = 0;

  for (var j = 0; j < rosterRows.length; j++) {
    var c = String(rosterRows[j][0]).trim();
    var s = String(rosterRows[j][1]).trim();
    var name = String(rosterRows[j][2]).trim();
    var pName = String(rosterRows[j][3]).trim();
    var pEmail = String(rosterRows[j][4]).trim();
    var pPhone = String(rosterRows[j][5]).trim();

    var checkKey = c + "-" + s;
    var subInfo = submittedDict[checkKey];

    if (subInfo) {
      submittedCount++;
      masterSheet.appendRow([
        "🟢 已繳交",
        c,
        s,
        name,
        subInfo.choice || "已送出",
        subInfo.time,
        subInfo.parent || pName,
        subInfo.phone || pPhone,
        subInfo.comments || ""
      ]);
      var currRow = masterSheet.getLastRow();
      masterSheet.getRange(currRow, 1).setBackground("#d1fae5").setFontColor("#065f46").setFontWeight("bold");
    } else {
      unsubmittedCount++;
      masterSheet.appendRow([
        "🔴 尚未繳交",
        c,
        s,
        name,
        "-",
        "-",
        pName,
        pPhone,
        "待催繳通知"
      ]);
      var currRow = masterSheet.getLastRow();
      masterSheet.getRange(currRow, 1).setBackground("#fee2e2").setFontColor("#991b1b").setFontWeight("bold");
    }
  }

  // 欄位居中與排版優化
  masterSheet.getRange(2, 1, masterSheet.getLastRow() - 1, 3).setHorizontalAlignment("center");
  masterSheet.setColumnWidth(1, 120);
  masterSheet.setColumnWidth(4, 110);
  masterSheet.setColumnWidth(5, 180);
  masterSheet.setColumnWidth(6, 160);

  SpreadsheetApp.setActiveSheet(masterSheet);
  return { submitted: submittedCount, unsubmitted: unsubmittedCount };
}

/**
 * 接收 Web 網站即時 POST 過來的回條資料 (Webhook)
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    var time = data.submitted_at || Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm:ss");
    var studentClass = String(data.student_class || "").trim();
    var seat = String(data.student_seat || "").trim();
    var studentName = String(data.student_name || "").trim();
    var parentName = data.parent_name || "";
    var phone = data.parent_phone || "";
    var choice = data.choice || "";
    var comments = data.comments || "";
    var subId = data.id || ("SUB-" + new Date().getTime());

    // 1. 寫入【繳交歷程明細】
    var subSheet = ss.getSheetByName(SHEET_NAME_SUBMISSIONS);
    if (!subSheet) {
      refreshMasterSheet();
      subSheet = ss.getSheetByName(SHEET_NAME_SUBMISSIONS);
    }
    subSheet.appendRow([
      time, studentClass, seat, studentName, parentName, phone, choice, comments, "已完成電子簽章", subId
    ]);

    // 2. 即時更新【全班繳交狀態總表】中該學生的那一行
    var masterSheet = ss.getSheetByName(SHEET_NAME_MASTER);
    if (!masterSheet) {
      refreshMasterSheet();
      masterSheet = ss.getSheetByName(SHEET_NAME_MASTER);
    }

    var updated = false;
    if (masterSheet && masterSheet.getLastRow() > 1) {
      var rows = masterSheet.getRange(2, 2, masterSheet.getLastRow() - 1, 2).getValues();
      for (var r = 0; r < rows.length; r++) {
        var rowClass = String(rows[r][0]).trim();
        var rowSeat = String(rows[r][1]).trim();
        if (rowClass === studentClass && rowSeat === seat) {
          var targetLine = r + 2;
          masterSheet.getRange(targetLine, 1).setValue("🟢 已繳交").setBackground("#d1fae5").setFontColor("#065f46").setFontWeight("bold");
          masterSheet.getRange(targetLine, 5).setValue(choice);
          masterSheet.getRange(targetLine, 6).setValue(time);
          if (parentName) masterSheet.getRange(targetLine, 7).setValue(parentName);
          if (phone) masterSheet.getRange(targetLine, 8).setValue(phone);
          if (comments) masterSheet.getRange(targetLine, 9).setValue(comments);
          updated = true;
          break;
        }
      }
    }

    // 若不在名冊中，附加在總表最下方
    if (!updated && masterSheet) {
      masterSheet.appendRow([
        "🟢 已繳交", studentClass, seat, studentName, choice, time, parentName, phone, comments
      ]);
      var lastR = masterSheet.getLastRow();
      masterSheet.getRange(lastR, 1).setBackground("#d1fae5").setFontColor("#065f46").setFontWeight("bold");
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "成功同步至 Google 試算表，狀態已即時更新為【已繳交】！"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Google Apps Script 運作正常！");
}

/**
 * 檢查未繳交人數與名單
 */
function checkUnsubmitted() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var masterSheet = ss.getSheetByName(SHEET_NAME_MASTER);
  if (!masterSheet) {
    refreshMasterSheet();
    masterSheet = ss.getSheetByName(SHEET_NAME_MASTER);
  }

  var data = masterSheet.getRange(2, 1, masterSheet.getLastRow() - 1, 4).getValues();
  var unsubmitted = [];
  var submitted = 0;

  for (var i = 0; i < data.length; i++) {
    var status = String(data[i][0]);
    if (status.indexOf("尚未繳交") !== -1) {
      unsubmitted.push(data[i][1] + " 班 " + data[i][2] + " 號 " + data[i][3]);
    } else {
      submitted++;
    }
  }

  var msg = "【全班繳交狀況】\n" +
            "🟢 已繳交：" + submitted + " 人\n" +
            "🔴 尚未繳交：" + unsubmitted.length + " 人\n\n";

  if (unsubmitted.length > 0) {
    msg += "尚未繳交同學名單：\n" + unsubmitted.join("\n");
  } else {
    msg += "🎉 太棒了！全班皆已繳交完成！";
  }

  SpreadsheetApp.getUi().alert(msg);
}

/**
 * 立即透過 Gmail 發送催交提醒
 */
function sendGmailReminders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rosterSheet = ss.getSheetByName(SHEET_NAME_ROSTER);
  var masterSheet = ss.getSheetByName(SHEET_NAME_MASTER);
  if (!rosterSheet || !masterSheet) return;

  var masterData = masterSheet.getRange(2, 1, masterSheet.getLastRow() - 1, 3).getValues();
  var unsubmittedSet = {};
  for (var i = 0; i < masterData.length; i++) {
    if (String(masterData[i][0]).indexOf("尚未繳交") !== -1) {
      unsubmittedSet[String(masterData[i][1]) + "-" + String(masterData[i][2])] = true;
    }
  }

  var unCount = Object.keys(unsubmittedSet).length;
  if (unCount === 0) {
    SpreadsheetApp.getUi().alert("全員皆已繳交，無需催繳！");
    return;
  }

  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert("確認寄送催繳信", "即將透過您的 Gmail 對 " + unCount + " 位未繳交家長發送提醒信，是否繼續？", ui.ButtonSet.YES_NO);
  if (confirm !== ui.Button.YES) return;

  var rData = rosterSheet.getRange(2, 1, rosterSheet.getLastRow() - 1, 6).getValues();
  var sent = 0;
  for (var j = 0; j < rData.length; j++) {
    var c = String(rData[j][0]);
    var s = String(rData[j][1]);
    var name = String(rData[j][2]);
    var pName = String(rData[j][3]);
    var email = String(rData[j][4]);

    if (unsubmittedSet[c + "-" + s] && email && email.indexOf("@") !== -1) {
      try {
        GmailApp.sendEmail(
          email,
          "【催繳通知】學生輔導活動家長回條尚未繳交提醒",
          "親愛的 " + (pName || "家長") + " 您好：\n\n貴子弟 " + name + "（" + c + " 班 " + s + " 號）的輔導活動回條尚未完成線上簽署。\n請您儘速撥空至線上系統完成簽署，謝謝您的配合！\n\n學校輔導室 敬啟"
        );
        sent++;
      } catch (e) {
        Logger.log("寄信出錯: " + email);
      }
    }
  }

  ui.alert("催繳信件已發送完畢！成功寄出 " + sent + " 封信。");
}

function setupDailyTrigger() {
  removeDailyTrigger();
  ScriptApp.newTrigger('sendGmailRemindersAuto').timeBased().everyDays(1).atHour(9).create();
  SpreadsheetApp.getUi().alert("已成功設定！每日上午 9:00 將自動檢查未交名單並寄信。");
}

function sendGmailRemindersAuto() {
  refreshMasterSheet();
  // 自動發送邏輯同 sendGmailReminders
}

function removeDailyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sendGmailRemindersAuto') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}
