/**
 * app.js — SharePay Sakura Admin
 * ไฟล์หลักสำหรับ Dashboard Logic ทั้งหมด
 * จัดการ: load data, render table, form submit, delete, search
 */

// =============================================
// 🗃️ State ของแอปพลิเคชัน
// =============================================
const state = {
  expenses: [],        // รายการค่าใช้จ่ายทั้งหมด
  filtered: [],        // รายการที่กรองแล้ว
  pendingDeleteId: null, // ID ที่รอการยืนยันลบ
  isLoading: false,    // สถานะกำลังโหลด
};

// =============================================
// 🌸 DOM Elements (Cache ไว้ใช้งาน)
// =============================================
const $ = id => document.getElementById(id);

const DOM = {
  // Summary Cards
  cardCount:   $('cardCount'),
  cardTotal:   $('cardTotal'),
  cardLatest:  $('cardLatest'),

  // Form
  form:        $('expenseForm'),
  fTitle:      $('fTitle'),
  fCategory:   $('fCategory'),
  fAmount:     $('fAmount'),
  fPaidBy:     $('fPaidBy'),
  fDate:       $('fDate'),
  fNote:       $('fNote'),
  btnSubmit:   $('btnSubmit'),
  btnReset:    $('btnReset'),

  // Table
  tableBody:   $('tableBody'),
  tableCount:  $('tableCount'),
  searchInput: $('searchInput'),

  // Dialog
  overlay:     $('deleteOverlay'),
  btnConfirm:  $('btnConfirmDelete'),
  btnCancel:   $('btnCancelDelete'),

  // Toast
  toastContainer: $('toastContainer'),
};

// =============================================
// 🚀 เริ่มต้นแอปเมื่อ DOM พร้อม
// =============================================
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // ตั้งค่าวันที่เริ่มต้นเป็นวันนี้
  DOM.fDate.value = todayISO();

  // ผูก Event Listeners
  DOM.form.addEventListener('submit', handleFormSubmit);
  DOM.btnReset.addEventListener('click', resetForm);
  DOM.searchInput.addEventListener('input', handleSearch);
  DOM.btnConfirm.addEventListener('click', handleConfirmDelete);
  DOM.btnCancel.addEventListener('click', closeDeleteDialog);
  DOM.overlay.addEventListener('click', e => {
    if (e.target === DOM.overlay) closeDeleteDialog();
  });

  // โหลดข้อมูลครั้งแรก
  await loadData();
}

// =============================================
// 📦 โหลดข้อมูลจาก Google Sheets
// =============================================
async function loadData() {
  if (state.isLoading) return;
  state.isLoading = true;
  renderTableState('loading');

  try {
    const expenses = await getExpenses();

    // เรียงจากใหม่ → เก่า
    state.expenses = expenses.sort((a, b) =>
      new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
    );
    state.filtered = [...state.expenses];

    renderSummary();
    renderTable();
  } catch (err) {
    console.error('[App] loadData error:', err);
    renderTableState('error');
    showToast('ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบ URL', 'error');
  } finally {
    state.isLoading = false;
  }
}

// =============================================
// 📊 อัปเดต Summary Cards
// =============================================
function renderSummary() {
  const expenses = state.expenses;
  const count    = expenses.length;
  const total    = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const latest   = expenses.length > 0 ? expenses[0] : null;

  // จำนวนรายการ
  DOM.cardCount.textContent = count.toLocaleString('th-TH');

  // ยอดรวม
  DOM.cardTotal.textContent = formatMoney(total);

  // รายการล่าสุด
  if (latest) {
    DOM.cardLatest.textContent = latest.title;
    DOM.cardLatest.nextElementSibling.textContent =
      `${formatDate(latest.date)} · ${latest.paidBy}`;
  } else {
    DOM.cardLatest.textContent = '—';
    DOM.cardLatest.nextElementSibling.textContent = 'ยังไม่มีรายการ';
  }
}

// =============================================
// 📋 Render ตารางรายการ
// =============================================
function renderTable(data = state.filtered) {
  if (data.length === 0) {
    renderTableState(state.expenses.length === 0 ? 'empty' : 'no-result');
    DOM.tableCount.textContent = '0 รายการ';
    return;
  }

  DOM.tableCount.textContent = `${data.length.toLocaleString('th-TH')} รายการ`;

  DOM.tableBody.innerHTML = data.map(exp => `
    <tr data-id="${escHTML(exp.id)}">
      <td>${formatDate(exp.date)}</td>
      <td style="font-weight:600;">${escHTML(exp.title)}</td>
      <td><span class="badge-category">${escHTML(exp.category)}</span></td>
      <td class="amount-cell">${formatMoney(exp.amount)}</td>
      <td>${escHTML(exp.paidBy)}</td>
      <td class="td-note" title="${escHTML(exp.note || '')}">${escHTML(exp.note || '—')}</td>
      <td>
        <button class="btn-delete" onclick="openDeleteDialog('${escHTML(exp.id)}')" title="ลบรายการ">🗑️</button>
      </td>
    </tr>
  `).join('');
}

