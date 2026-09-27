import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Cyrillic to Latin and Code Normalizer
function cyrillicToLatin(text: string): string {
  if (!text) return '';
  const map: Record<string, string> = {
    'А': 'A', 'а': 'a', 'Б': 'B', 'б': 'b', 'В': 'V', 'в': 'v',
    'Г': 'G', 'г': 'g', 'Д': 'D', 'д': 'd', 'Е': 'E', 'е': 'e',
    'Ё': 'Yo', 'ё': 'yo', 'Ж': 'J', 'ж': 'j', 'З': 'Z', 'з': 'z',
    'И': 'I', 'и': 'i', 'Й': 'I', 'й': 'i', 'К': 'K', 'к': 'k',
    'Л': 'L', 'л': 'l', 'М': 'M', 'м': 'm', 'Н': 'N', 'н': 'n',
    'О': 'O', 'о': 'o', 'Ө': 'O', 'ө': 'o', 'П': 'P', 'п': 'p',
    'Р': 'R', 'р': 'r', 'С': 'S', 'с': 's', 'Т': 'T', 'т': 't',
    'У': 'U', 'у': 'u', 'Ү': 'U', 'ү': 'u', 'Ф': 'F', 'ф': 'f',
    'Х': 'H', 'х': 'h', 'Ц': 'Ts', 'ц': 'ts', 'Ч': 'Ch', 'ч': 'ch',
    'Ш': 'Sh', 'ш': 'sh', 'Щ': 'Sh', 'щ': 'sh', 'Ъ': '', 'ъ': '',
    'Ы': 'Y', 'ы': 'y', 'Ь': '', 'ь': '', 'Э': 'E', 'э': 'e',
    'Ю': 'Yu', 'ю': 'yu', 'Я': 'Ya', 'я': 'ya'
  };
  return text.split('').map((ch) => map[ch] ?? ch).join('');
}

function normalizeCode(str: string): string {
  if (!str) return '';
  return cyrillicToLatin(str)
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '');
}

interface DBStructure {
  settings: any;
  classes: any[];
  teachers: any[];
  students: any[];
  responses: Record<string, Record<string, string>>;
  logs: any[];
}

