import { SchoolClass, Student, Teacher, SystemSettings, SystemLog, RiskEvaluation } from '../types';
import { RAW_QUESTIONS } from '../data/questions';
import { evaluateStudentRisk } from './riskCalculator';
import { GoogleSheetsService } from './googleSheetsService';
import { GasService } from './gasService';

export function cyrillicToLatin(text: string): string {
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

export function normalizeCode(str: string): string {
  if (!str) return '';
  return cyrillicToLatin(str)
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '');
}

const STORAGE_KEYS = {
  CLASSES: 'school_risk_classes_v1',
  TEACHERS: 'school_risk_teachers_v1',
  STUDENTS: 'school_risk_students_v1',
  RESPONSES: 'school_risk_responses_v1',
  SETTINGS: 'school_risk_settings_v1',
  LOGS: 'school_risk_logs_v1',
  SESSION: 'school_risk_session_v1'
};

export interface ActiveSession {
  role: 'admin' | 'teacher' | 'student';
  userId: string;
  userName: string;
  classId?: string;
  className?: string;
  studentCode?: string;
  token: string;
}

// Initial Seed Data for Instant Usability
export const TARGET_SPREADSHEET_ID = '1Dv1ydn-iikIMFcjyNxyNmc3ffMALfq-41AjOQ20vwQg';
export const DEFAULT_GAS_URL ='https://script.google.com/macros/s/AKfycbwU5arPll6wf0p3I9H5hYVm1SAqUntVnjxAz0a0y_NYc0Sg_U1vlN09cUOtAXWMQ66eqg/exec';

// Таны Apps Script-ийг Deploy хийхэд гарсан "Web app URL" (.../exec төгссөн)-ийг энд бэхэлж тавина


const INITIAL_SETTINGS: SystemSettings = {
  schoolName: 'Хөвсгөл аймгийн 3-р сургууль',
  academicYear: '2026-2027',
  surveyOpen: true,
  gasWebAppUrl: DEFAULT_GAS_URL,
  gasConnected: true,
  googleSheetsSpreadsheetId: TARGET_SPREADSHEET_ID,
  googleSheetsUrl: `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit`,
  googleSheetsConnected: true,
  googleSheetsLastSync: new Date().toISOString()
}
const INITIAL_CLASSES: SchoolClass[] = [
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
];

const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'TCH_7A',
    name: 'Б. Бат-Эрдэнэ',
    teacherCode: 'TEACH-7A',
    classId: 'CLS_7A',
    className: '7А',
    phone: '99112233',
    password: 'TEACH-7A'
  },
  {
    id: 'TCH_8B',
    name: 'Д. Цэцэгмаа',
    teacherCode: 'TEACH-8B',
    classId: 'CLS_8B',
    className: '8Б',
    phone: '99223344',
    password: 'TEACH-8B'
  },
  {
    id: 'TCH_9V',
    name: 'М. Баяр',
    teacherCode: 'TEACH-9V',
    classId: 'CLS_9V',
    className: '9В',
    phone: '99334455',
    password: 'TEACH-9V'
  }
];

const INITIAL_STUDENTS: Student[] = [
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
];

