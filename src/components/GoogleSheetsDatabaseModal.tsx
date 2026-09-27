import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  Lock,
  Database,
  Unlink,
  Sparkles
} from 'lucide-react';
import {
  initGoogleAuth,
  googleSignIn,
  googleSignOut,
  getGoogleAccessToken,
  getCurrentGoogleUser,
  GoogleSheetsService
} from '../utils/googleSheetsService';
import { StorageService } from '../utils/storage';
import { GasService } from '../utils/gasService';
import { SchoolClass, Student, Teacher, SystemSettings } from '../types';
import { User } from 'firebase/auth';

interface GoogleSheetsDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNotification?: (msg: string) => void;
  onDataRefreshed?: () => void;
}

export const GoogleSheetsDatabaseModal: React.FC<GoogleSheetsDatabaseModalProps> = ({
  isOpen,
  onClose,
  onSuccessNotification,
  onDataRefreshed
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(StorageService.getSettings());
  const [existingInput, setExistingInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSettings(StorageService.getSettings());
      const unsubscribe = initGoogleAuth(
        (u, token) => {
          setUser(u);
          setHasToken(Boolean(token));
        },
        () => {
          setUser(getCurrentGoogleUser());
          setHasToken(Boolean(getGoogleAccessToken()));
        }
      );
      return () => unsubscribe();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setHasToken(true);
        setStatusMessage({
          type: 'success',
          text: `Амжилттай холбогдлоо: ${result.user.displayName || result.user.email}`
        });
      }
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';
      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        setStatusMessage({
          type: 'error',
          text: `Энэхүү хаяг (${hostname}) нь Firebase төслийн Authorized Domains (Зөвшөөрөгдсөн домэйн) жагсаалтад бүртгэгдээгүй байна. Та Firebase Console > Authentication > Settings > Authorized Domains хэсэгт "${hostname}"-ийг нэмэх, эсвэл домэйн шаардлагагүй "Google Apps Script (GAS)" тохиргоог ашиглан Google Sheet-тэй шууд холбогдож болно.`
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: err.message || 'Google дансаар нэвтрэхэд алдаа гарлаа.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await googleSignOut();
      setUser(null);
      setHasToken(false);
      setStatusMessage({ type: 'info', text: 'Google данснаас гарлаа.' });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateNewSheet = async () => {
    if (!hasToken) {
      setStatusMessage({ type: 'error', text: 'Эхлээд "Google-ээр нэвтрэх" товчийг дарна уу.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    try {
      const { spreadsheetId, spreadsheetUrl } = await GoogleSheetsService.createCentralDatabaseSheet(
        `${settings.schoolName || 'Сургууль'} - Эрсдлийн үнэлгээний өгөгдлийн сан`
      );

      // Save to settings
      const updated = {
        ...settings,
        googleSheetsSpreadsheetId: spreadsheetId,
        googleSheetsUrl: spreadsheetUrl,
        googleSheetsConnected: true,
        googleSheetsLastSync: new Date().toISOString()
      };
      StorageService.saveSettings(updated);
      setSettings(updated);

      // Export current local classes, teachers, students to the new Sheet
      const classes = StorageService.getClasses();
      const teachers = StorageService.getTeachers();
      const students = StorageService.getStudents();
      const responses = StorageService.getAllResponses();

      await GoogleSheetsService.syncAllToSheet(
        spreadsheetId,
        classes,
        teachers,
        students,
        responses,
        updated
      );

      setStatusMessage({
        type: 'success',
        text: `Google Sheet өгөгдлийн сан амжилттай үүсэж анхны өгөгдлүүд бичигдлээ!`
      });
      onSuccessNotification?.('Google Sheet сан амжилттай үүслээ!');
      onDataRefreshed?.();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Шинэ Google Sheet үүсгэхэд алдаа гарлаа.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectExisting = async () => {
    if (!existingInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Google Sheet-ийн URL эсвэл ID-г оруулна уу.' });
      return;
    }

    if (!hasToken) {
      setStatusMessage({ type: 'error', text: 'Эхлээд дээрх "Google-ээр нэвтрэх" товчийг дарж эрхээ баталгаажуулна уу.' });
      return;
    }

    let sheetId = existingInput.trim();
    // Extract ID from full URL if provided
    const match = sheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      sheetId = match[1];
    }

    setIsLoading(true);
    setStatusMessage(null);
    try {
      const token = await getGoogleAccessToken();
      if (!token) {
        throw new Error('Google эрх шалгахад алдаа гарлаа. "Google-ээр нэвтрэх" товч дарж дахин нэвтэрнэ үү.');
      }

      // Automatically verify and create missing tabs if needed
      await GoogleSheetsService.ensureSheetsExist(sheetId, token);

      const updated = {
        ...settings,
        googleSheetsSpreadsheetId: sheetId,
        googleSheetsUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
        googleSheetsConnected: true,
        googleSheetsLastSync: new Date().toISOString()
      };
      StorageService.saveSettings(updated);
      setSettings(updated);

      setStatusMessage({
        type: 'success',
        text: 'Google Sheet өгөгдлийн сантай амжилттай холбогдож, шаардлагатай хүснэгтүүдийг бэлтгэлээ.'
      });
      onSuccessNotification?.('Google Sheet амжилттай холбогдлоо!');
      onDataRefreshed?.();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Google Sheet холбоход алдаа гарлаа. Sheet-ийн хандах эрх болон ID-г шалгана уу.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Google Sheet өгөгдлийн санг салгах уу?',
      description: 'Энэ үйлдлээр Google Sheet-тэй холбогдсон тохиргоог салгах бөгөөд Sheet доторх өгөгдөл тань устахгүй хэвээр үлдэнэ.',
      confirmText: 'Салгах',
      onConfirm: () => {
        const updated = {
          ...settings,
          googleSheetsSpreadsheetId: '',
          googleSheetsUrl: '',
          googleSheetsConnected: false
        };
        StorageService.saveSettings(updated);
        setSettings(updated);
        setStatusMessage({ type: 'info', text: 'Google Sheet-ээс салгалаа.' });
        setConfirmDialog(null);
      }
    });
  };

  // MANDATORY USER CONFIRMATION FOR MUTATING/EXPORTING TO SHEET
  const requestSyncToSheet = () => {
    if (!settings.googleSheetsSpreadsheetId) return;

    const classes = StorageService.getClasses();
    const teachers = StorageService.getTeachers();
    const students = StorageService.getStudents();
    const responses = StorageService.getAllResponses();

    setConfirmDialog({
      isOpen: true,
      title: 'Google Sheet рүү өгөгдлийг синк хийж бичих үү?',
      description: `Таны системийн одоогийн нийт ${classes.length} анги, ${teachers.length} багш, ${students.length} сурагчийн код, нууц үг, судалгааны хариултууд Google Sheet рүү шинэчлэгдэн бичигдэнэ.`,
      confirmText: 'Тийм, Google Sheet рүү илгээх',
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsLoading(true);
        setStatusMessage(null);
        try {
          if (settings.gasWebAppUrl) {
            await GasService.syncAllToGas(settings.gasWebAppUrl, {
              classes,
              teachers,
              students,
              responses,
              settings
            });
            const updated = { ...settings, googleSheetsLastSync: new Date().toISOString(), googleSheetsConnected: true };
            StorageService.saveSettings(updated);
            setSettings(updated);
            await StorageService.syncToServer();
            setStatusMessage({
              type: 'success',
              text: `Амжилттай: Нийт ${students.length} сурагч, ${classes.length} ангийн мэдээлэл Google Sheet рүү синк хийгдлээ!`
            });
          } else if (hasToken && settings.googleSheetsSpreadsheetId) {
            await GoogleSheetsService.syncAllToSheet(
              settings.googleSheetsSpreadsheetId!,
              classes,
              teachers,
              students,
              responses,
              settings
            );
            const updated = { ...settings, googleSheetsLastSync: new Date().toISOString(), googleSheetsConnected: true };
            StorageService.saveSettings(updated);
            setSettings(updated);
            await StorageService.syncToServer();
            setStatusMessage({
              type: 'success',
              text: `Амжилттай: Нийт ${students.length} сурагч, ${teachers.length} багшийн мэдээлэл Google Sheet рүү синк хийгдлээ!`
            });
          } else {
            // Pull from public sheet, merge, and save to server
            const res = await StorageService.loadAllFromCloudDatabase();
            const updated = { ...settings, googleSheetsLastSync: new Date().toISOString(), googleSheetsConnected: true };
            StorageService.saveSettings(updated);
            setSettings(updated);
            await StorageService.syncToServer();
            setStatusMessage({
              type: 'success',
              text: `${res.message} Нийт ${classes.length} анги, ${students.length} сурагч төв серверт хадгалагдлаа!`
            });
          }
          onSuccessNotification?.('Google Sheet рүү амжилттай синк хийгдлээ');
        } catch (err: any) {
          setStatusMessage({
            type: 'error',
            text: err.message || 'Google Sheet рүү бичихэд алдаа гарлаа.'
          });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // MANDATORY USER CONFIRMATION FOR IMPORTING FROM SHEET
  const requestLoadFromSheet = () => {
    if (!settings.googleSheetsSpreadsheetId) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Google Sheet-ээс өгөгдлийг татаж шинэчлэх үү?',
      description: 'Google Sheet-д байгаа багш, анги, сурагчдын нэрс, код, нууц үг, судалгааны хариултуудыг систем рүү татаж шинэчилнэ.',
      confirmText: 'Тийм, Sheet-ээс өгөгдөл татах',
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsLoading(true);
        setStatusMessage(null);
        try {
          let remote;
          if (settings.gasWebAppUrl) {
            remote = await GasService.loadAllFromGas(settings.gasWebAppUrl);
          } else if (hasToken && settings.googleSheetsSpreadsheetId) {
            remote = await GoogleSheetsService.loadAllFromSheet(settings.googleSheetsSpreadsheetId!);
          } else if (settings.googleSheetsSpreadsheetId) {
            remote = await GoogleSheetsService.loadAllFromPublicSheet(settings.googleSheetsSpreadsheetId!);
          } else {
            throw new Error('Google Sheet ID олдсонгүй.');
          }

          // Smart merge classes (e.g. keep 12а Тэгшжаргал and add 7а Дулсам)
          const currentClasses = StorageService.getClasses();
          const classMap = new Map<string, SchoolClass>();
          currentClasses.forEach((c) => {
            if (c.name) classMap.set(c.name.trim().toUpperCase(), c);
          });
          remote.classes.forEach((c) => {
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
          remote.teachers.forEach((t) => {
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
          remote.students.forEach((s) => {
            const key = (s.studentCode || s.id).trim().toUpperCase();
            if (studentMap.has(key)) {
              studentMap.set(key, { ...studentMap.get(key)!, ...s });
            } else {
              studentMap.set(key, s);
            }
          });
          const mergedStudents = Array.from(studentMap.values());
          StorageService.saveStudents(mergedStudents);

          if (Object.keys(remote.responses).length > 0) {
            const allResp = StorageService.getAllResponses();
            Object.assign(allResp, remote.responses);
            StorageService.saveResponses(allResp);
          }

          const now = new Date().toISOString();
          const updated = {
            ...settings,
            ...remote.settings,
            googleSheetsLastSync: now,
            googleSheetsConnected: true
          };
          StorageService.saveSettings(updated);
          setSettings(updated);

          // Push fresh data to central server db as well
          await StorageService.syncToServer();

          setStatusMessage({
            type: 'success',
            text: `Амжилттай татлаа: ${mergedClasses.length} анги, ${mergedStudents.length} сурагчийн өгөгдөл шинэчлэгдлээ!`
          });
          onSuccessNotification?.('Google Sheet-ээс өгөгдлийг амжилттай татлаа');
          onDataRefreshed?.();
        } catch (err: any) {
          setStatusMessage({
            type: 'error',
            text: err.message || 'Google Sheet-ээс өгөгдөл татахад алдаа гарлаа.'
          });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const isConnected = Boolean(settings.googleSheetsConnected && settings.googleSheetsSpreadsheetId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                Google Sheet Өгөгдлийн Сан (Database)
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                  Шууд холболт
                </span>
              </h2>
              <p className="text-emerald-100 text-xs mt-0.5">
                Багш, сурагчдын код нууц үг, судалгааны явцыг Google Sheet-тэй шууд холбох
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{statusMessage.text}</div>
            </div>
          )}

          {/* STEP 1: Google Account Connection */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">1-р алхам</span>
                <h3 className="text-sm font-bold text-slate-800">Google данс баталгаажуулах</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Google Sheet-д өгөгдөл бичих, унших эрх олгох
                </p>
              </div>

              {hasToken && user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-700 flex items-center gap-1 justify-end">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Холбогдсон
                    </p>
                    <p className="text-[11px] text-slate-500">{user.displayName || user.email}</p>
                  </div>
                  <button
                    onClick={handleGoogleLogout}
                    className="text-xs px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium transition-colors"
                  >
                    Гарах
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 shadow-sm transition-all hover:shadow"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google-ээр нэвтрэх</span>
                </button>
              )}
            </div>
          </div>

          {/* STEP 2: Google Sheet Connection & Controls */}
          {isConnected ? (
            <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">Төв Google Sheet холбогдсон байна</h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                        ИДЭВХТЭЙ
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      ID: {settings.googleSheetsSpreadsheetId}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDisconnect}
                  className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold hover:bg-rose-50 px-2.5 py-1.5 rounded transition-colors"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  Салгах
                </button>
              </div>

              {/* Link to view Spreadsheet */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                <div className="truncate mr-3">
                  <span className="text-[11px] font-semibold text-slate-400 block">GOOGLE SHEET ХОЛБООС:</span>
                  <a
                    href={settings.googleSheetsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1 truncate"
                  >
                    {settings.googleSheetsUrl}
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
                <a
                  href={settings.googleSheetsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-sm transition-all shrink-0 flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Хүснэгт нээх
                </a>
              </div>

              {/* Sync Actions */}
              <div className="pt-2 border-t border-emerald-100 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={requestSyncToSheet}
                  disabled={isLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UploadCloud className="w-4 h-4" />
                  )}
                  <span>Google Sheet рүү синк хийх</span>
                </button>

                <button
                  type="button"
                  onClick={requestLoadFromSheet}
                  disabled={isLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 shadow-sm transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <DownloadCloud className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>Google Sheet-ээс өгөгдөл татах</span>
                </button>
              </div>

              {settings.googleSheetsLastSync && (
                <p className="text-[11px] text-slate-400 text-center">
                  Сүүлд синк хийсэн: {new Date(settings.googleSheetsLastSync).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Option A: Auto create Google Sheet */}
              <div className="border border-slate-200 hover:border-emerald-400 bg-white rounded-xl p-5 shadow-sm transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900">
                      Сонголт 1: Автоматаар шинэ Google Sheet сан үүсгэх
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Систем таны Google Drive дээр <strong>"Багш_Ангиуд"</strong>, <strong>"Сурагчид"</strong>,{' '}
                      <strong>"Судалгааны_Хариултууд"</strong> хүснэгтүүдийг автоматаар бэлтгэж, одоо байгаа бүх
                      өгөгдлийг синк хийнэ.
                    </p>
                    <button
                      type="button"
                      onClick={handleCreateNewSheet}
                      disabled={isLoading || !hasToken}
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-sm transition-all"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="w-4 h-4" />
                      )}
                      <span>Google Sheet Төв Сан Үүсгэх (1-дарж үүсгэх)</span>
                    </button>
                    {!hasToken && (
                      <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1 font-medium">
                        <Lock className="w-3 h-3" />
                        Эхлээд дээрх "Google-ээр нэвтрэх" товчийг дарна уу.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Option B: Connect existing Sheet */}
              <div className="border border-slate-200 bg-white rounded-xl p-5 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  Сонголт 2: Бэлэн байгаа Google Sheet-ийн холбоос холбох
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  Та өмнө нь үүсгэсэн хүснэгтийн холбоос (URL) эсвэл ID-г оруулж болно.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/... эсвэл ID"
                    value={existingInput}
                    onChange={(e) => setExistingInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleConnectExisting}
                    disabled={isLoading}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                  >
                    Холбох
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-600" />
              Хэрхэн ажиллах зарчим:
            </div>
            <p className="text-blue-800">
              1. Админ эсвэл ангийн багш нар шинэ сурагч бүртгэхэд нэвтрэх код, нууц үг нь энэхүү Google Sheet-ийн <strong>"Сурагчид"</strong> баганад шууд нэмэгдэнэ.
            </p>
            <p className="text-blue-800">
              2. Сурагч гар утсаараа кодоо хийж судалгааг бөглөхөд үр дүн болон 143 асуултын хариултууд Google Sheet-ийн <strong>"Судалгааны_Хариултууд"</strong> хүснэгтэд бодит цагт шууд очиж хадгалагдана.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Хаах
          </button>
        </div>
      </div>

      {/* MANDATORY EXPLICIT USER CONFIRMATION DIALOG (Workspace skill standard) */}
      {confirmDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">{confirmDialog.title}</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{confirmDialog.description}</p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Болих
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition-colors"
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