const DEFAULT_DB: DBStructure = {
  settings: {
    schoolName: 'Хөвсгөл аймгийн 1-р сургууль',
    academicYear: '2025-2026',
    surveyOpen: true,
    gasWebAppUrl: '',
    gasConnected: false,
    googleSheetsSpreadsheetId: '1Dv1ydn-iikIMFcjyNxyNmc3ffMALfq-41AjOQ20vwQg',
    googleSheetsUrl: 'https://docs.google.com/spreadsheets/d/1Dv1ydn-iikIMFcjyNxyNmc3ffMALfq-41AjOQ20vwQg/edit',
    googleSheetsConnected: true
  },
  classes: [
    {
      id: 'CLS_7A',
      name: '7А',
      grade: 7,
      sectionLetter: 'А',
      teacherId: 'TCH_7A',
      teacherName: 'Б. Бат-Эрдэнэ багш',
      teacherCode: 'TEACH-7A',
      academicYear: '2025-2026',
      schoolName: 'Хөвсгөл аймгийн 1-р сургууль'
    },
    {
      id: 'CLS_8B',
      name: '8Б',
      grade: 8,
      sectionLetter: 'Б',
      teacherId: 'TCH_8B',
      teacherName: 'Д. Цэцэгмаа багш',
      teacherCode: 'TEACH-8B',
      academicYear: '2025-2026',
      schoolName: 'Хөвсгөл аймгийн 1-р сургууль'
    },
    {
      id: 'CLS_9V',
      name: '9В',
      grade: 9,
      sectionLetter: 'В',
      teacherId: 'TCH_9V',
      teacherName: 'М. Баяр багш',
      teacherCode: 'TEACH-9V',
      academicYear: '2025-2026',
      schoolName: 'Хөвсгөл аймгийн 1-р сургууль'
    }
  ],
  teachers: [
    {
      id: 'TCH_7A',
      name: 'Б. Бат-Эрдэнэ',
      teacherCode: 'TEACH-7A',
      classId: 'CLS_7A',
      className: '7А',
      phone: '99112233'
    },
    {
      id: 'TCH_8B',
      name: 'Д. Цэцэгмаа',
      teacherCode: 'TEACH-8B',
      classId: 'CLS_8B',
      className: '8Б',
      phone: '99223344'
    },
    {
      id: 'TCH_9V',
      name: 'М. Баяр',
      teacherCode: 'TEACH-9V',
      classId: 'CLS_9V',
      className: '9В',
      phone: '99334455'
    }
  ],
  students: [
    {
      id: 'STU_7A_001',
      classId: 'CLS_7A',
      className: '7А',
      studentCode: '7A001',
      password: 'A8K29P',
      fullName: 'Болдын Тэмүүлэн',
      gender: '2',
      isSubmitted: true,
      submittedAt: '2026-03-01T10:15:00Z',
      riskLevel: 'low',
      riskScore: 2
    },
    {
      id: 'STU_7A_002',
      classId: 'CLS_7A',
      className: '7А',
      studentCode: '7A002',
      password: 'X4N72W',
      fullName: 'Ганбаатарын Ариунболд',
      gender: '2',
      isSubmitted: true,
      submittedAt: '2026-03-02T14:30:00Z',
      riskLevel: 'high',
      riskScore: 9
    },
    {
      id: 'STU_7A_003',
      classId: 'CLS_7A',
      className: '7А',
      studentCode: '7A003',
      password: 'M9P15K',
      fullName: 'Энхбатын Номин',
      gender: '1',
      isSubmitted: true,
      submittedAt: '2026-03-03T09:00:00Z',
      riskLevel: 'medium',
      riskScore: 4
    },
    {
      id: 'STU_7A_004',
      classId: 'CLS_7A',
      className: '7А',
      studentCode: '7A004',
      password: 'H3R88T',
      fullName: 'Доржийн Наран',
      gender: '1',
      isSubmitted: false
    },
    {
      id: 'STU_7A_005',
      classId: 'CLS_7A',
      className: '7А',
      studentCode: '7A005',
      password: 'V7C62Q',
      fullName: 'Сүхээгийн Мөнх-Эрдэнэ',
      gender: '2',
      isSubmitted: false
    }
  ],
  responses: {
    STU_7A_001: {
      Q001: '1', Q003: '7', Q004: '14', Q008: '4', Q012: '1', Q030: '1',
      Q035: '2', Q036: '2', Q037: '2', Q038: '2', Q053: '1', Q067: '1',
      Q071: '1', Q092: '8', Q093: '2', Q107: '1', Q108: '2', Q116: '2',
      Q123: '2', Q140: '2', Q141: '2', Q142: '3'
    },
    STU_7A_002: {
      Q001: '2', Q003: '7', Q004: '1', Q008: '5', Q012: '2', Q030: '11',
      Q035: '1', Q037: '1', Q092: '1', Q093: '1', Q099: '1', Q108: '1',
      Q114: '1', Q115: '1', Q116: '1', Q123: '1', Q127: '1', Q142: '1'
    },
    STU_7A_003: {
      Q001: '1', Q003: '7', Q004: '24', Q008: '4', Q012: '2', Q030: '3',
      Q035: '2', Q036: '2', Q037: '2', Q038: '2', Q053: '2', Q067: '1',
      Q071: '2', Q092: '8', Q093: '2', Q107: '1', Q114: '1', Q143: '1'
    }
  },
  logs: [
    {
      id: 'LOG_INIT_1',
      timestamp: new Date().toISOString(),
      userRole: 'SYSTEM',
      userName: 'Систем',
      action: 'INIT',
      details: 'Суралцагчийн эрсдлийн үнэлгээний төв сервер эхэллээ'
    }
  ]
};

function readDB(): DBStructure {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDB(DEFAULT_DB);
      return DEFAULT_DB;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      settings: parsed.settings || DEFAULT_DB.settings,
      classes: parsed.classes || DEFAULT_DB.classes,
      teachers: parsed.teachers || DEFAULT_DB.teachers,
      students: parsed.students || DEFAULT_DB.students,
      responses: parsed.responses || DEFAULT_DB.responses,
      logs: parsed.logs || DEFAULT_DB.logs,
    };
  } catch (err) {
    console.error('Error reading db.json, returning default:', err);
    return DEFAULT_DB;
  }
}

function writeDB(data: DBStructure) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to db.json:', err);
  }
}

const app = express();
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// CORS headers for all incoming requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// GET all data
app.get('/api/data', (req, res) => {
  const db = readDB();
  res.json(db);
});

