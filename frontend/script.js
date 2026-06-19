// === 後端 API 位址 ===
// 本機測試先用 localhost，之後部署 Render 再換成 Render 網址
const API_BASE_URL = "https://volunteer-hour-system-backend.onrender.com";

// 登入成功後，後端會給前端一張臨時通行證
let authToken = "";
// localStorage keys
const VOLUNTEER_STORAGE_KEY = "volunteer_hour_tool_volunteers";
const RECORDS_STORAGE_KEY = "volunteer_hour_tool_records";
// === DOM ===
const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");
const loginForm = document.getElementById("loginForm");
const loginPasswordInput = document.getElementById("loginPassword");
const loginErrorEl = document.getElementById("loginError");
const loginSubmitBtn = loginForm ? loginForm.querySelector('button[type="submit"]') : null;

const volunteerForm = document.getElementById("volunteer-form");
const volunteerNameInput = document.getElementById("volunteerName");
const volunteerIdInput = document.getElementById("volunteerId");
const volunteerSubmitBtn = document.getElementById("volunteerSubmitBtn");
const cancelVolunteerEditBtn = document.getElementById("cancelVolunteerEditBtn");
const volunteerListEl = document.getElementById("volunteerList");
const volunteerIdErrorEl = document.getElementById("volunteerIdError");
const volunteerFormStatusEl = document.getElementById("volunteerFormStatus");

const recordVolunteerSelect = document.getElementById("recordVolunteerName");
const recordVolunteerIdInput = document.getElementById("recordVolunteerId");

// 志工預設服務項目管理區：選擇志工
const serviceManagerVolunteerSelect = document.getElementById("serviceManagerVolunteerSelect");
const loadVolunteerServicesBtn = document.getElementById("loadVolunteerServicesBtn");
const volunteerServicesTableBody = document.getElementById("volunteerServicesTableBody");
const volunteerServicesCurrentEditingMessageEl = document.getElementById("volunteerServicesCurrentEditingMessage");
const volunteerServicesMessageEl = document.getElementById("volunteerServicesMessage");
const volunteerServicesErrorEl = document.getElementById("volunteerServicesError");
const addVolunteerServiceRowBtn = document.getElementById("addVolunteerServiceRowBtn");
const saveVolunteerServicesBtn = document.getElementById("saveVolunteerServicesBtn");
const cancelVolunteerServicesEditBtn = document.getElementById("cancelVolunteerServicesEditBtn");
const recordForm = document.getElementById("record-form");
const recordServiceDraftTableBody = document.getElementById("recordServiceDraftTableBody");
const recordErrorEl = document.getElementById("recordError");
const recordSubmitBtn = document.getElementById("recordSubmitBtn");

const recordsTableBody = document.getElementById("recordsTableBody");
const copyTableBtn = document.getElementById("copyTableBtn") || document.getElementById("exportCsvBtn");
const clearRecordsBtn = document.getElementById("clearRecordsBtn");
const displayModeInputs = document.querySelectorAll('input[name="displayMode"]');

// 多人批次新增區
const batchToggleBtn = document.getElementById("batchToggleBtn");
const batchPanel = document.getElementById("batchPanel");
const batchForm = document.getElementById("batch-form");
const batchStartDateInput = document.getElementById("batchStartDate");
const batchEndDateInput = document.getElementById("batchEndDate");
const batchServiceItemSelect = document.getElementById("batchServiceItemSelect");
const batchServiceContentSelect = document.getElementById("batchServiceContentSelect");
const batchHoursInput = document.getElementById("batchHours");
const batchMinutesInput = document.getElementById("batchMinutes");
const batchClientCountInput = document.getElementById("batchClientCount");
const batchTrafficFeeInput = document.getElementById("batchTrafficFee");
const batchMealFeeInput = document.getElementById("batchMealFee");
const batchVolunteerChecklist = document.getElementById("batchVolunteerChecklist");
const batchSelectAllCheckbox = document.getElementById("batchSelectAll");
const batchClearSelectedBtn = document.getElementById("batchClearSelectedBtn");
const batchBuildPreviewBtn = document.getElementById("batchBuildPreviewBtn");
const batchClearDraftBtn = document.getElementById("batchClearDraftBtn");
const batchPreviewTableBody = document.getElementById("batchPreviewTableBody");
const batchErrorEl = document.getElementById("batchError");

// === 資料 ===
const volunteers = [];
const records = [];
// 目前管理區正在編輯的志工預設服務項目
const volunteerServicesDraft = [];
let serviceManagerEditingVolunteerId = "";
const batchDraftRows = [];
let displayMode = "readable";
let editingVolunteerIndex = null;

// === 服務項目 / 內容代碼表 ===
const SERVICE_ITEMS = [
  { code: "0060", label: "老人服務" },
  { code: "0130", label: "社區服務" },
];

const SERVICE_CONTENTS_BY_ITEM = {
  "0060": [
    { code: "0056", label: "共餐服務" },
    { code: "0055", label: "健康促進" },
    { code: "0053", label: "關懷訪視"},
    {code: "0099", label: "其他"},
  ],
  "0130": [
    { code: "0049", label: "行政支援" },
    { code: "0006", label: "資料整理" },
    { code: "0020", label: "活動支援服務" },
    { code: "0028", label: "引導服務" },
    { code: "0012", label: "宣導推廣服務" },
    { code: "0017", label: "環保服務" },
    {code: "0099", label: "其他"},

  ],
};

// ============================================================
// === Toast 通知系統 ===
// ============================================================

let toastContainer = null;

function getToastContainer() {
  if (toastContainer) return toastContainer;
  toastContainer = document.createElement("div");
  toastContainer.id = "toastContainer";
  toastContainer.style.cssText = `
    position: fixed;
    top: 1.2rem;
    right: 1.2rem;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    pointer-events: none;
  `;
  document.body.appendChild(toastContainer);
  return toastContainer;
}

function showToast(message, type = "info", duration = 3200) {
  const container = getToastContainer();

  const iconMap = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  const colorMap = {
    success: { bg: "#f0fdf4", border: "#86efac", text: "#166534", icon: "#16a34a" },
    error: { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", icon: "#dc2626" },
    warning: { bg: "#fffbeb", border: "#fcd34d", text: "#92400e", icon: "#d97706" },
    info: { bg: "#f0f9ff", border: "#7dd3fc", text: "#075985", icon: "#0284c7" },
  };

  const c = colorMap[type] || colorMap.info;

  const toast = document.createElement("div");
  toast.style.cssText = `
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    background: ${c.bg};
    border: 1.5px solid ${c.border};
    border-radius: 10px;
    padding: 0.75rem 1rem;
    min-width: 240px;
    max-width: 340px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.10);
    pointer-events: auto;
    opacity: 0;
    transform: translateX(20px);
    transition: opacity 0.22s ease, transform 0.22s ease;
    cursor: default;
  `;

  const iconEl = document.createElement("span");
  iconEl.style.cssText = `font-size:1rem;font-weight:700;color:${c.icon};flex-shrink:0;line-height:1.4;`;
  iconEl.textContent = iconMap[type] || "ℹ";

  const msgEl = document.createElement("span");
  msgEl.style.cssText = `font-size:0.88rem;color:${c.text};line-height:1.5;flex:1;`;
  msgEl.textContent = message;

  toast.appendChild(iconEl);
  toast.appendChild(msgEl);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(0)";
  });

  const dismiss = () => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    setTimeout(() => toast.remove(), 250);
  };

  toast.addEventListener("click", dismiss);
  if (duration > 0) setTimeout(dismiss, duration);

  return toast;
}

function showConfirm(message, confirmLabel = "確定", cancelLabel = "取消") {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(15,23,42,0.35);z-index:10000;
      display:flex;align-items:center;justify-content:center;padding:1rem;
    `;

    const dialog = document.createElement("div");
    dialog.style.cssText = `
      background:#fff;border-radius:14px;padding:1.6rem 1.8rem 1.4rem;
      max-width:360px;width:100%;box-shadow:0 12px 36px rgba(15,23,42,0.18);font-family:inherit;
    `;

    const msg = document.createElement("p");
    msg.style.cssText = `margin:0 0 1.3rem;font-size:0.95rem;color:#0f172a;line-height:1.6;`;
    msg.textContent = message;

    const actions = document.createElement("div");
    actions.style.cssText = `display:flex;gap:0.6rem;justify-content:flex-end;`;

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = cancelLabel;
    cancelBtn.style.cssText = `
      padding:0.55rem 1.2rem;border-radius:8px;border:1px solid #D3D1C7;
      background:#F1EFE8;color:#2C2C2A;font-size:0.88rem;font-weight:500;cursor:pointer;font-family:inherit;
    `;

    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = confirmLabel;
    confirmBtn.style.cssText = `
      padding:0.55rem 1.2rem;border-radius:8px;border:none;
      background:#A32D2D;color:#fff;font-size:0.88rem;font-weight:500;cursor:pointer;font-family:inherit;
    `;

    cancelBtn.addEventListener("click", () => { overlay.remove(); resolve(false); });
    confirmBtn.addEventListener("click", () => { overlay.remove(); resolve(true); });

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    dialog.appendChild(msg);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const onKey = (e) => {
      if (e.key === "Escape") { overlay.remove(); resolve(false); document.removeEventListener("keydown", onKey); }
    };
    document.addEventListener("keydown", onKey);
  });
}

