import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ActiveSession, StorageService, normalizeCode } from '../utils/storage';
import { GasService } from '../utils/gasService';
import { SchoolClass, Student, Teacher, SystemSettings, SystemLog } from '../types';
import { evaluateStudentRisk } from '../utils/riskCalculator';
import { exportSurveyDataToExcel } from '../utils/excelExport';
import {
  calculateSurveyAnalytics,
  calculateSchoolClassComparisons,
  getRiskLevelBadge,
} from '../utils/surveyAnalytics';
import { AdminKPICards } from './dashboard/KPICards';
import { RiskDonutChart, GroupsHorizontalBarChart, ClassRiskComparisonChart } from './dashboard/RiskCharts';
import { AttentionSection } from './dashboard/AttentionSection';
import { ClassComparisonTable } from './dashboard/ClassComparisonTable';
import { ClassDrillDownView } from './dashboard/ClassDrillDownView';
import { DashboardSidebar, SidebarItem } from './dashboard/DashboardSidebar';
import {
  ShieldCheck,
  School,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Plus,
  Users,
  Search,
  RotateCcw,
  CheckCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  FileSpreadsheet,
  Download,
  UploadCloud,
  Activity,
  AlertTriangle,
  Key,
  Copy,
  Check,
  Trash2,
  X,
  UserCheck,
  Filter,
  CheckSquare,
  LayoutDashboard,
  Layers,
  Settings,
  Cloud,
  Lock,
  Unlock,
  Upload,
  ListPlus,
  ClipboardCopy,
  Phone,
  FileText,
  CheckCheck,
} from 'lucide-react';