// GET / POST settings
app.get('/api/settings', (req, res) => {
  const db = readDB();
  res.json({ success: true, settings: db.settings || {} });
});

app.post('/api/settings', (req, res) => {
  const db = readDB();
  const incoming = req.body || {};
  db.settings = { ...db.settings, ...incoming };
  writeDB(db);
  res.json({ success: true, settings: db.settings });
});

// CSV Parser for Google Sheets gviz export
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell);
      if (currentRow.some((c) => c.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.some((c) => c.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// Sync from Public Google Sheet gviz CSV (Zero-config, pulls 7а Дулсам and other updates)
async function syncFromPublicSheetIfConfigured(db: DBStructure): Promise<boolean> {
  const sheetId = db.settings?.googleSheetsSpreadsheetId || '1Dv1ydn-iikIMFcjyNxyNmc3ffMALfq-41AjOQ20vwQg';
  if (!sheetId) return false;

  try {
    const fetchTab = async (tab: string) => {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const text = await res.text();
      return parseCSV(text);
    };

    const teacherRows = await fetchTab('Багш_Ангиуд');
    const studentRows = await fetchTab('Сурагчид');
    const responseRows = await fetchTab('Судалгааны_Хариултууд');

    let changed = false;

    if (teacherRows.length > 1) {
      const classMap = new Map();
      db.classes.forEach((c) => {
        if (c.name) classMap.set(c.name.trim().toUpperCase(), c);
      });

      const teacherMap = new Map();
      db.teachers.forEach((t) => {
        const key = (t.teacherCode || t.className).trim().toUpperCase();
        teacherMap.set(key, t);
      });

      teacherRows.slice(1).forEach((row) => {
        const c_name = (row[0] || '').trim();
        if (!c_name) return;
        const key = c_name.toUpperCase();
        const t_name = (row[1] || `${c_name} Ангийн багш`).trim();
        const t_code = (row[2] || `TEACH-${c_name}`).trim();
        const phone = (row[3] || '').trim();

        if (classMap.has(key)) {
          const existing = classMap.get(key);
          existing.teacherName = t_name;
          existing.teacherCode = t_code;
        } else {
          changed = true;
          const norm = normalizeCode(c_name);
          classMap.set(key, {
            id: `CLS_${norm}`,
            name: c_name,
            grade: parseInt(c_name.match(/^(\d+)/)?.[1] || '7', 10),
            sectionLetter: c_name.replace(/^[\d\s\-_]+/, '').trim() || 'А',
            teacherId: `TCH_${norm}`,
            teacherName: t_name,
            teacherCode: t_code,
            academicYear: db.settings?.academicYear || '2025-2026',
            schoolName: db.settings?.schoolName || 'Сургууль'
          });
        }

        const tKey = t_code.toUpperCase();
        if (teacherMap.has(tKey)) {
          const existing = teacherMap.get(tKey);
          existing.name = t_name;
          if (phone) existing.phone = phone;
        } else {
          changed = true;
          const norm = normalizeCode(c_name);
          teacherMap.set(tKey, {
            id: `TCH_${norm}`,
            name: t_name,
            teacherCode: t_code,
            classId: `CLS_${norm}`,
            className: c_name,
            phone
          });
        }
      });

      db.classes = Array.from(classMap.values());
      db.teachers = Array.from(teacherMap.values());
    }

    if (studentRows.length > 1) {
      const studentMap = new Map();
      db.students.forEach((s) => {
        studentMap.set(s.studentCode.trim().toUpperCase(), s);
      });

      studentRows.slice(1).forEach((row) => {
        const studentCode = (row[0] || '').trim();
        if (!studentCode) return;
        const key = studentCode.toUpperCase();
        const className = (row[1] || '').trim();
        const fullName = (row[2] || studentCode).trim();
        const gender = (row[3] || '').trim() === 'Эм' ? '1' : '2';
        const password = (row[4] || '').trim();
        const isSubmitted = (row[5] || '').includes('Судалгаа бөглөсөн');
        const riskLevel = row[6] === 'Өндөр' ? 'high' : row[6] === 'Дунд' ? 'medium' : row[6] === 'Энгийн' ? 'low' : undefined;
        const riskScore = row[7] ? parseInt(row[7], 10) : 0;
        const submittedAt = (row[8] || '').trim();

        if (studentMap.has(key)) {
          const existing = studentMap.get(key);
          existing.fullName = fullName;
          existing.gender = gender;
          if (password) existing.password = password;
          if (isSubmitted) {
            existing.isSubmitted = true;
            existing.riskLevel = riskLevel;
            existing.riskScore = riskScore;
            existing.submittedAt = submittedAt;
          }
        } else {
          changed = true;
          studentMap.set(key, {
            id: `STU_${studentCode}`,
            classId: `CLS_${normalizeCode(className)}`,
            className,
            studentCode,
            password: password || '123456',
            fullName,
            gender,
            isSubmitted,
            submittedAt,
            riskLevel,
            riskScore
          });
        }
      });
      db.students = Array.from(studentMap.values());
    }

    db.settings.googleSheetsLastSync = new Date().toISOString();
    writeDB(db);
    return true;
  } catch (err) {
    console.warn('[Server] Public sheet sync error:', err);
    return false;
  }
}

// Helper to sync from Google Apps Script if URL is configured
async function syncFromGasIfConfigured(db: DBStructure): Promise<boolean> {
  const gasUrl = db.settings?.gasWebAppUrl?.trim();
  if (!gasUrl) return false;
  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'getAllForClient' })
    });
    if (!response.ok) return false;
    const gasData: any = await response.json();
    if (gasData && gasData.success) {
      if (Array.isArray(gasData.classes) && gasData.classes.length > 0) {
        const classMap = new Map();
        db.classes.forEach((c) => {
          const k = (c.name || '').trim().toUpperCase();
          if (k) classMap.set(k, c);
        });
        gasData.classes.forEach((c: any) => {
          const key = (c.name || c.id || '').trim().toUpperCase();
          if (key) classMap.set(key, c);
        });
        db.classes = Array.from(classMap.values());
      }

      if (Array.isArray(gasData.teachers) && gasData.teachers.length > 0) {
        const teacherMap = new Map();
        db.teachers.forEach((t) => {
          const k = ((t.teacherCode || t.className) || '').trim().toUpperCase();
          if (k) teacherMap.set(k, t);
        });
        gasData.teachers.forEach((t: any) => {
          const key = ((t.teacherCode || t.className) || t.id || '').trim().toUpperCase();
          if (key) teacherMap.set(key, t);
        });
        db.teachers = Array.from(teacherMap.values());
      }

      if (Array.isArray(gasData.students) && gasData.students.length > 0) {
        const studentMap = new Map();
        db.students.forEach((s) => {
          const k = (s.studentCode || '').trim().toUpperCase();
          if (k) studentMap.set(k, s);
        });
        gasData.students.forEach((s: any) => {
          const key = (s.studentCode || s.id || '').trim().toUpperCase();
          if (key) studentMap.set(key, s);
        });
        db.students = Array.from(studentMap.values());
      }

      if (gasData.responses) {
        db.responses = { ...db.responses, ...gasData.responses };
      }

      db.settings.googleSheetsLastSync = new Date().toISOString();
      db.settings.gasConnected = true;
      writeDB(db);
      return true;
    }
  } catch (err) {
    console.warn('[Server] GAS auto-sync notice:', err);
  }
  return false;
}