// ============================================================
// === 小工具函式 ===
// ============================================================

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${authToken}`,
  };
}
function setText(el, text) {
  if (!el) return;
  el.textContent = text || "";

  if (el.classList && el.classList.contains("status-message")) {
    el.classList.toggle("hidden", !text);
  }
}

function setStatus(el, message, type = "info") {
  if (!el) return;

  // 先清掉上一個自動消失計時器，避免舊訊息誤刪新訊息
  if (el.dataset.statusTimerId) {
    clearTimeout(Number(el.dataset.statusTimerId));
    delete el.dataset.statusTimerId;
  }

  el.textContent = message || "";

  el.classList.remove("success", "warning", "error", "info");

  if (!message) {
    el.classList.add("hidden");
    return;
  }

  el.classList.add(type);
  el.classList.remove("hidden");

  // 成功訊息 30 秒後自動消失
  if (type === "success") {
    const timerId = setTimeout(() => {
      clearStatus(el);
    }, 15000);

    el.dataset.statusTimerId = String(timerId);
  }
}

function clearStatus(el) {
  setStatus(el, "");
}

function setButtonLoading(button, isLoading, loadingText) {
  if (!button) return;

  if (isLoading) {
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent;
    }

    button.textContent = loadingText || button.textContent;
    button.disabled = true;
    button.classList.add("is-loading");
    return;
  }

  button.textContent = button.dataset.originalText || button.textContent;
  delete button.dataset.originalText;
  button.disabled = false;
  button.classList.remove("is-loading");
}

function trimValue(inputEl) {
  return inputEl ? inputEl.value.trim() : "";
}

function padCode4(code) {
  if (code === null || code === undefined) return "";
  const str = String(code).trim();
  if (!str) return "";
  return str.padStart(4, "0");
}

function getServiceItemLabel(code) {
  const item = SERVICE_ITEMS.find((i) => i.code === code);
  return item ? item.label : "";
}

function getServiceContentLabel(itemCode, contentCode) {
  const list = SERVICE_CONTENTS_BY_ITEM[itemCode] || [];
  const found = list.find((c) => c.code === contentCode);
  return found ? found.label : "";
}

function formatLocalYYYYMMDD(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTodayLocalYYYYMMDD() {
  return formatLocalYYYYMMDD(new Date());
}

function parseIsoDateToDate(isoDateStr) {
  const parts = isoDateStr.split("-");
  if (parts.length !== 3) return null;
  const y = Number(parts[0]), m = Number(parts[1]), d = Number(parts[2]);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m - 1, d);
}

function toRocDate(isoDateStr) {
  if (!isoDateStr) return "";
  const parts = isoDateStr.split("-");
  if (parts.length !== 3) return isoDateStr;
  const year = Number(parts[0]) - 1911;
  return String(year).padStart(3, "0") + parts[1] + parts[2];
}

function isValidTaiwanId(id) {
  if (!id) return false;
  return /^[A-Z][0-9]{9}$/.test(id.toUpperCase().trim());
}

function toNonNegativeIntOrZero(valueStr) {
  if (valueStr === null || valueStr === undefined) return 0;
  const s = String(valueStr).trim();
  if (s === "") return 0;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.floor(n);
}

function toNonNegativeNumberOrZero(valueStr) {
  if (valueStr === null || valueStr === undefined) return 0;
  const s = String(valueStr).trim();
  if (s === "") return 0;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return n;
}

function sanitizeNonNegativeIntegerInput(input, maxValue = null) {
  if (!input) return;

  const rawValue = String(input.value || "").trim();

  if (rawValue === "") {
    return;
  }

  let value = Number(rawValue);

  if (!Number.isFinite(value)) {
    input.value = "";
    return;
  }

  value = Math.floor(value);

  if (value < 0) {
    value = 0;
  }

  if (typeof maxValue === "number" && value > maxValue) {
    value = maxValue;
  }

  input.value = String(value);
}

function sanitizeMinutesInput(input) {
  sanitizeNonNegativeIntegerInput(input, 59);
}

function normalizeTimeInputsIfPossible(hoursInput, minutesInput) {
  if (!hoursInput || !minutesInput) return null;

  const hasHours = String(hoursInput.value || "").trim() !== "";
  const hasMinutes = String(minutesInput.value || "").trim() !== "";

  if (!hasHours && !hasMinutes) {
    return null;
  }

  sanitizeNonNegativeIntegerInput(hoursInput);
  sanitizeMinutesInput(minutesInput);

  const hours = toNonNegativeIntOrZero(hoursInput.value);
  const minutes = toNonNegativeIntOrZero(minutesInput.value);
  const normalizedTime = normalizeServiceTime(hours, minutes);

  if (!normalizedTime) {
    return null;
  }

  hoursInput.value = String(normalizedTime.hours);
  minutesInput.value = String(normalizedTime.minutes);

  return normalizedTime;
}

function normalizeServiceTime(hours, minutes) {
  const rawHours = Number(hours || 0);
  const rawMinutes = Number(minutes || 0);

  if (
    !Number.isFinite(rawHours) ||
    !Number.isFinite(rawMinutes) ||
    rawHours < 0 ||
    rawMinutes < 0 ||
    rawMinutes > 59
  ) {
    return null;
  }

  let normalizedHours = Math.floor(rawHours);
  let normalizedMinutes = 0;

  if (rawMinutes > 30) {
    normalizedHours += 1;
    normalizedMinutes = 0;
  } else if (rawMinutes > 0) {
    normalizedMinutes = 30;
  }

  const countedHours = normalizedHours + normalizedMinutes / 60;

  return {
    hours: normalizedHours,
    minutes: normalizedMinutes,
    countedHours,
  };
}
function cleanCellForExcel(value) {
  return String(value ?? "").replace(/\t/g, " ").replace(/\r?\n/g, " ").trim();
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try { return document.execCommand("copy"); }
  finally { document.body.removeChild(ta); }
}

// ============================================================
// === 統計摘要 ===
// ============================================================

function renderSummaryBar() {
  const summaryBar = document.getElementById("recordsSummaryBar");
  if (!summaryBar) return;

  if (records.length === 0) {
    summaryBar.innerHTML = "<span>目前沒有紀錄</span>";
    return;
  }

  let totalMinutes = 0, totalPeople = 0, totalTraffic = 0, totalMeal = 0;
  records.forEach((r) => {
    totalMinutes += (r.hours || 0) * 60 + (r.minutes || 0);
    totalPeople += r.peopleCount || 0;
    totalTraffic += r.trafficFee || 0;
    totalMeal += r.mealFee || 0;
  });

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const timeStr = m > 0 ? `${h} 小時 ${m} 分` : `${h} 小時`;

  summaryBar.innerHTML = `
    <span class="summary-item"><strong>${records.length}</strong> 筆紀錄</span>
    <span class="summary-divider">·</span>
    <span class="summary-item">總時數 <strong>${timeStr}</strong></span>
    <span class="summary-divider">·</span>
    <span class="summary-item">受服務人次 <strong>${totalPeople}</strong></span>
    <span class="summary-divider">·</span>
    <span class="summary-item">交通費 <strong>${totalTraffic}</strong> 元</span>
    <span class="summary-divider">·</span>
    <span class="summary-item">誤餐費 <strong>${totalMeal}</strong> 元</span>
  `;
}

// ============================================================
// === 日期限制 ===
// ============================================================

// ============================================================
// === localStorage ===
// ============================================================

function saveVolunteersToStorage() {
  try { localStorage.setItem(VOLUNTEER_STORAGE_KEY, JSON.stringify(volunteers)); }
  catch (err) { console.error("儲存志工名單失敗", err); }
}

function loadVolunteersFromStorage() {
  try {
    const raw = localStorage.getItem(VOLUNTEER_STORAGE_KEY);
    if (!raw) return;
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return;
    volunteers.length = 0;
    list.forEach((v) => {
      if (!v || !v.name || !v.id) return;
      volunteers.push({ name: String(v.name), id: String(v.id).toUpperCase() });
    });
  } catch (err) { console.error("讀取志工名單失敗", err); }
}

function saveRecordsToStorage() {
  try { localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records)); }
  catch (err) { console.error("儲存服務紀錄失敗", err); }
}

function loadRecordsFromStorage() {
  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!raw) return;
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return;
    records.length = 0;
    list.forEach((r) => {
      if (!r || !r.name || !r.startDate) return;
      records.push(r);
    });
  } catch (err) { console.error("讀取服務紀錄失敗", err); }
}

// ============================================================
// === Google Sheet 同步 ===
// ============================================================

async function sendVolunteerToGSheet(vol) {
  if (!authToken) {
    console.warn("尚未登入，無法同步志工資料");
    showToast("尚未登入，無法同步志工資料", "warning");
    return false;
  }

  try {
    const resp = await fetch(`${API_BASE_URL}/api/volunteers`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: vol.name,
        id: vol.id,
        oldId: vol.oldId || "",
      }),
    });

    let data = {};
    try {
      data = await resp.json();
    } catch {
      data = {};
    }

    if (!resp.ok || data.ok === false) {
      const message = data.message || "志工資料同步到後端失敗";
      console.warn("新增或更新志工到後端失敗：", message);
      showToast(message, "error");
      return false;
    }

    return true;
  } catch (err) {
    console.warn("後端 upsert 失敗：", err);
    showToast("無法連線到後端，志工資料尚未同步", "error");
    return false;
  }
}

async function deleteVolunteerFromGSheet(vol) {
  if (!authToken) {
    console.warn("尚未登入，無法刪除後端志工資料");
    showToast("尚未登入，無法刪除志工資料", "warning");
    return false;
  }

  try {
    const resp = await fetch(`${API_BASE_URL}/api/volunteers/${encodeURIComponent(vol.id)}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${authToken}`,
      },
    });

    if (!resp.ok) {
      console.warn("刪除後端志工失敗");
      showToast("刪除志工失敗，後端沒有成功刪除", "error");
      return false;
    }

    return true;
  } catch (err) {
    console.warn("後端 delete 失敗：", err);
    showToast("無法連線到後端，志工資料尚未刪除", "error");
    return false;
  }
}

async function loadVolunteersFromGSheet() {
  if (!authToken) {
    console.warn("尚未登入，略過讀取後端志工名單");
    return;
  }

  try {
    const resp = await fetch(`${API_BASE_URL}/api/volunteers`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${authToken}`,
      },
    });

    if (!resp.ok) {
      console.warn("讀取後端志工名單失敗");
      return;
    }

    const data = await resp.json();
    if (!data || !Array.isArray(data.volunteers)) {
      console.warn("後端回傳的 volunteers 格式不正確");
      return;
    }

    volunteers.length = 0;

    data.volunteers.forEach((v) => {
      const name = (v.name || "").toString().trim();
      const id = (v.id || "").toString().trim().toUpperCase();

      if (!name || !id) return;

      volunteers.push({ name, id });
    });

    saveVolunteersToStorage();
    renderVolunteerList();
    renderVolunteerSelect();
  } catch (err) {
    console.warn("從後端讀取志工名單失敗：", err);
  }
}
// ============================================================
// === 登入 + 密碼眼睛切換
// ============================================================
function removeDuplicateVolunteerServices() {
  const seen = new Set();
  let removedCount = 0;

  for (let i = volunteerServicesDraft.length - 1; i >= 0; i -= 1) {
    const service = volunteerServicesDraft[i];
    const serviceItemCode = padCode4(service.serviceItemCode);
    const serviceContentCode = padCode4(service.serviceContentCode);

    // 空白列或尚未選完整的列，不要當成重複
    if (!serviceItemCode || !serviceContentCode) {
      continue;
    }

    const key = `${serviceItemCode}__${serviceContentCode}`;

    if (seen.has(key)) {
      volunteerServicesDraft.splice(i, 1);
      removedCount += 1;
    } else {
      seen.add(key);
    }
  }

  volunteerServicesDraft.forEach((service, index) => {
    service.sortOrder = index + 1;
  });

  return removedCount;
}


function renderVolunteerServicesTable(emptyMessage = "") {
  if (!volunteerServicesTableBody) return;

  volunteerServicesTableBody.innerHTML = "";

  if (volunteerServicesDraft.length === 0) {
    const message = emptyMessage || (
      serviceManagerEditingVolunteerId
        ? "這位志工目前沒有預設服務項目"
        : "請先選擇志工並載入服務項目"
    );

    volunteerServicesTableBody.innerHTML = `
      <tr>
        <td colspan="4">${message}</td>
      </tr>
    `;
    return;
  }

  volunteerServicesDraft.forEach((service, index) => {
    const tr = document.createElement("tr");

    const serviceItemCode = padCode4(service.serviceItemCode);
    const serviceContentCode = padCode4(service.serviceContentCode);

    const itemOptionsHtml = SERVICE_ITEMS.map((item) => {
      const code = padCode4(item.code);
      const selected = code === serviceItemCode ? "selected" : "";

      return `
        <option value="${code}" ${selected}>
          ${code} - ${item.label}
        </option>
      `;
    }).join("");

    const contentList = serviceItemCode
      ? SERVICE_CONTENTS_BY_ITEM[serviceItemCode] || []
      : [];

    const contentOptionsHtml = contentList.map((content) => {
      const code = padCode4(content.code);
      const selected = code === serviceContentCode ? "selected" : "";

      return `
        <option value="${code}" ${selected}>
          ${code} - ${content.label}
        </option>
      `;
    }).join("");

    const contentPlaceholderText = serviceItemCode
      ? "請選擇服務內容"
      : "請先選擇服務項目";

    const contentDisabled = serviceItemCode ? "" : "disabled";

    tr.innerHTML = `
      <td>
        <select data-index="${index}" data-field="serviceItemCode">
          <option value="">請選擇服務項目</option>
          ${itemOptionsHtml}
        </select>
      </td>
      <td>
        <select data-index="${index}" data-field="serviceContentCode" ${contentDisabled}>
          <option value="">${contentPlaceholderText}</option>
          ${contentOptionsHtml}
        </select>
      </td>
      <td>
        <input
          type="number"
          min="1"
          step="1"
          value="${service.sortOrder || index + 1}"
          data-index="${index}"
          data-field="sortOrder"
        />
      </td>
      <td>
        <button
          type="button"
          class="btn btn-small btn-danger"
          data-action="deleteVolunteerService"
          data-index="${index}"
        >
          刪除
        </button>
      </td>
    `;

    volunteerServicesTableBody.appendChild(tr);
  });

  volunteerServicesTableBody.querySelectorAll("select, input").forEach((input) => {
    input.addEventListener("change", function () {
      const index = Number(input.dataset.index);
      const field = input.dataset.field;

      if (Number.isNaN(index) || !volunteerServicesDraft[index]) return;

      if (field === "serviceItemCode") {
        const newItemCode = padCode4(input.value);

        volunteerServicesDraft[index].serviceItemCode = newItemCode;

        // 換服務項目後，服務內容要清空，讓使用者自己選
        volunteerServicesDraft[index].serviceContentCode = "";

        renderVolunteerServicesTable();

        clearStatus(volunteerServicesErrorEl);
        clearStatus(volunteerServicesMessageEl);

        return;
      }

      if (field === "serviceContentCode") {
        volunteerServicesDraft[index].serviceContentCode = padCode4(input.value);

        const removedCount = removeDuplicateVolunteerServices();

        renderVolunteerServicesTable();

        if (removedCount > 0) {
          setStatus(volunteerServicesMessageEl, "已自動移除重複的服務項目。", "warning");
          clearStatus(volunteerServicesErrorEl);
          showToast("重複項目已自動移除", "warning");
        }

        return;
      }

      if (field === "sortOrder") {
        volunteerServicesDraft[index].sortOrder = Number(input.value || index + 1);
      }
    });
  });

  volunteerServicesTableBody.querySelectorAll('[data-action="deleteVolunteerService"]').forEach((button) => {
    button.addEventListener("click", async function () {
      const index = Number(button.dataset.index);

      if (Number.isNaN(index) || !volunteerServicesDraft[index]) return;

      const ok = await showConfirm("確定要刪除這一列服務項目嗎？", "刪除", "取消");
      if (!ok) return;

      volunteerServicesDraft.splice(index, 1);

      volunteerServicesDraft.forEach((service, i) => {
        service.sortOrder = i + 1;
      });

      renderVolunteerServicesTable();
      setStatus(volunteerServicesMessageEl, "已刪除一列，記得按儲存才會寫入 Google Sheet。", "warning");
      clearStatus(volunteerServicesErrorEl);
    });
  });
}

function getVolunteerById(volunteerId) {
  const targetId = String(volunteerId || "").trim().toUpperCase();
  return volunteers.find((v) => String(v.id || "").trim().toUpperCase() === targetId) || null;
}

function getVolunteerDisplayNameById(volunteerId) {
  const volunteer = getVolunteerById(volunteerId);
  return volunteer ? `${volunteer.name}（${volunteer.id}）` : volunteerId;
}

function setVolunteerServicesEditingState(volunteerId) {
  serviceManagerEditingVolunteerId = String(volunteerId || "").trim().toUpperCase();

  if (!serviceManagerEditingVolunteerId) {
    clearStatus(volunteerServicesCurrentEditingMessageEl);
    cancelVolunteerServicesEditBtn?.classList.add("hidden");
    return;
  }

  setStatus(
    volunteerServicesCurrentEditingMessageEl,
    `目前正在編輯：${getVolunteerDisplayNameById(serviceManagerEditingVolunteerId)}`,
    "info"
  );

  cancelVolunteerServicesEditBtn?.classList.remove("hidden");
}

