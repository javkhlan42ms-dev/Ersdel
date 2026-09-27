import { SchoolClass, Student, Teacher, SystemSettings } from '../types';

/**
 * Service to communicate with Google Apps Script Web App without any domain restrictions.
 */
export const GasService = {
  /**
   * Test ping to Google Apps Script Web App
   */
  async ping(gasUrl: string): Promise<{ success: boolean; message: string }> {
    const cleanUrl = gasUrl.trim();
    if (!cleanUrl) {
      throw new Error('Google Apps Script URL хоосон байна.');
    }

    try {
      const pingUrl = cleanUrl.includes('?') ? `${cleanUrl}&action=ping` : `${cleanUrl}?action=ping`;
      const res = await fetch(pingUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`Холболтын алдаа: HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          message: data.message || 'Google Apps Script өгөгдлийн сантай амжилттай холбогдлоо!'
        };
      } else {
        throw new Error(data.error || 'Амжилтгүй хариу ирлээ.');
      }
    } catch (err: any) {
      // Due to Google redirects (302) on web apps, sometimes GET gives a redirect or CORS issue if not deployed with 'Anyone'.
      // Try POST ping fallback
      try {
        const postRes = await fetch(cleanUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'ping' })
        });
        const postData = await postRes.json();
        if (postData.success) {
          return { success: true, message: 'Google Apps Script-тэй амжилттай холбогдлоо!' };
        }
      } catch {
        // Ignore fallback error
      }
      throw new Error(
        err.message || 'Google Apps Script-тэй холбогдож чадсангүй. Web App-ын эрх "Anyone" (Хүн бүр) эсэхийг шалгана уу.'
      );
    }
  },

  /**
   * 1-Click setup sheets via GAS
   */
  async setupSheets(gasUrl: string): Promise<{ success: boolean; message: string }> {
    const cleanUrl = gasUrl.trim();
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'setupSheets' })
    });
    const data = await res.json();
    return data;
  },

  /**
   * Sync all local data (Classes, Teachers, Students, Responses, Settings) to Google Sheet via GAS
   */
  async syncAllToGas(
    gasUrl: string,
    data: {
      classes: SchoolClass[];
      teachers: Teacher[];
      students: Student[];
      responses: Record<string, Record<string, string>>;
      settings: SystemSettings;
    }
  ): Promise<{ success: boolean; message: string }> {
    const cleanUrl = gasUrl.trim();
    if (!cleanUrl) throw new Error('Google Apps Script URL оруулна уу.');

    // 1. Try server proxy first (reliable, Node.js environment, no browser CORS issues)
    try {
      const srvRes = await fetch('/api/sync/gas-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (srvRes.ok) {
        const srvData = await srvRes.json();
        if (srvData.success) {
          return srvData;
        }
      }
    } catch {
      // Fall back to direct GAS call
    }

    // 2. Direct GAS fetch fallback
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'syncAllFromClient',
        classes: data.classes,
        teachers: data.teachers,
        students: data.students,
        responses: data.responses,
        settings: data.settings
      })
    });

    if (!res.ok) {
      throw new Error(`Холболтын алдаа: HTTP ${res.status}`);
    }

    const resJson = await res.json();
    if (!resJson.success) {
      const errMsg = resJson.error || '';
      if (errMsg.includes('Unknown action: syncAllFromClient') || errMsg.includes('Unknown action')) {
        throw new Error(
          'Google Apps Script дээр хуучин хувилбарын код ажиллаж байна. Шинэчилсэн кодыг тавьсны дараа Apps Script дээр заавал: "Deploy (Байрлуулах) ➜ Manage deployments ➜ Засах (Харандаа) ➜ Version: New version ➜ Deploy" хийж шинэчилнэ үү.'
        );
      }
      throw new Error(errMsg || 'Өгөгдөл илгээхэд алдаа гарлаа.');
    }

    return resJson;
  },

  /**
   * Load all data from Google Sheet via GAS
   */
  async loadAllFromGas(gasUrl: string): Promise<{
    success: boolean;
    classes: SchoolClass[];
    teachers: Teacher[];
    students: Student[];
    responses: Record<string, Record<string, string>>;
    settings: Partial<SystemSettings>;
  }> {
    const cleanUrl = gasUrl.trim();
    if (!cleanUrl) throw new Error('Google Apps Script URL оруулна уу.');

    // 1. Try server proxy first
    try {
      const srvRes = await fetch('/api/sync/cloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (srvRes.ok) {
        const srvData = await srvRes.json();
        if (srvData.success && Array.isArray(srvData.classes)) {
          return {
            success: true,
            classes: srvData.classes,
            teachers: srvData.teachers || [],
            students: srvData.students || [],
            responses: srvData.responses || {},
            settings: {
              googleSheetsLastSync: srvData.lastSync || new Date().toISOString()
            }
          };
        }
      }
    } catch {
      // Fallback to direct GAS call
    }

    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'getAllForClient' })
    });

    if (!res.ok) {
      throw new Error(`Холболтын алдаа: HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Өгөгдөл татахад алдаа гарлаа.');
    }

    return data;
  },

  /**
   * Direct Real-time User Authentication against Google Sheet via GAS (Multi-Device Login)
   */
  async login(
    gasUrl: string,
    params: {
      username?: string;
      studentCode?: string;
      code?: string;
      password?: string;
      role?: 'student' | 'teacher' | 'admin' | string;
    }
  ): Promise<{
    success: boolean;
    role?: 'student' | 'teacher';
    user?: any;
    message?: string;
  }> {
    const cleanUrl = gasUrl.trim();
    if (!cleanUrl) {
      return { success: false, message: 'Google Apps Script URL тохируулагдаагүй байна.' };
    }

    try {
      const res = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'login',
          ...params
        })
      });

      if (!res.ok) {
        return { success: false, message: `Холболтын алдаа: HTTP ${res.status}` };
      }

      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Сүлжээний холболтоо шалгана уу.'
      };
    }
  },

  /**
   * Register a new student directly into Google Sheet via GAS
   */
  async registerStudent(
    gasUrl: string,
    studentData: {
      studentCode: string;
      className: string;
      fullName: string;
      gender?: string;
      password?: string;
    }
  ): Promise<{
    success: boolean;
    message?: string;
    student?: any;
  }> {
    const cleanUrl = gasUrl.trim();
    if (!cleanUrl) {
      return { success: false, message: 'Google Apps Script URL тохируулагдаагүй байна.' };
    }

    try {
      const res = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'registerStudent',
          ...studentData
        })
      });

      if (!res.ok) {
        return { success: false, message: `Холболтын алдаа: HTTP ${res.status}` };
      }

      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Google Sheet рүү бичихэд алдаа гарлаа.'
      };
    }
  },

  /**
   * Append individual student survey response
   */
  async appendStudentSurvey(
    gasUrl: string,
    student: Student,
    answers: Record<string, string>,
    riskLevel?: string,
    riskScore?: number
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const cleanUrl = gasUrl.trim();
      if (!cleanUrl) return { success: false, message: 'Google Apps Script URL тохируулагдаагүй байна.' };

      const res = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveSurveyAnswers',
          student,
          studentCode: student.studentCode,
          className: student.className,
          fullName: student.fullName,
          answers,
          riskLevel: riskLevel || student.riskLevel || 'low',
          riskScore: riskScore != null ? riskScore : (student.riskScore || 0)
        })
      });

      if (!res.ok) {
        return { success: false, message: `Холболтын алдаа: HTTP ${res.status}` };
      }
      const data = await res.json();
      return data;
    } catch (e: any) {
      console.warn('Failed to append response to Google Apps Script:', e);
      return { success: false, message: e.message || 'Сүлжээний алдаа гарлаа.' };
    }
  }
};
