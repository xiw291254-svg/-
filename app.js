/**
 * SlipNotify Pro - Main Application Logic
 * 回條繳繳通 - 回條追蹤與自動催繳提醒系統
 */

// ==========================================
// 1. Initial State & Default Sample Data
// ==========================================
const STORAGE_KEY = 'slipnotify_pro_data_v1';
const SETTINGS_KEY = 'slipnotify_pro_settings_v1';

const DEFAULT_TEMPLATES = {
  friendly: `【溫馨提醒】親愛的{家長姓名}您好：提醒您，{學生姓名}的「{回條名稱}」繳交截止日為 {截止日期}，若您已填妥請交代孩子交給導師。若需協助請隨時聯繫，謝謝您的配合！`,
  urgent: `【即將截止提醒】親愛的{家長姓名}您好：{學生姓名}的「{回條名稱}」將於【{截止日期}】截止繳交。目前尚未收到回條，請您撥空簽署並請學生交回，感謝您的支持與配合！`,
  overdue: `【緊急逾期催繳】{家長姓名}您好：{學生姓名}的「{回條名稱}」（截止日 {截止日期}）目前已逾期尚未收到。為避免影響學生權益與活動辦理，請務必於明日交回，若有特殊情況請隨時來電，感謝！`,
  fee: `【回條與繳費提醒】親愛的{家長姓名}您好：提醒您，{學生姓名}的「{回條名稱}」與相關費用 NT$ {費用} 元，截止日為 {截止日期}。請協助確認是否已備妥並交由學生帶至學校繳交，謝謝您！`,
  line_list: `📢【{回條名稱}】繳交情況最新公告
⏰ 截止日期：{截止日期}
⚠️ 截至目前尚未繳交名單如下（座號 / 姓名）：
{未繳名單}
請上述座號之同學與家長撥空於明日交回回條，感謝各位家長配合！`
};

// Initial Sample Data for rich demonstration
const SAMPLE_DATA = [
  {
    id: 'slip_grad_trip_01',
    title: '三年二班 畢業旅行家長同意書',
    class: '三年二班',
    fee: 3500,
    createdDate: '2026-09-10',
    deadline: '2026-09-18',
    desc: '請家長務必詳閱行程並簽署同意書，同時勾選葷/素食與緊急聯絡電話。費用可連同回條繳交給班長。',
    members: [
      { id: 'm_1', seat: 1, name: '王小明', parent: '王爸爸', phone: '0912-345-678', status: 'submitted', submittedTime: '2026-09-12 08:30', note: '葷食，費用已繳清' },
      { id: 'm_2', seat: 2, name: '李美華', parent: '李媽媽', phone: '0923-456-789', status: 'submitted', submittedTime: '2026-09-13 09:15', note: '素食，已繳費' },
      { id: 'm_3', seat: 3, name: '張子軒', parent: '張家長', phone: '0934-567-890', status: 'pending', submittedTime: '', note: '家長口頭說這兩天交' },
      { id: 'm_4', seat: 4, name: '陳思妤', parent: '陳媽媽', phone: '0945-678-901', status: 'pending', submittedTime: '', note: '' },
      { id: 'm_5', seat: 5, name: '林冠宇', parent: '林爸爸', phone: '0956-789-012', status: 'pending', submittedTime: '', note: '電話未接，需傳簡訊' },
      { id: 'm_6', seat: 6, name: '黃詩涵', parent: '黃媽媽', phone: '0967-890-123', status: 'submitted', submittedTime: '2026-09-14 10:00', note: '葷食' },
      { id: 'm_7', seat: 7, name: '劉哲瑋', parent: '劉家長', phone: '0978-901-234', status: 'overdue', submittedTime: '', note: '已逾期，需優先催繳' },
      { id: 'm_8', seat: 8, name: '趙雨晴', parent: '趙爸爸', phone: '0989-012-345', status: 'submitted', submittedTime: '2026-09-15 08:00', note: '' },
      { id: 'm_9', seat: 9, name: '楊承翰', parent: '楊媽媽', phone: '0911-222-333', status: 'pending', submittedTime: '', note: '' },
      { id: 'm_10', seat: 10, name: '周佳穎', parent: '周家長', phone: '0922-333-444', status: 'exempt', submittedTime: '', note: '個人因素不參加，免繳' }
    ]
  },
  {
    id: 'slip_flu_vaccine_02',
    title: '115學年度 流感疫苗校園接種意願書',
    class: '三年二班',
    fee: 0,
    createdDate: '2026-09-08',
    deadline: '2026-09-15',
    desc: '無論同意或不同意施打，均須繳回本回條並請家長親自簽名。健康中心將統一造冊。',
    members: [
      { id: 'mv_1', seat: 1, name: '王小明', parent: '王爸爸', phone: '0912-345-678', status: 'submitted', submittedTime: '2026-09-11 08:30', note: '同意接種' },
      { id: 'mv_2', seat: 2, name: '李美華', parent: '李媽媽', phone: '0923-456-789', status: 'submitted', submittedTime: '2026-09-12 09:00', note: '同意接種' },
      { id: 'mv_3', seat: 3, name: '張子軒', parent: '張家長', phone: '0934-567-890', status: 'overdue', submittedTime: '', note: '今日截止未收到' },
      { id: 'mv_4', seat: 4, name: '陳思妤', parent: '陳媽媽', phone: '0945-678-901', status: 'overdue', submittedTime: '', note: '急需催繳' },
      { id: 'mv_5', seat: 5, name: '林冠宇', parent: '林爸爸', phone: '0956-789-012', status: 'submitted', submittedTime: '2026-09-14 11:20', note: '不同意，自行至診所' }
    ]
  },
  {
    id: 'slip_class_fee_03',
    title: '上學期 班費與冷氣卡收據確認回條',
    class: '三年二班',
    fee: 500,
    createdDate: '2026-09-01',
    deadline: '2026-09-20',
    desc: '班費 500 元包含講義印製費與班級公物，請簽名確認回傳。',
    members: [
      { id: 'mc_1', seat: 1, name: '王小明', parent: '王爸爸', phone: '0912-345-678', status: 'submitted', submittedTime: '2026-09-05 08:00', note: '' },
      { id: 'mc_2', seat: 2, name: '李美華', parent: '李媽媽', phone: '0923-456-789', status: 'submitted', submittedTime: '2026-09-06 08:00', note: '' },
      { id: 'mc_3', seat: 3, name: '張子軒', parent: '張家長', phone: '0934-567-890', status: 'pending', submittedTime: '', note: '' }
    ]
  }
];

// App Global State
let appData = {
  slips: [],
  activeSlipId: null,
  activeFilter: 'all',
  searchQuery: '',
  selectedMemberIds: new Set()
};

let appSettings = {
  autoPopup: true,
  theme: 'dark'
};

