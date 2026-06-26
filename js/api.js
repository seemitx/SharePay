/**
 * api.js — SharePay Sakura Admin
 * ทำหน้าที่เชื่อมต่อกับ Google Apps Script Web App
 * แก้ไข APPS_SCRIPT_URL ให้ตรงกับ URL ที่ deploy แล้ว
 */

// =============================================
// 🔧 ตั้งค่า URL ของ Google Apps Script Web App
// วิธีดู URL: Apps Script → Deploy → Manage deployments → Web App URL
// =============================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbymjEe01FWeb-X_JH2OLiy-AU9lFDYtL7RkmDIZkH5hbZLAeCbyRMECwBlMgmqnNnzv/exec';

/**
 * ดึงข้อมูลค่าใช้จ่ายทั้งหมดจาก Google Sheets
 * @returns {Promise<Array>} รายการค่าใช้จ่าย
 */
async function getExpenses() {
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=getExpenses`, {
      method: 'GET',
      // ไม่ใส่ mode: 'cors' เพราะ Apps Script redirect ด้วย no-cors redirect
      redirect: 'follow',
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();

    // ตรวจสอบ response format
    if (data.status === 'error') {
      throw new Error(data.message || 'เกิดข้อผิดพลาดจาก Server');
    }

    return data.data || [];
  } catch (err) {
    console.error('[API] getExpenses error:', err);
    throw err;
  }
}

/**
 * เพิ่มค่าใช้จ่ายใหม่ไปยัง Google Sheets
 * @param {Object} expense - ข้อมูลค่าใช้จ่าย
 * @param {string} expense.title    - ชื่อรายการ
 * @param {string} expense.category - หมวดหมู่
 * @param {number} expense.amount   - จำนวนเงิน
 * @param {string} expense.paidBy   - ผู้จ่าย
 * @param {string} expense.date     - วันที่ (YYYY-MM-DD)
 * @param {string} expense.note     - หมายเหตุ
 * @returns {Promise<Object>} ผลลัพธ์จาก server
 */
async function addExpense(expense) {
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain', // Apps Script ต้องการ text/plain สำหรับ CORS
      },
      body: JSON.stringify({
        action: 'addExpense',
        data: expense,
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();

    if (data.status === 'error') {
      throw new Error(data.message || 'ไม่สามารถเพิ่มรายการได้');
    }

    return data;
  } catch (err) {
    console.error('[API] addExpense error:', err);
    throw err;
  }
}

/**
 * ลบค่าใช้จ่ายตาม ID จาก Google Sheets
 * @param {string} id - ID ของรายการที่ต้องการลบ
 * @returns {Promise<Object>} ผลลัพธ์จาก server
 */
async function deleteExpense(id) {
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'deleteExpense',
        data: { id },
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();

    if (data.status === 'error') {
      throw new Error(data.message || 'ไม่สามารถลบรายการได้');
    }

    return data;
  } catch (err) {
    console.error('[API] deleteExpense error:', err);
    throw err;
  }
}