// Helper to push all server DB data directly to Google Apps Script
async function pushToGasIfConfigured(db: DBStructure): Promise<{ success: boolean; message: string }> {
  const gasUrl = db.settings?.gasWebAppUrl?.trim();
  if (!gasUrl) return { success: false, message: 'Google Apps Script URL тохируулагдаагүй байна.' };

  try {
    const classMap = new Map();
    db.classes.forEach((c) => {
      const k = (c.name || '').trim().toUpperCase();
      if (k && !classMap.has(k)) classMap.set(k, c);
    });
    const uniqueClasses = Array.from(classMap.values());

    const teacherMap = new Map();
    db.teachers.forEach((t) => {
      const k = ((t.teacherCode || t.className) || '').trim().toUpperCase();
      if (k && !teacherMap.has(k)) teacherMap.set(k, t);
    });
    const uniqueTeachers = Array.from(teacherMap.values());

    const studentMap = new Map();
    db.students.forEach((s) => {
      const k = (s.studentCode || '').trim().toUpperCase();
      if (k && !studentMap.has(k)) studentMap.set(k, s);
    });
    const uniqueStudents = Array.from(studentMap.values());

    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'syncAllFromClient',
        classes: uniqueClasses,
        teachers: uniqueTeachers,
        students: uniqueStudents,
        responses: db.responses || {},
        settings: db.settings
      })
    });

    if (!response.ok) {
      return { success: false, message: `Холболтын алдаа: HTTP ${response.status}` };
    }

    const resJson: any = await response.json();
    if (resJson && resJson.success) {
      db.settings.googleSheetsLastSync = new Date().toISOString();
      db.settings.gasConnected = true;
      writeDB(db);
    }
    return resJson;
  } catch (err: any) {
    console.warn('[Server] GAS push error:', err);
    return { success: false, message: err.message || 'Google Apps Script рүү өгөгдөл илгээхэд алдаа гарлаа.' };
  }
}