// Sample answers for completed students
const INITIAL_RESPONSES: Record<string, Record<string, string>> = {
  STU_7A_001: {
    Q001: '2',
    Q003: '7', // Нас 12
    Q004: '24', // Мөрөн
    Q008: '3', // Ам бүл 4
    Q012: '1', // Эцэг эхтэйгээ
    Q024: '1', // Эцэг дээд
    Q028: '1', // Эх дээд
    Q030: '8', // Орлого 900
    Q035: '2', // Бие махбодийн хүчирхийлэл үгүй
    Q036: '2',
    Q037: '2',
    Q038: '2',
    Q053: '1', // Идэвх сайн
    Q067: '1', // Орчин таатай
    Q071: '1', // Сурах идэвх сайн
    Q092: '8', // Хөдөлмөр үгүй
    Q093: '2', // Морь унадаггүй
    Q107: '1', // Зам хөндлөн гардаг
    Q108: '2',
    Q116: '2',
    Q123: '2',
    Q140: '2',
    Q141: '2',
    Q142: '3'
  },
  STU_7A_002: {
    Q001: '2',
    Q003: '7',
    Q004: '1',
    Q008: '5',
    Q012: '2', // Зөвхөн ээжтэйгээ
    Q030: '11', // Хүүхдийн мөнгөөр
    Q035: '1', // Бие махбодийн хүчирхийлэл Тийм (High trigger)
    Q037: '1', // Сэтгэл санааны дарамт Тийм
    Q092: '1', // Барилга
    Q093: '1', // Хурдан морь
    Q099: '1', // Унаж бэртсэн
    Q108: '1', // Харанхуй гудамж
    Q114: '1', // Хичээл хоцордог
    Q115: '1', // Хичээл тасалдаг
    Q116: '1', // Гадуурхагддаг
    Q123: '1', // Гэр бүлийн хүчирхийлэл
    Q127: '1', // Архины хамааралтай
    Q142: '1'  // Электрон тамхи
  },
  STU_7A_003: {
    Q001: '1',
    Q003: '7',
    Q004: '24',
    Q008: '4',
    Q012: '2',
    Q030: '3',
    Q035: '2',
    Q036: '2',
    Q037: '2',
    Q038: '2',
    Q053: '2', // Дунд
    Q067: '1',
    Q071: '2',
    Q092: '8',
    Q093: '2',
    Q107: '1',
    Q114: '1', // Хичээлээс хоцордог
    Q143: '1'  // Дэлгэцийн хамаарал
  }
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[Storage] Failed to read ${key}:`, err);
    return fallback;
  }
}

let syncTimer: any = null;
function triggerDebouncedServerSync() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncToServer();
  }, 150);
}

function safeSet(key: string, value: any): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
    if (key !== STORAGE_KEYS.SESSION) {
      triggerDebouncedServerSync();
    }
  } catch (err) {
    console.warn(`[Storage] Failed to save ${key}:`, err);
  }
}

function safeRemove(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn(`[Storage] Failed to remove ${key}:`, err);
  }
}

let isSyncing = false;

export async function syncFromServer(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return false;
  try {
    const res = await fetch('/api/data');
    if (!res.ok) return false;
    const data = await res.json();
    if (data) {
      // 1. Classes: merge by class id and normalized name
      if (Array.isArray(data.classes) && data.classes.length > 0) {
        const localClasses = safeGet<SchoolClass[]>(STORAGE_KEYS.CLASSES, []);
        const classMap = new Map<string, SchoolClass>();
        localClasses.forEach((c) => {
          classMap.set(c.id, c);
          if (c.name) classMap.set(c.name.trim().toUpperCase(), c);
        });
        data.classes.forEach((c: SchoolClass) => {
          const nameKey = c.name ? c.name.trim().toUpperCase() : '';
          if (nameKey && classMap.has(nameKey)) {
            classMap.set(nameKey, { ...classMap.get(nameKey)!, ...c });
          } else if (classMap.has(c.id)) {
            classMap.set(c.id, { ...classMap.get(c.id)!, ...c });
          } else {
            classMap.set(c.id, c);
          }
        });
        const uniqueClasses: SchoolClass[] = [];
        const seenIds = new Set<string>();
        for (const c of classMap.values()) {
          if (!seenIds.has(c.id)) {
            seenIds.add(c.id);
            uniqueClasses.push(c);
          }
        }
        safeSet(STORAGE_KEYS.CLASSES, uniqueClasses);
      }

      // 2. Teachers: merge by teacherCode and id
      if (Array.isArray(data.teachers) && data.teachers.length > 0) {
        const localTeachers = safeGet<Teacher[]>(STORAGE_KEYS.TEACHERS, []);
        const teacherMap = new Map<string, Teacher>();
        localTeachers.forEach((t) => {
          teacherMap.set(t.id, t);
          if (t.teacherCode) teacherMap.set(t.teacherCode.trim().toUpperCase(), t);
        });
        data.teachers.forEach((t: Teacher) => {
          const codeKey = t.teacherCode ? t.teacherCode.trim().toUpperCase() : '';
          if (codeKey && teacherMap.has(codeKey)) {
            teacherMap.set(codeKey, { ...teacherMap.get(codeKey)!, ...t });
          } else if (teacherMap.has(t.id)) {
            teacherMap.set(t.id, { ...teacherMap.get(t.id)!, ...t });
          } else {
            teacherMap.set(t.id, t);
          }
        });
        const uniqueTeachers: Teacher[] = [];
        const seenTchIds = new Set<string>();
        for (const t of teacherMap.values()) {
          if (!seenTchIds.has(t.id)) {
            seenTchIds.add(t.id);
            uniqueTeachers.push(t);
          }
        }
        safeSet(STORAGE_KEYS.TEACHERS, uniqueTeachers);
      }

      // 3. Students: merge by studentCode and id (CRITICAL: never wipe local or remote students!)
      if (Array.isArray(data.students) && data.students.length > 0) {
        const localStudents = safeGet<Student[]>(STORAGE_KEYS.STUDENTS, []);
        const studentMap = new Map<string, Student>();
        localStudents.forEach((s) => {
          studentMap.set(s.id, s);
          if (s.studentCode) studentMap.set(s.studentCode.trim().toUpperCase(), s);
        });
        data.students.forEach((s: Student) => {
          const codeKey = s.studentCode ? s.studentCode.trim().toUpperCase() : '';
          if (codeKey && studentMap.has(codeKey)) {
            studentMap.set(codeKey, { ...studentMap.get(codeKey)!, ...s });
          } else if (studentMap.has(s.id)) {
            studentMap.set(s.id, { ...studentMap.get(s.id)!, ...s });
          } else {
            studentMap.set(s.id, s);
          }
        });
        const uniqueStudents: Student[] = [];
        const seenStuIds = new Set<string>();
        for (const s of studentMap.values()) {
          if (!seenStuIds.has(s.id)) {
            seenStuIds.add(s.id);
            uniqueStudents.push(s);
          }
        }
        safeSet(STORAGE_KEYS.STUDENTS, uniqueStudents);
      }

      // 4. Responses
      if (data.responses) {
        const localResponses = safeGet<Record<string, any>>(STORAGE_KEYS.RESPONSES, {});
        safeSet(STORAGE_KEYS.RESPONSES, { ...data.responses, ...localResponses });
      }

      // 5. Settings: preserve gasWebAppUrl and googleSheetsSpreadsheetId
      if (data.settings) {
        const localSettings = safeGet<SystemSettings | null>(STORAGE_KEYS.SETTINGS, null);
        const mergedSettings: SystemSettings = {
          ...INITIAL_SETTINGS,
          ...(localSettings || {}),
          ...data.settings,
          gasWebAppUrl: data.settings.gasWebAppUrl || localSettings?.gasWebAppUrl || '',
          gasConnected: Boolean(data.settings.gasConnected || localSettings?.gasConnected),
          googleSheetsSpreadsheetId: data.settings.googleSheetsSpreadsheetId || localSettings?.googleSheetsSpreadsheetId || TARGET_SPREADSHEET_ID,
          googleSheetsConnected: true
        };
        safeSet(STORAGE_KEYS.SETTINGS, mergedSettings);
      }

      if (Array.isArray(data.logs)) {
        const localLogs = safeGet<any[]>(STORAGE_KEYS.LOGS, []);
        const logMap = new Map<string, any>();
        localLogs.forEach((l) => logMap.set(l.id, l));
        data.logs.forEach((l: any) => logMap.set(l.id, l));
        safeSet(STORAGE_KEYS.LOGS, Array.from(logMap.values()).slice(0, 500));
      }
      return true;
    }
  } catch (err) {
    console.warn('[Sync] Server sync unavailable:', err);
  }
  return false;
}

/**
 * Universal cloud database synchronization:
 * Loads all classes, teachers, students, responses from Google Apps Script or Google Sheets.
 */
export async function loadAllFromCloudDatabase(): Promise<{
  success: boolean;
  message: string;
  count?: { students: number; classes: number; teachers: number };
}> {
  // 1. Sync from server first
  await syncFromServer();

  const settings = StorageService.getSettings();

  // 2. If Google Apps Script URL exists, pull fresh data from Google Apps Script
  if (settings.gasWebAppUrl && settings.gasWebAppUrl.trim()) {
    try {
      const gasData = await GasService.loadAllFromGas(settings.gasWebAppUrl.trim());
      if (gasData && gasData.success) {
        if (Array.isArray(gasData.classes) && gasData.classes.length > 0) {
          StorageService.saveClasses(gasData.classes);
        }
        if (Array.isArray(gasData.teachers) && gasData.teachers.length > 0) {
          StorageService.saveTeachers(gasData.teachers);
        }
        if (Array.isArray(gasData.students) && gasData.students.length > 0) {
          StorageService.saveStudents(gasData.students);
        }
        if (gasData.responses && Object.keys(gasData.responses).length > 0) {
          StorageService.saveResponses(gasData.responses);
        }
        if (gasData.settings) {
          const now = new Date().toISOString();
          const updatedSettings = {
            ...settings,
            ...gasData.settings,
            googleSheetsLastSync: now,
            googleSheetsConnected: true,
            gasConnected: true
          };
          StorageService.saveSettings(updatedSettings);
        } else {
          const now = new Date().toISOString();
          StorageService.saveSettings({
            ...settings,
            googleSheetsLastSync: now,
            googleSheetsConnected: true,
            gasConnected: true
          });
        }
        // Send fresh state to server
        await syncToServer();

        return {
          success: true,
          message: `Google Sheet-ээс ${gasData.students?.length || 0} сурагч, ${gasData.teachers?.length || 0} багшийн өгөгдлийг амжилттай татлаа!`,
          count: {
            students: gasData.students?.length || 0,
            classes: gasData.classes?.length || 0,
            teachers: gasData.teachers?.length || 0
          }
        };
      }
    } catch (gasErr: any) {
      console.warn('[Storage] GAS cloud load notice:', gasErr);
    }
  }

  // 3. Fallback: Google Sheets Direct API if token available
  const token = GoogleSheetsService.getAccessToken();
  const sheetId = settings.googleSheetsSpreadsheetId || TARGET_SPREADSHEET_ID;
  if (token && sheetId) {
    try {
      const sheetData = await GoogleSheetsService.loadAllFromSheet(sheetId);
      if (sheetData) {
        if (sheetData.classes.length > 0) StorageService.saveClasses(sheetData.classes);
        if (sheetData.teachers.length > 0) StorageService.saveTeachers(sheetData.teachers);
        if (sheetData.students.length > 0) StorageService.saveStudents(sheetData.students);
        if (Object.keys(sheetData.responses).length > 0) StorageService.saveResponses(sheetData.responses);
        await syncToServer();
        return {
          success: true,
          message: `Google Sheet-ээс ${sheetData.students.length} сурагч, ${sheetData.teachers.length} багшийн өгөгдлийг амжилттай татлаа!`,
          count: {
            students: sheetData.students.length,
            classes: sheetData.classes.length,
            teachers: sheetData.teachers.length
          }
        };
      }
    } catch (sheetErr: any) {
      console.warn('[Storage] Google Sheet direct load notice:', sheetErr);
    }
  }

  // 4. Universal Zero-Config Google Sheet Public Pull (Reads live Google Sheet on any device without tokens)
  if (sheetId) {
    try {
      const publicData = await GoogleSheetsService.loadAllFromPublicSheet(sheetId);
      if (publicData && (publicData.classes.length > 0 || publicData.students.length > 0)) {
        // Smart merge with local classes (e.g. preserve 12а Тэгшжаргал and add 7а Дулсам)
        const currentClasses = StorageService.getClasses();
        const classMap = new Map<string, SchoolClass>();
        currentClasses.forEach((c) => {
          if (c.name) classMap.set(c.name.trim().toUpperCase(), c);
        });
        publicData.classes.forEach((c) => {
          const key = c.name.trim().toUpperCase();
          if (classMap.has(key)) {
            classMap.set(key, { ...classMap.get(key)!, ...c });
          } else {
            classMap.set(key, c);
          }
        });
        const mergedClasses = Array.from(classMap.values());
        StorageService.saveClasses(mergedClasses);

        // Smart merge teachers
        const currentTeachers = StorageService.getTeachers();
        const teacherMap = new Map<string, Teacher>();
        currentTeachers.forEach((t) => {
          const key = (t.teacherCode || t.className).trim().toUpperCase();
          teacherMap.set(key, t);
        });
        publicData.teachers.forEach((t) => {
          const key = (t.teacherCode || t.className).trim().toUpperCase();
          if (teacherMap.has(key)) {
            teacherMap.set(key, { ...teacherMap.get(key)!, ...t });
          } else {
            teacherMap.set(key, t);
          }
        });
        const mergedTeachers = Array.from(teacherMap.values());
        StorageService.saveTeachers(mergedTeachers);

        // Smart merge students
        const currentStudents = StorageService.getStudents();
        const studentMap = new Map<string, Student>();
        currentStudents.forEach((s) => {
          const key = (s.studentCode || s.id).trim().toUpperCase();
          studentMap.set(key, s);
        });
        publicData.students.forEach((s) => {
          const key = (s.studentCode || s.id).trim().toUpperCase();
          if (studentMap.has(key)) {
            studentMap.set(key, { ...studentMap.get(key)!, ...s });
          } else {
            studentMap.set(key, s);
          }
        });
        const mergedStudents = Array.from(studentMap.values());
        StorageService.saveStudents(mergedStudents);

        if (Object.keys(publicData.responses).length > 0) {
          const currentResponses = StorageService.getAllResponses();
          Object.assign(currentResponses, publicData.responses);
          StorageService.saveResponses(currentResponses);
        }

        const now = new Date().toISOString();
        const updatedSettings = {
          ...settings,
          googleSheetsLastSync: now,
          googleSheetsConnected: true
        };
        StorageService.saveSettings(updatedSettings);
        await syncToServer();

        return {
          success: true,
          message: `Google Sheet-ээс ${mergedStudents.length} сурагч, ${mergedClasses.length} ангийн өгөгдлийг амжилттай татаж синк хийлээ!`,
          count: {
            students: mergedStudents.length,
            classes: mergedClasses.length,
            teachers: mergedTeachers.length
          }
        };
      }
    } catch (publicErr) {
      console.warn('[Storage] Public Sheet sync notice:', publicErr);
    }
  }

  return {
    success: true,
    message: 'Серверээс өгөгдлийг амжилттай шинэчиллээ.'
  };
}

export async function syncAllToCloudDatabase(): Promise<{ success: boolean; message: string }> {
  const settings = StorageService.getSettings();
  const classes = StorageService.getClasses();
  const teachers = StorageService.getTeachers();
  const students = StorageService.getStudents();
  const responses = StorageService.getAllResponses();

  // 1. Send to local backend server
  await syncToServer();

  // 2. Push to Google Sheet via GAS
  const gasUrl = settings.gasWebAppUrl || 'https://script.google.com/macros/s/AKfycbyEvEUw_eDk6IMbXeQw1zNVBgaIXUnS58mF556BRB07ENsiM3uNzsj_HobIe0r5pXIc/exec';
  try {
    const res = await GasService.syncAllToGas(gasUrl, {
      classes,
      teachers,
      students,
      responses,
      settings
    });
    const now = new Date().toISOString();
    const updated = {
      ...settings,
      gasConnected: true,
      googleSheetsConnected: true,
      googleSheetsLastSync: now
    };
    StorageService.saveSettings(updated);
    await syncToServer();
    return {
      success: true,
      message: res.message || `Google Sheet рүү нийт ${classes.length} анги, ${students.length} сурагчийн өгөгдөл амжилттай синк хийгдлээ!`
    };
  } catch (err: any) {
    const token = GoogleSheetsService.getAccessToken();
    const sheetId = settings.googleSheetsSpreadsheetId || TARGET_SPREADSHEET_ID;
    if (token && sheetId) {
      await GoogleSheetsService.syncAllToSheet(sheetId, classes, teachers, students, responses, settings);
      const now = new Date().toISOString();
      const updated = {
        ...settings,
        googleSheetsConnected: true,
        googleSheetsLastSync: now
      };
      StorageService.saveSettings(updated);
      await syncToServer();
      return {
        success: true,
        message: `Google Sheet рүү нийт ${classes.length} анги, ${students.length} сурагчийн өгөгдөл амжилттай синк хийгдлээ!`
      };
    }
    throw err;
  }
}

export async function syncToServer(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return false;
  if (isSyncing) return false;
  try {
    isSyncing = true;
    const payload = {
      classes: safeGet(STORAGE_KEYS.CLASSES, []),
      teachers: safeGet(STORAGE_KEYS.TEACHERS, []),
      students: safeGet(STORAGE_KEYS.STUDENTS, []),
      responses: safeGet(STORAGE_KEYS.RESPONSES, {}),
      settings: safeGet(STORAGE_KEYS.SETTINGS, null),
      logs: safeGet(STORAGE_KEYS.LOGS, [])
    };
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    console.warn('[Sync] Failed to post to server:', err);
    return false;
  } finally {
    isSyncing = false;
  }
}

let autoSyncTimer: any = null;
let isAutoSyncRunning = false;

export async function executeAutoSync(actionType = 'DATA_CHANGE') {
  if (isAutoSyncRunning) return;
  try {
    isAutoSyncRunning = true;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:autosync_start', { detail: { action: actionType } }));
    }

    // 1. Sync to local backend server (db.json)
    await syncToServer();

    const settings = StorageService.getSettings();
    const classes = StorageService.getClasses();
    const teachers = StorageService.getTeachers();
    const students = StorageService.getStudents();
    const responses = StorageService.getAllResponses();

    const targetSheetId = settings.googleSheetsSpreadsheetId || TARGET_SPREADSHEET_ID;

    // 2. Direct Google Sheets Sync if token available
    const token = GoogleSheetsService.getAccessToken();
    if (token && targetSheetId) {
      try {
        await GoogleSheetsService.syncAllToSheet(targetSheetId, classes, teachers, students, responses, settings);
        settings.googleSheetsLastSync = new Date().toISOString();
        safeSet(STORAGE_KEYS.SETTINGS, settings);
      } catch (sheetErr) {
        console.warn('[AutoSync] Google Sheet direct sync notice:', sheetErr);
      }
    }

    // 3. GAS Sync if connected
    if (settings.gasWebAppUrl && settings.gasConnected) {
      try {
        await GasService.syncAllToGas(settings.gasWebAppUrl, {
          classes,
          teachers,
          students,
          responses,
          settings
        });
      } catch (gasErr) {
        console.warn('[AutoSync] GAS sync notice:', gasErr);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app:autosync_done', {
          detail: {
            action: actionType,
            timestamp: new Date().toISOString(),
            sheetId: targetSheetId
          }
        })
      );
    }
  } catch (err) {
    console.warn('[AutoSync] Notice:', err);
  } finally {
    isAutoSyncRunning = false;
  }
}

export function triggerAutoSync(actionType = 'DATA_CHANGE', debounceMs = 500) {
  if (autoSyncTimer) clearTimeout(autoSyncTimer);
  autoSyncTimer = setTimeout(() => {
    executeAutoSync(actionType);
  }, debounceMs);
}

export const StorageService = {
  syncFromServer,
  syncToServer,
  loadAllFromCloudDatabase,
  syncAllToCloudDatabase,
  triggerAutoSync,
  executeAutoSync,
  getSettings(): SystemSettings {

    const data = safeGet<SystemSettings | null>(STORAGE_KEYS.SETTINGS, null);
    if (!data) {
      safeSet(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
      return INITIAL_SETTINGS;
    }
    // Automatically bind the target sheet ID if missing or empty
    if (!data.googleSheetsSpreadsheetId) {
      data.googleSheetsSpreadsheetId = TARGET_SPREADSHEET_ID;
      data.googleSheetsUrl = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit`;
      data.googleSheetsConnected = true;
      safeSet(STORAGE_KEYS.SETTINGS, data);
    }
    // Хуучин төхөөрөмж дээр GAS URL хоосон бол автоматаар бэхэлсэн URL-аар дүүргэнэ
    if (!data.gasWebAppUrl) {
      data.gasWebAppUrl = DEFAULT_GAS_URL;
      data.gasConnected = true;
      safeSet(STORAGE_KEYS.SETTINGS, data);
    }
    return data;
  },

  saveSettings(settings: SystemSettings) {
    safeSet(STORAGE_KEYS.SETTINGS, settings);
    this.addLog('ADMIN', 'Администратор', 'SETTINGS_UPDATE', 'Системийн тохиргоо шинэчлэгдлээ');
    if (typeof fetch !== 'undefined') {
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      }).catch((e) => console.warn('Failed to sync settings to server:', e));
    }
    triggerAutoSync('SETTINGS_UPDATE');
  },

  getClasses(): SchoolClass[] {
    const data = safeGet<SchoolClass[] | null>(STORAGE_KEYS.CLASSES, null);
    if (!data) {
      safeSet(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
      return INITIAL_CLASSES;
    }
    return data;
  },

  saveClasses(classes: SchoolClass[]): void {
    safeSet(STORAGE_KEYS.CLASSES, classes);
    triggerAutoSync('CLASSES_SAVED');
  },

  saveTeachers(teachers: Teacher[]): void {
    safeSet(STORAGE_KEYS.TEACHERS, teachers);
    triggerAutoSync('TEACHERS_SAVED');
  },

  saveStudents(students: Student[]): void {
    safeSet(STORAGE_KEYS.STUDENTS, students);
    triggerAutoSync('STUDENTS_SAVED');
  },

  saveResponses(responses: Record<string, Record<string, string>>): void {
    safeSet(STORAGE_KEYS.RESPONSES, responses);
    triggerAutoSync('RESPONSES_SAVED');
  },

  addClass(newClass: Omit<SchoolClass, 'id'>): SchoolClass {
    const classes = this.getClasses();
    const cleanLatinName = normalizeCode(newClass.name) || 'CLASS';
    const id = 'CLS_' + cleanLatinName + '_' + Date.now();
    const created: SchoolClass = { ...newClass, id };
    classes.push(created);
    safeSet(STORAGE_KEYS.CLASSES, classes);

    // Also register teacher
    const teachers = this.getTeachers();
    const tId = 'TCH_' + Date.now();
    teachers.push({
      id: tId,
      name: newClass.teacherName || `${newClass.name} Ангийн багш`,
      teacherCode: newClass.teacherCode,
      classId: id,
      className: newClass.name
    });
    safeSet(STORAGE_KEYS.TEACHERS, teachers);
    this.addLog('ADMIN', 'Администратор', 'CLASS_CREATE', `${newClass.name} анги болон код (${newClass.teacherCode}) үүслээ`);
    triggerAutoSync('CLASS_CREATE');
    return created;
  },

  bulkAddTeachers(
    items: {
      className: string;
      teacherName: string;
      teacherCode?: string;
      grade?: number;
      phone?: string;
      password?: string;
    }[],
    actorRole: 'ADMIN' = 'ADMIN',
    actorName: string = 'Администратор'
  ): { createdCount: number; updatedCount: number; list: { schoolClass: SchoolClass; teacher: Teacher }[] } {
    const classes = this.getClasses();
    const teachers = this.getTeachers();
    const settings = this.getSettings();

    let createdCount = 0;
    let updatedCount = 0;
    const resultList: { schoolClass: SchoolClass; teacher: Teacher }[] = [];

    items.forEach((item, idx) => {
      const rawName = item.className.trim();
      if (!rawName) return;

      const normClass = normalizeCode(rawName) || `CLS${idx + 1}`;
      // Auto-extract grade if not specified
      let grade = item.grade;
      if (!grade) {
        const match = rawName.match(/^(\d+)/);
        grade = match ? parseInt(match[1], 10) : 7;
      }

      // Auto-extract section letter
      const sectionLetter = rawName.replace(/^[\d\s\-_]+/, '').trim() || 'А';
      const teacherCode = (item.teacherCode && item.teacherCode.trim())
        ? item.teacherCode.trim().toUpperCase()
        : ('TEACH-' + normClass);
      const teacherName = item.teacherName.trim() || `${rawName} Ангийн багш`;
      const phone = item.phone?.trim() || '';
      const password = (item.password && item.password.trim()) ? item.password.trim() : teacherCode;

      // Check if class already exists by name or normalized code
      const existingClassIndex = classes.findIndex(
        (c) => c.name.trim().toUpperCase() === rawName.toUpperCase() || normalizeCode(c.name) === normClass
      );

      let targetClass: SchoolClass;
      if (existingClassIndex >= 0) {
        classes[existingClassIndex] = {
          ...classes[existingClassIndex],
          name: rawName,
          grade,
          sectionLetter,
          teacherName,
          teacherCode
        };
        targetClass = classes[existingClassIndex];
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
          academicYear: settings.academicYear || '2025-2026',
          schoolName: settings.schoolName || 'Сургууль'
        };
        classes.push(targetClass);
        createdCount++;
      }

      // Check if teacher already exists for this class
      const existingTeacherIndex = teachers.findIndex(
        (t) =>
          t.classId === targetClass.id ||
          t.className.trim().toUpperCase() === rawName.toUpperCase() ||
          normalizeCode(t.className) === normClass ||
          t.teacherCode.toUpperCase() === teacherCode.toUpperCase()
      );

      let targetTeacher: Teacher;
      if (existingTeacherIndex >= 0) {
        teachers[existingTeacherIndex] = {
          ...teachers[existingTeacherIndex],
          name: teacherName,
          teacherCode,
          classId: targetClass.id,
          className: rawName,
          phone: phone || teachers[existingTeacherIndex].phone,
          password: password || teachers[existingTeacherIndex].password || teacherCode
        };
        targetTeacher = teachers[existingTeacherIndex];
      } else {
        targetTeacher = {
          id: 'TCH_' + (Date.now() + idx),
          name: teacherName,
          teacherCode,
          classId: targetClass.id,
          className: rawName,
          phone,
          password
        };
        teachers.push(targetTeacher);
      }

      resultList.push({ schoolClass: targetClass, teacher: targetTeacher });
    });

    safeSet(STORAGE_KEYS.CLASSES, classes);
    safeSet(STORAGE_KEYS.TEACHERS, teachers);

    this.addLog(
      actorRole,
      actorName,
      'BULK_TEACHER_IMPORT',
      `Багш нарыг олноор бүртгэлээ: ${createdCount} шинэ анги/багш үүсгэж, ${updatedCount} багшийн мэдээллийг шинэчлэв`
    );

    triggerAutoSync('BULK_TEACHER_IMPORT');
    return { createdCount, updatedCount, list: resultList };
  },

  getTeachers(): Teacher[] {
    const data = safeGet<Teacher[] | null>(STORAGE_KEYS.TEACHERS, null);
    if (!data) {
      safeSet(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
      return INITIAL_TEACHERS;
    }
    return data;
  },

  getStudents(classId?: string): Student[] {
    let list = safeGet<Student[] | null>(STORAGE_KEYS.STUDENTS, null);
    if (!list) {
      list = INITIAL_STUDENTS;
      safeSet(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    }
    if (classId) {
      return list.filter((s) => s.classId === classId);
    }
    return list;
  },

  addStudent(studentData: { classId: string; className: string; fullName: string; gender?: '1' | '2' }): Student {
    const students = this.getStudents();
    const inClassCount = students.filter((s) => s.classId === studentData.classId).length;
    const cleanClass = normalizeCode(studentData.className) || 'STU';
    const studentCode = cleanClass + ('000' + (inClassCount + 1)).slice(-3);

    // 6-char random password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let password = '';
    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const newStudent: Student = {
      id: 'STU_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      classId: studentData.classId,
      className: studentData.className,
      studentCode,
      password,
      fullName: studentData.fullName,
      gender: studentData.gender || '1',
      isSubmitted: false
    };

    students.push(newStudent);
    safeSet(STORAGE_KEYS.STUDENTS, students);
    this.addLog('TEACHER', studentData.className, 'STUDENT_ADD', `${newStudent.fullName} (${newStudent.studentCode}) нэмэгдлээ`);

    const settings = this.getSettings();
    if (settings.gasWebAppUrl) {
      GasService.registerStudent(settings.gasWebAppUrl, {
        studentCode: newStudent.studentCode,
        className: newStudent.className,
        fullName: newStudent.fullName,
        gender: newStudent.gender,
        password: newStudent.password
      }).catch((err) => console.warn('[Storage] Immediate GAS student registration warning:', err));
    }

    triggerAutoSync('STUDENT_ADD');
    return newStudent;
  },

  upsertSingleStudent(student: Student): void {
    const students = this.getStudents();
    const idx = students.findIndex((s) => s.id === student.id || s.studentCode.toUpperCase() === student.studentCode.toUpperCase());
    if (idx >= 0) {
      students[idx] = { ...students[idx], ...student };
    } else {
      students.push(student);
    }
    safeSet(STORAGE_KEYS.STUDENTS, students);
  },

  bulkAddStudents(
    classId: string,
    className: string,
    names: { name: string; gender?: '1' | '2' }[]
  ): Student[] {
    const students = this.getStudents();
    const existingInClass = students.filter((s) => s.classId === classId).length;
    const cleanClass = normalizeCode(className) || 'STU';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    const createdList: Student[] = [];
    names.forEach((item, idx) => {
      let password = '';
      for (let i = 0; i < 6; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const sCode = cleanClass + ('000' + (existingInClass + idx + 1)).slice(-3);
      const student: Student = {
        id: 'STU_' + (Date.now() + idx),
        classId,
        className,
        studentCode: sCode,
        password,
        fullName: item.name,
        gender: item.gender || '1',
        isSubmitted: false
      };
      createdList.push(student);
      students.push(student);
    });

    safeSet(STORAGE_KEYS.STUDENTS, students);
    this.addLog('TEACHER', className, 'BULK_IMPORT', `${createdList.length} сурагч бөөнөөр бүртгэгдлээ`);
    triggerAutoSync('BULK_STUDENT_IMPORT');
    return createdList;
  },

  getAllResponses(): Record<string, Record<string, string>> {
    const data = safeGet<Record<string, Record<string, string>> | null>(STORAGE_KEYS.RESPONSES, null);
    if (!data) {
      safeSet(STORAGE_KEYS.RESPONSES, INITIAL_RESPONSES);
      return INITIAL_RESPONSES;
    }
    return data;
  },

  getStudentResponses(studentId: string): Record<string, string> {
    const all = this.getAllResponses();
    return all[studentId] || {};
  },

  saveStudentDraft(studentId: string, answers: Record<string, string>) {
    const all = this.getAllResponses();
    all[studentId] = { ...(all[studentId] || {}), ...answers };
    safeSet(STORAGE_KEYS.RESPONSES, all);
  },

  async submitStudentSurvey(studentId: string, answers: Record<string, string>): Promise<{ success: boolean; message: string }> {
    const settings = this.getSettings();
    if (!settings.surveyOpen) {
      return { success: false, message: 'Судалгаа одоогоор хаагдсан байна.' };
    }

    const students = this.getStudents();
    let stIndex = students.findIndex((s) => s.id === studentId || s.studentCode === studentId);
    
    // Fallback: If student logged in directly from cloud on this device
    if (stIndex === -1) {
      const session = this.getSession();
      if (session && (session.studentCode === studentId || session.userId === studentId)) {
        const fallbackStudent: Student = {
          id: session.userId,
          classId: session.classId || '',
          className: session.className || 'Тодорхойгүй анги',
          studentCode: session.studentCode || studentId,
          password: '******',
          fullName: session.userName,
          gender: '1',
          isSubmitted: false
        };
        students.push(fallbackStudent);
        stIndex = students.length - 1;
      } else {
        return { success: false, message: 'Сурагчийн мэдээлэл олдсонгүй.' };
      }
    }

    const student = students[stIndex];

    // Check if the student's class risk assessment is locked/concluded
    const classes = this.getClasses();
    const studentClass = classes.find((c) => c.id === student.classId || c.name === student.className);
    if (studentClass?.isLocked) {
      return {
        success: false,
        message: `${studentClass.name} ангийн эрсдэлийн үнэлгээ дууссан тул дахин судалгаа авах боломжгүй хаагдсан байна.`
      };
    }

    if (student.isSubmitted && !student.canRetake) {
      return { success: false, message: 'Судалгаа өмнө нь илгээгдсэн тул дахин өөрчлөх боломжгүй.' };
    }

    // Save final answers
    const all = this.getAllResponses();
    all[student.id] = answers;
    safeSet(STORAGE_KEYS.RESPONSES, all);

    // Calculate risk
    const risk = evaluateStudentRisk(student, answers);
    student.isSubmitted = true;
    student.submittedAt = new Date().toISOString();
    student.canRetake = false;
    student.riskLevel = risk.level;
    student.riskScore = risk.totalScore;

    students[stIndex] = student;
    safeSet(STORAGE_KEYS.STUDENTS, students);
    this.addLog('STUDENT', student.fullName, 'SUBMIT_SURVEY', `${student.studentCode} судалгаагаа илгээлээ (Эрсдэл: ${risk.level})`);

    // Sync to GAS immediately
    if (settings.gasWebAppUrl) {
      try {
        const gasRes = await GasService.appendStudentSurvey(
          settings.gasWebAppUrl,
          student,
          answers,
          risk.level,
          risk.totalScore
        );
        if (gasRes && !gasRes.success) {
          console.warn('[Storage] GAS append notice:', gasRes.message);
        }
      } catch (err) {
        console.warn('[Storage] GAS append warning:', err);
      }
    }

    // Sync to Google Sheet if configured
    if (settings.googleSheetsSpreadsheetId) {
      GoogleSheetsService.appendStudentResponse(
        settings.googleSheetsSpreadsheetId,
        student,
        answers,
        risk.level,
        risk.totalScore
      ).catch((err) => console.warn('[Storage] Google Sheet append warning:', err));
    }

    triggerAutoSync('SUBMIT_SURVEY');
    return { success: true, message: 'Судалгааны хариулт амжилттай хадгалагдлаа!' };
  },

  allowRetake(
    studentId: string,
    allow: boolean,
    actorRole: 'ADMIN' | 'TEACHER' = 'ADMIN',
    actorName: string = 'Администратор'
  ): { success: boolean; message?: string } {
    const students = this.getStudents();
    const st = students.find((s) => s.id === studentId || s.studentCode === studentId);
    if (st) {
      if (allow) {
        const classes = this.getClasses();
        const studentClass = classes.find((c) => c.id === st.classId || c.name === st.className);
        if (studentClass?.isLocked) {
          return {
            success: false,
            message: `${studentClass.name} ангийн эрсдэлийн үнэлгээ дууссан тул дахин өгөх эрх олгох боломжгүй. Эхлээд ангийн төлөвийг нээнэ үү.`
          };
        }
      }

      st.canRetake = allow;
      if (allow) {
        st.isSubmitted = false;
      }
      safeSet(STORAGE_KEYS.STUDENTS, students);
      this.addLog(
        actorRole,
        actorName,
        'ALLOW_RETAKE',
        `${st.studentCode} (${st.fullName}) сурагчид дахин бөглөх эрх: ${allow ? 'Олгосон' : 'Цуцалсан'}`
      );
      triggerAutoSync('ALLOW_RETAKE');
      return { success: true };
    }
    return { success: false, message: 'Сурагч олдсонгүй' };
  },

  updateStudent(
    studentId: string,
    updates: Partial<Student>,
    actorRole: 'ADMIN' | 'TEACHER' = 'ADMIN',
    actorName: string = 'Администратор'
  ): Student | null {
    const students = this.getStudents();
    const idx = students.findIndex((s) => s.id === studentId || s.studentCode === studentId);
    if (idx === -1) return null;
    students[idx] = { ...students[idx], ...updates };
    safeSet(STORAGE_KEYS.STUDENTS, students);
    this.addLog(
      actorRole,
      actorName,
      'UPDATE_STUDENT',
      `${students[idx].fullName} (${students[idx].studentCode}) сурагчийн мэдээлэл шинэчлэгдлээ`
    );
    triggerAutoSync('UPDATE_STUDENT');
    return students[idx];
  },

  deleteStudent(
    studentId: string,
    actorRole: 'ADMIN' = 'ADMIN',
    actorName: string = 'Администратор'
  ): boolean {
    const students = this.getStudents();
    const st = students.find((s) => s.id === studentId || s.studentCode === studentId);
    if (!st) return false;

    const remaining = students.filter((s) => s.id !== st.id && s.studentCode !== st.studentCode);
    safeSet(STORAGE_KEYS.STUDENTS, remaining);

    // Clean up responses and drafts
    const responses = this.getAllResponses();
    if (responses[st.id]) {
      delete responses[st.id];
      safeSet(STORAGE_KEYS.RESPONSES, responses);
    }
    if (responses[st.studentCode]) {
      delete responses[st.studentCode];
      safeSet(STORAGE_KEYS.RESPONSES, responses);
    }
    safeRemove(`survey_draft_${st.id}`);
    safeRemove(`survey_draft_${st.studentCode}`);

    this.addLog(
      actorRole,
      actorName,
      'DELETE_STUDENT',
      `${st.fullName} (${st.studentCode}, ${st.className}) сурагчийн бүртгэл болон судалгааны өгөгдлийг устгалаа`
    );
    triggerAutoSync('DELETE_STUDENT');
    return true;
  },

  deleteMultipleStudents(
    studentIds: string[],
    actorRole: 'ADMIN' = 'ADMIN',
    actorName: string = 'Администратор'
  ): number {
    if (!studentIds || studentIds.length === 0) return 0;
    const targetSet = new Set(studentIds);
    const students = this.getStudents();
    const toDelete = students.filter((s) => targetSet.has(s.id) || targetSet.has(s.studentCode));
    if (toDelete.length === 0) return 0;

    const deleteIds = new Set(toDelete.map((s) => s.id));
    const deleteCodes = new Set(toDelete.map((s) => s.studentCode));

    const remaining = students.filter((s) => !deleteIds.has(s.id) && !deleteCodes.has(s.studentCode));
    safeSet(STORAGE_KEYS.STUDENTS, remaining);

    // Clean up responses and drafts
    const responses = this.getAllResponses();
    let responsesChanged = false;
    for (const st of toDelete) {
      if (responses[st.id]) {
        delete responses[st.id];
        responsesChanged = true;
      }
      if (responses[st.studentCode]) {
        delete responses[st.studentCode];
        responsesChanged = true;
      }
      safeRemove(`survey_draft_${st.id}`);
      safeRemove(`survey_draft_${st.studentCode}`);
    }
    if (responsesChanged) {
      safeSet(STORAGE_KEYS.RESPONSES, responses);
    }

    const summaryNames = toDelete.slice(0, 3).map((s) => s.fullName).join(', ');
    const moreCount = toDelete.length > 3 ? ` зэрэг нийт ${toDelete.length}` : ` (${toDelete.length})`;
    this.addLog(
      actorRole,
      actorName,
      'DELETE_STUDENT',
      `${summaryNames}${moreCount} сурагчдын бүртгэл болон судалгааны өгөгдлийг олноор нь устгалаа`
    );
    triggerAutoSync('DELETE_MULTIPLE_STUDENTS');
    return toDelete.length;
  },

  deleteTeacher(
    teacherId: string,
    actorRole: 'ADMIN' = 'ADMIN',
    actorName: string = 'Администратор'
  ): boolean {
    const teachers = this.getTeachers();
    const tch = teachers.find((t) => t.id === teacherId || t.teacherCode === teacherId);
    if (!tch) return false;

    const remaining = teachers.filter((t) => t.id !== tch.id && t.teacherCode !== tch.teacherCode);
    safeSet(STORAGE_KEYS.TEACHERS, remaining);

    this.addLog(
      actorRole,
      actorName,
      'DELETE_TEACHER',
      `${tch.name} (${tch.teacherCode}, ${tch.className || 'Ангигүй'}) багшийн эрхийг устгалаа`
    );
    triggerAutoSync('DELETE_TEACHER');
    return true;
  },

  updateClass(
    classId: string,
    updates: Partial<SchoolClass>,
    actorRole: 'ADMIN' = 'ADMIN',
    actorName: string = 'Администратор'
  ): SchoolClass | null {
    const classes = this.getClasses();
    const idx = classes.findIndex((c) => c.id === classId || c.name === classId);
    if (idx === -1) return null;
    classes[idx] = { ...classes[idx], ...updates };
    safeSet(STORAGE_KEYS.CLASSES, classes);
    this.addLog(
      actorRole,
      actorName,
      'UPDATE_CLASS',
      `${classes[idx].name} ангийн мэдээлэл шинэчлэгдлээ`
    );
    triggerAutoSync('UPDATE_CLASS');
    return classes[idx];
  },

  deleteClass(
    classId: string,
    actorRole: 'ADMIN' = 'ADMIN',
    actorName: string = 'Администратор'
  ): boolean {
    const classes = this.getClasses();
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return false;

    const remaining = classes.filter((c) => c.id !== cls.id);
    safeSet(STORAGE_KEYS.CLASSES, remaining);

    // Also remove associated teacher
    const teachers = this.getTeachers();
    const remainingTeachers = teachers.filter(
      (t) => t.classId !== cls.id && t.teacherCode !== cls.teacherCode
    );
    safeSet(STORAGE_KEYS.TEACHERS, remainingTeachers);

    this.addLog(
      actorRole,
      actorName,
      'DELETE_CLASS',
      `${cls.name} анги болон холбогдох багшийн бүртгэлийг устгалаа`
    );
    triggerAutoSync('DELETE_CLASS');
    return true;
  },

  toggleClassLock(
    classId: string,
    isLocked: boolean,
    actorRole: 'ADMIN' | 'TEACHER' = 'ADMIN',
    actorName: string = 'Администратор'
  ): { success: boolean; message: string; updatedClass?: SchoolClass } {
    const classes = this.getClasses();
    const cls = classes.find((c) => c.id === classId || c.name === classId);
    if (!cls) {
      return { success: false, message: 'Анги олдсонгүй' };
    }

    cls.isLocked = isLocked;
    cls.lockedAt = isLocked ? new Date().toISOString() : undefined;
    safeSet(STORAGE_KEYS.CLASSES, classes);

    const logAction = isLocked ? 'CLASS_LOCKED' : 'CLASS_UNLOCKED';
    const logDetails = isLocked
      ? `${cls.name} ангийн эрсдэлийн үнэлгээг ДУУССАН гэж тэмдэглэн дахин судалгаа авах боломжгүйгээр хаалаа.`
      : `${cls.name} ангийн эрсдэлийн үнэлгээг дахин нээж, судалгаа бөглөх боломжтой болголоо.`;

    this.addLog(actorRole, actorName, logAction, logDetails);
    triggerAutoSync('CLASS_LOCK');

    return {
      success: true,
      message: logDetails,
      updatedClass: cls
    };
  },

  getSession(): ActiveSession | null {
    return safeGet<ActiveSession | null>(STORAGE_KEYS.SESSION, null);
  },

  setSession(session: ActiveSession) {
    safeSet(STORAGE_KEYS.SESSION, session);
  },

  clearSession() {
    safeRemove(STORAGE_KEYS.SESSION);
  },

  getLogs(): SystemLog[] {
    return safeGet<SystemLog[]>(STORAGE_KEYS.LOGS, []);
  },

  addLog(userRole: string, userName: string, action: string, details: string) {
    const logs = this.getLogs();
    logs.unshift({
      id: 'LOG_' + Date.now(),
      timestamp: new Date().toISOString(),
      userRole,
      userName,
      action,
      details
    });
    // Keep last 100
    safeSet(STORAGE_KEYS.LOGS, logs.slice(0, 100));
  },

  async syncSurveyToGas(gasUrl: string, student: Student, answers: Record<string, string>) {
    try {
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'saveSurveyAnswers',
          studentId: student.id,
          answers,
          isFinalSubmit: true,
          token: 'offline_sync_token'
        })
      });
    } catch (err) {
      console.warn('Google Apps Script background sync notice:', err);
    }
  }
};