function clearVolunteerServicesManagerState(options = {}) {
  const {
    keepSelect = false,
    successMessage = "",
    infoMessage = "",
  } = options;

  serviceManagerEditingVolunteerId = "";
  volunteerServicesDraft.length = 0;

  if (serviceManagerVolunteerSelect && !keepSelect) {
    serviceManagerVolunteerSelect.value = "";
  }

  renderVolunteerServicesTable("請先選擇志工並載入服務項目");
  clearStatus(volunteerServicesCurrentEditingMessageEl);
  clearStatus(volunteerServicesErrorEl);
  cancelVolunteerServicesEditBtn?.classList.add("hidden");

  if (successMessage) {
    setStatus(volunteerServicesMessageEl, successMessage, "success");
    return;
  }

  if (infoMessage) {
    setStatus(volunteerServicesMessageEl, infoMessage, "info");
    return;
  }

  clearStatus(volunteerServicesMessageEl);
}

async function loadVolunteerServicesForManager() {
  const volunteerId = serviceManagerVolunteerSelect
    ? serviceManagerVolunteerSelect.value
    : "";

  clearStatus(volunteerServicesErrorEl);
  clearStatus(volunteerServicesMessageEl);

  if (!volunteerId) {
    clearVolunteerServicesManagerState({ keepSelect: true });
    setStatus(volunteerServicesErrorEl, "請先選擇志工。", "warning");
    return;
  }

  setButtonLoading(loadVolunteerServicesBtn, true, "查詢中...");

  try {
    const resp = await fetch(
      `${API_BASE_URL}/api/volunteers/${encodeURIComponent(volunteerId)}/services`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    const data = await resp.json();

    if (!resp.ok || !data.ok) {
      setStatus(volunteerServicesErrorEl, data.message || "讀取服務項目失敗。", "error");
      return;
    }

    volunteerServicesDraft.length = 0;

    const services = Array.isArray(data.services) ? data.services : [];

    services.forEach((service, index) => {
      volunteerServicesDraft.push({
        serviceItemCode: padCode4(service.serviceItemCode),
        serviceContentCode: padCode4(service.serviceContentCode),
        sortOrder: Number(service.sortOrder || index + 1),
      });
    });

    const removedCount = removeDuplicateVolunteerServices();

    setVolunteerServicesEditingState(volunteerId);
    renderVolunteerServicesTable();

    const displayName = getVolunteerDisplayNameById(volunteerId);

    if (removedCount > 0) {
      setStatus(
        volunteerServicesMessageEl,
        `已載入 ${displayName} 的 ${volunteerServicesDraft.length} 筆服務項目，並自動移除 ${removedCount} 筆重複項目。記得按儲存才會寫回 Google Sheet。`,
        "warning"
      );
    } else {
      setStatus(volunteerServicesMessageEl, `已載入 ${displayName} 的 ${volunteerServicesDraft.length} 筆服務項目。`, "success");
    }
  } catch (err) {
    console.error(err);
    setStatus(volunteerServicesErrorEl, "無法連線到後端，讀取服務項目失敗。", "error");
  } finally {
    setButtonLoading(loadVolunteerServicesBtn, false);
  }
}
async function saveVolunteerServicesForManager() {
  const selectedVolunteerId = serviceManagerVolunteerSelect
    ? serviceManagerVolunteerSelect.value
    : "";

  const volunteerId = serviceManagerEditingVolunteerId || selectedVolunteerId;

  clearStatus(volunteerServicesErrorEl);
  clearStatus(volunteerServicesMessageEl);

  if (!volunteerId) {
    setStatus(volunteerServicesErrorEl, "請先選擇志工並查詢服務項目。", "warning");
    return;
  }

  if (!serviceManagerEditingVolunteerId || selectedVolunteerId !== serviceManagerEditingVolunteerId) {
    setStatus(volunteerServicesErrorEl, "請先按「查詢服務項目內容」，確認目前要編輯的志工。", "warning");
    return;
  }

  const displayName = getVolunteerDisplayNameById(volunteerId);

  const ok = await showConfirm(
    `確定要儲存 ${displayName} 目前畫面上的服務項目嗎？這會覆蓋這位志工原本的預設服務項目。`,
    "儲存",
    "取消"
  );

  if (!ok) return;

  const services = volunteerServicesDraft.map((service, index) => ({
    serviceItemCode: padCode4(service.serviceItemCode),
    serviceContentCode: padCode4(service.serviceContentCode),
    sortOrder: Number(service.sortOrder || index + 1),
  }));

  setButtonLoading(saveVolunteerServicesBtn, true, "儲存中...");

  try {
    const resp = await fetch(
      `${API_BASE_URL}/api/volunteers/${encodeURIComponent(volunteerId)}/services`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ services }),
      }
    );

    const data = await resp.json();

    if (!resp.ok || !data.ok) {
      setStatus(volunteerServicesErrorEl, data.message || "儲存服務項目失敗。", "error");
      return;
    }

    // 如果「新增服務紀錄」目前選的就是同一位志工，也同步更新上方多列表格
    await refreshRecordDraftTableIfCurrentVolunteer(volunteerId);

    const volunteer = getVolunteerById(volunteerId);
    const volunteerName = volunteer ? volunteer.name : displayName;

    clearVolunteerServicesManagerState({
      successMessage: `${volunteerName}志工的預設服務項目已儲存完畢。`,
    });

    showToast(`${volunteerName}志工的預設服務項目已儲存完畢`, "success");
  } catch (err) {
    console.error(err);
    setStatus(volunteerServicesErrorEl, "無法連線到後端，儲存服務項目失敗。", "error");
  } finally {
    setButtonLoading(saveVolunteerServicesBtn, false);
  }
}
async function loadVolunteerServicesForRecord(volunteerId) {
  if (!volunteerId) return [];

  try {
    const resp = await fetch(
      `${API_BASE_URL}/api/volunteers/${encodeURIComponent(volunteerId)}/services`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    const data = await resp.json();

    if (!resp.ok || !data.ok) {
      showToast(data.message || "讀取志工預設服務項目失敗", "error");
      return [];
    }

    return Array.isArray(data.services) ? data.services : [];
  } catch (err) {
    console.error(err);
    showToast("無法連線到後端，讀取志工預設服務項目失敗", "error");
    return [];
  }
}
function renderRecordServiceDraftTable(services) {
  if (!recordServiceDraftTableBody) return;

  recordServiceDraftTableBody.innerHTML = "";

  if (!services || services.length === 0) {
    recordServiceDraftTableBody.innerHTML = `
      <tr>
        <td colspan="10">這位志工目前沒有預設服務項目</td>
      </tr>
    `;
    return;
  }

  services.forEach((service, index) => {
    const serviceItemCode = padCode4(service.serviceItemCode);
    const serviceContentCode = padCode4(service.serviceContentCode);

    const serviceItemLabel = getServiceItemLabel(serviceItemCode);
    const serviceContentLabel = getServiceContentLabel(serviceItemCode, serviceContentCode);

    const tr = document.createElement("tr");

    // 把這一列對應的服務代碼存在 tr 上，新增紀錄時才讀得到乾淨代碼
    tr.dataset.serviceItemCode = serviceItemCode;
    tr.dataset.serviceContentCode = serviceContentCode;

    tr.innerHTML = `
      <td>${serviceItemCode} - ${serviceItemLabel || "未知服務項目"}</td>
      <td>${serviceContentCode} - ${serviceContentLabel || "未知服務內容"}</td>

      <td>
        <input
          type="date"
          max="${getTodayLocalYYYYMMDD()}"
          data-index="${index}"
          data-field="startDate"
          title="請先選擇服務日期起，後面的時數與人數才會開放填寫"
        />
      </td>

      <td>
        <input
          type="date"
          max="${getTodayLocalYYYYMMDD()}"
          data-index="${index}"
          data-field="endDate"
          title="請先選擇服務日期起，系統會自動帶入合法的服務日期迄"
          disabled
        />
      </td>

      <td>
        <input type="number" min="0" step="1" value="" placeholder="小時" data-index="${index}" data-field="hours" disabled />
      </td>

      <td>
        <input type="number" min="0" max="59" step="1" value="" placeholder="分鐘" data-index="${index}" data-field="minutes" disabled />
      </td>

      <td>
        <input type="number" min="0" step="1" value="" placeholder="人數" data-index="${index}" data-field="clientCount" disabled />
      </td>

      <td>
        <input type="text" readonly value="" data-index="${index}" data-field="peopleCount" disabled />
      </td>

      <td>
        <input type="number" min="0" step="1" value="" placeholder="交通費" data-index="${index}" data-field="trafficFee" disabled />
      </td>

      <td>
        <input type="number" min="0" step="1" value="" placeholder="誤餐費" data-index="${index}" data-field="mealFee" disabled />
      </td>
    `;

    recordServiceDraftTableBody.appendChild(tr);

    // 讓這一列可以自動帶結束日期、即時計算人次、整理分鐘規則
    bindRecordDraftRowEvents(tr);
  });
}
function getDraftRowInput(row, field) {
  return row.querySelector(`[data-field="${field}"]`);
}

function getDraftRowValue(row, field) {
  const input = getDraftRowInput(row, field);
  return input ? String(input.value || "").trim() : "";
}
function resetDraftTableRowsAfterSubmit() {
  if (!recordServiceDraftTableBody) return;

  const rows = recordServiceDraftTableBody.querySelectorAll("tr");

  rows.forEach((row) => {
    const startInput = row.querySelector('[data-field="startDate"]');
    const endInput = row.querySelector('[data-field="endDate"]');
    const hoursInput = row.querySelector('[data-field="hours"]');
    const minutesInput = row.querySelector('[data-field="minutes"]');
    const clientCountInput = row.querySelector('[data-field="clientCount"]');
    const peopleCountInput = row.querySelector('[data-field="peopleCount"]');
    const trafficFeeInput = row.querySelector('[data-field="trafficFee"]');
    const mealFeeInput = row.querySelector('[data-field="mealFee"]');

    if (startInput) {
      startInput.value = "";
      startInput.max = getTodayLocalYYYYMMDD();
      startInput.disabled = false;
    }

    if (endInput) {
      endInput.value = "";
      endInput.min = "";
      endInput.max = "";
      endInput.disabled = true;
    }

    [hoursInput, minutesInput, clientCountInput, trafficFeeInput, mealFeeInput].forEach((input) => {
      if (!input) return;

      input.value = "";
      input.disabled = true;
    });

    if (peopleCountInput) {
      peopleCountInput.value = "";
    }
  });
}
function getLastDateOfMonthFromIsoDate(isoDateStr) {
  const date = parseIsoDateToDate(isoDateStr);
  if (!date) return "";

  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const lastDate = new Date(year, monthIndex + 1, 0);

  return formatLocalYYYYMMDD(lastDate);
}

function isValidDraftRowDateRange(row) {
  const startDate = getDraftRowValue(row, "startDate");
  const endDate = getDraftRowValue(row, "endDate");
  const todayStr = getTodayLocalYYYYMMDD();

  if (!startDate || !endDate) return false;
  if (startDate > todayStr || endDate > todayStr) return false;
  if (endDate < startDate) return false;
  if (startDate.slice(0, 7) !== endDate.slice(0, 7)) return false;

  return true;
}

function setDraftDetailInputsDisabled(row, disabled, shouldClear = false) {
  const editableFields = ["hours", "minutes", "clientCount", "trafficFee", "mealFee"];

  editableFields.forEach((field) => {
    const input = getDraftRowInput(row, field);
    if (!input) return;

    input.disabled = disabled;
    input.title = disabled
      ? "請先選擇服務日期起與服務日期迄"
      : "";

    if (disabled && shouldClear) {
      input.value = "";
    }
  });

  const peopleCountInput = getDraftRowInput(row, "peopleCount");
  if (peopleCountInput) {
    peopleCountInput.disabled = disabled;
    peopleCountInput.value = disabled ? "" : peopleCountInput.value;
  }
}

function updateDraftRowInputLock(row, options = {}) {
  const shouldClear = options.clearWhenLocked !== false;
  const startDate = getDraftRowValue(row, "startDate");
  const endDateInput = getDraftRowInput(row, "endDate");

  if (endDateInput) {
    endDateInput.disabled = !startDate;
    endDateInput.title = !startDate
      ? "請先選擇服務日期起"
      : "可依需要調整，但不可早於起日、不可跨月、不可超過今天";

    if (!startDate && shouldClear) {
      endDateInput.value = "";
      endDateInput.min = "";
      endDateInput.max = getTodayLocalYYYYMMDD();
    }
  }

  const canEditDetails = isValidDraftRowDateRange(row);

  // 沒有完整合法日期前，後面的時數、人數、費用一律鎖住
  setDraftDetailInputsDisabled(row, !canEditDetails, shouldClear);

  if (!canEditDetails) {
    const peopleCountInput = getDraftRowInput(row, "peopleCount");
    if (peopleCountInput) peopleCountInput.value = "";
  }
}

function updateDraftRowEndDate(row) {
  const startDateInput = getDraftRowInput(row, "startDate");
  const endDateInput = getDraftRowInput(row, "endDate");

  if (!startDateInput || !endDateInput) return;

  const todayStr = getTodayLocalYYYYMMDD();

  // 服務日期起不能選未來日期
  startDateInput.max = todayStr;
  endDateInput.max = todayStr;

  let startDate = startDateInput.value;

  if (!startDate) {
    updateDraftRowInputLock(row, { clearWhenLocked: true });
    return;
  }

  if (startDate > todayStr) {
    startDateInput.value = todayStr;
    startDate = todayStr;
    showToast("服務日期起不可大於今天，已自動調整。", "warning");
  }

  const lastDateOfMonth = getLastDateOfMonthFromIsoDate(startDate);

  // 結束日期原則上帶同月份最後一天，但如果那天是未來，就只能帶今天
  const maxEndDate = lastDateOfMonth <= todayStr ? lastDateOfMonth : todayStr;

  endDateInput.disabled = false;
  endDateInput.min = startDate;
  endDateInput.max = maxEndDate;
  endDateInput.value = maxEndDate;

  updateDraftRowInputLock(row, { clearWhenLocked: false });
}

function updateDraftRowPeopleCount(row, options = {}) {
  const hoursInput = getDraftRowInput(row, "hours");
  const minutesInput = getDraftRowInput(row, "minutes");
  const clientCountInput = getDraftRowInput(row, "clientCount");
  const peopleCountInput = getDraftRowInput(row, "peopleCount");

  if (!hoursInput || !minutesInput || !clientCountInput || !peopleCountInput) return;

  if (!isValidDraftRowDateRange(row)) {
    updateDraftRowInputLock(row, { clearWhenLocked: true });
    peopleCountInput.value = "";
    return;
  }

  sanitizeNonNegativeIntegerInput(hoursInput);
  sanitizeMinutesInput(minutesInput);
  sanitizeNonNegativeIntegerInput(clientCountInput);

  const hours = toNonNegativeIntOrZero(hoursInput.value);
  const minutes = toNonNegativeIntOrZero(minutesInput.value);
  const clientCount = toNonNegativeIntOrZero(clientCountInput.value);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    Number.isNaN(clientCount) ||
    minutes < 0 ||
    minutes > 59
  ) {
    peopleCountInput.value = "";
    return;
  }

  const normalizedTime = normalizeServiceTime(hours, minutes);

  if (!normalizedTime || normalizedTime.countedHours <= 0) {
    peopleCountInput.value = "";
    return;
  }

  if (options.normalizeInputs) {
    // 把 2 小時 6 分整理成 2 小時 30 分，讓畫面也看得懂
    hoursInput.value = String(normalizedTime.hours);
    minutesInput.value = String(normalizedTime.minutes);
  }

  // 人次 = 人數 × 整理後時數
  peopleCountInput.value = String(
    Math.round(clientCount * normalizedTime.countedHours)
  );
}