// Debounced auto-push to Google Sheet so we don't spam Google servers
let gasAutoPushTimer: NodeJS.Timeout | null = null;
function scheduleGasAutoPush() {
  if (gasAutoPushTimer) clearTimeout(gasAutoPushTimer);
  gasAutoPushTimer = setTimeout(async () => {
    try {
      const db = readDB();
      if (db.settings?.gasWebAppUrl && db.settings.gasWebAppUrl.trim()) {
        await pushToGasIfConfigured(db);
      }
    } catch (e) {
      console.warn('[Server] Background GAS push notice:', e);
    }
  }, 1500);
}

// SYNC data from client (Smart Merge)
app.post('/api/sync', (req, res) => {
  const db = readDB();
  const payload = req.body || {};

  if (payload.settings) {
    db.settings = { ...db.settings, ...payload.settings };
  }

  if (Array.isArray(payload.classes)) {
    const classMap = new Map();
    db.classes.forEach((c) => {
      const k = (c.name || '').trim().toUpperCase();
      if (k) classMap.set(k, c);
    });
    payload.classes.forEach((c: any) => {
      const k = (c.name || '').trim().toUpperCase();
      if (k) classMap.set(k, c);
    });
    db.classes = Array.from(classMap.values());
  }

  if (Array.isArray(payload.teachers)) {
    const teacherMap = new Map();
    db.teachers.forEach((t) => {
      const k = ((t.teacherCode || t.className) || '').trim().toUpperCase();
      if (k) teacherMap.set(k, t);
    });
    payload.teachers.forEach((t: any) => {
      const k = ((t.teacherCode || t.className) || '').trim().toUpperCase();
      if (k) teacherMap.set(k, t);
    });
    db.teachers = Array.from(teacherMap.values());
  }

  if (Array.isArray(payload.students)) {
    const studentMap = new Map();
    db.students.forEach((s) => {
      const k = (s.studentCode || '').trim().toUpperCase();
      if (k) studentMap.set(k, s);
    });
    payload.students.forEach((s: any) => {
      const k = (s.studentCode || '').trim().toUpperCase();
      if (k) studentMap.set(k, s);
    });
    db.students = Array.from(studentMap.values());
  }

  if (payload.responses) {
    db.responses = { ...db.responses, ...payload.responses };
  }

  if (Array.isArray(payload.logs)) {
    const logMap = new Map();
    db.logs.forEach((l) => logMap.set(l.id, l));
    payload.logs.forEach((l: any) => logMap.set(l.id, l));
    db.logs = Array.from(logMap.values()).slice(0, 500); // keep last 500
  }

  writeDB(db);

  // Trigger background sync to Google Apps Script / Sheet
  scheduleGasAutoPush();

  res.json({ success: true, timestamp: new Date().toISOString() });
});

// Trigger Cloud Push (Send to Google Sheet) on demand
app.post('/api/sync/gas-push', async (req, res) => {
  const db = readDB();
  const pushRes = await pushToGasIfConfigured(db);
  const updatedDb = readDB();
  res.json({
    ...pushRes,
    lastSync: updatedDb.settings.googleSheetsLastSync,
    classesCount: updatedDb.classes.length,
    teachersCount: updatedDb.teachers.length,
    studentsCount: updatedDb.students.length
  });
});

// Trigger Cloud Database Sync on demand
app.post('/api/sync/cloud', async (req, res) => {
  let db = readDB();
  let updated = false;

  if (db.settings?.gasWebAppUrl) {
    updated = await syncFromGasIfConfigured(db);
    if (updated) db = readDB();
  }

  const publicUpdated = await syncFromPublicSheetIfConfigured(db);
  if (publicUpdated) {
    db = readDB();
    updated = true;
  }

  res.json({
    success: true,
    updated,
    classes: db.classes,
    teachers: db.teachers,
    studentsCount: db.students.length,
    lastSync: db.settings.googleSheetsLastSync
  });
});

