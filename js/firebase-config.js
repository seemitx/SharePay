/**
 * SharePay - Firebase Configuration
 * ตั้งค่าการเชื่อมต่อ Firebase สำหรับแอปพลิเคชัน SharePay
 */

// ===== Firebase Configuration =====
// TODO: แทนที่ค่าเหล่านี้ด้วย config จาก Firebase Console ของคุณ
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// ===== Initialize Firebase =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// ===== Firestore Collections References =====
// References to Firestore collections for easy access across the app
const collections = {
  users: "users",           // ข้อมูลผู้ใช้
  groups: "groups",         // ข้อมูลกลุ่ม
  expenses: "expenses",     // ค่าใช้จ่าย
  settlements: "settlements", // การชำระหนี้
  notifications: "notifications" // การแจ้งเตือน
};

// ===== Google Sheets API Config =====
// สำหรับเชื่อมต่อกับ Google Apps Script
const sheetsConfig = {
  // TODO: แทนที่ด้วย URL ของ Google Apps Script Web App ของคุณ
  webAppUrl: "YOUR_GOOGLE_APPS_SCRIPT_URL",
  // Sheet names
  sheets: {
    expenses: "Expenses",
    settlements: "Settlements",
    members: "Members",
    groups: "Groups"
  }
};

// Export สำหรับใช้ในไฟล์อื่น
export { app, auth, db, storage, analytics, collections, sheetsConfig };