function bindRecordDraftRowEvents(row) {
  const startDateInput = getDraftRowInput(row, "startDate");
  const endDateInput = getDraftRowInput(row, "endDate");

  // 一開始先鎖住後面欄位，避免還沒選日期就填時數、人數、費用
  updateDraftRowInputLock(row, { clearWhenLocked: true });

  if (startDateInput) {
    startDateInput.max = getTodayLocalYYYYMMDD();

    startDateInput.addEventListener("change", function () {
      updateDraftRowEndDate(row);
      updateDraftRowPeopleCount(row);
    });
  }

  if (endDateInput) {
    endDateInput.max = getTodayLocalYYYYMMDD();

    endDateInput.addEventListener("change", function () {
      const todayStr = getTodayLocalYYYYMMDD();
      const startDate = getDraftRowValue(row, "startDate");
      const endDate = getDraftRowValue(row, "endDate");

      if (!startDate) {
        updateDraftRowInputLock(row, { clearWhenLocked: true });
        return;
      }

      const lastDateOfMonth = getLastDateOfMonthFromIsoDate(startDate);
      const maxEndDate = lastDateOfMonth <= todayStr ? lastDateOfMonth : todayStr;

      endDateInput.min = startDate;
      endDateInput.max = maxEndDate;

      // 若使用者手動改到未來、跨月或早於起日，直接拉回合法日期
      if (
        !endDate ||
        endDate > maxEndDate ||
        endDate < startDate ||
        endDate.slice(0, 7) !== startDate.slice(0, 7)
      ) {
        endDateInput.value = maxEndDate;
        showToast("服務日期迄不可超過今天，也不可跨月，已自動調整。", "warning");
      }

      updateDraftRowInputLock(row, { clearWhenLocked: false });
      updateDraftRowPeopleCount(row);
    });
  }

  ["hours", "minutes", "clientCount"].forEach((field) => {
    const input = getDraftRowInput(row, field);
    if (!input) return;

    input.addEventListener("input", function () {
      if (field === "minutes") {
        sanitizeMinutesInput(input);
      } else {
        sanitizeNonNegativeIntegerInput(input);
      }

      if (!isValidDraftRowDateRange(row)) {
        updateDraftRowInputLock(row, { clearWhenLocked: true });
        showToast("請先選擇服務日期，才能填寫時數與人數。", "warning");
        return;
      }

      updateDraftRowPeopleCount(row);
    });
  });

  ["hours", "minutes"].forEach((field) => {
    const input = getDraftRowInput(row, field);
    if (!input) return;

    // 離開欄位或確定輸入後，把畫面上的時數也整理成正式規則
    input.addEventListener("change", function () {
      if (!isValidDraftRowDateRange(row)) {
        updateDraftRowInputLock(row, { clearWhenLocked: true });
        return;
      }

      updateDraftRowPeopleCount(row, { normalizeInputs: true });
    });

    input.addEventListener("blur", function () {
      if (!isValidDraftRowDateRange(row)) {
        updateDraftRowInputLock(row, { clearWhenLocked: true });
        return;
      }

      updateDraftRowPeopleCount(row, { normalizeInputs: true });
    });
  });
}

function isDraftRowEmpty(row) {
  const startDate = getDraftRowValue(row, "startDate");
  const endDate = getDraftRowValue(row, "endDate");
  const hours = toNonNegativeNumberOrZero(getDraftRowValue(row, "hours"));
  const minutes = toNonNegativeNumberOrZero(getDraftRowValue(row, "minutes"));
  const clientCount = toNonNegativeNumberOrZero(getDraftRowValue(row, "clientCount"));
  const trafficFee = toNonNegativeNumberOrZero(getDraftRowValue(row, "trafficFee"));
  const mealFee = toNonNegativeNumberOrZero(getDraftRowValue(row, "mealFee"));

  return (
    !startDate &&
    !endDate &&
    !hours &&
    !minutes &&
    !clientCount &&
    !trafficFee &&
    !mealFee
  );
}

function buildRecordsFromDraftTableRows(name, id) {
  if (!recordServiceDraftTableBody) {
    return {
      ok: false,
      message: "找不到多列表格。",
    };
  }

  const rows = Array.from(recordServiceDraftTableBody.querySelectorAll("tr"))
    .filter((row) => row.dataset.serviceItemCode && row.dataset.serviceContentCode);

  if (rows.length === 0) {
    return {
      ok: false,
      message: "請先選擇志工，並確認已載入預設服務項目。",
    };
  }

  const todayStr = getTodayLocalYYYYMMDD();
  const newRecords = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 1;

    // 完全空白的列直接略過，不新增、不報錯
    if (isDraftRowEmpty(row)) {
      continue;
    }

    const serviceItemCode = padCode4(row.dataset.serviceItemCode);
    const serviceContentCode = padCode4(row.dataset.serviceContentCode);

    const startDate = getDraftRowValue(row, "startDate");
    const endDate = getDraftRowValue(row, "endDate");

    if (!startDate || !endDate) {
      return {
        ok: false,
        message: `第 ${rowNumber} 列請先選擇服務日期。`,
      };
    }

    if (startDate > todayStr || endDate > todayStr) {
      return {
        ok: false,
        message: `第 ${rowNumber} 列的服務日期不可是未來日期。`,
      };
    }

    if (endDate < startDate) {
      return {
        ok: false,
        message: `第 ${rowNumber} 列的服務日期迄不能早於服務日期起。`,
      };
    }

    if (startDate.slice(0, 7) !== endDate.slice(0, 7)) {
      return {
        ok: false,
        message: `第 ${rowNumber} 列的服務日期不可跨月。`,
      };
    }

    const hours = toNonNegativeIntOrZero(getDraftRowValue(row, "hours"));
    const minutes = toNonNegativeIntOrZero(getDraftRowValue(row, "minutes"));
    const clientCount = toNonNegativeIntOrZero(getDraftRowValue(row, "clientCount"));
    const trafficFee = toNonNegativeNumberOrZero(getDraftRowValue(row, "trafficFee"));
    const mealFee = toNonNegativeNumberOrZero(getDraftRowValue(row, "mealFee"));

    if (Number.isNaN(hours)) {
      return {
        ok: false,
        message: `第 ${rowNumber} 列的小時請輸入 0 以上的整數。`,
      };
    }

    if (Number.isNaN(minutes) || minutes < 0 || minutes > 59) {
      return {
        ok: false,
        message: `第 ${rowNumber} 列的分鐘請輸入 0 到 59。`,
      };
    }

    const normalizedTime = normalizeServiceTime(hours, minutes);

    if (!normalizedTime || normalizedTime.countedHours <= 0) {
      return {
        ok: false,
        message: `第 ${rowNumber} 列請填寫服務時數。`,
      };
    }

    if (Number.isNaN(clientCount)) {
      return {
        ok: false,
        message: `第 ${rowNumber} 列的人數請輸入 0 以上的整數。`,
      };
    }

    if (Number.isNaN(trafficFee)) {
      return {
        ok: false,
        message: `第 ${rowNumber} 列的交通費請輸入 0 以上的數字。`,
      };
    }

    if (Number.isNaN(mealFee)) {
      return {
        ok: false,
        message: `第 ${rowNumber} 列的誤餐費請輸入 0 以上的數字。`,
      };
    }

    newRecords.push({
      name,
      id,
      startDate,
      endDate,
      serviceItemCode,
      serviceContentCode,

      // 寫進 records 的是整理後時數
      hours: normalizedTime.hours,
      minutes: normalizedTime.minutes,

      clientCount,

      // 人次 = 人數 × 整理後時數
      peopleCount: Math.round(clientCount * normalizedTime.countedHours),

      trafficFee,
      mealFee,
    });
  }

  if (newRecords.length === 0) {
    return {
      ok: false,
      message: "請至少填寫一列服務紀錄。",
    };
  }

  return {
    ok: true,
    records: newRecords,
  };
}
function isSameServiceRecord(a, b) {
  return (
    a.id === b.id &&
    a.startDate === b.startDate &&
    a.endDate === b.endDate &&
    padCode4(a.serviceItemCode) === padCode4(b.serviceItemCode) &&
    padCode4(a.serviceContentCode) === padCode4(b.serviceContentCode)
  );
}

function findDuplicateRecord(newRecord) {
  return records.find((existingRecord) => {
    return isSameServiceRecord(existingRecord, newRecord);
  });
}

function findDuplicateRecordInNewRecords(newRecords) {
  const seen = new Set();

  for (const record of newRecords) {
    const key = [
      record.id,
      record.startDate,
      record.endDate,
      padCode4(record.serviceItemCode),
      padCode4(record.serviceContentCode),
    ].join("__");

    if (seen.has(key)) {
      return record;
    }

    seen.add(key);
  }

  return null;
}

function isRecordDraftTableDirty() {
  if (!recordServiceDraftTableBody) return false;

  const rows = Array.from(recordServiceDraftTableBody.querySelectorAll("tr"))
    .filter((row) => row.dataset.serviceItemCode && row.dataset.serviceContentCode);

  return rows.some((row) => !isDraftRowEmpty(row));
}

async function refreshRecordDraftTableIfCurrentVolunteer(volunteerId) {
  if (!recordVolunteerSelect || !recordServiceDraftTableBody) return;

  const selectedVolunteer = volunteers.find((v) => v.name === recordVolunteerSelect.value);

  if (!selectedVolunteer || selectedVolunteer.id !== volunteerId) {
    return;
  }

  if (isRecordDraftTableDirty()) {
    showToast("新增服務紀錄區已有尚未送出的資料，先不自動更新服務項目，避免覆蓋草稿。", "warning");
    setText(recordErrorEl, "志工預設服務項目已儲存，但目前新增服務紀錄區有尚未送出的資料。請先新增或清空後，再重新選擇志工載入最新服務項目。");
    return;
  }

  const latestServices = await loadVolunteerServicesForRecord(volunteerId);
  renderRecordServiceDraftTable(latestServices);

  if (latestServices.length === 0) {
    showToast("新增服務紀錄區已同步更新：這位志工目前沒有預設服務項目。", "warning");
    return;
  }

  showToast(`新增服務紀錄區已同步更新 ${latestServices.length} 筆服務項目`, "success");
}