// Teacher Login API - Strictly requires correct registered Username/Code
app.post('/api/auth/teacher', async (req, res) => {
  const { username, code } = req.body || {};
  const rawInput = String(username || code || '').trim();

  if (!rawInput) {
    return res.status(400).json({ success: false, message: 'Багшийн нэвтрэх нэр эсвэл ангийн нэрээ оруулна уу.' });
  }

  let db = readDB();
  const normInput = normalizeCode(rawInput);
  const upperRaw = rawInput.toUpperCase();
  const rawDigitsOnly = rawInput.replace(/[^0-9]/g, '');

  const findTeacher = () => {
    let foundTeacher = db.teachers.find((t) => {
      const tCodeNorm = normalizeCode(t.teacherCode);
      const tClassNorm = normalizeCode(t.className);
      const tPhoneDigits = t.phone ? t.phone.replace(/[^0-9]/g, '') : '';
      const tNameUpper = (t.name || '').toUpperCase().trim();

      return (
        t.teacherCode.toUpperCase() === upperRaw ||
        tCodeNorm === normInput ||
        t.className.toUpperCase() === upperRaw ||
        tClassNorm === normInput ||
        tNameUpper === upperRaw ||
        (rawDigitsOnly.length >= 6 && tPhoneDigits === rawDigitsOnly)
      );
    });

    let foundClass = db.classes.find((c) => {
      const cCodeNorm = normalizeCode(c.teacherCode);
      const cNameNorm = normalizeCode(c.name);

      return (
        c.teacherCode.toUpperCase() === upperRaw ||
        cCodeNorm === normInput ||
        c.name.toUpperCase() === upperRaw ||
        cNameNorm === normInput
      );
    });

    if (!foundTeacher && foundClass) {
      foundTeacher = db.teachers.find((t) => t.classId === foundClass.id || t.className === foundClass.name);
    }
    if (!foundClass && foundTeacher) {
      foundClass = db.classes.find((c) => c.id === foundTeacher.classId || c.name === foundTeacher.className);
    }

    return { foundTeacher, foundClass };
  };

  let { foundTeacher, foundClass } = findTeacher();

  // If not found in server DB, check if Google Apps Script or public sheet has freshly synced data
  if (!foundTeacher && !foundClass) {
    if (db.settings?.gasWebAppUrl) {
      const gasUrl = db.settings.gasWebAppUrl.trim();
      try {
        const gasAuthRes = await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'login',
            username: rawInput,
            role: 'teacher'
          }),
          signal: AbortSignal.timeout(2500)
        });
        if (gasAuthRes.ok) {
          const gasAuthData = await gasAuthRes.json();
          if (gasAuthData.success && gasAuthData.user) {
            const u = gasAuthData.user;
            foundTeacher = {
              id: u.id || ('TCH_' + u.teacherCode),
              name: u.fullName || u.name,
              teacherCode: u.teacherCode,
              classId: u.classId || ('CLS_' + u.className),
              className: u.className,
              phone: u.phone || '',
              password: u.password || u.teacherCode
            };
            foundClass = {
              id: u.classId || ('CLS_' + u.className),
              name: u.className,
              grade: parseInt(u.className.match(/^(\d+)/)?.[1] || '7', 10),
              sectionLetter: u.className.replace(/^[\d\s\-_]+/, '').trim() || 'А',
              teacherId: foundTeacher.id,
              teacherName: foundTeacher.name,
              teacherCode: foundTeacher.teacherCode,
              academicYear: db.settings?.academicYear || '2025-2026',
              schoolName: db.settings?.schoolName || 'Сургууль'
            };
            if (!db.teachers.some(t => t.teacherCode.toUpperCase() === foundTeacher!.teacherCode.toUpperCase())) {
              db.teachers.push(foundTeacher);
            }
            if (!db.classes.some(c => c.name.toUpperCase() === foundClass!.name.toUpperCase())) {
              db.classes.push(foundClass);
            }
            writeDB(db);
          }
        }
      } catch (err) {
        console.warn('[Server] Teacher direct GAS auth error:', err);
      }
    }

    if (!foundTeacher && !foundClass) {
      const publicUpdated = await syncFromPublicSheetIfConfigured(db);
      if (publicUpdated) {
        db = readDB();
        const retry = findTeacher();
        foundTeacher = retry.foundTeacher;
        foundClass = retry.foundClass;
      }
    }
  }

  if (!foundTeacher && !foundClass) {
    return res.status(404).json({
      success: false,
      message: 'Багшийн нэвтрэх нэр олдсонгүй. Анги эсвэл кодоо шалгана уу.'
    });
  }

  const className = foundClass ? foundClass.name : foundTeacher?.className || 'Анги';
  const classId = foundClass ? foundClass.id : foundTeacher?.classId || '';
  const teacherName = foundTeacher ? foundTeacher.name : `${className} Ангийн багш`;

  return res.json({
    success: true,
    session: {
      role: 'teacher',
      userId: foundTeacher?.id || 'TCH_' + classId,
      userName: teacherName,
      classId,
      className,
      token: `tch_tok_${classId}`
    },
    teacher: foundTeacher,
    schoolClass: foundClass
  });
});