// ==========================================
// 2. Data Persistence (LocalStorage)
// ==========================================
function loadAppData() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
      appData.slips = JSON.parse(rawData);
    } else {
      // First time launch: initialize with sample data
      appData.slips = JSON.parse(JSON.stringify(SAMPLE_DATA));
      saveAppData();
    }
  } catch (e) {
    console.error('Error loading data from localStorage', e);
    appData.slips = JSON.parse(JSON.stringify(SAMPLE_DATA));
  }

  // Set active slip ID to first slip if available
  if (appData.slips.length > 0) {
    const exists = appData.slips.find(s => s.id === appData.activeSlipId);
    if (!exists) {
      appData.activeSlipId = appData.slips[0].id;
    }
  } else {
    appData.activeSlipId = null;
  }

  // Load Settings
  try {
    const rawSettings = localStorage.getItem(SETTINGS_KEY);
    if (rawSettings) {
      appSettings = { ...appSettings, ...JSON.parse(rawSettings) };
    }
  } catch (e) {
    console.error('Error loading settings', e);
  }

  // Apply Theme
  applyTheme(appSettings.theme);
}

function saveAppData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData.slips));
  } catch (e) {
    console.error('Error saving data to localStorage', e);
    showToast('儲存失敗：儲存空間不足', 'urgent');
  }
}

function saveAppSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings));
  } catch (e) {
    console.error('Error saving settings', e);
  }
}

// ==========================================
// 3. UI Rendering Engine
// ==========================================
function getActiveSlip() {
  return appData.slips.find(s => s.id === appData.activeSlipId) || null;
}

function updateGlobalStats() {
  let totalSlips = appData.slips.length;
  let totalMembers = 0;
  let submittedCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;

  const todayStr = new Date().toISOString().split('T')[0];

  appData.slips.forEach(slip => {
    const isSlipOverdue = slip.deadline < todayStr;
    (slip.members || []).forEach(m => {
      totalMembers++;
      if (m.status === 'submitted') {
        submittedCount++;
      } else if (m.status === 'overdue' || (m.status === 'pending' && isSlipOverdue)) {
        overdueCount++;
        pendingCount++;
      } else if (m.status === 'pending') {
        pendingCount++;
      }
    });
  });

  const rate = totalMembers > 0 ? Math.round((submittedCount / totalMembers) * 100) : 0;

  document.getElementById('stat-total-slips').textContent = totalSlips;
  document.getElementById('stat-submitted-count').textContent = submittedCount;
  document.getElementById('stat-submitted-rate').textContent = `整體繳交率 ${rate}% (${submittedCount}/${totalMembers} 人)`;
  document.getElementById('stat-pending-count').textContent = pendingCount;
  document.getElementById('stat-overdue-count').textContent = overdueCount;
  document.getElementById('header-pending-count').textContent = pendingCount;

  // Header urgency glow toggle
  const reminderBtn = document.getElementById('btn-trigger-reminder');
  if (pendingCount > 0) {
    reminderBtn.classList.add('pulse-glow');
  } else {
    reminderBtn.classList.remove('pulse-glow');
  }
}

