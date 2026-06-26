# 🌸 SharePay Sakura Admin

บันทึกค่าใช้จ่ายกลุ่มแบบง่าย — ธีม Sakura Pink Modern Dashboard
ใช้ **Google Sheets** เป็นฐานข้อมูล ผ่าน **Google Apps Script** และ Deploy บน **GitHub Pages**

---

## 📁 โครงสร้างโปรเจกต์

```
SharePay/
├── index.html              ← หน้า Dashboard หลัก (SPA)
├── css/
│   └── style.css           ← Sakura Glassmorphism Theme
├── js/
│   ├── api.js              ← เชื่อมต่อ Google Apps Script
│   └── app.js              ← Logic ทั้งหมด
├── assets/
│   └── logo.svg            ← โลโก้ซากุระ
├── apps-script/
│   └── Code.gs             ← Google Apps Script Backend
└── README.md
```

---

## 🚀 วิธี Deploy ทีละขั้นตอน

### ขั้นที่ 1 — สร้าง Google Sheet

1. ไปที่ [Google Sheets](https://sheets.google.com) แล้วสร้าง Spreadsheet ใหม่
2. ตั้งชื่อไฟล์ตามต้องการ เช่น `SharePay Database`
3. **ไม่ต้องสร้าง Sheet เอง** — Apps Script จะสร้าง Sheet ชื่อ `Expenses` พร้อม Header ให้อัตโนมัติ

> ✅ Column ที่จะถูกสร้างอัตโนมัติ: `ID | Date | Title | Category | Amount | PaidBy | Note | CreatedAt`

---

### ขั้นที่ 2 — Deploy Google Apps Script

1. ใน Google Sheets ที่สร้างไว้ ไปที่เมนู **Extensions → Apps Script**
2. ลบโค้ดเดิมออกทั้งหมด แล้ว **วางโค้ดจากไฟล์ `apps-script/Code.gs`**
3. กดปุ่ม **Save** (Ctrl+S)
4. คลิก **Deploy → New deployment**
5. ตั้งค่า:
   - Type: **Web app**
   - Description: `SharePay API v1`
   - Execute as: **Me**
   - Who has access: **Anyone**
6. คลิก **Deploy** แล้วอนุมัติ Permission ที่ขอ
7. **คัดลอก Web App URL** (รูปแบบ: `https://script.google.com/macros/s/AKfyc.../exec`)

> ⚠️ ทุกครั้งที่แก้ไขโค้ด ต้อง Deploy ใหม่ (New deployment หรือ Manage → Edit)

---

### ขั้นที่ 3 — ตั้งค่า URL ใน api.js

เปิดไฟล์ `js/api.js` แล้วแก้บรรทัดนี้:

```javascript
// เปลี่ยนจาก:
const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

// เป็น URL จริงของคุณ เช่น:
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxXXXXXXXX/exec';
```

---

### ขั้นที่ 4 — Deploy บน GitHub Pages

1. สร้าง Repository ใหม่บน GitHub (เช่น `sharepay-sakura`)
2. Push ไฟล์ทั้งหมด (**ยกเว้น** โฟลเดอร์ `apps-script/`):
   ```bash
   git init
   git add index.html css/ js/ assets/ README.md
   git commit -m "🌸 Initial deploy"
   git remote add origin https://github.com/USERNAME/sharepay-sakura.git
   git push -u origin main
   ```
3. ไปที่ GitHub Repository → **Settings → Pages**
4. Source: **Deploy from a branch**
5. Branch: **main** / **/ (root)**
6. คลิก **Save**
7. รอ 1–2 นาที แล้วเข้าถึงที่ `https://USERNAME.github.io/sharepay-sakura/`

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML5 / CSS3 / JavaScript ES6+ |
| Backend | Google Apps Script (Web App) |
| Database | Google Sheets |
| Hosting | GitHub Pages |
| Theme | Sakura Pink Glassmorphism |

---

## 🔧 การแก้ปัญหาที่พบบ่อย

### ❌ "ไม่สามารถโหลดข้อมูลได้"
- ตรวจสอบ `APPS_SCRIPT_URL` ใน `js/api.js` ว่าถูกต้อง
- ตรวจสอบว่า Deploy แบบ **Who has access: Anyone**
- เปิด URL ตรงๆ ในเบราว์เซอร์ — ควรเห็น JSON response

### ❌ CORS Error ใน Console
- Apps Script ใช้ redirect — ต้องใช้ `redirect: 'follow'` ใน fetch (ตั้งค่าไว้แล้ว)
- ตรวจสอบว่า `Content-Type: 'text/plain'` ใน POST request (ตั้งค่าไว้แล้ว)

### ❌ ข้อมูลไม่อัปเดตหลัง Deploy ใหม่
- Apps Script มี cache — รอ 5–10 นาที หรือสร้าง New deployment

### ❌ Sheet ไม่ถูกสร้างอัตโนมัติ
- ตรวจสอบว่า Apps Script อยู่ใน Spreadsheet ที่ถูกต้อง (ผ่าน Extensions → Apps Script)
- ลองรัน function `getOrCreateSheet()` ด้วยตนเองใน Apps Script Editor

---

## 📝 API Reference

### GET /exec?action=getExpenses
ดึงรายการทั้งหมด

**Response:**
```json
{
  "status": "ok",
  "data": [
    {
      "id": "1718000000000",
      "date": "2024-06-10",
      "title": "ค่าอาหารเย็น",
      "category": "อาหาร",
      "amount": 350,
      "paidBy": "สมใจ",
      "note": "ร้านสุกี้",
      "createdAt": "2024-06-10T18:00:00.000Z"
    }
  ]
}
```

### POST /exec (addExpense)
เพิ่มรายการใหม่

**Body:**
```json
{
  "action": "addExpense",
  "data": {
    "title": "ค่าโรงแรม",
    "category": "ที่พัก",
    "amount": 1200,
    "paidBy": "มานี",
    "date": "2024-06-11",
    "note": "2 คืน"
  }
}
```

### POST /exec (deleteExpense)
ลบรายการตาม ID

**Body:**
```json
{
  "action": "deleteExpense",
  "data": { "id": "1718000000000" }
}
```

---

## 🌸 License

MIT — ใช้งานได้เสรี ดัดแปลงได้ตามต้องการ