interface AdminDashboardProps {
  session: ActiveSession;
  onOpenGasModal: () => void;
  onOpenGoogleSheetsModal?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  session,
  onOpenGasModal,
  onOpenGoogleSheetsModal
}) => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'comparison' | 'classes' | 'stats' | 'retake' | 'subgroups' | 'settings' | 'logs'
  >('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedClassForDrillDown, setSelectedClassForDrillDown] = useState<SchoolClass | null>(null);

  const [settings, setSettings] = useState<SystemSettings>(StorageService.getSettings());
  const [classes, setClasses] = useState<SchoolClass[]>(StorageService.getClasses());
  const [students, setStudents] = useState<Student[]>(StorageService.getStudents());
  const [teachers, setTeachers] = useState<Teacher[]>(StorageService.getTeachers());
  const [logs, setLogs] = useState<SystemLog[]>(StorageService.getLogs());

  // Deletion & lock modals state
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [classToDelete, setClassToDelete] = useState<SchoolClass | null>(null);
  const [classToToggleLock, setClassToToggleLock] = useState<SchoolClass | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // CSV Teacher import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedCsvFileName, setUploadedCsvFileName] = useState<string | null>(null);
  const [uploadedCsvFileSize, setUploadedCsvFileSize] = useState<number | null>(null);
  const [isDraggingCsv, setIsDraggingCsv] = useState(false);
  const [showRawCsvText, setShowRawCsvText] = useState(false);
  const [bulkTeacherText, setBulkTeacherText] = useState('');
  const [bulkTeacherResult, setBulkTeacherResult] = useState<{
    createdCount: number;
    updatedCount: number;
    list: { schoolClass: SchoolClass; teacher: Teacher }[];
  } | null>(null);
  const [showAllTeacherCodesModal, setShowAllTeacherCodesModal] = useState(false);
  const [copiedAllCodes, setCopiedAllCodes] = useState(false);

  // Download official CSV template with UTF-8 BOM: Анги бүлэг, Багшийн нэр, Нэвтрэх код, Утас
  const downloadTeacherCsvTemplate = () => {
    const csvContent =
      `\uFEFFАнги бүлэг,Багшийн нэр,Нэвтрэх код,Утас\n` +
      `7А,Б. Бат-Эрдэнэ,TEACH-7A,99112233\n` +
      `7Б,Д. Цэцэгмаа,TEACH-7B,99223344\n` +
      `8А,М. Баяр,TEACH-8A,99334455\n` +
      `8Б,С. Болд,TEACH-8B,99445566\n` +
      `9А,Х. Номин,TEACH-9A,99556677\n` +
      `9Б,Т. Гансүх,TEACH-9B,99667788\n` +
      `10А,Э. Уянга,TEACH-10A,99778899\n` +
      `11А,Ж. Батбаяр,TEACH-11A,99889900\n` +
      `12А,Ц. Тэгшжаргал,TEACH-12A,99001122\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'багш_нарын_бүртгэл_загвар.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCsvFileSelect = (file: File) => {
    if (!file) return;
    setUploadedCsvFileName(file.name);
    setUploadedCsvFileSize(file.size);
    setBulkTeacherResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      setBulkTeacherText(text);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleCsvFileSelect(e.target.files[0]);
    }
  };

  const handleDropCsv = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingCsv(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleCsvFileSelect(e.dataTransfer.files[0]);
    }
  };

  const clearCsvUpload = () => {
    setUploadedCsvFileName(null);
    setUploadedCsvFileSize(null);
    setBulkTeacherText('');
    setBulkTeacherResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Parsed bulk teachers memo (Handles comma, semicolon, tab, and quotes)
  const parsedBulkTeachers = useMemo(() => {
    if (!bulkTeacherText.trim()) return [];

    const lines = bulkTeacherText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    // Parse all lines with quotes handling
    const parsedRows: string[][] = lines.map((line) => {
      if (line.includes('\t') && !line.includes('"')) {
        return line.split('\t').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      }
      const cols: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if ((c === ',' || c === ';' || c === '\t') && !inQuotes) {
          cols.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      cols.push(cur.trim());
      return cols.map((c) => c.replace(/^["']|["']$/g, '').trim());
    });

    if (parsedRows.length === 0) return [];

    // Detect header row dynamically
    let startIndex = 0;
    let colClass = 0;
    let colTeacher = 1;
    let colCode = 2;
    let colPass = -1;
    let colPhone = 3;

    const firstRow = parsedRows[0];
    const isHeader = firstRow.some((cell) => {
      const lower = cell.toLowerCase().trim();
      return (
        lower.includes('анги') ||
        lower.includes('class') ||
        lower.includes('бүлэг') ||
        lower.includes('багш') ||
        lower.includes('код') ||
        lower.includes('нууц') ||
        lower.includes('нэвтрэх') ||
        lower.includes('утас') ||
        lower.includes('code') ||
        lower.includes('phone')
      );
    });

    if (isHeader) {
      startIndex = 1;
      firstRow.forEach((cell, idx) => {
        const lower = cell.toLowerCase().trim();
        // 1. Анги бүлэг (Class / Section)
        if (lower.includes('анги') || lower.includes('class') || lower.includes('бүлэг')) {
          colClass = idx;
        }
        // 2. Нууц үг (Password)
        else if (lower.includes('нууц үг') || lower.includes('password') || lower.includes('pass')) {
          colPass = idx;
        }
        // 3. Нэвтрэх код (Teacher Login Code)
        else if (lower.includes('код') || lower.includes('code') || lower.includes('нэвтрэх')) {
          colCode = idx;
        }
        // 4. Багшийн нэр (Teacher Name)
        else if (lower.includes('багш') || lower.includes('нэр') || lower.includes('овог') || lower.includes('teacher')) {
          colTeacher = idx;
        }
        // 5. Утасны дугаар (Phone number)
        else if (lower.includes('утас') || lower.includes('phone') || lower.includes('тел')) {
          colPhone = idx;
        }
      });
    }

    const results: Array<{
      className: string;
      grade: number;
      sectionLetter: string;
      teacherName: string;
      teacherCode: string;
      password?: string;
      phone: string;
      isExisting: boolean;
      isValid: boolean;
    }> = [];

    for (let i = startIndex; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      if (!row || row.length === 0) continue;

      const rawClass = (row[colClass] || '').trim();
      if (!rawClass) continue;

      const rawTeacher = (row[colTeacher] || '').trim();
      let rawCode = (colCode >= 0 && colCode < row.length ? row[colCode] : '')?.trim() || '';
      let rawPass = (colPass >= 0 && colPass < row.length ? row[colPass] : '')?.trim() || '';
      let rawPhone = (colPhone >= 0 && colPhone < row.length ? row[colPhone] : '')?.trim() || '';

      // If 3 columns without header and column 2 is an 8-digit phone number:
      if (!isHeader && row.length === 3 && /^\d{8}$/.test(rawCode) && !rawPhone) {
        rawPhone = rawCode;
        rawCode = '';
      }

      const normClass = normalizeCode(rawClass);
      const matchGrade = rawClass.match(/^(\d+)/);
      const grade = matchGrade ? parseInt(matchGrade[1], 10) : 7;
      const sectionLetter = rawClass.replace(/^[\d\s\-_]+/, '').trim() || 'А';

      // Custom teacher code from CSV or fallback
      const teacherCode = rawCode ? rawCode.toUpperCase() : 'TEACH-' + (normClass || 'CLS');
      const teacherName = rawTeacher || `${rawClass} Ангийн багш`;
      const teacherPassword = rawPass || teacherCode;

      const isExisting = classes.some(
        (c) => c.name.trim().toUpperCase() === rawClass.toUpperCase() || normalizeCode(c.name) === normClass
      );

      results.push({
        className: rawClass,
        grade,
        sectionLetter,
        teacherName,
        teacherCode,
        password: teacherPassword,
        phone: rawPhone,
        isExisting,
        isValid: Boolean(normClass),
      });
    }

    return results;
  }, [bulkTeacherText, classes]);

  // Retake student search & filters
  const [retakeSearch, setRetakeSearch] = useState('');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'UNSUBMITTED'>('ALL');

  // Multi-select students & bulk deletion
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);

  const [autoSyncState, setAutoSyncState] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [lastAutoSyncTime, setLastAutoSyncTime] = useState<string>('');

  useEffect(() => {
    const handleStart = () => setAutoSyncState('syncing');
    const handleDone = () => {
      setAutoSyncState('synced');
      setLastAutoSyncTime(new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }));
      setTimeout(() => setAutoSyncState('idle'), 3500);
    };

    window.addEventListener('app:autosync_start', handleStart);
    window.addEventListener('app:autosync_done', handleDone);
    return () => {
      window.removeEventListener('app:autosync_start', handleStart);
      window.removeEventListener('app:autosync_done', handleDone);
    };
  }, []);

  const refreshData = () => {
    setSettings(StorageService.getSettings());
    setClasses(StorageService.getClasses());
    setStudents(StorageService.getStudents());
    setTeachers(StorageService.getTeachers());
    setLogs(StorageService.getLogs());
  };

  // Aggregated school metrics
  const totalStudents = students.length;
  const totalSubmitted = students.filter((s) => s.isSubmitted).length;
  const overallRate = totalStudents > 0 ? Math.round((totalSubmitted / totalStudents) * 100) : 0;

  const responsesMap = StorageService.getAllResponses();

  const schoolAnalytics = useMemo(() => {
    return calculateSurveyAnalytics(students, responsesMap);
  }, [students, responsesMap]);

  const classComparisons = useMemo(() => {
    return calculateSchoolClassComparisons(classes, students, responsesMap);
  }, [classes, students, responsesMap]);

  const riskSummary = useMemo(() => {
    return schoolAnalytics?.riskSummary || { low: 0, med: 0, high: 0, lowPct: 0, medPct: 0, highPct: 0 };
  }, [schoolAnalytics]);

  // Toggle survey open/closed
  const handleToggleSurvey = () => {
    const updated: SystemSettings = {
      ...settings,
      surveyOpen: !settings.surveyOpen
    };
    StorageService.saveSettings(updated);
    setSettings(updated);
    StorageService.addLog(
      'ADMIN',
      'Администратор',
      'TOGGLE_SURVEY',
      `Судалгааны төлөвийг ${updated.surveyOpen ? 'НЭЭВ' : 'ХААВ'}`
    );
    setLogs(StorageService.getLogs());
  };

  // Save school settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(settings);
    alert('Сургууль, хичээлийн жилийн тохиргоо амжилттай хадгалагдлаа.');
    refreshData();
  };

  // Bulk register teachers strictly from CSV (Анги бүлэг, Багшийн нэр, Нэвтрэх код, Утас)
  const handleBulkRegisterTeachers = () => {
    const validItems = parsedBulkTeachers.filter((item) => item.isValid);
    if (validItems.length === 0) {
      setActionMessage({
        type: 'error',
        text: 'Бүртгэх боломжтой анги/багшийн мэдээлэл олдсонгүй. CSV файлаа шалгана уу.'
      });
      return;
    }

    const res = StorageService.bulkAddTeachers(
      validItems.map((item) => ({
        className: item.className,
        teacherName: item.teacherName,
        teacherCode: item.teacherCode,
        grade: item.grade,
        phone: item.phone,
        password: item.password || item.teacherCode
      })),
      'ADMIN',
      session.userName || 'Администратор'
    );

    setBulkTeacherResult(res);
    refreshData();
    setActionMessage({
      type: 'success',
      text: `Амжилттай: ${res.createdCount} шинэ анги/багш үүсэж, ${res.updatedCount} багшийн мэдээлэл шинэчлэгдлээ!`
    });
    setTimeout(() => setActionMessage(null), 5000);
  };

  const loadBulkTeacherSample = () => {
    const sample = 
`Анги бүлэг,Багшийн нэр,Нэвтрэх код,Утас
7А,Б. Бат-Эрдэнэ,TEACH-7A,99112233
7Б,Д. Цэцэгмаа,TEACH-7B,99223344
8А,М. Баяр,TEACH-8A,99334455
8Б,С. Болд,TEACH-8B,99445566
9А,Х. Номин,TEACH-9A,99556677
9Б,Т. Гансүх,TEACH-9B,99667788
10А,Э. Уянга,TEACH-10A,99778899
11А,Ж. Батбаяр,TEACH-11A,99889900
12А,Ц. Тэгшжаргал,TEACH-12A,99001122`;
    setUploadedCsvFileName('жишээ_багш_нарын_бүртгэл.csv');
    setUploadedCsvFileSize(sample.length);
    setBulkTeacherText(sample);
  };

  const copyAllTeacherCodes = () => {
    const currentTeachers = StorageService.getTeachers();
    const currentClasses = StorageService.getClasses();
    const currentSettings = StorageService.getSettings();

    let text = `=== ${currentSettings.schoolName || 'СУРГУУЛЬ'} - БАГШ НАРЫН НЭВТРЭХ КОДЫН ЖАГСААЛТ (${currentClasses.length} АНГИ) ===\n`;
    text += `Огноо: ${new Date().toLocaleDateString('mn-MN')}\n`;
    text += `Нэвтрэх заавар: Багш нь өөрийн Код (жишээ: TEACH-7A) эсвэл шууд Ангийнхаа нэрийг (жишээ: 7А) бичиж шууд нэвтэрч болно.\n\n`;
    text += `Анги\tБагшийн нэр\tНэвтрэх код\tУтас\n`;

    currentClasses.forEach((cls) => {
      const tch = currentTeachers.find((t) => t.classId === cls.id || t.className === cls.name);
      text += `${cls.name}\t${cls.teacherName || tch?.name || 'Багш'}\t${cls.teacherCode}\t${tch?.phone || '-'}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedAllCodes(true);
    setTimeout(() => setCopiedAllCodes(false), 3000);
  };

  // Toggle retake permission for a student
  const handleToggleRetake = (studentId: string, currentRetakeStatus: boolean) => {
    StorageService.allowRetake(
      studentId,
      !currentRetakeStatus,
      'ADMIN',
      session.userName || 'Администратор'
    );
    refreshData();
  };

  // Student deletion confirmed
  const confirmDeleteStudent = () => {
    if (!studentToDelete) return;
    const name = studentToDelete.fullName;
    const code = studentToDelete.studentCode;
    StorageService.deleteStudent(
      studentToDelete.id,
      'ADMIN',
      session.userName || 'Администратор'
    );
    setStudentToDelete(null);
    refreshData();
    setActionMessage({
      type: 'success',
      text: `${name} (${code}) сурагчийн бүртгэл болон судалгааны өгөгдлийг амжилттай устгалаа.`
    });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Teacher deletion confirmed
  const confirmDeleteTeacher = () => {
    if (!teacherToDelete) return;
    const name = teacherToDelete.name;
    const code = teacherToDelete.teacherCode;
    StorageService.deleteTeacher(
      teacherToDelete.id,
      'ADMIN',
      session.userName || 'Администратор'
    );
    setTeacherToDelete(null);
    refreshData();
    setActionMessage({
      type: 'success',
      text: `${name} (${code}) багшийн эрхийг амжилттай устгалаа.`
    });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Class deletion confirmed
  const confirmDeleteClass = () => {
    if (!classToDelete) return;
    const name = classToDelete.name;
    StorageService.deleteClass(
      classToDelete.id,
      'ADMIN',
      session.userName || 'Администратор'
    );
    setClassToDelete(null);
    refreshData();
    setActionMessage({
      type: 'success',
      text: `${name} анги болон холбогдох багшийн бүртгэлийг амжилттай устгалаа.`
    });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Class lock / unlock toggling
  const confirmToggleClassLock = () => {
    if (!classToToggleLock) return;
    const newLockState = !classToToggleLock.isLocked;
    const result = StorageService.toggleClassLock(
      classToToggleLock.id,
      newLockState,
      'ADMIN',
      session.userName || 'Администратор'
    );
    const targetName = classToToggleLock.name;
    setClassToToggleLock(null);
    refreshData();
    if (selectedClassForDrillDown && selectedClassForDrillDown.id === classToToggleLock.id) {
      setSelectedClassForDrillDown((prev) => prev ? { ...prev, isLocked: newLockState } : null);
    }
    setActionMessage({
      type: result.success ? 'success' : 'error',
      text: result.message
    });
    setTimeout(() => setActionMessage(null), 5000);
  };

  // Multi-select & Bulk actions for students
  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = filteredRetakeStudents.map((s) => s.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedStudentIds([]);
  };

  const confirmBulkDeleteStudents = () => {
    if (selectedStudentIds.length === 0) return;
    const count = StorageService.deleteMultipleStudents(
      selectedStudentIds,
      'ADMIN',
      session.userName || 'Администратор'
    );
    setSelectedStudentIds([]);
    setIsBulkDeleteModalOpen(false);
    refreshData();
    setActionMessage({
      type: 'success',
      text: `Нийт ${count} сурагчийн бүртгэл болон судалгааны өгөгдлийг амжилттай устгалаа.`
    });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleBulkToggleRetake = (allow: boolean) => {
    if (selectedStudentIds.length === 0) return;
    selectedStudentIds.forEach((id) => {
      StorageService.allowRetake(id, allow, 'ADMIN', session.userName || 'Администратор');
    });
    refreshData();
    setActionMessage({
      type: 'success',
      text: `Сонгогдсон ${selectedStudentIds.length} сурагчид дахин бөглөх эрхийг ${allow ? 'нээлээ' : 'хаалаа'}.`
    });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Export full school data to Excel
  const handleExportAll = () => {
    exportSurveyDataToExcel(
      {
        id: 'ALL_CLASSES',
        name: 'Бүх_ангиуд',
        grade: 0,
        sectionLetter: 'Бүгд',
        teacherCode: 'ADMIN',
        academicYear: settings.academicYear,
        schoolName: settings.schoolName
      },
      students,
      responsesMap
    );
  };

  const [isPushingCloud, setIsPushingCloud] = useState(false);
  const [isPullingCloud, setIsPullingCloud] = useState(false);

  // Manual push (sync) all data to Google Sheet via GAS
  const handleCloudPush = async () => {
    const curSettings = StorageService.getSettings();
    if (!curSettings.gasWebAppUrl) {
      if (onOpenGasModal) {
        onOpenGasModal();
      } else if (onOpenGoogleSheetsModal) {
        onOpenGoogleSheetsModal();
      }
      setActionMessage({
        type: 'error',
        text: 'Google Sheet рүү синк хийхийн тулд эхлээд Google Apps Script холболтоо тохируулна уу.'
      });
      return;
    }

    setIsPushingCloud(true);
    setActionMessage({ type: 'success', text: 'Google Sheet рүү өгөгдлийг синк хийж байна...' });
    try {
      const cls = StorageService.getClasses();
      const tch = StorageService.getTeachers();
      const stu = StorageService.getStudents();
      const resp = StorageService.getAllResponses();

      const res = await GasService.syncAllToGas(curSettings.gasWebAppUrl.trim(), {
        classes: cls,
        teachers: tch,
        students: stu,
        responses: resp,
        settings: curSettings
      });

      const updatedSettings = {
        ...curSettings,
        gasConnected: true,
        googleSheetsLastSync: new Date().toISOString()
      };
      StorageService.saveSettings(updatedSettings);
      setSettings(updatedSettings);
      await StorageService.syncToServer();
      refreshData();

      setActionMessage({
        type: 'success',
        text: res.message || `Амжилттай: ${stu.length} сурагч, ${cls.length} ангийн өгөгдөл Google Sheet рүү амжилттай синк хийгдлээ!`
      });
      setTimeout(() => setActionMessage(null), 7000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: 'Google Sheet рүү синк хийхэд алдаа гарлаа: ' + (err.message || 'Сүлжээгээ шалгана уу')
      });
    } finally {
      setIsPushingCloud(false);
    }
  };

  // Manual pull from Google Sheet / Cloud DB
  const handleCloudPull = async () => {
    setIsPullingCloud(true);
    setActionMessage({ type: 'success', text: 'Google Sheet сангаас өгөгдлийг татаж байна...' });
    try {
      const res = await StorageService.loadAllFromCloudDatabase();
      refreshData();
      setActionMessage({ type: 'success', text: res.message });
      setTimeout(() => setActionMessage(null), 6000);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: 'Татахад алдаа гарлаа: ' + (err.message || 'Сүлжээгээ шалгана уу') });
    } finally {
      setIsPullingCloud(false);
    }
  };

  const filteredRetakeStudents = useMemo(() => {
    return students.filter((s) => {
      // Class filter
      if (classFilter !== 'ALL' && s.classId !== classFilter && s.className !== classFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === 'SUBMITTED' && !s.isSubmitted) return false;
      if (statusFilter === 'UNSUBMITTED' && s.isSubmitted) return false;

      // Text search
      if (!retakeSearch.trim()) return true;
      const q = retakeSearch.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q)
      );
    });
  }, [students, retakeSearch, classFilter, statusFilter]);

  const selectedStudentsList = useMemo(() => {
    const set = new Set(selectedStudentIds);
    return students.filter((s) => set.has(s.id));
  }, [students, selectedStudentIds]);

  const [expandedSubgroups, setExpandedSubgroups] = useState<Set<string>>(new Set());
  const toggleSubgroupExpand = (subKey: string) => {
    setExpandedSubgroups((prev) => {
      const next = new Set(prev);
      if (next.has(subKey)) next.delete(subKey);
      else next.add(subKey);
      return next;
    });
  };

  const handleSelectClassDrillDown = (classId: string) => {
    const target = classes.find((c) => c.id === classId);
    if (target) {
      setSelectedClassForDrillDown(target);
    }
  };

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Хяналтын самбар',
      icon: <LayoutDashboard className="w-4 h-4" />,
      active: activeTab === 'dashboard' && !selectedClassForDrillDown,
      onClick: () => {
        setSelectedClassForDrillDown(null);
        setActiveTab('dashboard');
      },
    },
    {
      id: 'comparison',
      label: 'Ангиудын харьцуулалт',
      icon: <School className="w-4 h-4" />,
      badge: classes.length,
      active: activeTab === 'comparison' && !selectedClassForDrillDown,
      onClick: () => {
        setSelectedClassForDrillDown(null);
        setActiveTab('comparison');
      },
    },
    {
      id: 'classes',
      label: 'Ангиуд & Багш нар',
      icon: <UserCheck className="w-4 h-4" />,
      badge: teachers.length,
      active: activeTab === 'classes' && !selectedClassForDrillDown,
      onClick: () => {
        setSelectedClassForDrillDown(null);
        setActiveTab('classes');
      },
    },
    {
      id: 'retake',
      label: 'Сурагчид & Эрх',
      icon: <Users className="w-4 h-4" />,
      badge: students.length,
      active: activeTab === 'retake' && !selectedClassForDrillDown,
      onClick: () => {
        setSelectedClassForDrillDown(null);
        setActiveTab('retake');
      },
    },
    {
      id: 'subgroups',
      label: 'Эрсдэлийн шинжилгээ',
      icon: <Layers className="w-4 h-4" />,
      active: activeTab === 'subgroups' && !selectedClassForDrillDown,
      onClick: () => {
        setSelectedClassForDrillDown(null);
        setActiveTab('subgroups');
      },
    },
    {
      id: 'settings',
      label: 'Тохиргоо',
      icon: <Settings className="w-4 h-4" />,
      active: activeTab === 'settings' && !selectedClassForDrillDown,
      onClick: () => {
        setSelectedClassForDrillDown(null);
        setActiveTab('settings');
      },
    },
    {
      id: 'logs',
      label: 'Системийн лог',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: logs.length,
      active: activeTab === 'logs' && !selectedClassForDrillDown,
      onClick: () => {
        setSelectedClassForDrillDown(null);
        setActiveTab('logs');
      },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8 flex flex-col lg:flex-row gap-6 items-start">
      {/* 1. FIXED DESKTOP SIDEBAR / RESPONSIVE MOBILE DRAWER */}
      <DashboardSidebar
        title={settings.schoolName || 'Сургуулийн удирдлага'}
        subtitle={`Хичээлийн жил: ${settings.academicYear}`}
        roleBadge="Администратор"
        items={sidebarItems}
        actions={[
          {
            label: 'Google Sheet Сан (DB)',
            icon: <FileSpreadsheet className="w-4 h-4 text-emerald-400" />,
            onClick: onOpenGoogleSheetsModal || onOpenGasModal,
            variant: 'secondary',
          },
          {
            label: 'Excel татах (14 хуудас)',
            icon: <Download className="w-4 h-4" />,
            onClick: handleExportAll,
            variant: 'success',
          },
          {
            label: 'Google Apps Script',
            icon: <Cloud className="w-4 h-4" />,
            onClick: onOpenGasModal,
            variant: 'secondary',
          },
        ]}
        isOpenMobile={isMobileMenuOpen}
        onToggleMobile={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 w-full min-w-0">
        {/* Admin Top Header Banner */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase">
                  Ерөнхий Администратор
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {settings.schoolName} ({settings.academicYear})
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                Сургуулийн удирдлагын нэгдсэн хяналт
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ангиуд, багшийн код, судалгааны төлөв болон тайлан шинжилгээний төв
              </p>
              {settings.googleSheetsLastSync && (
                <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Google Sheet сантай сүүлд синк хийсэн: {new Date(settings.googleSheetsLastSync).toLocaleString('mn-MN')}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Survey Status Toggle Button */}
              <button
                id="btn-toggle-survey-status"
                onClick={handleToggleSurvey}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
                  settings.surveyOpen
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                }`}
              >
                {settings.surveyOpen ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-emerald-400" />
                    <span>Судалгаа: НЭЭЛТТЭЙ</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-red-400" />
                    <span>Судалгаа: ХААГДСАН</span>
                  </>
                )}
              </button>

              {/* Google Sheets Database Quick Access & Live Auto-sync */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenGoogleSheetsModal || onOpenGasModal}
                  className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
                    settings.googleSheetsConnected
                      ? 'bg-emerald-600/30 text-emerald-200 border-emerald-400/40 hover:bg-emerald-600/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title={`Google Sheet Төв Өгөгдлийн Сан (ID: ${settings.googleSheetsSpreadsheetId || '1khD5n...'})`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline">Google Sheet Сан</span>
                  <span className="sm:hidden">Sheet</span>
                  {autoSyncState === 'syncing' ? (
                    <span className="flex items-center gap-1 text-[11px] text-amber-300">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Синк...</span>
                    </span>
                  ) : autoSyncState === 'synced' ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Хадгаллаа</span>
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Автомат синк холбогдсон"></span>
                  )}
                </button>

                {settings.googleSheetsSpreadsheetId && (
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${settings.googleSheetsSpreadsheetId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                    title="Google Sheet хүснэгтийг нээх"
                  >
                    <ExternalLink className="w-4 h-4 text-emerald-400" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleCloudPush}
                  disabled={isPushingCloud}
                  className="px-3 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-500/40 bg-emerald-600/30 text-emerald-200 hover:bg-emerald-600/40 disabled:opacity-50"
                  title="Системийн бүх сурагч, анги, хариултыг Google Sheet рүү синк хийж хадгалах"
                >
                  <UploadCloud className={`w-3.5 h-3.5 text-emerald-300 ${isPushingCloud ? 'animate-bounce' : ''}`} />
                  <span className="hidden sm:inline">{isPushingCloud ? 'Синк хийж байна...' : 'Sheet рүү синк хийх'}</span>
                  <span className="sm:hidden">{isPushingCloud ? 'Синк...' : 'Илгээх'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloudPull}
                  disabled={isPullingCloud}
                  className="px-3 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-blue-500/40 bg-blue-600/30 text-blue-200 hover:bg-blue-600/40 disabled:opacity-50"
                  title="Google Sheet дээрх шинэ анги, багш, сурагчдын өгөгдлийг татаж шинэчлэх"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-300 ${isPullingCloud ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isPullingCloud ? 'Татаж байна...' : 'Google Sheet-ээс татах'}</span>
                  <span className="sm:hidden">{isPullingCloud ? 'Татаж байна...' : 'Татах'}</span>
                </button>
              </div>

              <button
                onClick={handleExportAll}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Бүх сургуулийн Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Notification Alert Banner */}
        {actionMessage && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-sm flex items-center justify-between shadow-xs transition-all ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 3. CLASS DRILL-DOWN VIEW (if selected) OR NORMAL TABS */}
        {selectedClassForDrillDown ? (
          <ClassDrillDownView
            schoolClass={selectedClassForDrillDown}
            students={students}
            responsesMap={responsesMap}
            onBack={() => setSelectedClassForDrillDown(null)}
            onToggleLock={setClassToToggleLock}
          />
        ) : (
          <>
            {/* Horizontal Tabs Header (for quick mobile/tablet switching) */}
            <div className="border-b border-slate-200 mb-6 flex gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'dashboard'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Хяналтын самбар</span>
              </button>

              <button
                onClick={() => setActiveTab('comparison')}
                className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'comparison'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <School className="w-4 h-4" />
                <span>Ангиудын харьцуулалт ({classes.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('classes')}
                className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'classes'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Ангиуд & Багш нар ({teachers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('retake')}
                className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'retake'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Сурагчид & Эрх ({students.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('subgroups')}
                className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'subgroups'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Эрсдэлийн шинжилгээ</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'settings'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Тохиргоо</span>
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'logs'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Системийн лог ({logs.length})</span>
              </button>
            </div>

            {/* TAB: MAIN DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* 7 School-Wide KPI Cards */}
                <AdminKPICards
                  totalStudents={totalStudents}
                  totalClasses={classes.length}
                  totalTeachers={teachers.length}
                  totalSubmitted={totalSubmitted}
                  overallRate={overallRate}
                  lowRiskCount={riskSummary.low}
                  medRiskCount={riskSummary.med}
                  highRiskCount={riskSummary.high}
                />

                {/* Empty State warning if no students exist */}
                {totalStudents === 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
                    <School className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-bold text-sm text-slate-900">Одоогоор судалгааны мэдээлэл байхгүй байна.</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Эхлээд "Ангиуд & Багш нар" цэсээр анги үүсгэж, багш нар сурагчдаа бүртгэнэ үү.
                    </p>
                  </div>
                )}

                {/* Attention Needed (TOP 5 High Risk Indicators) */}
                {totalStudents > 0 && (
                  <AttentionSection
                    attentionItems={schoolAnalytics.attentionItems}
                    onFilterHighRisk={() => setActiveTab('comparison')}
                  />
                )}

                {/* Visual Charts: Donut + 8 Groups Horizontal Bar */}
                {totalStudents > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RiskDonutChart
                      low={riskSummary.low}
                      med={riskSummary.med}
                      high={riskSummary.high}
                      totalSubmitted={totalSubmitted}
                      title="Сургуулийн эрсдэлийн ерөнхий харьцаа"
                    />

                    <GroupsHorizontalBarChart
                      sectionStats={schoolAnalytics.sectionStats}
                      title="8 Бүлгийн эрсдэлийн дундаж үнэлгээ"
                    />
                  </div>
                )}

                {/* Class Comparison Chart */}
                {classes.length > 0 && (
                  <ClassRiskComparisonChart
                    classComparisons={classComparisons}
                    onSelectClass={handleSelectClassDrillDown}
                  />
                )}

                {/* Class Comparison Table with Drill-down */}
                {classes.length > 0 && (
                  <ClassComparisonTable
                    classComparisons={classComparisons}
                    onSelectClass={handleSelectClassDrillDown}
                  />
                )}
              </div>
            )}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          {/* Action Message Banner */}
          {actionMessage && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-150 ${
                actionMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {actionMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{actionMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionMessage(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* CSV Teacher Registration Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  <span>Багш нарын бүртгэл (Зөвхөн CSV файлаар)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Анги бүлэг, Багшийн нэр, Нэвтрэх код, Утасны дугаар бүхий CSV файлаар багш нарын бүртгэлийг үүсгэнэ
                </p>
              </div>

              {/* Action Buttons: Template Download & Reset */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={downloadTeacherCsvTemplate}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Загвар CSV файлыг татаж аваад өөрийн анги, багш нарын мэдээллээр бөглөнө үү"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Загвар CSV татах (.csv)</span>
                </button>

                {(uploadedCsvFileName || bulkTeacherText) && (
                  <button
                    type="button"
                    onClick={clearCsvUpload}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Цэвэрлэх</span>
                  </button>
                )}
              </div>
            </div>

            {/* CSV File Upload Zone */}
            <div className="space-y-4">
              {/* Required Columns Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-blue-50/60 border border-blue-200/70 rounded-xl p-3 text-xs">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">1</div>
                  <div>
                    <span className="font-bold text-slate-800">Анги бүлэг</span>
                    <p className="text-[11px] text-slate-500">Жишээ: 7А, 8Б, 9В, 12А гэх мэт</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">2</div>
                  <div>
                    <span className="font-bold text-slate-800">Багшийн нэр</span>
                    <p className="text-[11px] text-slate-500">Жишээ: Б. Бат-Эрдэнэ, Д. Цэцэгмаа</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">3</div>
                  <div>
                    <span className="font-bold text-slate-800">Нэвтрэх код</span>
                    <p className="text-[11px] text-slate-500">Жишээ: TEACH-7A (Хоосон бол автоматаар үүснэ)</p>
                  </div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileInputChange}
                className="hidden"
                id="teacher-csv-upload-input"
              />

              {!uploadedCsvFileName && !bulkTeacherText ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingCsv(true);
                  }}
                  onDragLeave={() => setIsDraggingCsv(false)}
                  onDrop={handleDropCsv}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                    isDraggingCsv
                      ? 'border-blue-500 bg-blue-50/60 scale-[1.005]'
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/20'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">
                    Багш нарын CSV файлыг энд чирч оруулах эсвэл товшиж сонгоно уу
                  </h4>
                  <p className="text-xs text-slate-500 max-w-lg mx-auto mb-3">
                    Дэмжигдэх формат: <strong>.csv, .tsv, .txt</strong> (Баганууд: <strong>Анги бүлэг, Багшийн нэр, Нэвтрэх код, Утас</strong>)
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <span className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Компьютерээс CSV файл сонгох</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadTeacherCsvTemplate();
                      }}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Загвар файл татах</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        loadBulkTeacherSample();
                      }}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                    >
                      <ClipboardCopy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Жишээгээр бөглөх</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* File Selected Banner */
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {uploadedCsvFileName || 'Оруулсан CSV өгөгдөл'}
                        </span>
                        {uploadedCsvFileSize && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                            {(uploadedCsvFileSize / 1024).toFixed(1)} KB
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Нийт <strong>{parsedBulkTeachers.length}</strong> багш, ангийн мэдээлэл танигдлаа
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setShowRawCsvText(!showRawCsvText)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {showRawCsvText ? 'Эх текстийг нуух' : 'Эх текстийг харах'}
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                      Өөр файл сонгох
                    </button>
                  </div>
                </div>
              )}

              {/* Optional Raw Text View / Paste */}
              {showRawCsvText && (
                <div className="space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold">CSV файлын өгөгдөл (Анги бүлэг, Багшийн нэр, Нэвтрэх код, Утас):</span>
                    <button
                      type="button"
                      onClick={loadBulkTeacherSample}
                      className="text-blue-600 hover:underline text-[11px]"
                    >
                      Жишээ өгөгдөл оруулах
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={bulkTeacherText}
                    onChange={(e) => setBulkTeacherText(e.target.value)}
                    placeholder={`Анги бүлэг,Багшийн нэр,Нэвтрэх код,Утас\n7А,Б. Бат-Эрдэнэ,TEACH-7A,99112233\n8Б,Д. Цэцэгмаа,TEACH-8B,99223344`}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              )}

              {/* Live Parsed Preview Table */}
              {parsedBulkTeachers.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs animate-in fade-in duration-150">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <span>CSV-ээс танигдсан багш нарын жагсаалт:</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
                        {parsedBulkTeachers.length} мөр
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="text-emerald-700 font-medium">
                        ✓ {parsedBulkTeachers.filter((r) => !r.isExisting).length} шинэ анги үүснэ
                      </span>
                      <span>•</span>
                      <span className="text-amber-700 font-medium">
                        ↻ {parsedBulkTeachers.filter((r) => r.isExisting).length} шинэчлэгдэнэ
                      </span>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 text-[11px] sticky top-0 bg-slate-50">
                          <th className="py-2.5 px-3">№</th>
                          <th className="py-2.5 px-3">Анги бүлэг</th>
                          <th className="py-2.5 px-3">Багшийн нэр</th>
                          <th className="py-2.5 px-3">Нэвтрэх код</th>
                          <th className="py-2.5 px-3">Утас</th>
                          <th className="py-2.5 px-3">Төлөв</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedBulkTeachers.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">{row.className}</td>
                            <td className="py-2 px-3 text-slate-800 font-medium">{row.teacherName}</td>
                            <td className="py-2 px-3 font-mono font-bold text-blue-700">
                              <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                                {row.teacherCode}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600">{row.phone || '-'}</td>
                            <td className="py-2 px-3">
                              {row.isExisting ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  Шинэчлэгдэнэ
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Шинэ анги
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-500">
                      💡 Баталгаажуулсны дараа мэдээллийн сан болон Google Sheet рүү шууд синк хийгдэх ба багш нар энэхүү кодоор системд нэвтэрнэ.
                    </p>
                    <button
                      type="button"
                      onClick={handleBulkRegisterTeachers}
                      className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Багш нарыг баталгаажуулан бүртгэх ({parsedBulkTeachers.length})</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Bulk Result Banner */}
              {bulkTeacherResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-3 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-950">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>
                        CSV файлаас амжилттай бүртгэлээ! ({bulkTeacherResult.createdCount} шинэ анги үүсэж, {bulkTeacherResult.updatedCount} багшийн мэдээлэл шинэчлэгдлээ)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={copyAllTeacherCodes}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
                    >
                      {copiedAllCodes ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Бүх код хуулагдлаа!</span>
                        </>
                      ) : (
                        <>
                          <ClipboardCopy className="w-3.5 h-3.5" />
                          <span>Багш нарын кодыг хуулж авах</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Та "Багш нарын кодыг хуулж авах" товчийг дарж багш нарын групп чат руу (Telegram, Viber, Facebook) нэвтрэх заавартай нь хамт шууд хуулж илгээх боломжтой. Бүх өгөгдөл мэдээллийн сан болон Google Sheet рүү амжилттай хадгалагдлаа.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Classes Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <School className="w-4 h-4 text-blue-600" />
                  <span>Сургуулийн ангиудын бүртгэл & Багшийн кодууд</span>
                </h3>
                <p className="text-xs text-slate-500">Бүртгэлтэй нийт анги, хариуцсан багш, нэвтрэх код ба судалгааны явц</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={copyAllTeacherCodes}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="Бүх багшийн нэвтрэх кодыг хуулах"
                >
                  {copiedAllCodes ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Бүх код хуулагдлаа!</span>
                    </>
                  ) : (
                    <>
                      <ClipboardCopy className="w-3.5 h-3.5" />
                      <span>Бүх багшийн кодыг хуулах</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowAllTeacherCodesModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Бүх багшийн кодыг нэгдсэн хүснэгтээр харах"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>Жагсаалт харах</span>
                </button>

                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs">
                  Нийт анги: {classes.length}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Анги</th>
                    <th className="py-3 px-4">Төлөв</th>
                    <th className="py-3 px-4">Ангийн багш</th>
                    <th className="py-3 px-4">Багшийн нэвтрэх код</th>
                    <th className="py-3 px-4">Утас</th>
                    <th className="py-3 px-4">Сурагчдын тоо</th>
                    <th className="py-3 px-4">Бөглөсөн</th>
                    <th className="py-3 px-4">Хувь</th>
                    <th className="py-3 px-4 text-right">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classes.map((cls) => {
                    const classStudents = students.filter((s) => s.classId === cls.id);
                    const classSubmitted = classStudents.filter((s) => s.isSubmitted).length;
                    const cRate = classStudents.length > 0 ? Math.round((classSubmitted / classStudents.length) * 100) : 0;
                    const tch = teachers.find((t) => t.classId === cls.id || t.className === cls.name);

                    return (
                      <tr key={cls.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-bold text-slate-900">{cls.name}</td>
                        <td className="py-3 px-4">
                          {cls.isLocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <Lock className="w-3 h-3 text-rose-600" />
                              <span>Дууссан (Хаагдсан)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Unlock className="w-3 h-3 text-emerald-600" />
                              <span>Судалгаа идэвхтэй</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{cls.teacherName || tch?.name || 'Багш'}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              {cls.teacherCode}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">{tch?.phone || '-'}</td>
                        <td className="py-3 px-4 text-slate-600">{classStudents.length}</td>
                        <td className="py-3 px-4 text-emerald-700 font-semibold">{classSubmitted}</td>
                        <td className="py-3 px-4 font-semibold">{cRate}%</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Lock / Conclude risk assessment toggle */}
                            {cls.isLocked ? (
                              <button
                                onClick={() => setClassToToggleLock(cls)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold transition-colors cursor-pointer text-xs"
                                title="Энэ ангийн эрсдэлийн үнэлгээг дахин нээх"
                              >
                                <Unlock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Нээх</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setClassToToggleLock(cls)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold transition-colors cursor-pointer text-xs"
                                title="Энэ ангийн эрсдэлийн үнэлгээ дууссан гэж тэмдэглэн судалгааг хаах"
                              >
                                <Lock className="w-3.5 h-3.5 text-rose-600" />
                                <span>Үнэлгээ дуусгах</span>
                              </button>
                            )}

                            <button
                              onClick={() => copyToClipboard(cls.teacherCode)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer text-xs"
                              title="Код хуулах"
                            >
                              {copiedCode === cls.teacherCode ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700">Хуулагдлаа</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-slate-500" />
                                  <span>Хуулах</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => setClassToDelete(cls)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                              title="Ангийг устгах"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Teachers Table with Delete Teacher capability */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Бүртгэлтэй багш нар & Эрх удирдах</h3>
                <p className="text-xs text-slate-500">Багш нарын мэдээлэл, нэвтрэх код болон багш устгах эрх</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs">
                Нийт багш: {teachers.length}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">№</th>
                    <th className="py-3 px-4">Багшийн нэр</th>
                    <th className="py-3 px-4">Хариуцсан анги</th>
                    <th className="py-3 px-4">Багшийн нэвтрэх код</th>
                    <th className="py-3 px-4">Утас</th>
                    <th className="py-3 px-4 text-right">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teachers.map((tch, idx) => (
                    <tr key={tch.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{tch.name}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{tch.className || 'Ангигүй'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{tch.teacherCode}</td>
                      <td className="py-3 px-4 text-slate-600">{tch.phone || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => copyToClipboard(tch.teacherCode)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                            title="Код хуулах"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Хуулах</span>
                          </button>
                          <button
                            onClick={() => setTeacherToDelete(tch)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium transition-colors cursor-pointer"
                            title="Багшийн эрхийг устгах"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Устгах</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {teachers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        Бүртгэлтэй багш одоогоор алга байна.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CLASS COMPARISON */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <ClassRiskComparisonChart
            classComparisons={classComparisons}
            onSelectClass={handleSelectClassDrillDown}
          />
          <ClassComparisonTable
            classComparisons={classComparisons}
            onSelectClass={handleSelectClassDrillDown}
          />
        </div>
      )}

      {/* TAB: SUBGROUPS & RISK ANALYSIS */}
      {activeTab === 'subgroups' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Сургуулийн түвшний 8 бүлэг, дэд бүлэг & асуултын эрсдэлийн шинжилгээ
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Судалгааны бүх хариултаар тооцоолсон эрсдэлийн үнэлгээ (Эрсдэлтэй хариулсан тоо болон хувиар). Дэд бүлэг тус бүр дээр дарж асуултын нарийвчилсан задаргааг харна уу.
            </p>

            <div className="space-y-4">
              {schoolAnalytics.sectionStats.map((sec) => (
                <div key={sec.id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/40">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-3 mb-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {sec.shortTitle}: {sec.title}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Нийт асуулт: {sec.totalQuestions} | Эрсдэлтэй хариулт өгсөн сурагч: {sec.riskStudentsCount}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{sec.scorePercentage}%</span>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor:
                            sec.riskLevel === 'high' ? '#fee2e2' : sec.riskLevel === 'medium' ? '#fef3c7' : '#dcfce7',
                          color:
                            sec.riskLevel === 'high' ? '#b91c1c' : sec.riskLevel === 'medium' ? '#b45309' : '#15803d',
                        }}
                      >
                        {sec.riskLevel === 'high' ? 'Өндөр эрсдэл' : sec.riskLevel === 'medium' ? 'Дунд эрсдэл' : 'Бага эрсдэл'}
                      </span>
                    </div>
                  </div>

                  {/* Subgroups within section */}
                  <div className="space-y-2.5">
                    {sec.subgroups.map((sub) => {
                      const subKey = `admin-${sec.id}-${sub.id}`;
                      const isExpanded = expandedSubgroups.has(subKey);

                      return (
                        <div key={sub.id} className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                          <div
                            onClick={() => toggleSubgroupExpand(subKey)}
                            className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <span className="font-semibold text-xs text-slate-800">
                              {sub.title}
                            </span>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs font-bold text-slate-700">
                                {sub.scorePercentage}%
                              </span>
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold"
                                style={{
                                  backgroundColor:
                                    sub.riskLevel === 'high' ? '#fee2e2' : sub.riskLevel === 'medium' ? '#fef3c7' : '#dcfce7',
                                  color:
                                    sub.riskLevel === 'high' ? '#b91c1c' : sub.riskLevel === 'medium' ? '#b45309' : '#15803d',
                                }}
                              >
                                {sub.riskLevel === 'high' ? 'Өндөр' : sub.riskLevel === 'medium' ? 'Дунд' : 'Бага'}
                              </span>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
                              {sub.questions.map((q) => (
                                <div key={q.id} className="border-b border-slate-200/60 pb-3 last:border-0 last:pb-0">
                                  <div className="flex justify-between items-start gap-2 text-xs mb-1.5">
                                    <span className="font-medium text-slate-900">
                                      {q.code}. {q.text}
                                    </span>
                                    <span className="font-bold text-red-600 shrink-0">
                                      {q.riskPercentage}% ({q.riskAnswersCount} сурагч)
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                                    {q.options.map((opt, i) => (
                                      <div
                                        key={i}
                                        className={`p-2 rounded-lg border ${
                                          opt.isRisk
                                            ? 'bg-red-50 border-red-200 text-red-800'
                                            : 'bg-white border-slate-200 text-slate-700'
                                        }`}
                                      >
                                        <div className="truncate font-medium">{opt.text}</div>
                                        <div className="font-bold mt-0.5">
                                          {opt.count} сурагч ({opt.percentage}%)
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RETAKE & STUDENTS MANAGEMENT */}
      {activeTab === 'retake' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Toolbar */}
            <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row justify-between lg:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">
                    Сурагчдын нэгдсэн бүртгэл & Эрх удирдах
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    Илэрц: {filteredRetakeStudents.length} / {students.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Сурагчдыг check-лэж сонгон олноор нь устгах, эсвэл дахин бөглөх эрх олгох / хаах
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                {/* Class Filter */}
                <div>
                  <select
                    id="select-class-filter"
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                  >
                    <option value="ALL">Бүх ангиуд ({students.length})</option>
                    {classes.map((cls) => {
                      const count = students.filter((s) => s.classId === cls.id).length;
                      return (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} анги ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    id="select-status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                  >
                    <option value="ALL">Бүх төлөв</option>
                    <option value="SUBMITTED">
                      Илгээсэн ({students.filter((s) => s.isSubmitted).length})
                    </option>
                    <option value="UNSUBMITTED">
                      Бөглөөгүй ({students.filter((s) => !s.isSubmitted).length})
                    </option>
                  </select>
                </div>

                {/* Search */}
                <div className="relative min-w-[200px] flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    id="input-retake-search"
                    placeholder="Нэр, кодоор хайх..."
                    value={retakeSearch}
                    onChange={(e) => setRetakeSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Bulk Action Bar when items selected */}
            {selectedStudentIds.length > 0 && (
              <div className="bg-blue-50/90 border-b border-blue-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {selectedStudentIds.length}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-blue-900">
                      Сонгогдсон сурагч: {selectedStudentIds.length}
                    </span>
                    <span className="text-xs text-blue-600 ml-2 hidden sm:inline">
                      (Хүснэгтээс {selectedStudentIds.length} сурагчийг check-лэсэн)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-xs text-blue-700 hover:text-blue-900 underline font-semibold ml-2 cursor-pointer"
                  >
                    Сонголтыг арилгах
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBulkToggleRetake(true)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="Сонгосон сурагчдад дахин бөглөх эрх нээх"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Дахин бөглөх эрх олгох</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBulkToggleRetake(false)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="Сонгосон сурагчдын дахин бөглөх эрхийг хаах"
                  >
                    <span>Эрх хаах</span>
                  </button>

                  <button
                    type="button"
                    id="btn-bulk-delete-students"
                    onClick={() => setIsBulkDeleteModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Сонгосон ({selectedStudentIds.length}) сурагчийг устгах</span>
                  </button>
                </div>
              </div>
            )}

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4 w-12 text-center">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          id="checkbox-select-all-students"
                          checked={
                            filteredRetakeStudents.length > 0 &&
                            filteredRetakeStudents.every((s) => selectedStudentIds.includes(s.id))
                          }
                          onChange={handleSelectAllVisible}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                          title="Энэ хуудсан дээрх бүх сурагчийг сонгох / болих"
                        />
                      </div>
                    </th>
                    <th className="py-3 px-4">Код</th>
                    <th className="py-3 px-4">Сурагчийн нэр</th>
                    <th className="py-3 px-4">Анги</th>
                    <th className="py-3 px-4">Судалгааны төлөв</th>
                    <th className="py-3 px-4">Дахин бөглөх эрх</th>
                    <th className="py-3 px-4 text-right">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRetakeStudents.map((s) => {
                    const isChecked = selectedStudentIds.includes(s.id);
                    return (
                      <tr
                        key={s.id}
                        className={`transition-colors ${
                          isChecked ? 'bg-blue-50/70 font-medium' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectStudent(s.id)}
                              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">{s.studentCode}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{s.fullName}</td>
                        <td className="py-3 px-4 text-slate-600 font-semibold">{s.className}</td>
                        <td className="py-3 px-4">
                          {s.isSubmitted ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                              Илгээсэн
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                              Бөглөөгүй
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {s.canRetake ? (
                            <span className="text-amber-700 font-bold flex items-center gap-1">
                              <RotateCcw className="w-3 h-3 text-amber-600" />
                              <span>Нээлттэй (Дахин бөглөж болно)</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">Хаалттай</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleRetake(s.id, Boolean(s.canRetake))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                s.canRetake
                                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                              }`}
                            >
                              {s.canRetake ? 'Эрхийг хаах' : 'Дахин бөглөх эрх олгох'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentToDelete(s)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer"
                              title="Сурагчийг устгах"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Устгах</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRetakeStudents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Шүүлтүүр эсвэл хайлтад тохирох сурагч олдсонгүй.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SCHOOL & YEAR SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl">
          <h3 className="font-bold text-slate-900 text-base mb-1">
            Сургуулийн үндсэн тохиргоо
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Тайлан, Excel экспорт болон нүүр хуудсанд харагдах үндсэн өгөгдөл
          </p>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Сургуулийн нэр
              </label>
              <input
                type="text"
                value={settings.schoolName}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Хичээлийн жил
              </label>
              <input
                type="text"
                value={settings.academicYear}
                onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Өөрчлөлтийг хадгалах
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: SYSTEM LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm">
              Аюулгүй байдал & Үйлдлийн лог бүртгэл (Audit Trail)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Хугацаа</th>
                  <th className="py-3 px-4">Хэрэглэгчийн эрх</th>
                  <th className="py-3 px-4">Нэр</th>
                  <th className="py-3 px-4">Үйлдэл</th>
                  <th className="py-3 px-4">Дэлгэрэнгүй тайлбар</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('mn-MN')}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full font-semibold uppercase text-[10px] bg-slate-100 text-slate-700">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">{log.userName}</td>
                    <td className="py-2.5 px-4 font-mono text-blue-700 font-semibold">{log.action}</td>
                    <td className="py-2.5 px-4 text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
          </>
        )}
      </div>

      {/* BULK DELETE STUDENTS CONFIRMATION MODAL */}
      {isBulkDeleteModalOpen && selectedStudentsList.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-red-50/70">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <h3 className="font-bold text-base text-slate-900">
                  Сурагчдыг олноор нь устгах ({selectedStudentsList.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <p className="text-sm text-slate-700">
                Та нийт <strong className="text-red-600 font-bold">{selectedStudentsList.length}</strong> сурагчийн бүртгэлийг системээс олноор нь устгах гэж байна:
              </p>

              {/* List of selected students */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
                {selectedStudentsList.map((st) => (
                  <div key={st.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-blue-700 shrink-0">{st.studentCode}</span>
                      <span className="font-semibold text-slate-900 truncate">{st.fullName}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-medium shrink-0">
                        {st.className}
                      </span>
                    </div>
                    <span className="text-[11px] shrink-0 text-slate-500">
                      {st.isSubmitted ? 'Илгээсэн хариулттай' : 'Хариултгүй'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Анхаар: Буцаах боломжгүй үйлдэл</span>
                </div>
                <p className="text-[11px] text-red-600 leading-relaxed">
                  Сонгогдсон сурагчдын нэвтрэх эрх, бүртгэл болон бөглөсөн судалгааны бүх хариулт, ноорог өгөгдөл системээс бүрмөсөн устах болно.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Цуцлах
              </button>
              <button
                type="button"
                onClick={confirmBulkDeleteStudents}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Тийм, сонгосон {selectedStudentsList.length} сурагчийг устгах</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE STUDENT CONFIRMATION MODAL */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-red-50/50">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <h3 className="font-bold text-base text-slate-900">Сурагчийн бүртгэл устгах</h3>
              </div>
              <button
                onClick={() => setStudentToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Та дараах сурагчийг системээс бүрэн устгахдаа итгэлтэй байна уу?
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Сурагчийн нэр:</span>
                  <strong className="text-slate-900 text-sm">{studentToDelete.fullName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Сурагчийн код:</span>
                  <strong className="text-blue-700 font-mono">{studentToDelete.studentCode}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Анги:</span>
                  <span className="text-slate-800 font-medium">{studentToDelete.className}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Судалгааны төлөв:</span>
                  <span className={studentToDelete.isSubmitted ? 'text-emerald-700 font-semibold' : 'text-slate-600 font-medium'}>
                    {studentToDelete.isSubmitted ? 'Илгээсэн (Хариулт байна)' : 'Бөглөөгүй'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Анхаар: Буцаах боломжгүй үйлдэл</span>
                </div>
                <p className="text-[11px] text-red-600 leading-relaxed">
                  Сурагчийн бүртгэл, нэвтрэх эрх болон илгээсэн судалгааны бүх хариулт, ноорог бүрмөсөн устах болно.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setStudentToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Цуцлах
                </button>
                <button
                  onClick={confirmDeleteStudent}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Тийм, сурагчийг устгах</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE TEACHER CONFIRMATION MODAL */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-red-50/50">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <h3 className="font-bold text-base text-slate-900">Багшийн эрхийг устгах</h3>
              </div>
              <button
                onClick={() => setTeacherToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Та дараах багшийн бүртгэл болон нэвтрэх эрхийг устгахдаа итгэлтэй байна уу?
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Багшийн нэр:</span>
                  <strong className="text-slate-900 text-sm">{teacherToDelete.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Нэвтрэх код:</span>
                  <strong className="text-blue-700 font-mono">{teacherToDelete.teacherCode}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Хариуцсан анги:</span>
                  <span className="text-slate-800 font-medium">{teacherToDelete.className || 'Ангигүй'}</span>
                </div>
                {teacherToDelete.phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Утас:</span>
                    <span className="text-slate-700">{teacherToDelete.phone}</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1">
                <p className="text-[11px] text-red-600 leading-relaxed">
                  Уг багшийн код хүчингүй болж, багшийн хэсгээр нэвтрэх боломжгүй болно.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setTeacherToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Цуцлах
                </button>
                <button
                  onClick={confirmDeleteTeacher}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Тийм, багшийг устгах</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CLASS CONFIRMATION MODAL */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-red-50/50">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <h3 className="font-bold text-base text-slate-900">Ангийн бүртгэл устгах</h3>
              </div>
              <button
                onClick={() => setClassToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Та дараах анги болон түүнд харьяалагдах багшийн эрхийг устгахдаа итгэлтэй байна уу?
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Анги:</span>
                  <strong className="text-slate-900 text-sm">{classToDelete.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ангийн багш:</span>
                  <span className="text-slate-800 font-medium">{classToDelete.teacherName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Багшийн код:</span>
                  <strong className="text-blue-700 font-mono">{classToDelete.teacherCode}</strong>
                </div>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1">
                <p className="text-[11px] text-red-600 leading-relaxed">
                  Энэхүү анги болон холбогдох багшийн нэвтрэх эрх системээс устана.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setClassToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Цуцлах
                </button>
                <button
                  onClick={confirmDeleteClass}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Тийм, ангийг устгах</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOCK / CONCLUDE RISK ASSESSMENT CONFIRMATION MODAL */}
      {classToToggleLock && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div
              className={`p-5 border-b border-slate-200 flex justify-between items-center ${
                classToToggleLock.isLocked ? 'bg-amber-50/70' : 'bg-rose-50/70'
              }`}
            >
              <div className="flex items-center gap-2">
                {classToToggleLock.isLocked ? (
                  <Unlock className="w-5 h-5 text-amber-600 shrink-0" />
                ) : (
                  <Lock className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <h3 className="font-bold text-base text-slate-900">
                  {classToToggleLock.isLocked
                    ? 'Ангийн судалгааг дахин нээх'
                    : 'Ангийн эрсдэлийн үнэлгээг дуусгах (Түгжих)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setClassToToggleLock(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Анги:</span>
                  <strong className="text-slate-900 text-sm">{classToToggleLock.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ангийн багш:</span>
                  <span className="text-slate-800 font-medium">{classToToggleLock.teacherName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Одоогийн төлөв:</span>
                  <span
                    className={`font-semibold ${
                      classToToggleLock.isLocked ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {classToToggleLock.isLocked ? 'Түгжигдсэн (Хаагдсан)' : 'Идэвхтэй (Судалгаа нээлттэй)'}
                  </span>
                </div>
              </div>

              {classToToggleLock.isLocked ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-amber-900">
                    <Unlock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Судалгааг дахин нээх</span>
                  </p>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Энэ ангийн сурагчид судалгаа бөглөх болон ангийн багш шаардлагатай бол дахин өгөх эрх олгох боломжтой болно.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-rose-900">
                    <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Үнэлгээ дуусгах (Судалгааг хаах)</span>
                  </p>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    <strong>{classToToggleLock.name}</strong> ангийн эрсдэлийн үнэлгээ бүрэн дууссан гэж тооцогдох ба <strong>сурагчид шинээр болон дахин судалгаа бөглөх боломжгүйгээр бүрэн хаагдана</strong>. Мөн ангийн багш дахин өгөх эрх нээх боломжгүй болно.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClassToToggleLock(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Цуцлах
                </button>
                <button
                  type="button"
                  onClick={confirmToggleClassLock}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                    classToToggleLock.isLocked
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {classToToggleLock.isLocked ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Тийм, судалгааг дахин нээх</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Тийм, үнэлгээг дуусгаж түгжих</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ALL TEACHER CODES MODAL */}
      {showAllTeacherCodesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <School className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">Бүх багшийн нэвтрэх код</h3>
                  <p className="text-xs text-slate-500">Нийт {classes.length} анги ба багшийн мэдээлэл</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyAllTeacherCodes}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  {copiedAllCodes ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Бүх код хуулагдлаа!</span>
                    </>
                  ) : (
                    <>
                      <ClipboardCopy className="w-3.5 h-3.5" />
                      <span>Жагсаалтыг хуулах</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAllTeacherCodesModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 border-b border-blue-100 text-xs text-blue-900">
              <p className="font-semibold">📱 Багш нэвтрэх заавар:</p>
              <p className="text-[11px] text-blue-800 mt-0.5">
                Багш нэвтрэхдээ <strong>Нэвтрэх нэр:</strong> Анги бүлэг (жишээ: <strong>7А</strong>) эсвэл Багшийн код (жишээ: <strong>TEACH-7A</strong>), <strong>Нууц үг:</strong> Нэвтрэх кодоо (эсвэл баталгаажсан нууц үгээ) зөв оруулж нэвтэрнэ.
              </p>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                    <th className="py-2.5 px-3">№</th>
                    <th className="py-2.5 px-3">Анги</th>
                    <th className="py-2.5 px-3">Ангийн багш</th>
                    <th className="py-2.5 px-3">Нэвтрэх код</th>
                    <th className="py-2.5 px-3">Утас</th>
                    <th className="py-2.5 px-3 text-right">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classes.map((cls, idx) => {
                    const tch = teachers.find((t) => t.classId === cls.id || t.className === cls.name);
                    return (
                      <tr key={cls.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{cls.name}</td>
                        <td className="py-2.5 px-3 text-slate-800 font-medium">{cls.teacherName || tch?.name || 'Багш'}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {cls.teacherCode}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono">{tch?.phone || '-'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(cls.teacherCode)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer text-xs"
                          >
                            {copiedCode === cls.teacherCode ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700">Хуулагдлаа</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-500" />
                                <span>Хуулах</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllTeacherCodesModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors cursor-pointer"
              >
                Хаах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