function renderSlipsSidebar() {
  const container = document.getElementById('slips-list-container');
  container.innerHTML = '';

  if (appData.slips.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem; color: var(--text-dim); font-size: 0.85rem;">
        <i class="fa-solid fa-folder-plus" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
        尚無回條項目<br>點擊上方「+」新增
      </div>
    `;
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];

  appData.slips.forEach(slip => {
    const isActive = slip.id === appData.activeSlipId;
    const members = slip.members || [];
    const total = members.length;
    const submitted = members.filter(m => m.status === 'submitted').length;
    const pending = members.filter(m => m.status === 'pending' || m.status === 'overdue').length;
    const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;

    let dueBadgeClass = 'text-muted';
    let dueBadgeText = slip.deadline;

    if (slip.deadline < todayStr) {
      dueBadgeClass = 'text-rose';
      dueBadgeText = '已截止';
    } else if (slip.deadline === todayStr) {
      dueBadgeClass = 'text-amber';
      dueBadgeText = '今日截止';
    }

    const card = document.createElement('div');
    card.className = `slip-item-card ${isActive ? 'active' : ''}`;
    card.innerHTML = `
      <div class="slip-card-header">
        <h4 class="slip-card-title" title="${slip.title}">${escapeHtml(slip.title)}</h4>
        <span class="slip-card-due ${dueBadgeClass}">${dueBadgeText}</span>
      </div>
      <div class="slip-card-meta">
        <span>${escapeHtml(slip.class || '全體')} · ${total} 人</span>
        <span class="${pending > 0 ? 'text-amber' : 'text-success'}">
          ${submitted}/${total} (${pct}%)
        </span>
      </div>
      <div class="slip-mini-progress">
        <div class="slip-mini-fill" style="width: ${pct}%;"></div>
      </div>
    `;

    card.addEventListener('click', () => {
      appData.activeSlipId = slip.id;
      appData.selectedMemberIds.clear();
      renderApp();
    });

    container.appendChild(card);
  });
}

function renderActiveSlipWorkspace() {
  const slip = getActiveSlip();
  const banner = document.getElementById('active-slip-banner');
  const emptyRosterState = document.getElementById('empty-roster-state');
  const table = document.getElementById('roster-table');
  const tbody = document.getElementById('roster-tbody');

  if (!slip) {
    document.getElementById('slip-detail-title').textContent = '請先建立或選擇回條項目';
    document.getElementById('slip-detail-desc').textContent = '點擊左上方「新增回條」按鈕以開始記錄。';
    document.getElementById('slip-progress-pct').textContent = '0%';
    document.getElementById('slip-progress-numbers').textContent = '0/0 人';
    document.getElementById('slip-progress-fill').style.width = '0%';
    tbody.innerHTML = '';
    table.style.display = 'none';
    emptyRosterState.style.display = 'none';
    return;
  }

  table.style.display = 'table';
  
  const members = slip.members || [];
  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = slip.deadline < todayStr;
  const isToday = slip.deadline === todayStr;

  // Banner details
  document.getElementById('slip-detail-title').textContent = slip.title;
  document.getElementById('slip-detail-desc').textContent = slip.desc || '無詳細備註說明';
  document.getElementById('slip-class-badge').innerHTML = `<i class="fa-solid fa-users"></i> ${escapeHtml(slip.class || '全體')}`;
  document.getElementById('slip-detail-created').textContent = slip.createdDate || '-';
  document.getElementById('slip-detail-deadline').textContent = slip.deadline || '-';

  const feeBadge = document.getElementById('slip-fee-badge');
  if (slip.fee && Number(slip.fee) > 0) {
    feeBadge.style.display = 'inline-flex';
    feeBadge.innerHTML = `<i class="fa-solid fa-sack-dollar"></i> 費用: NT$ ${Number(slip.fee).toLocaleString()}`;
  } else {
    feeBadge.style.display = 'none';
  }

  // Status & Countdown
  const statusBadge = document.getElementById('slip-status-badge');
  const countdownEl = document.getElementById('slip-detail-countdown');

  if (isOverdue) {
    statusBadge.textContent = '已截止 / 逾期中';
    statusBadge.className = 'badge-status status-overdue';
    countdownEl.textContent = '已過截止日';
    countdownEl.className = 'text-rose';
  } else if (isToday) {
    statusBadge.textContent = '今日截止';
    statusBadge.className = 'badge-status';
    countdownEl.textContent = '今日 23:59 截止';
    countdownEl.className = 'text-amber';
  } else {
    const diffDays = Math.ceil((new Date(slip.deadline) - new Date(todayStr)) / (1000 * 60 * 60 * 24));
    statusBadge.textContent = '進行中';
    statusBadge.className = 'badge-status';
    countdownEl.textContent = `剩餘 ${diffDays} 天`;
    countdownEl.className = 'text-success';
  }

  // Progress computation
  const total = members.length;
  const submitted = members.filter(m => m.status === 'submitted').length;
  const pending = members.filter(m => m.status === 'pending').length;
  const overdue = members.filter(m => m.status === 'overdue').length;
  const exempt = members.filter(m => m.status === 'exempt').length;
  const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;

  document.getElementById('slip-progress-pct').textContent = `${pct}%`;
  document.getElementById('slip-progress-numbers').textContent = `${submitted}/${total} 人`;
  document.getElementById('slip-progress-fill').style.width = `${pct}%`;

  // Update Filter pill counters
  document.getElementById('count-filter-all').textContent = total;
  document.getElementById('count-filter-submitted').textContent = submitted;
  document.getElementById('count-filter-pending').textContent = pending;
  document.getElementById('count-filter-overdue').textContent = overdue;
  document.getElementById('count-filter-exempt').textContent = exempt;

  // Filter & Search Members
  let filteredMembers = members.filter(m => {
    // Status Filter
    if (appData.activeFilter !== 'all') {
      if (m.status !== appData.activeFilter) return false;
    }

    // Search Query
    if (appData.searchQuery.trim() !== '') {
      const q = appData.searchQuery.toLowerCase().trim();
      const matchName = (m.name || '').toLowerCase().includes(q);
      const matchSeat = String(m.seat || '').includes(q);
      const matchPhone = (m.phone || '').includes(q);
      const matchParent = (m.parent || '').toLowerCase().includes(q);
      if (!matchName && !matchSeat && !matchPhone && !matchParent) return false;
    }
    return true;
  });

  // Sort by seat number
  filteredMembers.sort((a, b) => (Number(a.seat) || 0) - (Number(b.seat) || 0));

  // Render Table rows
  tbody.innerHTML = '';

  if (members.length === 0) {
    table.style.display = 'none';
    emptyRosterState.style.display = 'flex';
  } else if (filteredMembers.length === 0) {
    table.style.display = 'table';
    emptyRosterState.style.display = 'none';
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2.5rem; color: var(--text-dim);">
          <i class="fa-solid fa-magnifying-glass" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>
          查無符合篩選條件的成員名單
        </td>
      </tr>
    `;
  } else {
    table.style.display = 'table';
    emptyRosterState.style.display = 'none';

    filteredMembers.forEach(m => {
      const tr = document.createElement('tr');
      const isChecked = appData.selectedMemberIds.has(m.id);

      let statusBadgeHtml = '';
      if (m.status === 'submitted') {
        statusBadgeHtml = `<span class="status-pill status-submitted" onclick="cycleMemberStatus('${m.id}')" title="點擊切換狀態"><i class="fa-solid fa-check"></i> 已繳交</span>`;
      } else if (m.status === 'overdue') {
        statusBadgeHtml = `<span class="status-pill status-overdue" onclick="cycleMemberStatus('${m.id}')" title="點擊切換狀態"><i class="fa-solid fa-triangle-exclamation"></i> 已逾期</span>`;
      } else if (m.status === 'exempt') {
        statusBadgeHtml = `<span class="status-pill status-exempt" onclick="cycleMemberStatus('${m.id}')" title="點擊切換狀態"><i class="fa-solid fa-minus"></i> 免繳</span>`;
      } else {
        statusBadgeHtml = `<span class="status-pill status-pending" onclick="cycleMemberStatus('${m.id}')" title="點擊切換狀態"><i class="fa-solid fa-clock"></i> 未繳交</span>`;
      }

      tr.innerHTML = `
        <td><input type="checkbox" class="member-row-chk" data-id="${m.id}" ${isChecked ? 'checked' : ''}></td>
        <td><strong>#${m.seat || '-'}</strong></td>
        <td><strong>${escapeHtml(m.name)}</strong></td>
        <td>${escapeHtml(m.parent || '-')}</td>
        <td>${escapeHtml(m.phone || '-')}</td>
        <td>${statusBadgeHtml}</td>
        <td style="font-size: 0.78rem; color: var(--text-muted);">${m.submittedTime || '-'}</td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(m.note || '-')}</td>
        <td class="text-center">
          <div class="table-actions">
            <button class="btn-icon-small" title="發送/預覽專屬催繳簡訊" onclick="openIndividualSmsModal('${m.id}')">
              <i class="fa-solid fa-comment-sms text-rose"></i>
            </button>
            <button class="btn-icon-small" title="編輯成員資料" onclick="openEditMemberModal('${m.id}')">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-icon-small" title="刪除此成員" onclick="deleteMember('${m.id}')">
              <i class="fa-solid fa-trash text-rose"></i>
            </button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  // Update check all checkbox state
  const checkAll = document.getElementById('check-all-members');
  const rowCheckboxes = document.querySelectorAll('.member-row-chk');
  if (rowCheckboxes.length > 0) {
    const allChecked = Array.from(rowCheckboxes).every(chk => chk.checked);
    checkAll.checked = allChecked;
  } else {
    checkAll.checked = false;
  }

  // Update Batch action bar visibility
  updateBatchActionBar();
}

function updateBatchActionBar() {
  const batchBar = document.getElementById('batch-action-bar');
  const countEl = document.getElementById('selected-members-count');
  const count = appData.selectedMemberIds.size;

  if (count > 0) {
    batchBar.style.display = 'flex';
    countEl.textContent = count;
  } else {
    batchBar.style.display = 'none';
  }
}

function renderApp() {
  updateGlobalStats();
  renderSlipsSidebar();
  renderActiveSlipWorkspace();
}

// ==========================================
// 4. Auto Reminder Popup Logic (核心自動催繳提醒)
// ==========================================
function checkAndTriggerAutoReminder(forceOpen = false) {
  if (!forceOpen && !appSettings.autoPopup) {
    return;
  }

  // Count unsubmitted & overdue members across all slips
  const todayStr = new Date().toISOString().split('T')[0];
  let slipsWithPending = [];
  let totalPendingAll = 0;

  appData.slips.forEach(slip => {
    const unsubmitted = (slip.members || []).filter(m => m.status === 'pending' || m.status === 'overdue');
    if (unsubmitted.length > 0) {
      slipsWithPending.push(slip);
      totalPendingAll += unsubmitted.length;
    }
  });

  if (totalPendingAll === 0 && !forceOpen) {
    // No unsubmitted slips, no need to auto popup
    return;
  }

  // Open the auto reminder modal!
  openAutoReminderModal(slipsWithPending);
}

function openAutoReminderModal(targetSlips = null) {
  const modal = document.getElementById('modal-auto-reminder');
  const slipSelect = document.getElementById('reminder-slip-select');
  
  if (!targetSlips) {
    targetSlips = appData.slips;
  }

  // Populate Slips Select Options
  slipSelect.innerHTML = '';
  appData.slips.forEach(slip => {
    const unsubmittedCount = (slip.members || []).filter(m => m.status === 'pending' || m.status === 'overdue').length;
    const opt = document.createElement('option');
    opt.value = slip.id;
    opt.textContent = `${slip.title} (未繳: ${unsubmittedCount} 人)`;
    if (slip.id === appData.activeSlipId) {
      opt.selected = true;
    }
    slipSelect.appendChild(opt);
  });

  // If active slip doesn't have pending, select the first slip that has pending
  if (slipSelect.value) {
    const curr = appData.slips.find(s => s.id === slipSelect.value);
    const currPending = curr ? (curr.members || []).filter(m => m.status === 'pending' || m.status === 'overdue').length : 0;
    if (currPending === 0 && slipsWithPendingHasItems(appData.slips)) {
      const firstWithPending = appData.slips.find(s => (s.members || []).some(m => m.status === 'pending' || m.status === 'overdue'));
      if (firstWithPending) {
        slipSelect.value = firstWithPending.id;
      }
    }
  }

  // Sync Auto-popup checkbox setting
  document.getElementById('chk-auto-popup-enabled').checked = appSettings.autoPopup;

  // Refresh Reminder modal view
  updateReminderModalContent();

  modal.classList.add('active');
}

function slipsWithPendingHasItems(slips) {
  return slips.some(s => (s.members || []).some(m => m.status === 'pending' || m.status === 'overdue'));
}

function updateReminderModalContent() {
  const slipSelect = document.getElementById('reminder-slip-select');
  const templateSelect = document.getElementById('reminder-template-select');
  const pendingListEl = document.getElementById('reminder-pending-list');
  const summaryTitle = document.getElementById('reminder-summary-title');
  const summaryDesc = document.getElementById('reminder-summary-desc');
  const textarea = document.getElementById('reminder-sms-textarea');
  const pendingCountEl = document.getElementById('reminder-pending-count');

  const slipId = slipSelect.value;
  const slip = appData.slips.find(s => s.id === slipId);

  if (!slip) {
    summaryTitle.textContent = '目前無任何回條資料';
    summaryDesc.textContent = '請先建立回條活動與學生名單。';
    pendingListEl.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding: 1rem;">無名單</div>';
    textarea.value = '';
    return;
  }

  const unsubmittedMembers = (slip.members || []).filter(m => m.status === 'pending' || m.status === 'overdue');
  const overdueMembers = unsubmittedMembers.filter(m => m.status === 'overdue');

  pendingCountEl.textContent = unsubmittedMembers.length;

  if (unsubmittedMembers.length === 0) {
    summaryTitle.innerHTML = `🎉 太棒了！【${escapeHtml(slip.title)}】已全部繳交完畢！`;
    summaryDesc.textContent = '目前沒有需要催繳的學生名單。';
  } else {
    summaryTitle.innerHTML = `⚠️【${escapeHtml(slip.title)}】共有 <strong class="text-rose">${unsubmittedMembers.length}</strong> 位成員尚未繳交！`;
    summaryDesc.textContent = `截止日期為 ${slip.deadline || '未定'}，其中已逾期 ${overdueMembers.length} 人。`;
  }

  // Render pending checklist inside modal
  pendingListEl.innerHTML = '';
  if (unsubmittedMembers.length === 0) {
    pendingListEl.innerHTML = '<div style="color: var(--success); text-align: center; padding: 0.75rem;"><i class="fa-solid fa-circle-check"></i> 全員皆已繳交</div>';
  } else {
    unsubmittedMembers.forEach(m => {
      const item = document.createElement('div');
      item.className = 'pending-check-item';
      item.innerHTML = `
        <div class="pending-item-left">
          <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
            <input type="checkbox" class="quick-submit-chk" data-slip-id="${slip.id}" data-member-id="${m.id}">
            <strong>#${m.seat} ${escapeHtml(m.name)}</strong>
          </label>
          <span style="color: var(--text-dim); font-size: 0.75rem;">(${escapeHtml(m.parent || '家長')} / ${escapeHtml(m.phone || '無電話')})</span>
        </div>
        <div class="pending-item-right">
          ${m.status === 'overdue' ? '<span class="status-pill status-overdue" style="font-size: 0.68rem; padding: 2px 6px;">已逾期</span>' : '<span class="status-pill status-pending" style="font-size: 0.68rem; padding: 2px 6px;">未繳交</span>'}
          <button class="btn-icon-small" title="複製單人簡訊" onclick="copySingleSms('${slip.id}', '${m.id}')">
            <i class="fa-solid fa-copy"></i>
          </button>
        </div>
      `;
      pendingListEl.appendChild(item);
    });
  }

  // Generate Template Text
  const templateKey = templateSelect.value;
  let rawTemplate = DEFAULT_TEMPLATES[templateKey] || DEFAULT_TEMPLATES.friendly;

  // Build unsubmitted text list for LINE / SMS
  const unsubmittedListText = unsubmittedMembers.map(m => `座號 ${m.seat} 號 ${m.name} (${m.parent || '家長'})`).join('\n') || '無';

  // Sample representative member for preview
  const sampleMember = unsubmittedMembers[0] || { name: '王小明', parent: '家長', phone: '0912-345-678' };

  let generatedText = rawTemplate
    .replaceAll('{學生姓名}', sampleMember.name)
    .replaceAll('{家長姓名}', sampleMember.parent || '家長')
    .replaceAll('{回條名稱}', slip.title)
    .replaceAll('{截止日期}', slip.deadline || '即日起')
    .replaceAll('{費用}', slip.fee ? Number(slip.fee).toLocaleString() : '0')
    .replaceAll('{未繳名單}', unsubmittedListText);

  textarea.value = generatedText;
  updateSmsCharCounter();
}

function updateSmsCharCounter() {
  const textarea = document.getElementById('reminder-sms-textarea');
  const countEl = document.getElementById('sms-char-count');
  const segEl = document.getElementById('sms-segments-count');

  const len = textarea.value.length;
  countEl.textContent = len;

  // SMS length calculation (Standard SMS: 70 chars for Chinese, Long SMS: 67 chars per segment)
  let segments = 1;
  if (len > 70) {
    segments = Math.ceil(len / 67);
  }
  segEl.textContent = segments;
}

// ==========================================
// 5. Phone Mockup & Single SMS Modal
// ==========================================
let currentSingleMemberContext = null;

function openIndividualSmsModal(memberId) {
  const slip = getActiveSlip();
  if (!slip) return;
  const member = (slip.members || []).find(m => m.id === memberId);
  if (!member) return;

  currentSingleMemberContext = { slip, member };

  const modal = document.getElementById('modal-individual-sms');
  document.getElementById('mock-receiver-name').textContent = `收件人：${member.parent || member.name + '家長'} (${member.phone || '未留電話'})`;
  
  // Decide which template is best based on status and deadline
  const todayStr = new Date().toISOString().split('T')[0];
  let template = DEFAULT_TEMPLATES.friendly;
  if (member.status === 'overdue' || slip.deadline < todayStr) {
    template = DEFAULT_TEMPLATES.overdue;
  } else if (slip.deadline === todayStr) {
    template = DEFAULT_TEMPLATES.urgent;
  } else if (slip.fee && Number(slip.fee) > 0) {
    template = DEFAULT_TEMPLATES.fee;
  }

  const generatedSms = template
    .replaceAll('{學生姓名}', member.name)
    .replaceAll('{家長姓名}', member.parent || '家長')
    .replaceAll('{回條名稱}', slip.title)
    .replaceAll('{截止日期}', slip.deadline || '即日起')
    .replaceAll('{費用}', slip.fee ? Number(slip.fee).toLocaleString() : '0');

  document.getElementById('mock-sms-text').textContent = generatedSms;
  document.getElementById('mock-sms-time').textContent = '現在';

  // Setup sms: and tel: links
  const cleanPhone = (member.phone || '').replace(/[^0-9+]/g, '');
  const smsBtn = document.getElementById('btn-ind-send-sms');
  const callBtn = document.getElementById('btn-ind-call');

  if (cleanPhone) {
    smsBtn.href = `sms:${cleanPhone}?body=${encodeURIComponent(generatedSms)}`;
    smsBtn.style.display = 'inline-flex';
    callBtn.href = `tel:${cleanPhone}`;
    callBtn.style.display = 'inline-flex';
  } else {
    smsBtn.style.display = 'none';
    callBtn.style.display = 'none';
  }

  modal.classList.add('active');
}

// ==========================================
// 6. Action Handlers (CRUD for Slips & Members)
// ==========================================

// Add / Edit Slip
function openAddSlipModal() {
  const modal = document.getElementById('modal-slip-form');
  document.getElementById('slip-modal-title').innerHTML = '<i class="fa-solid fa-clipboard-list"></i> 新增回條活動';
  document.getElementById('slip-form-id').value = '';
  document.getElementById('slip-form-title').value = '';
  document.getElementById('slip-form-class').value = '三年二班';
  document.getElementById('slip-form-fee').value = '0';
  document.getElementById('slip-form-desc').value = '';
  
  const todayStr = new Date().toISOString().split('T')[0];
  document.getElementById('slip-form-created').value = todayStr;
  
  // Set default deadline 7 days later
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 5);
  document.getElementById('slip-form-deadline').value = nextWeek.toISOString().split('T')[0];

  modal.classList.add('active');
}

function openEditSlipModal() {
  const slip = getActiveSlip();
  if (!slip) return;

  const modal = document.getElementById('modal-slip-form');
  document.getElementById('slip-modal-title').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> 編輯回條活動';
  document.getElementById('slip-form-id').value = slip.id;
  document.getElementById('slip-form-title').value = slip.title;
  document.getElementById('slip-form-class').value = slip.class || '';
  document.getElementById('slip-form-fee').value = slip.fee || 0;
  document.getElementById('slip-form-created').value = slip.createdDate || '';
  document.getElementById('slip-form-deadline').value = slip.deadline || '';
  document.getElementById('slip-form-desc').value = slip.desc || '';

  modal.classList.add('active');
}

function handleSlipFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('slip-form-id').value;
  const title = document.getElementById('slip-form-title').value.trim();
  const className = document.getElementById('slip-form-class').value.trim();
  const fee = Number(document.getElementById('slip-form-fee').value) || 0;
  const createdDate = document.getElementById('slip-form-created').value;
  const deadline = document.getElementById('slip-form-deadline').value;
  const desc = document.getElementById('slip-form-desc').value.trim();

  if (!title || !deadline) {
    showToast('請填寫回條名稱與截止日期', 'urgent');
    return;
  }

  if (id) {
    // Edit existing
    const slip = appData.slips.find(s => s.id === id);
    if (slip) {
      slip.title = title;
      slip.class = className;
      slip.fee = fee;
      slip.createdDate = createdDate;
      slip.deadline = deadline;
      slip.desc = desc;
      showToast('✅ 回條活動更新成功！', 'success');
    }
  } else {
    // New Slip
    const newId = 'slip_' + Date.now();
    const newSlip = {
      id: newId,
      title,
      class: className,
      fee,
      createdDate,
      deadline,
      desc,
      members: []
    };
    appData.slips.unshift(newSlip);
    appData.activeSlipId = newId;
    showToast('🎉 新增回條活動成功！', 'success');
  }

  saveAppData();
  renderApp();
  closeAllModals();
}

function deleteCurrentSlip() {
  const slip = getActiveSlip();
  if (!slip) return;

  if (confirm(`確定要刪除「${slip.title}」及其所有繳交名單記錄嗎？此動作無法復原。`)) {
    appData.slips = appData.slips.filter(s => s.id !== slip.id);
    appData.activeSlipId = appData.slips.length > 0 ? appData.slips[0].id : null;
    appData.selectedMemberIds.clear();
    saveAppData();
    renderApp();
    showToast('🗑️ 回條已成功刪除', 'urgent');
  }
}

// Add / Edit Member
function openAddMemberModal() {
  const slip = getActiveSlip();
  if (!slip) {
    showToast('請先選擇或建立回條項目', 'urgent');
    return;
  }

  const modal = document.getElementById('modal-member-form');
  document.getElementById('member-modal-title').innerHTML = '<i class="fa-solid fa-user-plus"></i> 新增學生成員';
  document.getElementById('member-form-id').value = '';
  
  // Calculate next seat number
  const maxSeat = (slip.members || []).reduce((max, m) => Math.max(max, Number(m.seat) || 0), 0);
  document.getElementById('member-form-seat').value = maxSeat + 1;
  document.getElementById('member-form-name').value = '';
  document.getElementById('member-form-parent').value = '';
  document.getElementById('member-form-phone').value = '';
  document.getElementById('member-form-status').value = 'pending';
  document.getElementById('member-form-time').value = '';
  document.getElementById('member-form-note').value = '';

  modal.classList.add('active');
}

function openEditMemberModal(memberId) {
  const slip = getActiveSlip();
  if (!slip) return;
  const member = (slip.members || []).find(m => m.id === memberId);
  if (!member) return;

  const modal = document.getElementById('modal-member-form');
  document.getElementById('member-modal-title').innerHTML = '<i class="fa-solid fa-user-pen"></i> 編輯學生成員';
  document.getElementById('member-form-id').value = member.id;
  document.getElementById('member-form-seat').value = member.seat || '';
  document.getElementById('member-form-name').value = member.name || '';
  document.getElementById('member-form-parent').value = member.parent || '';
  document.getElementById('member-form-phone').value = member.phone || '';
  document.getElementById('member-form-status').value = member.status || 'pending';
  document.getElementById('member-form-time').value = member.submittedTime ? member.submittedTime.replace(' ', 'T') : '';
  document.getElementById('member-form-note').value = member.note || '';

  modal.classList.add('active');
}

function handleMemberFormSubmit(e) {
  e.preventDefault();
  const slip = getActiveSlip();
  if (!slip) return;

  const id = document.getElementById('member-form-id').value;
  const seat = Number(document.getElementById('member-form-seat').value) || 1;
  const name = document.getElementById('member-form-name').value.trim();
  const parent = document.getElementById('member-form-parent').value.trim();
  const phone = document.getElementById('member-form-phone').value.trim();
  const status = document.getElementById('member-form-status').value;
  let submittedTime = document.getElementById('member-form-time').value;
  const note = document.getElementById('member-form-note').value.trim();

  if (!name) {
    showToast('請輸入學生姓名', 'urgent');
    return;
  }

  // Format submitted time
  if (status === 'submitted' && !submittedTime) {
    submittedTime = formatCurrentDateTime();
  } else if (submittedTime) {
    submittedTime = submittedTime.replace('T', ' ');
  }

  if (id) {
    // Edit existing member
    const member = (slip.members || []).find(m => m.id === id);
    if (member) {
      member.seat = seat;
      member.name = name;
      member.parent = parent;
      member.phone = phone;
      member.status = status;
      member.submittedTime = (status === 'submitted') ? submittedTime : '';
      member.note = note;
      showToast('✅ 成員資料更新成功！', 'success');
    }
  } else {
    // Add new member
    const newMember = {
      id: 'm_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      seat,
      name,
      parent: parent || (name + '家長'),
      phone,
      status,
      submittedTime: (status === 'submitted') ? submittedTime : '',
      note
    };
    if (!slip.members) slip.members = [];
    slip.members.push(newMember);
    showToast('🎉 新增成員成功！', 'success');
  }

  saveAppData();
  renderApp();
  closeAllModals();
}

function deleteMember(memberId) {
  const slip = getActiveSlip();
  if (!slip) return;
  const member = (slip.members || []).find(m => m.id === memberId);
  if (!member) return;

  if (confirm(`確定要從此回條移除成員「${member.name}」嗎？`)) {
    slip.members = slip.members.filter(m => m.id !== memberId);
    appData.selectedMemberIds.delete(memberId);
    saveAppData();
    renderApp();
    showToast('🗑️ 已移除成員', 'urgent');
  }
}

function cycleMemberStatus(memberId) {
  const slip = getActiveSlip();
  if (!slip) return;
  const member = (slip.members || []).find(m => m.id === memberId);
  if (!member) return;

  // Cycle sequence: pending -> submitted -> overdue -> exempt -> pending
  const cycleMap = {
    'pending': 'submitted',
    'submitted': 'overdue',
    'overdue': 'exempt',
    'exempt': 'pending'
  };

  const nextStatus = cycleMap[member.status] || 'pending';
  member.status = nextStatus;

  if (nextStatus === 'submitted') {
    member.submittedTime = formatCurrentDateTime();
    showToast(`🟢 已將【${member.name}】標記為已繳交！`, 'success');
  } else {
    member.submittedTime = '';
    showToast(`已切換【${member.name}】狀態為：${getStatusLabel(nextStatus)}`, 'success');
  }

  saveAppData();
  renderApp();
}

function getStatusLabel(status) {
  switch (status) {
    case 'submitted': return '已繳交';
    case 'pending': return '未繳交';
    case 'overdue': return '已逾期';
    case 'exempt': return '免繳';
    default: return status;
  }
}

// Batch Import Parser
function openBatchImportModal() {
  const slip = getActiveSlip();
  if (!slip) {
    showToast('請先選擇或建立回條項目', 'urgent');
    return;
  }
  document.getElementById('modal-batch-import').classList.add('active');
}

function handleBatchImport() {
  const slip = getActiveSlip();
  if (!slip) return;

  const rawText = document.getElementById('batch-import-textarea').value.trim();
  if (!rawText) {
    showToast('請先貼上名單資料', 'urgent');
    return;
  }

  const mode = document.querySelector('input[name="batch-mode"]:checked').value;
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let newMembers = [];
  let currentMaxSeat = (mode === 'append') ? (slip.members || []).reduce((max, m) => Math.max(max, Number(m.seat) || 0), 0) : 0;

  lines.forEach((line, idx) => {
    // Delimiter check: comma, tab, semicolon
    const parts = line.split(/[,;\t]+/).map(p => p.trim());
    
    let seat = currentMaxSeat + idx + 1;
    let name = '';
    let parent = '';
    let phone = '';
    let note = '';

    if (parts.length === 1) {
      // Just name
      name = parts[0];
      parent = name + '家長';
    } else if (parts.length === 2) {
      // Could be seat, name OR name, phone
      if (!isNaN(parts[0])) {
        seat = Number(parts[0]);
        name = parts[1];
        parent = name + '家長';
      } else {
        name = parts[0];
        parent = name + '家長';
        phone = parts[1];
      }
    } else if (parts.length >= 3) {
      if (!isNaN(parts[0])) {
        seat = Number(parts[0]);
        name = parts[1];
        parent = parts[2];
        phone = parts[3] || '';
        note = parts[4] || '';
      } else {
        name = parts[0];
        parent = parts[1];
        phone = parts[2];
        note = parts[3] || '';
      }
    }

    if (name) {
      newMembers.push({
        id: 'm_' + Date.now() + '_' + idx + '_' + Math.floor(Math.random() * 1000),
        seat,
        name,
        parent: parent || (name + '家長'),
        phone: phone || '',
        status: 'pending',
        submittedTime: '',
        note: note || ''
      });
    }
  });

  if (newMembers.length === 0) {
    showToast('解析失敗：未找到有效的學生姓名資料', 'urgent');
    return;
  }

  if (mode === 'replace') {
    slip.members = newMembers;
  } else {
    if (!slip.members) slip.members = [];
    slip.members.push(...newMembers);
  }

  saveAppData();
  renderApp();
  closeAllModals();
  showToast(`🎉 成功匯入 ${newMembers.length} 位成員名單！`, 'success');
  document.getElementById('batch-import-textarea').value = '';
}

// Bulk Actions
function handleBatchMarkSubmitted() {
  const slip = getActiveSlip();
  if (!slip || appData.selectedMemberIds.size === 0) return;

  const now = formatCurrentDateTime();
  let count = 0;

  (slip.members || []).forEach(m => {
    if (appData.selectedMemberIds.has(m.id)) {
      m.status = 'submitted';
      m.submittedTime = now;
      count++;
    }
  });

  appData.selectedMemberIds.clear();
  saveAppData();
  renderApp();
  showToast(`✅ 已將 ${count} 位成員批量標記為「已繳交」！`, 'success');
}

function handleBatchMarkPending() {
  const slip = getActiveSlip();
  if (!slip || appData.selectedMemberIds.size === 0) return;

  let count = 0;
  (slip.members || []).forEach(m => {
    if (appData.selectedMemberIds.has(m.id)) {
      m.status = 'pending';
      m.submittedTime = '';
      count++;
    }
  });

  appData.selectedMemberIds.clear();
  saveAppData();
  renderApp();
  showToast(`🟡 已將 ${count} 位成員標記為「未繳交」！`, 'success');
}

function handleBatchDelete() {
  const slip = getActiveSlip();
  if (!slip || appData.selectedMemberIds.size === 0) return;

  const count = appData.selectedMemberIds.size;
  if (confirm(`確定要刪除選取的 ${count} 位成員嗎？`)) {
    slip.members = (slip.members || []).filter(m => !appData.selectedMemberIds.has(m.id));
    appData.selectedMemberIds.clear();
    saveAppData();
    renderApp();
    showToast(`🗑️ 已刪除 ${count} 位成員`, 'urgent');
  }
}

function handleBatchSendSms() {
  openAutoReminderModal();
}

// ==========================================
// 7. Clipboard & Message Generation Helpers
// ==========================================
function copySingleSms(slipId, memberId) {
  const slip = appData.slips.find(s => s.id === slipId);
  if (!slip) return;
  const member = (slip.members || []).find(m => m.id === memberId);
  if (!member) return;

  const templateSelect = document.getElementById('reminder-template-select');
  const templateKey = templateSelect ? templateSelect.value : 'friendly';
  const rawTemplate = DEFAULT_TEMPLATES[templateKey] || DEFAULT_TEMPLATES.friendly;

  const text = rawTemplate
    .replaceAll('{學生姓名}', member.name)
    .replaceAll('{家長姓名}', member.parent || '家長')
    .replaceAll('{回條名稱}', slip.title)
    .replaceAll('{截止日期}', slip.deadline || '即日起')
    .replaceAll('{費用}', slip.fee ? Number(slip.fee).toLocaleString() : '0')
    .replaceAll('{未繳名單}', `${member.name} (${member.parent || '家長'})`);

  copyToClipboard(text, `✅ 已複製【${member.name}】的催繳簡訊！`);
}

function copyAllIndividualSms() {
  const slipSelect = document.getElementById('reminder-slip-select');
  const templateSelect = document.getElementById('reminder-template-select');
  const slip = appData.slips.find(s => s.id === slipSelect.value);
  if (!slip) return;

  const unsubmitted = (slip.members || []).filter(m => m.status === 'pending' || m.status === 'overdue');
  if (unsubmitted.length === 0) {
    showToast('目前沒有未繳交的成員', 'urgent');
    return;
  }

  const rawTemplate = DEFAULT_TEMPLATES[templateSelect.value] || DEFAULT_TEMPLATES.friendly;

  const batchText = unsubmitted.map(m => {
    const single = rawTemplate
      .replaceAll('{學生姓名}', m.name)
      .replaceAll('{家長姓名}', m.parent || '家長')
      .replaceAll('{回條名稱}', slip.title)
      .replaceAll('{截止日期}', slip.deadline || '即日起')
      .replaceAll('{費用}', slip.fee ? Number(slip.fee).toLocaleString() : '0');
    return `【給：#${m.seat} ${m.name}家長 (${m.phone || '無電話'})】\n${single}\n----------------------------------------`;
  }).join('\n\n');

  copyToClipboard(batchText, `✅ 已複製全部 ${unsubmitted.length} 則個人專屬催繳簡訊！`);
}

function copyLineBulletin() {
  const slipSelect = document.getElementById('reminder-slip-select');
  const slip = appData.slips.find(s => s.id === slipSelect.value);
  if (!slip) return;

  const unsubmitted = (slip.members || []).filter(m => m.status === 'pending' || m.status === 'overdue');
  const unsubmittedList = unsubmitted.map(m => `▫️ 座號 ${m.seat} 號 ${m.name}`).join('\n') || '全體已繳齊 🎉';

  const lineTemplate = DEFAULT_TEMPLATES.line_list
    .replaceAll('{回條名稱}', slip.title)
    .replaceAll('{截止日期}', slip.deadline || '即日起')
    .replaceAll('{未繳名單}', unsubmittedList);

  copyToClipboard(lineTemplate, '📱 已複製 LINE 群組催繳公告格式！');
}

function copyCurrentSmsTextarea() {
  const textarea = document.getElementById('reminder-sms-textarea');
  if (!textarea.value.trim()) {
    showToast('內容為空無法複製', 'urgent');
    return;
  }
  copyToClipboard(textarea.value, '📋 已複製簡訊內容至剪貼簿！');
}

function copyToClipboard(text, successMsg = '已複製到剪貼簿！') {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg, 'success');
    }).catch(() => {
      fallbackCopyText(text, successMsg);
    });
  } else {
    fallbackCopyText(text, successMsg);
  }
}