// Student Login API - Strictly requires correct Student Code and Password
app.post('/api/auth/student', async (req, res) => {
  const { studentCode, password } = req.body || {};
  if (!studentCode || !password) {
    return res.status(400).json({ success: false, message: 'Сурагчийн код болон нууц үгээ оруулна уу' });
  }

  let db = readDB();
  const rawCode = String(studentCode).trim();
  const normInput = normalizeCode(rawCode);
  const cleanPassword = String(password).trim().toUpperCase();

  // First check if student exists by code in server DB
  const studentByCode = db.students.find((s) => {
    const sCodeNorm = normalizeCode(s.studentCode);
    return s.studentCode.toUpperCase() === rawCode.toUpperCase() || sCodeNorm === normInput;
  });

  if (studentByCode) {
    const passMatch = studentByCode.password.trim().toUpperCase() === cleanPassword;
    if (!passMatch) {
      return res.status(401).json({
        success: false,
        message: 'Нэвтрэх нууц үг буруу байна. Ангийн багшаасаа нууц үгээ авна уу.'
      });
    }

    return res.json({
      success: true,
      session: {
        role: 'student',
        userId: studentByCode.id,
        userName: studentByCode.fullName,
        studentCode: studentByCode.studentCode,
        classId: studentByCode.classId,
        className: studentByCode.className,
        token: `stu_tok_${studentByCode.id}`
      },
      student: studentByCode
    });
  }

  // If student not found in server DB, attempt direct login via Google Apps Script Web App
  let student: any = null;
  if (db.settings?.gasWebAppUrl) {
    const gasUrl = db.settings.gasWebAppUrl.trim();
    try {
      const gasLoginRes = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'login',
          username: rawCode,
          password: cleanPassword,
          role: 'student'
        })
      });

      if (gasLoginRes.ok) {
        const gasData = await gasLoginRes.json();
        if (gasData.success && gasData.user) {
          const u = gasData.user;
          student = {
            id: u.id || ('STU_' + u.studentCode),
            classId: u.classId || ('CLS_' + u.className),
            className: u.className || u.class,
            studentCode: u.studentCode || u.username,
            password: password,
            fullName: u.fullName || u.student_name,
            gender: u.gender || '1',
            isSubmitted: Boolean(u.isSubmitted),
            submittedAt: u.submittedAt,
            riskLevel: u.riskLevel,
            riskScore: u.riskScore
          };

          // Cache student in server db
          const idx = db.students.findIndex(s => s.studentCode.toUpperCase() === student!.studentCode.toUpperCase());
          if (idx >= 0) {
            db.students[idx] = student;
          } else {
            db.students.push(student);
          }
          writeDB(db);
        } else if (gasData.success === false && gasData.message) {
          return res.status(401).json({ success: false, message: gasData.message });
        }
      }
    } catch (err) {
      console.warn('[Server] Student direct GAS auth error:', err);
    }
  }

  // Also check public sheet sync if still not found
  if (!student) {
    const publicUpdated = await syncFromPublicSheetIfConfigured(db);
    if (publicUpdated) {
      db = readDB();
      const retryStudent = db.students.find((s) => {
        const sCodeNorm = normalizeCode(s.studentCode);
        return s.studentCode.toUpperCase() === rawCode.toUpperCase() || sCodeNorm === normInput;
      });
      if (retryStudent) {
        const passMatch = retryStudent.password.trim().toUpperCase() === cleanPassword;
        if (!passMatch) {
          return res.status(401).json({
            success: false,
            message: 'Нэвтрэх нууц үг буруу байна. Ангийн багшаасаа нууц үгээ авна уу.'
          });
        }
        student = retryStudent;
      }
    }
  }

  if (!student) {
    return res.status(404).json({ success: false, message: 'Сурагчийн код олдсонгүй. Ангийн багшаасаа шалгана уу.' });
  }

  return res.json({
    success: true,
    session: {
      role: 'student',
      userId: student.id,
      userName: student.fullName,
      studentCode: student.studentCode,
      classId: student.classId,
      className: student.className,
      token: `stu_tok_${student.id}`
    },
    student
  });
});