function initVolunteerServicesManager() {
  renderVolunteerServicesTable("請先選擇志工並載入服務項目");

  if (serviceManagerVolunteerSelect) {
    serviceManagerVolunteerSelect.addEventListener("change", function () {
      const volunteerId = serviceManagerVolunteerSelect.value;

      if (!volunteerId) {
        clearVolunteerServicesManagerState();
        return;
      }

      serviceManagerEditingVolunteerId = "";
      volunteerServicesDraft.length = 0;
      renderVolunteerServicesTable("請按「查詢服務項目內容」載入這位志工的資料");
      clearStatus(volunteerServicesCurrentEditingMessageEl);
      clearStatus(volunteerServicesErrorEl);
      cancelVolunteerServicesEditBtn?.classList.add("hidden");
      setStatus(
        volunteerServicesMessageEl,
        `已選擇 ${getVolunteerDisplayNameById(volunteerId)}，請按「查詢服務項目內容」開始編輯。`,
        "info"
      );
    });
  }

  if (loadVolunteerServicesBtn) {
    loadVolunteerServicesBtn.addEventListener("click", function () {
      loadVolunteerServicesForManager();
    });
  }

  if (addVolunteerServiceRowBtn) {
    addVolunteerServiceRowBtn.addEventListener("click", function () {
      if (!serviceManagerEditingVolunteerId) {
        setStatus(volunteerServicesErrorEl, "請先選擇志工並查詢服務項目，再新增服務項目列。", "warning");
        return;
      }

      // 新增空白列，不自動塞服務項目，也不自動塞服務內容
      volunteerServicesDraft.push({
        serviceItemCode: "",
        serviceContentCode: "",
        sortOrder: volunteerServicesDraft.length + 1,
      });

      renderVolunteerServicesTable();

      setStatus(volunteerServicesMessageEl, "已新增一列，請選擇服務項目與服務內容。", "info");
      clearStatus(volunteerServicesErrorEl);
    });
  }

  if (saveVolunteerServicesBtn) {
    saveVolunteerServicesBtn.addEventListener("click", function () {
      saveVolunteerServicesForManager();
    });
  }

  if (cancelVolunteerServicesEditBtn) {
    cancelVolunteerServicesEditBtn.addEventListener("click", function () {
      clearVolunteerServicesManagerState({
        infoMessage: "已取消編輯服務項目。",
      });
      showToast("已取消編輯服務項目", "info");
    });
  }
}

function showApp() { loginSection?.classList.add("hidden"); appSection?.classList.remove("hidden"); }
function showLogin() { appSection?.classList.add("hidden"); loginSection?.classList.remove("hidden"); }

function initPasswordToggle() {
  const toggleBtn = document.getElementById("passwordToggleBtn");
  const pwdInput = document.getElementById("loginPassword");
  const eyeOpen = toggleBtn?.querySelector(".eye-open");
  const eyeOff = toggleBtn?.querySelector(".eye-off");

  if (!toggleBtn || !pwdInput) return;

  toggleBtn.addEventListener("click", function () {
    const isHidden = pwdInput.type === "password";

    // 切換輸入框型別
    pwdInput.type = isHidden ? "text" : "password";

    // 切換圖示
    if (eyeOpen) eyeOpen.style.display = isHidden ? "none" : "block";
    if (eyeOff) eyeOff.style.display = isHidden ? "block" : "none";

    // 更新 aria-label
    toggleBtn.setAttribute("aria-label", isHidden ? "隱藏密碼" : "顯示密碼");

    // 保持焦點在輸入框
    pwdInput.focus();
  });
}

function initLogin() {
  if (loginSection && appSection) showLogin();

  initPasswordToggle();

  if (!loginForm) return;

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    clearStatus(loginErrorEl);

    const pwd = (loginPasswordInput?.value || "").trim();

    if (!pwd) {
      setStatus(loginErrorEl, "請先輸入密碼。", "warning");
      return;
    }

    setButtonLoading(loginSubmitBtn, true, "登入中...");

    try {
      const resp = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: pwd, // 把使用者輸入的密碼送到後端檢查
        }),
      });

      const data = await resp.json();

      if (!resp.ok || !data.accessToken) {
        setStatus(loginErrorEl, "密碼錯誤，請再試一次。", "error");

        if (loginPasswordInput) {
          loginPasswordInput.value = "";
          loginPasswordInput.focus();
        }

        return;
      }

      // 保存後端發給前端的臨時通行證
      authToken = data.accessToken;

      if (loginPasswordInput) {
        loginPasswordInput.value = "";
      }

      showApp();

      // 登入成功後，才從後端讀取志工名單
      await loadVolunteersFromGSheet();
    } catch (err) {
      console.error(err);
      setStatus(loginErrorEl, "無法連線到後端，請確認後端是否已啟動。", "error");
    } finally {
      setButtonLoading(loginSubmitBtn, false);
    }
  });
}
// ============================================================
// === 服務項目 / 內容下拉 ===
// ============================================================

// ============================================================
// === 身分證輸入限制 ===
// ============================================================

function initVolunteerIdInputGuards() {
  if (!volunteerIdInput) return;
  volunteerIdInput.addEventListener("input", function (e) {
    let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (v.length > 10) v = v.slice(0, 10);
    e.target.value = v;
  });
  volunteerIdInput.addEventListener("blur", function () {
    const id = (volunteerIdInput.value || "").trim().toUpperCase();
    if (!id) { setText(volunteerIdErrorEl, ""); return; }
    setText(volunteerIdErrorEl, isValidTaiwanId(id) ? "" : "身分證格式：1 英文字母 + 9 數字（例 A123456789）");
  });
}

// ============================================================
// === 志工編輯模式 ===
// ============================================================

function enterVolunteerEditMode(index) {
  editingVolunteerIndex = index;
  const v = volunteers[index];
  if (!v) return;

  if (volunteerNameInput) volunteerNameInput.value = v.name;
  if (volunteerIdInput) volunteerIdInput.value = v.id;

  setText(volunteerIdErrorEl, "");
  setStatus(volunteerFormStatusEl, `正在編輯：${v.name}（${v.id}）。下方名單會先隱藏這位志工，避免重複操作。`, "info");

  if (volunteerSubmitBtn) volunteerSubmitBtn.textContent = "儲存修改";
  cancelVolunteerEditBtn?.classList.remove("hidden");

  renderVolunteerList();
  volunteerNameInput?.focus();
}

function exitVolunteerEditMode() {
  editingVolunteerIndex = null;

  if (volunteerForm) volunteerForm.reset();

  setText(volunteerIdErrorEl, "");
  clearStatus(volunteerFormStatusEl);

  if (volunteerSubmitBtn) volunteerSubmitBtn.textContent = "新增志工";
  cancelVolunteerEditBtn?.classList.add("hidden");

  renderVolunteerList();
}

// ============================================================
// === 志工列表渲染 ===
// ============================================================

function renderVolunteerList() {
  if (!volunteerListEl) return;

  volunteerListEl.innerHTML = "";

  if (volunteers.length === 0) {
    volunteerListEl.innerHTML = '<li style="color:#888780;font-size:0.88rem;padding:0.4rem 0;">尚未建立志工名單</li>';
    return;
  }

  if (editingVolunteerIndex !== null && volunteers[editingVolunteerIndex]) {
    const editingVolunteer = volunteers[editingVolunteerIndex];
    const noteLi = document.createElement("li");
    noteLi.className = "volunteer-editing-note";
    noteLi.textContent = `編輯中：${editingVolunteer.name}（${editingVolunteer.id}）。完成或取消後會回到名單。`;
    volunteerListEl.appendChild(noteLi);
  }

  let visibleCount = 0;

  volunteers.forEach((v, index) => {
    // 正在編輯的那一筆先不要正常顯示，避免使用者重複按修改或刪除。
    if (editingVolunteerIndex === index) {
      return;
    }

    const li = document.createElement("li");
    li.dataset.index = String(index);
    li.innerHTML = `
      <div class="volunteer-text">
        ${v.name}<br><small>身分證：${v.id}</small>
      </div>
      <div class="volunteer-actions">
        <button type="button" class="btn btn-small btn-secondary" data-action="edit">修改</button>
        <button type="button" class="btn btn-small btn-danger"    data-action="delete">刪除</button>
      </div>`;
    volunteerListEl.appendChild(li);
    visibleCount += 1;
  });

  if (visibleCount === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.style.cssText = "color:#888780;font-size:0.88rem;padding:0.4rem 0;";
    emptyLi.textContent = "其他志工名單目前沒有可顯示的資料。";
    volunteerListEl.appendChild(emptyLi);
  }
}

function renderVolunteerSelect() {
  // 新增服務紀錄用：用姓名當 value，因為你原本流程是選姓名後自動帶 ID
  if (recordVolunteerSelect) {
    const prevName = recordVolunteerSelect.value;

    recordVolunteerSelect.innerHTML = '<option value="">請選擇志工</option>';

    volunteers.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v.name;
      opt.textContent = v.name;
      recordVolunteerSelect.appendChild(opt);
    });

    const stillExists = volunteers.some((v) => v.name === prevName);
    recordVolunteerSelect.value = stillExists ? prevName : "";

    if (recordVolunteerIdInput) {
      const matched = volunteers.find((v) => v.name === recordVolunteerSelect.value);
      recordVolunteerIdInput.value = matched ? matched.id : "";
    }
  }

  // 預設服務項目管理用：用身分證 ID 當 value，之後比較方便呼叫 API
  if (serviceManagerVolunteerSelect) {
    const prevId = serviceManagerVolunteerSelect.value;

    serviceManagerVolunteerSelect.innerHTML = '<option value="">請選擇志工</option>';

    volunteers.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v.id;
      opt.textContent = `${v.name}（${v.id}）`;
      serviceManagerVolunteerSelect.appendChild(opt);
    });

    const stillExists = volunteers.some((v) => v.id === prevId);
    serviceManagerVolunteerSelect.value = stillExists ? prevId : "";
  }

  renderBatchVolunteerChecklist();
}
// ============================================================
// === 志工名單：新增 / 修改 ===
// ============================================================

function updateLocalRecordsVolunteerIdentity(oldId, updatedVolunteer) {
  const targetOldId = String(oldId || "").trim().toUpperCase();
  const nextName = String(updatedVolunteer?.name || "").trim();
  const nextId = String(updatedVolunteer?.id || "").trim().toUpperCase();

  if (!targetOldId || !nextName || !nextId) {
    return 0;
  }

  let updatedCount = 0;

  records.forEach((record) => {
    const recordId = String(record.id || "").trim().toUpperCase();

    if (recordId === targetOldId) {
      record.name = nextName;
      record.id = nextId;
      updatedCount += 1;
    }
  });

  return updatedCount;
}

function updateBatchDraftVolunteerIdentity(oldId, updatedVolunteer) {
  const targetOldId = String(oldId || "").trim().toUpperCase();
  const nextName = String(updatedVolunteer?.name || "").trim();
  const nextId = String(updatedVolunteer?.id || "").trim().toUpperCase();

  if (!targetOldId || !nextName || !nextId) {
    return 0;
  }

  let updatedCount = 0;

  batchDraftRows.forEach((row) => {
    const rowId = String(row.id || "").trim().toUpperCase();

    if (rowId === targetOldId) {
      row.name = nextName;
      row.id = nextId;
      updatedCount += 1;
    }
  });

  if (updatedCount > 0) {
    renderBatchPreviewTable();
  }

  return updatedCount;
}

function initVolunteerForm() {
  if (!volunteerForm) return;

  if (cancelVolunteerEditBtn) {
    cancelVolunteerEditBtn.addEventListener("click", function () {
      exitVolunteerEditMode();
      showToast("已取消修改志工資料", "info");
    });
  }

  volunteerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = trimValue(volunteerNameInput);
    const id = trimValue(volunteerIdInput).toUpperCase();
    const oldId = editingVolunteerIndex !== null && volunteers[editingVolunteerIndex]
      ? String(volunteers[editingVolunteerIndex].id || "").trim().toUpperCase()
      : "";

    if (!name || !id) {
      setStatus(volunteerFormStatusEl, "請輸入完整的志工姓名與身分證字號。", "warning");
      showToast("請輸入完整的志工姓名與身分證字號", "warning");
      return;
    }

    if (!isValidTaiwanId(id)) {
      setText(volunteerIdErrorEl, "身分證格式：1 英文字母 + 9 數字（例 A123456789）");
      setStatus(volunteerFormStatusEl, "身分證格式不正確，請確認後再儲存。", "error");
      showToast("身分證格式不正確", "error");
      return;
    }

    setText(volunteerIdErrorEl, "");

    const exists = volunteers.some((v, idx) => {
      if (editingVolunteerIndex !== null && idx === editingVolunteerIndex) return false;
      return String(v.id || "").trim().toUpperCase() === id;
    });

    if (exists) {
      setStatus(volunteerFormStatusEl, "此身分證字號已在志工名單中。", "warning");
      showToast("此身分證字號已在志工名單中", "warning");
      return;
    }

    const loadingText = editingVolunteerIndex === null ? "新增中..." : "儲存中...";
    setButtonLoading(volunteerSubmitBtn, true, loadingText);

    const syncOk = await sendVolunteerToGSheet({ name, id, oldId });

    setButtonLoading(volunteerSubmitBtn, false);

    if (!syncOk) {
      setStatus(volunteerFormStatusEl, "後端同步失敗，這次沒有更新志工資料。", "error");
      return;
    }

    if (editingVolunteerIndex === null) {
      volunteers.push({ name, id });
      setStatus(volunteerFormStatusEl, `已新增志工「${name}」。`, "success");
      showToast(`已新增志工「${name}」`, "success");
    } else {
      const updatedRecordCount = updateLocalRecordsVolunteerIdentity(oldId, { name, id });
      updateBatchDraftVolunteerIdentity(oldId, { name, id });

      volunteers[editingVolunteerIndex].name = name;
      volunteers[editingVolunteerIndex].id = id;

      if (updatedRecordCount > 0) {
        saveRecordsToStorage();
        renderRecordsTable();
      }

      setStatus(volunteerFormStatusEl, `已更新志工「${name}」的資料。`, "success");
      showToast(`已更新志工「${name}」的資料`, "success");
    }

    const successMessage = editingVolunteerIndex === null
      ? `已新增志工「${name}」。`
      : `已更新志工「${name}」的資料。`;

    saveVolunteersToStorage();
    renderVolunteerSelect();
    exitVolunteerEditMode();
    setStatus(volunteerFormStatusEl, successMessage, "success");

    await loadVolunteersFromGSheet();
  });
}