function fallbackCopyText(text, successMsg) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    showToast(successMsg, 'success');
  } catch (err) {
    showToast('複製失敗，請手動複製', 'urgent');
  }
  document.body.removeChild(ta);
}

// ==========================================
// 8. CSV & Backup JSON Exporters
// ==========================================
function exportActiveSlipCsv() {
  const slip = getActiveSlip();
  if (!slip) {
    showToast('請先選擇要匯出的回條', 'urgent');
    return;
  }

  const members = slip.members || [];
  if (members.length === 0) {
    showToast('此回條尚無名單可匯出', 'urgent');
    return;
  }

  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel Chinese compatibility
  csvContent += `回條名稱,${slip.title}\n`;
  csvContent += `班級,${slip.class || ''}\n`;
  csvContent += `截止日期,${slip.deadline}\n`;
  csvContent += `費用,${slip.fee || 0}\n\n`;
  csvContent += '座號,學生姓名,家長稱謂,聯絡電話,繳交狀態,繳交時間,備註\n';

  members.forEach(m => {
    const row = [
      m.seat || '',
      `"${(m.name || '').replace(/"/g, '""')}"`,
      `"${(m.parent || '').replace(/"/g, '""')}"`,
      `\t${m.phone || ''}`, // Prepend tab to prevent Excel converting phone to exponential
      getStatusLabel(m.status),
      m.submittedTime || '',
      `"${(m.note || '').replace(/"/g, '""')}"`
    ];
    csvContent += row.join(',') + '\n';
  });

  downloadBlob(csvContent, `${slip.title}_繳交名單_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
  showToast('📊 CSV 檔案已成功下載！', 'success');
}

function exportFullBackupJson() {
  const backupData = {
    version: '1.0',
    exportTime: new Date().toISOString(),
    slips: appData.slips,
    settings: appSettings
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  downloadBlob(jsonStr, `SlipNotify_Backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  showToast('💾 系統備份檔 (JSON) 已成功下載！', 'success');
}

function handleImportBackupJson() {
  const fileInput = document.getElementById('import-json-file');
  const file = fileInput.files[0];
  if (!file) {
    showToast('請先選擇要還原的 JSON 備份檔', 'urgent');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data && Array.isArray(data.slips)) {
        appData.slips = data.slips;
        if (data.settings) {
          appSettings = { ...appSettings, ...data.settings };
          saveAppSettings();
          applyTheme(appSettings.theme);
        }
        appData.activeSlipId = appData.slips.length > 0 ? appData.slips[0].id : null;
        appData.selectedMemberIds.clear();
        saveAppData();
        renderApp();
        closeAllModals();
        showToast('🎉 備份資料還原成功！', 'success');
      } else {
        showToast('還原失敗：備份檔格式不正確', 'urgent');
      }
    } catch (err) {
      showToast('還原失敗：JSON 格式解析錯誤', 'urgent');
    }
  };
  reader.readAsText(file);
}

