import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../firebaseConfig';
import { SchoolClass, Student, Teacher, SystemSettings } from '../types';

// Initialize Firebase App if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// Provider with Google Workspace Scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory access token cache (MANDATORY: Never in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google нэвтрэлт амжилтгүй боллоо (Access token олдсонгүй).');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getCurrentGoogleUser = (): User | null => {
  return auth.currentUser;
};

// ==========================================
// Google Sheets API Helpers (v4)
// ==========================================

const SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

export function parseCSVText(text: string): string[][] {
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
        i++; // skip escaped quote
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

interface CreateSpreadsheetResponse {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

export const GoogleSheetsService = {
  getAuthStatus(): boolean {
    return Boolean(cachedAccessToken);
  },

  getAccessToken(): string | null {
    return cachedAccessToken;
  },

  /**
   * Ensure that required tabs (Багш_Ангиуд, Сурагчид, Судалгааны_Хариултууд, Тохиргоо) exist.
   * If any tab is missing, create it automatically.
   */
  async ensureSheetsExist(spreadsheetId: string, token: string): Promise<void> {
    const res = await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}?fields=sheets.properties`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Google Sheet мэдээлэл авахад алдаа гарлаа. Sheet-ийн хандах эрхийг шалгана уу.');
    }

    const data = await res.json();
    const existingTitles = new Set<string>(
      (data.sheets || []).map((s: any) => (s.properties?.title || '').trim())
    );

    const required = ['Багш_Ангиуд', 'Сурагчид', 'Судалгааны_Хариултууд', 'Тохиргоо'];
    const missing = required.filter((title) => !existingTitles.has(title));

    if (missing.length > 0) {
      const requests = missing.map((title) => ({
        addSheet: {
          properties: {
            title,
            gridProperties: {
              rowCount: title === 'Судалгааны_Хариултууд' ? 5000 : title === 'Сурагчид' ? 2000 : 500,
              columnCount: 20
            }
          }
        }
      }));

      const addRes = await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      });

      if (!addRes.ok) {
        const err = await addRes.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Google Sheet дээр шаардлагатай хуудсуудыг үүсгэхэд алдаа гарлаа.');
      }

      // Initialize headers for newly created sheets
      await this.initSheetHeaders(spreadsheetId, token);
    }
  },

  /**
   * Create a new Google Spreadsheet with structured tabs
   */
  async createCentralDatabaseSheet(title?: string): Promise<CreateSpreadsheetResponse> {
    const token = cachedAccessToken;
    if (!token) throw new Error('Эхлээд Google дансаараа нэвтэрнэ үү.');

    const sheetTitle = title || `Суралцагчийн эрсдлийн үнэлгээ - Төв Сан (${new Date().toLocaleDateString()})`;

    const body = {
      properties: {
        title: sheetTitle
      },
      sheets: [
        {
          properties: {
            title: 'Багш_Ангиуд',
            gridProperties: { rowCount: 1000, columnCount: 10 }
          }
        },
        {
          properties: {
            title: 'Сурагчид',
            gridProperties: { rowCount: 2000, columnCount: 12 }
          }
        },
        {
          properties: {
            title: 'Судалгааны_Хариултууд',
            gridProperties: { rowCount: 5000, columnCount: 30 }
          }
        },
        {
          properties: {
            title: 'Тохиргоо',
            gridProperties: { rowCount: 20, columnCount: 5 }
          }
        }
      ]
    };

    const res = await fetch(SHEETS_BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Google Sheet үүсгэхэд алдаа гарлаа.');
    }

    const created = await res.json();
    const spreadsheetId = created.spreadsheetId;
    const spreadsheetUrl = created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // Initialize Headers
    await this.initSheetHeaders(spreadsheetId, token);

    return {
      spreadsheetId,
      spreadsheetUrl
    };
  },

  /**
   * Initialize table headers with clear Mongolian column names (using single quotes for sheet names)
   */
  async initSheetHeaders(spreadsheetId: string, token: string): Promise<void> {
    const headerData = [
      {
        range: "'Багш_Ангиуд'!A1:G1",
        values: [['Анги', 'Ангийн багшийн нэр', 'Багшийн код', 'Утас', 'Хичээлийн жил', 'Сургууль', 'Бүртгэсэн огноо']]
      },
      {
        range: "'Сурагчид'!A1:J1",
        values: [['Сурагчийн код', 'Анги', 'Овог нэр', 'Хүйс', 'Нэвтрэх нууц үг', 'Төлөв', 'Эрсдлийн түвшин', 'Эрсдлийн оноо', 'Илгээсэн огноо', 'Шинэчилсэн огноо']]
      },
      {
        range: "'Судалгааны_Хариултууд'!A1:L1",
        values: [['Сурагчийн код', 'Анги', 'Овог нэр', 'Бөглөсөн цаг', 'Эрсдэл', 'Оноо', 'Нөлөөлсөн хүчин зүйлс', 'Ангийн багш', 'Сургууль', 'Хариулсан тоо', 'Нийт асуулт', 'Бүх хариулт (JSON)']]
      },
      {
        range: "'Тохиргоо'!A1:D2",
        values: [
          ['Сургуулийн нэр', 'Хичээлийн жил', 'Судалгаа нээлттэй эсэх', 'Сүүлд синк хийсэн'],
          ['Хөвсгөл аймгийн 1-р сургууль', '2025-2026', 'НЭЭЛТТЭЙ', new Date().toISOString()]
        ]
      }
    ];

    await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: headerData
      })
    });
  },

  /**
   * Export / Overwrite full data to the Google Sheet (requires user confirmation before calling)
   */
  async syncAllToSheet(
    spreadsheetId: string,
    classes: SchoolClass[],
    teachers: Teacher[],
    students: Student[],
    responses: Record<string, Record<string, string>>,
    settings: SystemSettings
  ): Promise<boolean> {
    const token = cachedAccessToken;
    if (!token) throw new Error('Google эрх шалгахад алдаа гарлаа. Эхлээд Google дансаараа нэвтэрнэ үү.');

    // CRITICAL: Ensure all tabs exist before writing ranges
    await this.ensureSheetsExist(spreadsheetId, token);

    // 1. Prepare Classes & Teachers rows
    const teacherRows: (string | number)[][] = [
      ['Анги', 'Ангийн багшийн нэр', 'Багшийн код', 'Утас', 'Хичээлийн жил', 'Сургууль', 'Бүртгэсэн огноо']
    ];

    classes.forEach((c) => {
      const t = teachers.find((tc) => tc.classId === c.id || tc.className === c.name);
      teacherRows.push([
        c.name,
        t?.name || c.teacherName || `${c.name} багш`,
        t?.teacherCode || c.teacherCode,
        t?.phone || '',
        c.academicYear || settings.academicYear || '',
        c.schoolName || settings.schoolName || '',
        new Date().toLocaleDateString()
      ]);
    });

    // 2. Prepare Students rows
    const studentRows: (string | number)[][] = [
      ['Сурагчийн код', 'Анги', 'Овог нэр', 'Хүйс', 'Нэвтрэх нууц үг', 'Төлөв', 'Эрсдлийн түвшин', 'Эрсдлийн оноо', 'Илгээсэн огноо', 'Шинэчилсэн огноо']
    ];

    students.forEach((s) => {
      studentRows.push([
        s.studentCode,
        s.className,
        s.fullName,
        s.gender === '1' ? 'Эм' : 'Эр',
        s.password,
        s.isSubmitted ? 'Судалгаа бөглөсөн' : 'Хүлээгдэж буй',
        s.riskLevel ? (s.riskLevel === 'high' ? 'Өндөр' : s.riskLevel === 'medium' ? 'Дунд' : 'Энгийн') : '-',
        s.riskScore ?? 0,
        s.submittedAt || '',
        new Date().toLocaleDateString()
      ]);
    });

    // 3. Prepare Survey Responses rows
    const responseRows: (string | number)[][] = [
      ['Сурагчийн код', 'Анги', 'Овог нэр', 'Бөглөсөн цаг', 'Эрсдэл', 'Оноо', 'Нөлөөлсөн хүчин зүйлс', 'Ангийн багш', 'Сургууль', 'Хариулсан тоо', 'Нийт асуулт', 'Бүх хариулт (JSON)']
    ];

    students.filter((s) => s.isSubmitted).forEach((s) => {
      const ans = responses[s.id] || {};
      const answeredCount = Object.keys(ans).length;
      responseRows.push([
        s.studentCode,
        s.className,
        s.fullName,
        s.submittedAt || new Date().toISOString(),
        s.riskLevel === 'high' ? 'Өндөр' : s.riskLevel === 'medium' ? 'Дунд' : 'Энгийн',
        s.riskScore ?? 0,
        '',
        '',
        settings.schoolName || '',
        answeredCount,
        143,
        JSON.stringify(ans)
      ]);
    });

    // Clear existing data in tabs first to prevent leftover rows
    try {
      await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}/values:batchClear`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ranges: [
            "'Багш_Ангиуд'!A1:Z1000",
            "'Сурагчид'!A1:Z5000",
            "'Судалгааны_Хариултууд'!A1:Z5000",
            "'Тохиргоо'!A1:Z20"
          ]
        })
      });
    } catch {
      // ignore clear error
    }

    // 4. Update Batch using sheet ranges starting at A1
    const payload = {
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: "'Багш_Ангиуд'!A1",
          values: teacherRows
        },
        {
          range: "'Сурагчид'!A1",
          values: studentRows
        },
        {
          range: "'Судалгааны_Хариултууд'!A1",
          values: responseRows
        },
        {
          range: "'Тохиргоо'!A1",
          values: [
            ['Сургуулийн нэр', 'Хичээлийн жил', 'Судалгаа нээлттэй эсэх', 'Сүүлд синк хийсэн'],
            [settings.schoolName, settings.academicYear, settings.surveyOpen ? 'НЭЭЛТТЭЙ' : 'ХААЛТТАЙ', new Date().toISOString()]
          ]
        }
      ]
    };

    const res = await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Google Sheet рүү өгөгдөл илгээхэд алдаа гарлаа.');
    }

    return true;
  },

  /**
   * Read all data from Google Sheet and parse into Classes, Teachers, Students, and Responses
   */
  async loadAllFromSheet(spreadsheetId: string): Promise<{
    classes: SchoolClass[];
    teachers: Teacher[];
    students: Student[];
    responses: Record<string, Record<string, string>>;
    settings: Partial<SystemSettings>;
  }> {
    const token = cachedAccessToken;
    if (!token) throw new Error('Google эрх шалгахад алдаа гарлаа. Эхлээд Google дансаараа нэвтэрнэ үү.');

    // Ensure all tabs exist before reading
    await this.ensureSheetsExist(spreadsheetId, token);

    const ranges = [
      "'Багш_Ангиуд'!A2:G500",
      "'Сурагчид'!A2:J2000",
      "'Судалгааны_Хариултууд'!A2:L5000",
      "'Тохиргоо'!A2:D2"
    ];

    const url = `${SHEETS_BASE_URL}/${spreadsheetId}/values:batchGet?ranges=${ranges.map((r) => encodeURIComponent(r)).join('&ranges=')}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Google Sheet-ээс өгөгдөл уншихад алдаа гарлаа.');
    }

    const data = await res.json();
    const [teacherData, studentData, responseData, settingsData] = data.valueRanges || [];

    // 1. Parse Classes & Teachers
    const classes: SchoolClass[] = [];
    const teachers: Teacher[] = [];

    (teacherData?.values || []).forEach((row: string[], idx: number) => {
      const className = (row[0] || '').trim();
      if (!className) return;

      const teacherName = (row[1] || `${className} багш`).trim();
      const teacherCode = (row[2] || `TEACH-${className.replace(/[^0-9A-Za-z]/g, '')}`).trim();
      const phone = (row[3] || '').trim();
      const year = (row[4] || '2025-2026').trim();
      const school = (row[5] || '').trim();

      const gradeMatch = className.match(/^(\d+)/);
      const grade = gradeMatch ? parseInt(gradeMatch[1], 10) : 7;
      const sectionLetter = className.replace(/^[\d\s\-_]+/, '').trim() || 'А';
      const classId = 'CLS_' + className.replace(/[^0-9A-Za-z]/g, '') + '_' + (idx + 1);
      const teacherId = 'TCH_' + className.replace(/[^0-9A-Za-z]/g, '') + '_' + (idx + 1);

      classes.push({
        id: classId,
        name: className,
        grade,
        sectionLetter,
        teacherId,
        teacherName,
        teacherCode,
        academicYear: year,
        schoolName: school
      });

      teachers.push({
        id: teacherId,
        name: teacherName,
        teacherCode,
        classId,
        className,
        phone
      });
    });

    // 2. Parse Students
    const students: Student[] = [];
    (studentData?.values || []).forEach((row: string[], idx: number) => {
      const studentCode = (row[0] || '').trim();
      const className = (row[1] || '').trim();
      const fullName = (row[2] || '').trim();
      if (!studentCode || !fullName) return;

      const gender = (row[3] || '').toLowerCase().includes('эм') ? '1' : '2';
      const password = (row[4] || '').trim();
      const isSubmitted = (row[5] || '').includes('бөглөсөн') || Boolean(row[8]);
      const riskText = (row[6] || '').trim();
      let riskLevel: 'low' | 'medium' | 'high' | undefined = undefined;
      if (riskText.includes('Өндөр')) riskLevel = 'high';
      else if (riskText.includes('Дунд')) riskLevel = 'medium';
      else if (riskText.includes('Энгийн')) riskLevel = 'low';

      const riskScore = parseInt(row[7] || '0', 10) || 0;
      const submittedAt = row[8] || undefined;

      const matchedClass = classes.find((c) => c.name === className);
      const classId = matchedClass?.id || 'CLS_' + className;

      students.push({
        id: 'STU_' + studentCode,
        classId,
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
    });

    // 3. Parse Survey Responses
    const responses: Record<string, Record<string, string>> = {};
    (responseData?.values || []).forEach((row: string[]) => {
      const studentCode = (row[0] || '').trim();
      const rawJson = row[11];
      if (studentCode && rawJson) {
        try {
          const parsed = JSON.parse(rawJson);
          responses['STU_' + studentCode] = parsed;
        } catch {
          // ignore parsing error
        }
      }
    });

    // 4. Parse Settings
    const settingsRow = settingsData?.values?.[0] || [];
    const settings: Partial<SystemSettings> = {};
    if (settingsRow[0]) settings.schoolName = settingsRow[0];
    if (settingsRow[1]) settings.academicYear = settingsRow[1];
    if (settingsRow[2]) settings.surveyOpen = settingsRow[2] === 'НЭЭЛТТЭЙ';

    return {
      classes,
      teachers,
      students,
      responses,
      settings
    };
  },

  /**
   * Universal Zero-Config reader: Read all data directly from public Google Sheet via gviz CSV export
   * (Works on any mobile, tablet, desktop without requiring OAuth popup or tokens)
   */
  async loadAllFromPublicSheet(spreadsheetId: string): Promise<{
    classes: SchoolClass[];
    teachers: Teacher[];
    students: Student[];
    responses: Record<string, Record<string, string>>;
    settings: Partial<SystemSettings>;
  }> {
    const fetchTab = async (tabName: string): Promise<string[][]> => {
      try {
        const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const text = await res.text();
        return parseCSVText(text);
      } catch (err) {
        console.warn(`[PublicSheet] Failed to fetch tab ${tabName}:`, err);
        return [];
      }
    };

    const teacherRows = await fetchTab('Багш_Ангиуд');
    const studentRows = await fetchTab('Сурагчид');
    const responseRows = await fetchTab('Судалгааны_Хариултууд');
    const settingsRows = await fetchTab('Тохиргоо');

    // 1. Parse Classes & Teachers
    const classes: SchoolClass[] = [];
    const teachers: Teacher[] = [];

    (teacherRows.slice(1) || []).forEach((row, idx) => {
      const className = (row[0] || '').trim();
      if (!className) return;

      const teacherName = (row[1] || `${className} Ангийн багш`).trim();
      const teacherCode = (row[2] || `TEACH-${className.replace(/[^0-9A-Za-z]/g, '')}`).trim();
      const phone = (row[3] || '').trim();
      const year = (row[4] || '2025-2026').trim();
      const school = (row[5] || 'Хөвсгөл аймгийн 1-р сургууль').trim();
      const classId = `CLS_${className.replace(/[^0-9A-Za-z]/g, '') || idx}`;

      const gradeMatch = className.match(/^(\d+)/);
      const grade = gradeMatch ? parseInt(gradeMatch[1], 10) : 7;
      const sectionLetter = className.replace(/^[\d\s\-_]+/, '').trim() || 'А';

      classes.push({
        id: classId,
        name: className,
        grade,
        sectionLetter,
        teacherId: 'TCH_' + (teacherCode || classId),
        teacherName,
        teacherCode,
        academicYear: year,
        schoolName: school
      });

      teachers.push({
        id: 'TCH_' + (teacherCode || classId),
        name: teacherName,
        teacherCode,
        classId,
        className,
        phone
      });
    });

    // 2. Parse Students
    const students: Student[] = [];
    (studentRows.slice(1) || []).forEach((row) => {
      const studentCode = (row[0] || '').trim();
      if (!studentCode) return;

      const className = (row[1] || '').trim();
      const fullName = (row[2] || studentCode).trim();
      const gender = (row[3] || '').trim() === 'Эм' ? '1' : '2';
      const password = (row[4] || '').trim();
      const isSubmitted = (row[5] || '').includes('Судалгаа бөглөсөн') || (row[5] || '').includes('тийм');
      const riskLevel = row[6] === 'Өндөр' ? 'high' : row[6] === 'Дунд' ? 'medium' : row[6] === 'Энгийн' ? 'low' : undefined;
      const riskScore = row[7] ? parseInt(row[7], 10) : 0;
      const submittedAt = (row[8] || '').trim();
      const matchedClass = classes.find((c) => c.name === className);
      const classId = matchedClass?.id || 'CLS_' + className;

      students.push({
        id: 'STU_' + studentCode,
        classId,
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
    });

    // 3. Parse Survey Responses
    const responses: Record<string, Record<string, string>> = {};
    (responseRows.slice(1) || []).forEach((row) => {
      const studentCode = (row[4] || row[0] || '').trim();
      const rawJson = row[9] || row[11];
      if (studentCode && rawJson) {
        try {
          const parsed = JSON.parse(rawJson);
          responses['STU_' + studentCode] = parsed;
        } catch {
          // ignore parsing error
        }
      }
    });

    // 4. Parse Settings
    const settings: Partial<SystemSettings> = {
      googleSheetsLastSync: new Date().toISOString()
    };
    (settingsRows || []).forEach((row) => {
      if (row[0] === 'SchoolName' && row[1]) settings.schoolName = row[1];
      if (row[0] === 'AcademicYear' && row[1]) settings.academicYear = row[1];
      if (row[0] === 'SurveyOpen') settings.surveyOpen = row[1].toUpperCase() === 'TRUE';
    });

    return {
      classes,
      teachers,
      students,
      responses,
      settings
    };
  },

  /**
   * Append a single student survey submission to Google Sheet immediately
   */
  async appendStudentResponse(
    spreadsheetId: string,
    student: Student,
    answers: Record<string, string>,
    riskLevel?: string,
    riskScore?: number
  ): Promise<boolean> {
    const token = cachedAccessToken;
    if (!token) return false;

    const row = [
      student.studentCode,
      student.className,
      student.fullName,
      student.submittedAt || new Date().toISOString(),
      riskLevel === 'high' ? 'Өндөр' : riskLevel === 'medium' ? 'Дунд' : 'Энгийн',
      riskScore ?? 0,
      '',
      '',
      '',
      Object.keys(answers).length,
      143,
      JSON.stringify(answers)
    ];

    try {
      const targetRange = encodeURIComponent("'Судалгааны_Хариултууд'!A:L");
      await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}/values/${targetRange}:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: [row] })
      });
      return true;
    } catch (err) {
      console.warn('Failed to append response to Google Sheet:', err);
      return false;
    }
  }
};