// Bulk add teachers endpoint
app.post('/api/teachers/bulk', (req, res) => {
  const { items, actorRole = 'ADMIN', actorName = 'Администратор' } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Бүртгэх мэдээлэл хоосон байна' });
  }

  const db = readDB();
  let createdCount = 0;
  let updatedCount = 0;
  const resultList: any[] = [];

  items.forEach((item: any, idx: number) => {
    const rawName = String(item.className || '').trim();
    if (!rawName) return;

    const normClass = normalizeCode(rawName);
    const teacherName = String(item.teacherName || '').trim() || `${rawName} Ангийн багш`;
    const phone = String(item.phone || '').trim();
    const grade = item.grade || parseInt(rawName.match(/^(\d+)/)?.[1] || '7', 10);
    const sectionLetter = rawName.replace(/^[\d\s\-_]+/, '').trim() || 'А';
    const teacherCode = 'TEACH-' + (normClass || 'CLS');

    const existingClassIndex = db.classes.findIndex(
      (c) => c.name.trim().toUpperCase() === rawName.toUpperCase() || normalizeCode(c.name) === normClass
    );

    let targetClass: any;
    if (existingClassIndex >= 0) {
      db.classes[existingClassIndex] = {
        ...db.classes[existingClassIndex],
        grade,
        sectionLetter,
        teacherName,
        teacherCode
      };
      targetClass = db.classes[existingClassIndex];
      updatedCount++;
    } else {
      const id = 'CLS_' + normClass + '_' + (Date.now() + idx);
      targetClass = {
        id,
        name: rawName,
        grade,
        sectionLetter,
        teacherId: 'TCH_' + (Date.now() + idx),
        teacherName,
        teacherCode,
        academicYear: db.settings.academicYear || '2025-2026',
        schoolName: db.settings.schoolName || 'Сургууль'
      };
      db.classes.push(targetClass);
      createdCount++;
    }

    const existingTeacherIndex = db.teachers.findIndex(
      (t) =>
        t.classId === targetClass.id ||
        t.className.trim().toUpperCase() === rawName.toUpperCase() ||
        normalizeCode(t.className) === normClass ||
        t.teacherCode.toUpperCase() === teacherCode.toUpperCase()
    );

    let targetTeacher: any;
    if (existingTeacherIndex >= 0) {
      db.teachers[existingTeacherIndex] = {
        ...db.teachers[existingTeacherIndex],
        name: teacherName,
        teacherCode,
        classId: targetClass.id,
        className: rawName,
        phone: phone || db.teachers[existingTeacherIndex].phone
      };
      targetTeacher = db.teachers[existingTeacherIndex];
    } else {
      targetTeacher = {
        id: 'TCH_' + (Date.now() + idx),
        name: teacherName,
        teacherCode,
        classId: targetClass.id,
        className: rawName,
        phone
      };
      db.teachers.push(targetTeacher);
    }

    resultList.push({ schoolClass: targetClass, teacher: targetTeacher });
  });

  db.logs.unshift({
    id: 'LOG_' + Date.now(),
    timestamp: new Date().toISOString(),
    userRole: actorRole,
    userName: actorName,
    action: 'BULK_TEACHER_IMPORT',
    details: `${createdCount} шинэ анги/багш үүсэж, ${updatedCount} шинэчлэгдлээ`
  });

  writeDB(db);
  res.json({ success: true, createdCount, updatedCount, list: resultList });
});

// Start Express server and mount Vite or static build
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
    // Sync initial state from Google Sheet
    syncFromPublicSheetIfConfigured(readDB()).catch((e) => console.warn('[Server] Initial Google Sheet sync notice:', e));
  });
}

startServer();