function resetAllData() {
  if (confirm('⚠️ 警告：確定要清除所有回條與繳交記錄嗎？此動作將抹除所有資料！')) {
    localStorage.removeItem(STORAGE_KEY);
    appData.slips = [];
    appData.activeSlipId = null;
    appData.selectedMemberIds.clear();
    renderApp();
    closeAllModals();
    showToast('🧹 系統資料已完全重置', 'urgent');
  }
}

function loadSampleData() {
  if (confirm('確定要載入示範數據嗎？這將載入三年二班各項回條與學生示範紀錄。')) {
    appData.slips = JSON.parse(JSON.stringify(SAMPLE_DATA));
    appData.activeSlipId = appData.slips[0].id;
    appData.selectedMemberIds.clear();
    saveAppData();
    renderApp();
    showToast('✨ 示範數據已載入！', 'success');
    checkAndTriggerAutoReminder(true);
  }
}

function downloadBlob(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================
// 9. Toast & Utility Helpers
// ==========================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'urgent' ? 'fa-triangle-exclamation' : 'fa-circle-check';
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCurrentDateTime() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const Y = now.getFullYear();
  const M = pad(now.getMonth() + 1);
  const D = pad(now.getDate());
  const h = pad(now.getHours());
  const m = pad(now.getMinutes());
  return `${Y}-${M}-${D} ${h}:${m}`;
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  }
}