// ============================================================
// === 志工列表事件代理 ===
// ============================================================

function initVolunteerListActions() {
  if (!volunteerListEl) return;
  volunteerListEl.addEventListener("click", async function (e) {
    const button = e.target.closest("button");
    if (!button) return;
    const li = button.closest("li");
    if (!li) return;
    const index = Number(li.dataset.index);
    if (Number.isNaN(index)) return;
    const action = button.dataset.action;
    if (action === "edit") { enterVolunteerEditMode(index); return; }
    if (action === "delete") {
  const v = volunteers[index];
  if (!v) return;

  const ok = await showConfirm(`確定要刪除志工「${v.name}」嗎？`);
  if (!ok) return;

  setButtonLoading(button, true, "刪除中...");

  const deleteOk = await deleteVolunteerFromGSheet(v);

  setButtonLoading(button, false);

  if (!deleteOk) {
    return;
  }

  volunteers.splice(index, 1);

  if (editingVolunteerIndex === index) {
    exitVolunteerEditMode();
  } else if (editingVolunteerIndex !== null && editingVolunteerIndex > index) {
    editingVolunteerIndex -= 1;
    renderVolunteerList();
  } else {
    renderVolunteerList();
  }

  saveVolunteersToStorage();
  renderVolunteerSelect();
  showToast(`已刪除志工「${v.name}」`, "info");

  if (recordVolunteerSelect?.value === v.name) {
    recordVolunteerSelect.value = "";
    if (recordVolunteerIdInput) recordVolunteerIdInput.value = "";
  }

  await loadVolunteersFromGSheet();
}
  });
}

function initVolunteerSelectAutoFill() {
  if (!recordVolunteerSelect) return;

  recordVolunteerSelect.addEventListener("change", async function () {
    const matched = volunteers.find((v) => v.name === recordVolunteerSelect.value);
    const volunteerId = matched ? matched.id : "";

    if (recordVolunteerIdInput) {
      recordVolunteerIdInput.value = volunteerId;
    }

    setText(recordErrorEl, "");

    if (!volunteerId) {
      renderRecordServiceDraftTable([]);
      return;
    }

    const services = await loadVolunteerServicesForRecord(volunteerId);

    renderRecordServiceDraftTable(services);

    if (services.length === 0) {
      showToast("這位志工目前沒有設定預設服務項目", "warning");
      return;
    }

    showToast(`已載入 ${services.length} 筆預設服務項目`, "success");
  });
}

// ============================================================
// === 受服務人次預覽 ===
// ============================================================

// ============================================================
// === 服務紀錄：編輯模式 ===
// ============================================================

// ============================================================
// === 表格：組每列 17 欄 ===
// ============================================================

function buildReadableRowCells(r) {
  return [
    r.name || "",
    r.id || "",
    r.startDate || "",
    r.endDate || "",
    `${padCode4(r.serviceItemCode)} - ${getServiceItemLabel(r.serviceItemCode)}`,
    `${padCode4(r.serviceContentCode)} - ${getServiceContentLabel(r.serviceItemCode, r.serviceContentCode)}`,
    String(r.hours ?? 0),
    String(r.minutes ?? 0),
    String(r.peopleCount ?? 0),
    String(r.trafficFee ?? 0),
    String(r.mealFee ?? 0),
    "", "", "", "", "", "",
  ];
}

function buildImportRowCells(r) {
  return [
    r.name || "",
    r.id || "",
    toRocDate(r.startDate),
    toRocDate(r.endDate),
    padCode4(r.serviceItemCode),
    padCode4(r.serviceContentCode),
    String(r.hours ?? 0),
    String(r.minutes ?? 0),
    String(r.peopleCount ?? 0),
    String(r.trafficFee ?? 0),
    String(r.mealFee ?? 0),
    "", "", "", "", "", "",
  ];
}

function fillDraftRowWithRecord(row, record) {
  const startInput = getDraftRowInput(row, "startDate");
  const endInput = getDraftRowInput(row, "endDate");
  const hoursInput = getDraftRowInput(row, "hours");
  const minutesInput = getDraftRowInput(row, "minutes");
  const clientCountInput = getDraftRowInput(row, "clientCount");
  const trafficFeeInput = getDraftRowInput(row, "trafficFee");
  const mealFeeInput = getDraftRowInput(row, "mealFee");

  if (startInput) {
    startInput.value = record.startDate || "";
  }

  // 先依照服務日期起，建立合法的服務日期迄範圍並解鎖後續欄位
  updateDraftRowEndDate(row);

  if (endInput) {
    endInput.value = record.endDate || "";
  }

  updateDraftRowInputLock(row, { clearWhenLocked: false });

  if (hoursInput) hoursInput.value = String(record.hours ?? "");
  if (minutesInput) minutesInput.value = String(record.minutes ?? "");
  if (clientCountInput) clientCountInput.value = String(record.clientCount ?? "");
  if (trafficFeeInput) trafficFeeInput.value = String(record.trafficFee ?? "");
  if (mealFeeInput) mealFeeInput.value = String(record.mealFee ?? "");

  updateDraftRowPeopleCount(row, { normalizeInputs: false });
}

async function editRecordInDraftTable(index) {
  const record = records[index];

  if (!record) {
    showToast("找不到要編輯的服務紀錄", "error");
    return;
  }

  const ok = await showConfirm(
    "要把這筆紀錄帶回上方多列表格編輯嗎？原紀錄會先從下方列表移除，修改後請重新按「新增服務紀錄」。",
    "帶回編輯",
    "取消"
  );

  if (!ok) return;

  if (recordVolunteerSelect) {
    recordVolunteerSelect.value = record.name || "";
  }

  if (recordVolunteerIdInput) {
    recordVolunteerIdInput.value = record.id || "";
  }

  let services = await loadVolunteerServicesForRecord(record.id);
  services = Array.isArray(services) ? services : [];

  const hasRecordService = services.some((service) => {
    return (
      padCode4(service.serviceItemCode) === padCode4(record.serviceItemCode) &&
      padCode4(service.serviceContentCode) === padCode4(record.serviceContentCode)
    );
  });

  // 多人批次新增的紀錄不一定是志工固定服務項目。
  // 編輯時只暫時把這個服務項目加到畫面，不會寫入志工預設服務項目。
  if (!hasRecordService) {
    services = [
      {
        serviceItemCode: padCode4(record.serviceItemCode),
        serviceContentCode: padCode4(record.serviceContentCode),
        sortOrder: 0,
      },
      ...services,
    ];
  }

  renderRecordServiceDraftTable(services);

  const targetRow = Array.from(recordServiceDraftTableBody.querySelectorAll("tr"))
    .find((row) => {
      return (
        padCode4(row.dataset.serviceItemCode) === padCode4(record.serviceItemCode) &&
        padCode4(row.dataset.serviceContentCode) === padCode4(record.serviceContentCode)
      );
    });

  if (!targetRow) {
    showToast("找不到對應的服務項目列，無法編輯這筆紀錄", "error");
    return;
  }

  fillDraftRowWithRecord(targetRow, record);

  // 先從 records 移除原本那筆，避免重新新增時被判定成重複紀錄
  records.splice(index, 1);
  saveRecordsToStorage();
  renderRecordsTable();

  setText(recordErrorEl, "這筆紀錄已帶回上方多列表格，修改後請重新按「新增服務紀錄」。");
  showToast("已帶回上方多列表格，修改後請重新新增", "info");

  recordForm?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderRecordsTable() {
  if (!recordsTableBody) return;
  recordsTableBody.innerHTML = "";

  records.forEach((r, index) => {
    const tr = document.createElement("tr");
    const cells = displayMode === "import" ? buildImportRowCells(r) : buildReadableRowCells(r);

    cells.forEach((text) => {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    });

    const actionTd = document.createElement("td");
    actionTd.style.whiteSpace = "nowrap";
    actionTd.innerHTML = `
      <button
        type="button"
        class="btn btn-small btn-secondary"
        data-action="editRecord"
        data-index="${index}"
      >
        編輯
      </button>
      <button
        type="button"
        class="btn btn-small btn-danger"
        data-action="deleteRecord"
        data-index="${index}"
        style="margin-left:0.3rem;"
      >
        刪除
      </button>
    `;

    tr.appendChild(actionTd);
    recordsTableBody.appendChild(tr);
  });

  renderSummaryBar();
}

function initRecordTableActions() {
  if (!recordsTableBody) return;

  recordsTableBody.addEventListener("click", async function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;

    const action = btn.dataset.action;
    const index = Number(btn.dataset.index);

    if (Number.isNaN(index)) return;

    if (action === "editRecord") {
      editRecordInDraftTable(index);
      return;
    }

    if (action === "deleteRecord") {
      const r = records[index];
      if (!r) return;

      const ok = await showConfirm(`確定要刪除「${r.name}」在 ${r.startDate} 的服務紀錄嗎？`);
      if (!ok) return;

      records.splice(index, 1);
      saveRecordsToStorage();
      renderRecordsTable();

      showToast("已刪除該筆服務紀錄", "info");
    }
  });
}

// ============================================================
// === 新增 / 修改 服務紀錄 ===
// ============================================================

function initRecordForm() {
  if (!recordForm) return;

  recordForm.addEventListener("submit", function (e) {
    e.preventDefault();

    setText(recordErrorEl, "");

    const name = recordVolunteerSelect ? recordVolunteerSelect.value : "";
    const id = recordVolunteerIdInput ? recordVolunteerIdInput.value : "";

    if (!name) {
      setText(recordErrorEl, "請選擇志工姓名。");
      showToast("請先選擇志工姓名", "warning");
      return;
    }

    if (!id) {
      setText(recordErrorEl, "請確認已選擇志工，並帶出身分證字號。");
      showToast("請確認已帶出身分證字號", "warning");
      return;
    }

    const result = buildRecordsFromDraftTableRows(name, id);

    if (!result.ok) {
      setText(recordErrorEl, result.message);
      showToast(result.message, "warning");
      return;
    }

    const duplicateInNewRecords = findDuplicateRecordInNewRecords(result.records);

    if (duplicateInNewRecords) {
      const itemLabel = getServiceItemLabel(duplicateInNewRecords.serviceItemCode);
      const contentLabel = getServiceContentLabel(
        duplicateInNewRecords.serviceItemCode,
        duplicateInNewRecords.serviceContentCode
      );

      const message = `本次新增中有重複服務紀錄：${duplicateInNewRecords.startDate} 至 ${duplicateInNewRecords.endDate}，${itemLabel}／${contentLabel}。請確認後再新增。`;

      setText(recordErrorEl, message);
      showToast("本次新增中有重複服務紀錄，未新增。", "warning");
      return;
    }

    const duplicateExistingRecord = result.records.find((newRecord) => {
      return findDuplicateRecord(newRecord);
    });

    if (duplicateExistingRecord) {
      const itemLabel = getServiceItemLabel(duplicateExistingRecord.serviceItemCode);
      const contentLabel = getServiceContentLabel(
        duplicateExistingRecord.serviceItemCode,
        duplicateExistingRecord.serviceContentCode
      );

      const message = `已存在相同服務紀錄：${duplicateExistingRecord.startDate} 至 ${duplicateExistingRecord.endDate}，${itemLabel}／${contentLabel}。請先刪除或編輯原紀錄，不會新增重複時數。`;

      setText(recordErrorEl, message);
      showToast("已存在相同服務紀錄，未新增。", "warning");
      return;
    }

    setButtonLoading(recordSubmitBtn, true, "新增中...");
    records.push(...result.records);

    saveRecordsToStorage();
    renderRecordsTable();
    resetDraftTableRowsAfterSubmit();

    showToast(`已新增 ${result.records.length} 筆服務紀錄`, "success");

    clearStatus(recordErrorEl);
    setButtonLoading(recordSubmitBtn, false);
  });
}



// ============================================================
// === 多人批次新增服務紀錄 ===
// ============================================================

function renderBatchServiceItemOptions() {
  if (!batchServiceItemSelect) return;

  batchServiceItemSelect.innerHTML = '<option value="">請選擇服務項目</option>';

  SERVICE_ITEMS.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = padCode4(item.code);
    opt.textContent = `${padCode4(item.code)} - ${item.label}`;
    batchServiceItemSelect.appendChild(opt);
  });

  renderBatchServiceContentOptions("");
}