// =============================================
// ⏳ Render State: loading / empty / error / no-result
// =============================================
function renderTableState(type) {
  const states = {
    loading: `
      <tr><td colspan="7" class="table-state">
        <div class="spinner"></div>
        <p class="state-title">กำลังโหลดข้อมูล...</p>
        <p class="state-sub">กรุณารอสักครู่</p>
      </td></tr>`,
    empty: `
      <tr><td colspan="7" class="table-state">
        <span class="state-icon">🌸</span>
        <p class="state-title">ยังไม่มีรายการ</p>
        <p class="state-sub">เพิ่มค่าใช้จ่ายแรกของคุณด้านบน</p>
      </td></tr>`,
    error: `
      <tr><td colspan="7" class="table-state">
        <span class="state-icon">⚠️</span>
        <p class="state-title">โหลดข้อมูลไม่ได้</p>
        <p class="state-sub">กรุณาตรวจสอบ Apps Script URL ใน api.js</p>
      </td></tr>`,
    'no-result': `
      <tr><td colspan="7" class="table-state">
        <span class="state-icon">🔍</span>
        <p class="state-title">ไม่พบรายการที่ค้นหา</p>
        <p class="state-sub">ลองค้นหาด้วยคำอื่น</p>
      </td></tr>`,
  };
  DOM.tableBody.innerHTML = states[type] || '';
}

// =============================================
// ✏️ Form Submit: เพิ่มค่าใช้จ่าย
// =============================================
async function handleFormSubmit(e) {
  e.preventDefault();

  // Validate
  const title    = DOM.fTitle.value.trim();
  const category = DOM.fCategory.value;
  const amount   = parseFloat(DOM.fAmount.value);
  const paidBy   = DOM.fPaidBy.value.trim();
  const date     = DOM.fDate.value;
  const note     = DOM.fNote.value.trim();

  if (!title || !category || isNaN(amount) || amount <= 0 || !paidBy || !date) {
    showToast('กรุณากรอกข้อมูลให้ครบและถูกต้อง', 'error');
    return;
  }

  // ปิดปุ่มระหว่างส่ง
  DOM.btnSubmit.disabled = true;
  DOM.btnSubmit.textContent = '⏳ กำลังบันทึก...';

  try {
    await addExpense({ title, category, amount, paidBy, date, note });
    showToast('✅ เพิ่มรายการสำเร็จ!', 'success');
    resetForm();
    await loadData(); // Reload จาก Google Sheets
  } catch (err) {
    console.error('[App] addExpense error:', err);
    showToast('ไม่สามารถเพิ่มรายการได้ กรุณาลองใหม่', 'error');
  } finally {
    DOM.btnSubmit.disabled = false;
    DOM.btnSubmit.innerHTML = '🌸 บันทึกรายการ';
  }
}

// =============================================
// 🗑️ Delete Dialog
// =============================================
function openDeleteDialog(id) {
  state.pendingDeleteId = id;
  DOM.overlay.classList.add('active');
}

function closeDeleteDialog() {
  state.pendingDeleteId = null;
  DOM.overlay.classList.remove('active');
}

async function handleConfirmDelete() {
  const id = state.pendingDeleteId;
  if (!id) return;

  closeDeleteDialog();
  DOM.btnConfirm.disabled = true;

  try {
    await deleteExpense(id);
    showToast('🗑️ ลบรายการสำเร็จ', 'info');

    // ลบออกจาก state ทันทีโดยไม่ต้อง reload ใหม่ (UX เร็วขึ้น)
    state.expenses = state.expenses.filter(e => e.id !== id);
    applySearch(); // กรองใหม่ตาม keyword ปัจจุบัน
    renderSummary();
  } catch (err) {
    console.error('[App] deleteExpense error:', err);
    showToast('ไม่สามารถลบรายการได้', 'error');
  } finally {
    DOM.btnConfirm.disabled = false;
  }
}

// =============================================
// 🔍 Search / Filter
// =============================================
function handleSearch() {
  applySearch();
}

function applySearch() {
  const keyword = DOM.searchInput.value.trim().toLowerCase();
  if (!keyword) {
    state.filtered = [...state.expenses];
  } else {
    state.filtered = state.expenses.filter(e =>
      (e.title    || '').toLowerCase().includes(keyword) ||
      (e.category || '').toLowerCase().includes(keyword) ||
      (e.paidBy   || '').toLowerCase().includes(keyword) ||
      (e.note     || '').toLowerCase().includes(keyword) ||
      (e.date     || '').includes(keyword)
    );
  }
  renderTable();
  DOM.tableCount.textContent =
    `${state.filtered.length.toLocaleString('th-TH')} รายการ` +
    (keyword ? ` (ค้นหา: "${keyword}")` : '');
}

// =============================================
// 🔄 Reset Form
// =============================================
function resetForm() {
  DOM.form.reset();
  DOM.fDate.value = todayISO(); // คืนค่าวันที่เป็นวันนี้
}

// =============================================
// 🔔 Toast Notification
// =============================================
function showToast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '💬'}</span><span>${message}</span>`;

  DOM.toastContainer.appendChild(toast);

  // Auto ลบหลัง 3.5 วินาที
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3500);
}

// =============================================
// 🛠️ Utility Functions
// =============================================

/** แปลงตัวเลขเป็นสกุลเงินบาท */
function formatMoney(amount) {
  const num = Number(amount) || 0;
  return '฿' + num.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** แปลงวันที่ YYYY-MM-DD เป็น DD/MM/YYYY */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = String(dateStr).split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

/** วันที่วันนี้ในรูป YYYY-MM-DD */
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Escape HTML เพื่อป้องกัน XSS */
function escHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