function toggleTheme() {
  appSettings.theme = appSettings.theme === 'dark' ? 'light' : 'dark';
  saveAppSettings();
  applyTheme(appSettings.theme);
  showToast(`已切換為${appSettings.theme === 'dark' ? '深色' : '淺色'}主題`, 'success');
}

function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
}

// ==========================================
// 10. Event Listeners & Bootstrapping
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Load data & render
  loadAppData();
  renderApp();

  // 🔔 Automatic Reminder Trigger upon entering program!
  // ("點入此程式自動跳出提醒短信")
  setTimeout(() => {
    checkAndTriggerAutoReminder();
  }, 400);

  // Top Nav Buttons
  document.getElementById('btn-trigger-reminder').addEventListener('click', () => {
    checkAndTriggerAutoReminder(true);
  });
  document.getElementById('btn-open-sms-center').addEventListener('click', () => {
    checkAndTriggerAutoReminder(true);
  });
  document.getElementById('btn-add-slip').addEventListener('click', openAddSlipModal);
  document.getElementById('btn-sidebar-add-slip').addEventListener('click', openAddSlipModal);
  document.getElementById('btn-edit-slip').addEventListener('click', openEditSlipModal);
  document.getElementById('btn-delete-slip').addEventListener('click', deleteCurrentSlip);
  document.getElementById('btn-load-sample').addEventListener('click', loadSampleData);
  document.getElementById('btn-theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('btn-export-import').addEventListener('click', () => {
    document.getElementById('modal-backup').classList.add('active');
  });

  // Roster Toolbar Actions
  document.getElementById('btn-add-member').addEventListener('click', openAddMemberModal);
  document.getElementById('btn-batch-import').addEventListener('click', openBatchImportModal);
  document.getElementById('btn-export-csv').addEventListener('click', exportActiveSlipCsv);

  // Search & Filter
  const searchInput = document.getElementById('roster-search-input');
  const clearSearchBtn = document.getElementById('btn-clear-search');
  searchInput.addEventListener('input', (e) => {
    appData.searchQuery = e.target.value;
    clearSearchBtn.style.display = e.target.value ? 'block' : 'none';
    renderActiveSlipWorkspace();
  });
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    appData.searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderActiveSlipWorkspace();
  });

  // Filter Pills
  document.getElementById('filter-pills-group').addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (pill) {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      appData.activeFilter = pill.getAttribute('data-filter');
      renderActiveSlipWorkspace();
    }
  });

  // Table Checkboxes & Event Delegation
  document.getElementById('check-all-members').addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    const slip = getActiveSlip();
    if (!slip) return;
    
    if (isChecked) {
      (slip.members || []).forEach(m => appData.selectedMemberIds.add(m.id));
    } else {
      appData.selectedMemberIds.clear();
    }
    renderActiveSlipWorkspace();
  });

  document.getElementById('roster-tbody').addEventListener('change', (e) => {
    if (e.target.classList.contains('member-row-chk')) {
      const id = e.target.getAttribute('data-id');
      if (e.target.checked) {
        appData.selectedMemberIds.add(id);
      } else {
        appData.selectedMemberIds.delete(id);
      }
      updateBatchActionBar();
    }
  });

  // Batch Operation Buttons
  document.getElementById('btn-batch-mark-submitted').addEventListener('click', handleBatchMarkSubmitted);
  document.getElementById('btn-batch-mark-pending').addEventListener('click', handleBatchMarkPending);
  document.getElementById('btn-batch-send-sms').addEventListener('click', handleBatchSendSms);
  document.getElementById('btn-batch-delete').addEventListener('click', handleBatchDelete);

  // Forms Submissions
  document.getElementById('form-slip').addEventListener('submit', handleSlipFormSubmit);
  document.getElementById('form-member').addEventListener('submit', handleMemberFormSubmit);
  document.getElementById('btn-confirm-batch-import').addEventListener('click', handleBatchImport);

  // Auto Reminder Modal Controls
  document.getElementById('reminder-slip-select').addEventListener('change', updateReminderModalContent);
  document.getElementById('reminder-template-select').addEventListener('change', updateReminderModalContent);
  document.getElementById('reminder-sms-textarea').addEventListener('input', updateSmsCharCounter);
  document.getElementById('chk-auto-popup-enabled').addEventListener('change', (e) => {
    appSettings.autoPopup = e.target.checked;
    saveAppSettings();
    showToast(appSettings.autoPopup ? '已開啟：下次開啟程式自動彈出提醒' : '已關閉自動彈出提醒', 'success');
  });

  // Quick submit check in Reminder modal
  document.getElementById('reminder-pending-list').addEventListener('change', (e) => {
    if (e.target.classList.contains('quick-submit-chk')) {
      const slipId = e.target.getAttribute('data-slip-id');
      const memberId = e.target.getAttribute('data-member-id');
      const slip = appData.slips.find(s => s.id === slipId);
      if (slip) {
        const member = (slip.members || []).find(m => m.id === memberId);
        if (member) {
          member.status = 'submitted';
          member.submittedTime = formatCurrentDateTime();
          saveAppData();
          renderApp();
          updateReminderModalContent();
          showToast(`🟢 已核銷【${member.name}】的回條！`, 'success');
        }
      }
    }
  });

  // Variable Tag Insertion Buttons
  document.querySelectorAll('.btn-var-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      const varTag = btn.getAttribute('data-var');
      const textarea = document.getElementById('reminder-sms-textarea');
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      textarea.value = val.substring(0, start) + varTag + val.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + varTag.length;
      textarea.focus();
      updateSmsCharCounter();
    });
  });

  // Copy Buttons in Reminder Modal
  document.getElementById('btn-copy-sms-text').addEventListener('click', copyCurrentSmsTextarea);
  document.getElementById('btn-copy-all-individual-sms').addEventListener('click', copyAllIndividualSms);
  document.getElementById('btn-copy-line-bulletin').addEventListener('click', copyLineBulletin);
  document.getElementById('btn-ind-copy').addEventListener('click', () => {
    const text = document.getElementById('mock-sms-text').textContent;
    copyToClipboard(text, '📋 已複製專屬簡訊！');
  });

  // Backup & Import Buttons
  document.getElementById('btn-export-json').addEventListener('click', exportFullBackupJson);
  document.getElementById('btn-export-all-csv').addEventListener('click', exportActiveSlipCsv);
  document.getElementById('btn-confirm-import-json').addEventListener('click', handleImportBackupJson);
  document.getElementById('btn-reset-data').addEventListener('click', resetAllData);

  // Modal Close Handlers
  document.querySelectorAll('.btn-close-modal, #btn-dismiss-reminder, #btn-cancel-slip-modal, #btn-cancel-member-modal, #btn-cancel-batch-modal').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeAllModals();
    });
  });

  // Keyboard shortcut (Escape to close modals)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });
});