function renderBatchServiceContentOptions(itemCode) {
  if (!batchServiceContentSelect) return;

  batchServiceContentSelect.innerHTML = "";

  if (!itemCode || !SERVICE_CONTENTS_BY_ITEM[itemCode]) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "請先選擇服務項目";
    batchServiceContentSelect.appendChild(opt);
    batchServiceContentSelect.disabled = true;
    return;
  }

  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = "請選擇服務內容";
  batchServiceContentSelect.appendChild(ph);

  SERVICE_CONTENTS_BY_ITEM[itemCode].forEach((content) => {
    const opt = document.createElement("option");
    opt.value = padCode4(content.code);
    opt.textContent = `${padCode4(content.code)} - ${content.label}`;
    batchServiceContentSelect.appendChild(opt);
  });

  batchServiceContentSelect.disabled = false;
}

function renderBatchVolunteerChecklist() {
  if (!batchVolunteerChecklist) return;

  batchVolunteerChecklist.innerHTML = "";

  if (!volunteers || volunteers.length === 0) {
    batchVolunteerChecklist.innerHTML = '<p class="section-desc" style="margin:0;">尚未建立志工名單</p>';
    if (batchSelectAllCheckbox) batchSelectAllCheckbox.checked = false;
    return;
  }

  const list = document.createElement("div");
  list.style.cssText = `
    display:grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap:0.45rem 0.8rem;
  `;

  volunteers.forEach((v) => {
    const label = document.createElement("label");
    label.style.cssText = "display:flex;align-items:center;gap:0.4rem;font-size:0.9rem;line-height:1.5;";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "batch-volunteer-checkbox";
    checkbox.value = v.id;

    const text = document.createElement("span");
    text.textContent = `${v.name}（${v.id}）`;

    label.appendChild(checkbox);
    label.appendChild(text);
    list.appendChild(label);
  });

  batchVolunteerChecklist.appendChild(list);

  if (batchSelectAllCheckbox) batchSelectAllCheckbox.checked = false;
}

function getCheckedBatchVolunteers() {
  if (!batchVolunteerChecklist) return [];

  const checkedIds = Array.from(
    batchVolunteerChecklist.querySelectorAll(".batch-volunteer-checkbox:checked")
  ).map((checkbox) => checkbox.value);

  return volunteers.filter((v) => checkedIds.includes(v.id));
}

function updateBatchEndDateConstraints() {
  if (!batchStartDateInput || !batchEndDateInput) return;

  const todayStr = getTodayLocalYYYYMMDD();
  batchStartDateInput.max = todayStr;
  batchEndDateInput.max = todayStr;

  let startDate = batchStartDateInput.value;

  if (!startDate) {
    batchEndDateInput.value = "";
    batchEndDateInput.min = "";
    batchEndDateInput.max = todayStr;
    return;
  }

  if (startDate > todayStr) {
    batchStartDateInput.value = todayStr;
    startDate = todayStr;
    showToast("服務日期起不可大於今天，已自動調整。", "warning");
  }

  const lastDateOfMonth = getLastDateOfMonthFromIsoDate(startDate);
  const maxEndDate = lastDateOfMonth <= todayStr ? lastDateOfMonth : todayStr;

  batchEndDateInput.min = startDate;
  batchEndDateInput.max = maxEndDate;

  if (
    !batchEndDateInput.value ||
    batchEndDateInput.value < startDate ||
    batchEndDateInput.value > maxEndDate ||
    batchEndDateInput.value.slice(0, 7) !== startDate.slice(0, 7)
  ) {
    batchEndDateInput.value = maxEndDate;
  }
}

function validateBatchCommonInputs() {
  const startDate = batchStartDateInput ? batchStartDateInput.value : "";
  const endDate = batchEndDateInput ? batchEndDateInput.value : "";
  const serviceItemCode = batchServiceItemSelect ? padCode4(batchServiceItemSelect.value) : "";
  const serviceContentCode = batchServiceContentSelect ? padCode4(batchServiceContentSelect.value) : "";
  const todayStr = getTodayLocalYYYYMMDD();

  if (!startDate || !endDate) {
    return { ok: false, message: "請填寫服務日期起與服務日期迄。" };
  }

  if (startDate > todayStr || endDate > todayStr) {
    return { ok: false, message: "服務日期不可是未來日期。" };
  }

  if (endDate < startDate) {
    return { ok: false, message: "服務日期迄不能早於服務日期起。" };
  }

  if (startDate.slice(0, 7) !== endDate.slice(0, 7)) {
    return { ok: false, message: "服務日期不可跨月。" };
  }

  if (!serviceItemCode) {
    return { ok: false, message: "請選擇服務項目。" };
  }

  if (!serviceContentCode) {
    return { ok: false, message: "請選擇服務內容。" };
  }

  sanitizeNonNegativeIntegerInput(batchHoursInput);
  sanitizeMinutesInput(batchMinutesInput);
  sanitizeNonNegativeIntegerInput(batchClientCountInput);

  const hours = toNonNegativeIntOrZero(batchHoursInput ? batchHoursInput.value : "");
  const minutes = toNonNegativeIntOrZero(batchMinutesInput ? batchMinutesInput.value : "");
  const clientCount = toNonNegativeIntOrZero(batchClientCountInput ? batchClientCountInput.value : "0");
  const trafficFee = toNonNegativeNumberOrZero(batchTrafficFeeInput ? batchTrafficFeeInput.value : "0");
  const mealFee = toNonNegativeNumberOrZero(batchMealFeeInput ? batchMealFeeInput.value : "0");

  if (Number.isNaN(hours)) {
    return { ok: false, message: "小時請輸入 0 以上的整數。" };
  }

  if (Number.isNaN(minutes) || minutes < 0 || minutes > 59) {
    return { ok: false, message: "分鐘請輸入 0 到 59。" };
  }

  const normalizedTime = normalizeServiceTime(hours, minutes);

  if (!normalizedTime || normalizedTime.countedHours <= 0) {
    return { ok: false, message: "請填寫服務時數。" };
  }

  if (batchHoursInput) batchHoursInput.value = String(normalizedTime.hours);
  if (batchMinutesInput) batchMinutesInput.value = String(normalizedTime.minutes);

  if (Number.isNaN(clientCount)) {
    return { ok: false, message: "人數請輸入 0 以上的整數。" };
  }

  if (Number.isNaN(trafficFee)) {
    return { ok: false, message: "交通費請輸入 0 以上的數字。" };
  }

  if (Number.isNaN(mealFee)) {
    return { ok: false, message: "誤餐費請輸入 0 以上的數字。" };
  }

  return {
    ok: true,
    values: {
      startDate,
      endDate,
      serviceItemCode,
      serviceContentCode,
      hours: normalizedTime.hours,
      minutes: normalizedTime.minutes,
      clientCount,
      peopleCount: Math.round(clientCount * normalizedTime.countedHours),
      trafficFee,
      mealFee,
    },
  };
}

function buildBatchPreviewRows() {
  setText(batchErrorEl, "");

  setButtonLoading(batchBuildPreviewBtn, true, "建立中...");

  const commonResult = validateBatchCommonInputs();

  if (!commonResult.ok) {
    setText(batchErrorEl, commonResult.message);
    showToast(commonResult.message, "warning");
    setButtonLoading(batchBuildPreviewBtn, false);
    return;
  }

  const selectedVolunteers = getCheckedBatchVolunteers();

  if (selectedVolunteers.length === 0) {
    const message = "請至少勾選一位參與志工。";
    setText(batchErrorEl, message);
    showToast(message, "warning");
    setButtonLoading(batchBuildPreviewBtn, false);
    return;
  }

  batchDraftRows.length = 0;

  selectedVolunteers.forEach((v) => {
    batchDraftRows.push({
      name: v.name,
      id: v.id,
      ...commonResult.values,
      sourceType: "batch",
    });
  });

  renderBatchPreviewTable();
  showToast(`已建立 ${batchDraftRows.length} 位志工的批次預覽表`, "success");
  setButtonLoading(batchBuildPreviewBtn, false);
}

function getBatchPreviewInput(rowEl, field) {
  return rowEl.querySelector(`[data-field="${field}"]`);
}

function setBatchPreviewRowDateConstraints(rowEl) {
  const startInput = getBatchPreviewInput(rowEl, "startDate");
  const endInput = getBatchPreviewInput(rowEl, "endDate");

  if (!startInput || !endInput) return;

  const todayStr = getTodayLocalYYYYMMDD();
  startInput.max = todayStr;
  endInput.max = todayStr;

  let startDate = startInput.value;

  if (!startDate) {
    endInput.value = "";
    endInput.min = "";
    endInput.max = todayStr;
    return;
  }

  if (startDate > todayStr) {
    startInput.value = todayStr;
    startDate = todayStr;
    showToast("服務日期起不可大於今天，已自動調整。", "warning");
  }

  const lastDateOfMonth = getLastDateOfMonthFromIsoDate(startDate);
  const maxEndDate = lastDateOfMonth <= todayStr ? lastDateOfMonth : todayStr;

  endInput.min = startDate;
  endInput.max = maxEndDate;

  if (
    !endInput.value ||
    endInput.value < startDate ||
    endInput.value > maxEndDate ||
    endInput.value.slice(0, 7) !== startDate.slice(0, 7)
  ) {
    endInput.value = maxEndDate;
  }
}

function syncBatchDraftRowFromInputs(rowEl, index, options = {}) {
  const draft = batchDraftRows[index];
  if (!draft) return;

  setBatchPreviewRowDateConstraints(rowEl);

  const startDate = getBatchPreviewInput(rowEl, "startDate")?.value || "";
  const endDate = getBatchPreviewInput(rowEl, "endDate")?.value || "";
  const hoursInput = getBatchPreviewInput(rowEl, "hours");
  const minutesInput = getBatchPreviewInput(rowEl, "minutes");
  const clientCountInput = getBatchPreviewInput(rowEl, "clientCount");
  const peopleCountInput = getBatchPreviewInput(rowEl, "peopleCount");
  const trafficFeeInput = getBatchPreviewInput(rowEl, "trafficFee");
  const mealFeeInput = getBatchPreviewInput(rowEl, "mealFee");

  sanitizeNonNegativeIntegerInput(hoursInput);
  sanitizeMinutesInput(minutesInput);
  sanitizeNonNegativeIntegerInput(clientCountInput);

  const hours = toNonNegativeIntOrZero(hoursInput ? hoursInput.value : "");
  const minutes = toNonNegativeIntOrZero(minutesInput ? minutesInput.value : "");
  const clientCount = toNonNegativeIntOrZero(clientCountInput ? clientCountInput.value : "0");
  const trafficFee = toNonNegativeNumberOrZero(trafficFeeInput ? trafficFeeInput.value : "0");
  const mealFee = toNonNegativeNumberOrZero(mealFeeInput ? mealFeeInput.value : "0");

  draft.startDate = startDate;
  draft.endDate = endDate;
  draft.clientCount = Number.isNaN(clientCount) ? 0 : clientCount;
  draft.trafficFee = Number.isNaN(trafficFee) ? 0 : trafficFee;
  draft.mealFee = Number.isNaN(mealFee) ? 0 : mealFee;

  const normalizedTime = normalizeServiceTime(hours, minutes);

  if (!normalizedTime || normalizedTime.countedHours <= 0 || Number.isNaN(clientCount)) {
    draft.hours = Number.isNaN(hours) ? 0 : hours;
    draft.minutes = Number.isNaN(minutes) ? 0 : minutes;
    draft.peopleCount = 0;
    if (peopleCountInput) peopleCountInput.value = "";
    return;
  }

  draft.hours = normalizedTime.hours;
  draft.minutes = normalizedTime.minutes;
  draft.peopleCount = Math.round(draft.clientCount * normalizedTime.countedHours);

  if (options.normalizeInputs) {
    if (hoursInput) hoursInput.value = String(draft.hours);
    if (minutesInput) minutesInput.value = String(draft.minutes);
  }

  if (peopleCountInput) peopleCountInput.value = String(draft.peopleCount);
}

function bindBatchPreviewRowEvents(rowEl, index) {
  ["startDate", "endDate", "hours", "minutes", "clientCount", "trafficFee", "mealFee"].forEach((field) => {
    const input = getBatchPreviewInput(rowEl, field);
    if (!input) return;

    input.addEventListener("input", function () {
      syncBatchDraftRowFromInputs(rowEl, index, { normalizeInputs: false });
    });

    input.addEventListener("change", function () {
      const shouldNormalize = field === "hours" || field === "minutes";
      syncBatchDraftRowFromInputs(rowEl, index, { normalizeInputs: shouldNormalize });
    });

    input.addEventListener("blur", function () {
      const shouldNormalize = field === "hours" || field === "minutes";
      syncBatchDraftRowFromInputs(rowEl, index, { normalizeInputs: shouldNormalize });
    });
  });
}

function renderBatchPreviewTable() {
  if (!batchPreviewTableBody) return;

  batchPreviewTableBody.innerHTML = "";

  if (batchDraftRows.length === 0) {
    batchPreviewTableBody.innerHTML = `
      <tr>
        <td colspan="11">勾選志工並建立預覽表後，會在這裡逐位調整。</td>
      </tr>
    `;
    return;
  }

  batchDraftRows.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.dataset.index = String(index);

    tr.innerHTML = `
      <td>${row.name || ""}</td>
      <td>${row.id || ""}</td>
      <td><input type="date" value="${row.startDate || ""}" data-field="startDate" max="${getTodayLocalYYYYMMDD()}" /></td>
      <td><input type="date" value="${row.endDate || ""}" data-field="endDate" max="${getTodayLocalYYYYMMDD()}" /></td>
      <td><input type="number" min="0" step="1" value="${row.hours ?? ""}" data-field="hours" /></td>
      <td><input type="number" min="0" max="59" step="1" value="${row.minutes ?? ""}" data-field="minutes" /></td>
      <td><input type="number" min="0" step="1" value="${row.clientCount ?? ""}" data-field="clientCount" /></td>
      <td><input type="text" readonly value="${row.peopleCount ?? ""}" data-field="peopleCount" /></td>
      <td><input type="number" min="0" step="1" value="${row.trafficFee ?? ""}" data-field="trafficFee" /></td>
      <td><input type="number" min="0" step="1" value="${row.mealFee ?? ""}" data-field="mealFee" /></td>
      <td>
        <button type="button" class="btn btn-small btn-danger" data-action="removeBatchPreviewRow" data-index="${index}">移除</button>
      </td>
    `;

    batchPreviewTableBody.appendChild(tr);
    setBatchPreviewRowDateConstraints(tr);
    syncBatchDraftRowFromInputs(tr, index, { normalizeInputs: false });
    bindBatchPreviewRowEvents(tr, index);
  });
}

function validateBatchDraftRowsForRecords() {
  if (batchDraftRows.length === 0) {
    return { ok: false, message: "請先建立批次預覽表。" };
  }

  const todayStr = getTodayLocalYYYYMMDD();
  const newRecords = [];

  for (const [index, row] of batchDraftRows.entries()) {
    const rowNumber = index + 1;

    if (!row.startDate || !row.endDate) {
      return { ok: false, message: `第 ${rowNumber} 列請填寫服務日期。` };
    }

    if (row.startDate > todayStr || row.endDate > todayStr) {
      return { ok: false, message: `第 ${rowNumber} 列的服務日期不可是未來日期。` };
    }

    if (row.endDate < row.startDate) {
      return { ok: false, message: `第 ${rowNumber} 列的服務日期迄不能早於服務日期起。` };
    }

    if (row.startDate.slice(0, 7) !== row.endDate.slice(0, 7)) {
      return { ok: false, message: `第 ${rowNumber} 列的服務日期不可跨月。` };
    }

    const normalizedTime = normalizeServiceTime(row.hours, row.minutes);

    if (!normalizedTime || normalizedTime.countedHours <= 0) {
      return { ok: false, message: `第 ${rowNumber} 列請填寫服務時數。` };
    }

    if (!Number.isInteger(Number(row.clientCount)) || Number(row.clientCount) < 0) {
      return { ok: false, message: `第 ${rowNumber} 列的人數請輸入 0 以上的整數。` };
    }

    if (!Number.isFinite(Number(row.trafficFee)) || Number(row.trafficFee) < 0) {
      return { ok: false, message: `第 ${rowNumber} 列的交通費請輸入 0 以上的數字。` };
    }

    if (!Number.isFinite(Number(row.mealFee)) || Number(row.mealFee) < 0) {
      return { ok: false, message: `第 ${rowNumber} 列的誤餐費請輸入 0 以上的數字。` };
    }

    newRecords.push({
      name: row.name,
      id: row.id,
      startDate: row.startDate,
      endDate: row.endDate,
      serviceItemCode: padCode4(row.serviceItemCode),
      serviceContentCode: padCode4(row.serviceContentCode),
      hours: normalizedTime.hours,
      minutes: normalizedTime.minutes,
      clientCount: Number(row.clientCount || 0),
      peopleCount: Math.round(Number(row.clientCount || 0) * normalizedTime.countedHours),
      trafficFee: Number(row.trafficFee || 0),
      mealFee: Number(row.mealFee || 0),
      sourceType: "batch",
    });
  }

  const duplicateInNewRecords = findDuplicateRecordInNewRecords(newRecords);
  if (duplicateInNewRecords) {
    const itemLabel = getServiceItemLabel(duplicateInNewRecords.serviceItemCode);
    const contentLabel = getServiceContentLabel(
      duplicateInNewRecords.serviceItemCode,
      duplicateInNewRecords.serviceContentCode
    );

    return {
      ok: false,
      message: `本次批次新增中有重複服務紀錄：${duplicateInNewRecords.name}，${duplicateInNewRecords.startDate} 至 ${duplicateInNewRecords.endDate}，${itemLabel}／${contentLabel}。`,
    };
  }

  const duplicateExistingRecords = newRecords.filter((newRecord) => findDuplicateRecord(newRecord));

  if (duplicateExistingRecords.length > 0) {
    const names = duplicateExistingRecords.map((r) => r.name).join("、");
    return {
      ok: false,
      message: `以下志工已有相同服務紀錄，未新增：${names}。請先刪除或編輯原紀錄。`,
    };
  }

  return {
    ok: true,
    records: newRecords,
  };
}

function clearBatchDraft(options = {}) {
  batchDraftRows.length = 0;
  renderBatchPreviewTable();
  setText(batchErrorEl, "");

  if (options.clearChecked !== false && batchVolunteerChecklist) {
    batchVolunteerChecklist.querySelectorAll(".batch-volunteer-checkbox").forEach((checkbox) => {
      checkbox.checked = false;
    });
  }

  if (batchSelectAllCheckbox && options.clearChecked !== false) {
    batchSelectAllCheckbox.checked = false;
  }
}

function initBatchRecords() {
  renderBatchServiceItemOptions();
  renderBatchVolunteerChecklist();

  if (batchStartDateInput) {
    batchStartDateInput.max = getTodayLocalYYYYMMDD();
    batchStartDateInput.addEventListener("change", updateBatchEndDateConstraints);
  }

  if (batchEndDateInput) {
    batchEndDateInput.max = getTodayLocalYYYYMMDD();
    batchEndDateInput.addEventListener("change", updateBatchEndDateConstraints);
  }

  if (batchServiceItemSelect) {
    batchServiceItemSelect.addEventListener("change", function () {
      renderBatchServiceContentOptions(padCode4(batchServiceItemSelect.value));
    });
  }

  [
    batchHoursInput,
    batchMinutesInput,
    batchClientCountInput,
  ].forEach((input) => {
    if (!input) return;

    input.addEventListener("input", function () {
      if (input === batchMinutesInput) {
        sanitizeMinutesInput(input);
      } else {
        sanitizeNonNegativeIntegerInput(input);
      }
    });
  });

  [batchHoursInput, batchMinutesInput].forEach((input) => {
    if (!input) return;

    input.addEventListener("change", function () {
      normalizeTimeInputsIfPossible(batchHoursInput, batchMinutesInput);
    });

    input.addEventListener("blur", function () {
      normalizeTimeInputsIfPossible(batchHoursInput, batchMinutesInput);
    });
  });

  if (batchToggleBtn && batchPanel) {
    batchToggleBtn.addEventListener("click", function () {
      const shouldOpen = batchPanel.classList.contains("hidden");

      if (shouldOpen) {
        batchPanel.classList.remove("hidden");
        batchToggleBtn.textContent = "收起多人批次新增";
        renderBatchVolunteerChecklist();
      } else {
        batchPanel.classList.add("hidden");
        batchToggleBtn.textContent = "開啟多人批次新增";
      }
    });
  }

  if (batchSelectAllCheckbox && batchVolunteerChecklist) {
    batchSelectAllCheckbox.addEventListener("change", function () {
      batchVolunteerChecklist.querySelectorAll(".batch-volunteer-checkbox").forEach((checkbox) => {
        checkbox.checked = batchSelectAllCheckbox.checked;
      });
    });

    batchVolunteerChecklist.addEventListener("change", function (e) {
      if (!e.target.matches(".batch-volunteer-checkbox")) return;

      const allBoxes = Array.from(batchVolunteerChecklist.querySelectorAll(".batch-volunteer-checkbox"));
      const checkedBoxes = allBoxes.filter((checkbox) => checkbox.checked);

      batchSelectAllCheckbox.checked = allBoxes.length > 0 && checkedBoxes.length === allBoxes.length;
    });
  }

  if (batchClearSelectedBtn && batchVolunteerChecklist) {
    batchClearSelectedBtn.addEventListener("click", function () {
      batchVolunteerChecklist.querySelectorAll(".batch-volunteer-checkbox").forEach((checkbox) => {
        checkbox.checked = false;
      });
      if (batchSelectAllCheckbox) batchSelectAllCheckbox.checked = false;
    });
  }

  if (batchBuildPreviewBtn) {
    batchBuildPreviewBtn.addEventListener("click", buildBatchPreviewRows);
  }

  if (batchClearDraftBtn) {
    batchClearDraftBtn.addEventListener("click", async function () {
      if (batchDraftRows.length === 0) {
        clearBatchDraft();
        showToast("目前沒有批次草稿可清空", "warning");
        return;
      }

      const ok = await showConfirm("確定要清空批次預覽表嗎？", "清空", "取消");
      if (!ok) return;

      clearBatchDraft();
      showToast("已清空批次草稿", "info");
    });
  }

  if (batchPreviewTableBody) {
    batchPreviewTableBody.addEventListener("click", function (e) {
      const btn = e.target.closest("button");
      if (!btn) return;

      if (btn.dataset.action !== "removeBatchPreviewRow") return;

      const index = Number(btn.dataset.index);
      if (Number.isNaN(index) || !batchDraftRows[index]) return;

      batchDraftRows.splice(index, 1);
      renderBatchPreviewTable();
    });
  }

  if (batchForm) {
    batchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      setText(batchErrorEl, "");

      setButtonLoading(batchSubmitBtn, true, "新增中...");

      const result = validateBatchDraftRowsForRecords();

      if (!result.ok) {
        setText(batchErrorEl, result.message);
        showToast(result.message, "warning");
        setButtonLoading(batchSubmitBtn, false);
        return;
      }

      records.push(...result.records);
      saveRecordsToStorage();
      renderRecordsTable();
      clearBatchDraft();

      showToast(`已批次新增 ${result.records.length} 筆服務紀錄`, "success");
      setButtonLoading(batchSubmitBtn, false);
    });
  }
}

// ============================================================
// === 顯示模式切換 ===
// ============================================================

function initDisplayModeToggle() {
  if (!displayModeInputs || displayModeInputs.length === 0) return;
  const checked = document.querySelector('input[name="displayMode"]:checked');
  if (checked?.value) displayMode = checked.value;
  displayModeInputs.forEach((input) => {
    input.addEventListener("change", function () {
      if (input.checked) { displayMode = input.value; renderRecordsTable(); }
    });
  });
}

// ============================================================
// === 複製表格 ===
// ============================================================

function buildCopyTextFromCurrentTableBody() {
  if (!recordsTableBody) return "";
  return Array.from(recordsTableBody.querySelectorAll("tr"))
    .map((tr) =>
      Array.from(tr.querySelectorAll("td"))
        .slice(0, 17)
        .map((td) => cleanCellForExcel(td.textContent))
        .join("\t")
    )
    .join("\r\n");
}

function initCopyButton() {
  if (!copyTableBtn) return;
  copyTableBtn.addEventListener("click", async function () {
    if (records.length === 0) { showToast("目前沒有資料可複製", "warning"); return; }
    const text = buildCopyTextFromCurrentTableBody();
    if (!text) { showToast("目前表格沒有可複製的資料", "warning"); return; }
    setButtonLoading(copyTableBtn, true, "複製中...");

    try {
      await copyTextToClipboard(text);
      showToast(`已複製 ${records.length} 筆資料到剪貼簿`, "success");
    } catch (err) {
      console.error(err);
      showToast("複製失敗，請確認瀏覽器權限或改用 HTTPS", "error");
    } finally {
      setButtonLoading(copyTableBtn, false);
    }
  });
}

// ============================================================
// === 清空紀錄 ===
// ============================================================

function initClearRecordsButton() {
  if (!clearRecordsBtn) return;

  clearRecordsBtn.addEventListener("click", async function () {
    if (records.length === 0) {
      showToast("目前沒有紀錄可清空", "warning");
      return;
    }

    const ok = await showConfirm("確定要清空所有服務紀錄嗎？此操作無法復原。", "清空", "取消");
    if (!ok) return;

    setButtonLoading(clearRecordsBtn, true, "清空中...");

    records.length = 0;
    saveRecordsToStorage();
    renderRecordsTable();

    if (recordSubmitBtn) {
      recordSubmitBtn.textContent = "新增服務紀錄";
    }

    resetDraftTableRowsAfterSubmit();

    showToast("已清空所有服務紀錄", "info");
    setButtonLoading(clearRecordsBtn, false);
  });
}

// ============================================================
// === 初始化 ===
// ============================================================

function initVolunteersDataFlow() {
  loadVolunteersFromStorage();
  renderVolunteerList();
  renderVolunteerSelect();

  // 不在頁面剛開啟時讀後端
  // 因為還沒登入，還沒有 authToken
}

function init() {
  initLogin();
  initVolunteerIdInputGuards();
  initVolunteerForm();
  initVolunteerListActions();
  initVolunteerSelectAutoFill();
  initVolunteerServicesManager();
  initRecordForm();
  initBatchRecords();
  initDisplayModeToggle();
  initRecordTableActions();
  initCopyButton();
  initClearRecordsButton();
  initVolunteersDataFlow();

  loadRecordsFromStorage();
  renderRecordsTable();
}

document.addEventListener("DOMContentLoaded", init);
