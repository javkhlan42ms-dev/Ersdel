import React, { useState, useMemo } from 'react';
import { ActiveSession, StorageService } from '../utils/storage';
import { Student, SchoolClass } from '../types';
import { RAW_QUESTIONS, SECTIONS } from '../data/questions';
import { evaluateStudentRisk } from '../utils/riskCalculator';
import { exportSurveyDataToExcel } from '../utils/excelExport';
import {
  calculateSurveyAnalytics,
  getRiskLevelBadge,
  QuestionStat,
  SubgroupStat,
  SectionStat
} from '../utils/surveyAnalytics';
import { DashboardSidebar, SidebarItem } from './dashboard/DashboardSidebar';
import { TeacherKPICards } from './dashboard/KPICards';
import { RiskDonutChart, GroupsHorizontalBarChart } from './dashboard/RiskCharts';
import { AttentionSection } from './dashboard/AttentionSection';
import {
  Users,
  CheckCircle,
  Clock,
  Percent,
  Download,
  Printer,
  Plus,
  AlertTriangle,
  Search,
  KeyRound,
  FileText,
  BarChart3,
  ShieldCheck,
  Eye,
  X,
  Upload,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Check,
  Info,
  Layers,
  HelpCircle,
  Lock,
  RefreshCw,
  UploadCloud,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface TeacherDashboardProps {
  session: ActiveSession;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ session }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'roster' | 'subgroups' | 'add'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'unsubmitted'>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sortField, setSortField] = useState<'code' | 'name' | 'status' | 'risk'>('code');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [expandedSubgroups, setExpandedSubgroups] = useState<Set<string>>(new Set());
  const [selectedSectionId, setSelectedSectionId] = useState<number | 'all'>('all');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);

  // Single student addition state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'1' | '2'>('1');

  // Bulk import state
  const [bulkText, setBulkText] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');

  // Load class and student data
  const classes = StorageService.getClasses();
  const currentClass = useMemo(() => {
    return classes.find((c) => c.id === session.classId || c.name === session.className) || {
      id: session.classId || 'CLS_7A',
      name: session.className || '7А',
      grade: 7,
      sectionLetter: 'А',
      teacherCode: 'TEACH-' + (session.className || '7A'),
      teacherName: session.userName || 'Багш',
      academicYear: '2025-2026',
      schoolName: 'Сургууль'
    } as SchoolClass;
  }, [classes, session.classId, session.className, session.userName]);

  const [students, setStudents] = useState<Student[]>(() => {
    return StorageService.getStudents(currentClass.id);
  });

  const responsesMap = StorageService.getAllResponses();

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [isPushingCloud, setIsPushingCloud] = useState(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState<string | null>(null);

  const refreshStudents = () => {
    setStudents(StorageService.getStudents(currentClass.id));
  };

  const handleCloudPush = async () => {
    setIsPushingCloud(true);
    setCloudSyncMsg(null);
    try {
      const res = await StorageService.syncAllToCloudDatabase();
      setCloudSyncMsg(res.message);
      setTimeout(() => setCloudSyncMsg(null), 5000);
    } catch (err: any) {
      setCloudSyncMsg('Хадгалахад алдаа гарлаа: ' + (err.message || 'Сүлжээгээ шалгана уу'));
    } finally {
      setIsPushingCloud(false);
    }
  };

  const handleCloudPull = async () => {
    setIsSyncingCloud(true);
    setCloudSyncMsg(null);
    try {
      const res = await StorageService.loadAllFromCloudDatabase();
      refreshStudents();
      setCloudSyncMsg(res.message);
      setTimeout(() => setCloudSyncMsg(null), 5000);
    } catch (err: any) {
      setCloudSyncMsg('Шинэчлэхэд алдаа гарлаа: ' + (err.message || ''));
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Pre-calculate full survey analytics (hierarchical questions, subgroups, sections, attention areas)
  const analytics = useMemo(() => {
    return calculateSurveyAnalytics(students, responsesMap);
  }, [students, responsesMap]);

  // Basic stats
  const totalCount = students.length;
  const completedCount = students.filter((s) => s.isSubmitted).length;
  const pendingCount = totalCount - completedCount;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 1000) / 10 : 0;

  // Student-specific evaluations
  const studentEvaluationsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof evaluateStudentRisk>>();
    students.forEach((s) => {
      const sAnswers = responsesMap[s.id] || {};
      map.set(s.id, evaluateStudentRisk(s, sAnswers));
    });
    return map;
  }, [students, responsesMap]);

  // Risk counts (ONLY submitted students, per Rule 3 & 17)
  const riskCounts = useMemo(() => {
    let low = 0;
    let med = 0;
    let high = 0;

    students.forEach((s) => {
      if (!s.isSubmitted) return;
      const r = studentEvaluationsMap.get(s.id);
      if (r?.level === 'high') high++;
      else if (r?.level === 'medium') med++;
      else low++;
    });

    const evaluated = completedCount;
    const lowPct = evaluated > 0 ? Math.round((low / evaluated) * 1000) / 10 : 0;
    const medPct = evaluated > 0 ? Math.round((med / evaluated) * 1000) / 10 : 0;
    const highPct = evaluated > 0 ? Math.round((high / evaluated) * 1000) / 10 : 0;

    return { low, med, high, lowPct, medPct, highPct };
  }, [students, studentEvaluationsMap, completedCount]);

  // Donut chart data
  const donutData = useMemo(() => {
    return [
      { name: 'Бага эрсдэл', value: riskCounts.low, color: '#10B981', pct: riskCounts.lowPct },
      { name: 'Дунд эрсдэл', value: riskCounts.med, color: '#F59E0B', pct: riskCounts.medPct },
      { name: 'Өндөр эрсдэл', value: riskCounts.high, color: '#EF4444', pct: riskCounts.highPct }
    ].filter((d) => d.value > 0);
  }, [riskCounts]);

  // 8 Main Groups Bar Chart Data (color chosen dynamically based on risk level)
  const barChartData = useMemo(() => {
    return analytics.sectionStats.map((sec) => {
      let fillColor = '#10B981'; // Green
      if (sec.riskLevel === 'high') fillColor = '#EF4444'; // Red
      else if (sec.riskLevel === 'medium') fillColor = '#F59E0B'; // Amber

      return {
        id: sec.id,
        name: sec.shortTitle,
        fullName: sec.title,
        scorePct: sec.scorePercentage,
        avgScore: sec.avgScore,
        riskLevel: sec.riskLevel,
        fill: fillColor
      };
    });
  }, [analytics.sectionStats]);

  // Filtered & Sorted Roster for Consolidated Student Table
  const filteredAndSortedStudents = useMemo(() => {
    let result = [...students];

    // Status filter
    if (statusFilter === 'submitted') {
      result = result.filter((s) => s.isSubmitted);
    } else if (statusFilter === 'unsubmitted') {
      result = result.filter((s) => !s.isSubmitted);
    }

    // Risk filter (only applies to submitted)
    if (riskFilter !== 'all') {
      result = result.filter((s) => {
        if (!s.isSubmitted) return false;
        const r = studentEvaluationsMap.get(s.id);
        return r?.level === riskFilter;
      });
    }

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      if (sortField === 'code') {
        valA = a.studentCode;
        valB = b.studentCode;
      } else if (sortField === 'name') {
        valA = a.fullName;
        valB = b.fullName;
      } else if (sortField === 'status') {
        valA = a.isSubmitted ? 1 : 0;
        valB = b.isSubmitted ? 1 : 0;
      } else if (sortField === 'risk') {
        const rA = studentEvaluationsMap.get(a.id);
        const rB = studentEvaluationsMap.get(b.id);
        valA = a.isSubmitted ? (rA?.totalScore || 0) : -1;
        valB = b.isSubmitted ? (rB?.totalScore || 0) : -1;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [students, statusFilter, riskFilter, searchQuery, sortField, sortAsc, studentEvaluationsMap]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredAndSortedStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedStudents.slice(start, start + pageSize);
  }, [filteredAndSortedStudents, currentPage, pageSize]);

  // Subgroups accordion toggling
  const toggleSubgroup = (subId: string) => {
    setExpandedSubgroups((prev) => {
      const next = new Set(prev);
      if (next.has(subId)) next.delete(subId);
      else next.add(subId);
      return next;
    });
  };

  const expandAllSubgroups = () => {
    const all = new Set<string>();
    analytics.sectionStats.forEach((sec) => {
      sec.subgroups.forEach((sub) => all.add(sub.id));
    });
    setExpandedSubgroups(all);
  };

  const collapseAllSubgroups = () => {
    setExpandedSubgroups(new Set());
  };

  // Toggle retake permission
  const handleToggleRetake = (studentId: string, currentRetakeStatus: boolean) => {
    StorageService.allowRetake(
      studentId,
      !currentRetakeStatus,
      'TEACHER',
      session.userName || currentClass.teacherName || 'Ангийн багш'
    );
    refreshStudents();
    if (selectedStudentForDetail && selectedStudentForDetail.id === studentId) {
      setSelectedStudentForDetail((prev) =>
        prev
          ? {
              ...prev,
              canRetake: !currentRetakeStatus,
              isSubmitted: !currentRetakeStatus ? false : prev.isSubmitted
            }
          : null
      );
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    exportSurveyDataToExcel(currentClass, students, responsesMap);
  };

  // Add single student
  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    StorageService.addStudent({
      classId: currentClass.id,
      className: currentClass.name,
      fullName: newStudentName.trim(),
      gender: newStudentGender
    });

    setNewStudentName('');
    refreshStudents();
    setActiveTab('roster');
  };

  // Bulk import
  const handleBulkImport = () => {
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n');
    const parsed: { name: string; gender?: '1' | '2' }[] = [];

    lines.forEach((line) => {
      const clean = line.trim();
      if (!clean) return;

      const parts = clean.split(/[\t,;]+/);
      const name = parts[0].trim();
      let gender: '1' | '2' = '1';

      if (parts[1]) {
        const gStr = parts[1].toLowerCase().trim();
        if (gStr.includes('эр') || gStr === '2') gender = '2';
        else gender = '1';
      }

      if (name) {
        parsed.push({ name, gender });
      }
    });

    if (parsed.length === 0) {
      setBulkMessage('Сурагчийн нэр олдсонгүй.');
      return;
    }

    const created = StorageService.bulkAddStudents(currentClass.id, currentClass.name, parsed);
    setBulkText('');
    setBulkMessage(`Амжилттай: ${created.length} сурагч бүртгэгдэж, код болон нууц үг үүслээ!`);
    refreshStudents();
    setTimeout(() => {
      setBulkMessage('');
      setActiveTab('roster');
    }, 2000);
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Хяналтын самбар',
      icon: <BarChart3 className="w-4 h-4" />,
      active: activeTab === 'dashboard',
      onClick: () => setActiveTab('dashboard'),
    },
    {
      id: 'roster',
      label: 'Сурагчдын хүснэгт',
      icon: <Users className="w-4 h-4" />,
      badge: students.length,
      active: activeTab === 'roster',
      onClick: () => setActiveTab('roster'),
    },
    {
      id: 'subgroups',
      label: 'Дэд бүлгийн шинжилгээ',
      icon: <Layers className="w-4 h-4" />,
      active: activeTab === 'subgroups',
      onClick: () => setActiveTab('subgroups'),
    },
    {
      id: 'add',
      label: 'Сурагч нэмэх & Импорт',
      icon: <Plus className="w-4 h-4" />,
      active: activeTab === 'add',
      onClick: () => setActiveTab('add'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8 flex flex-col lg:flex-row gap-6 items-start">
      {/* 1. FIXED DESKTOP SIDEBAR / RESPONSIVE MOBILE DRAWER */}
      <DashboardSidebar
        title={`${currentClass.name} анги`}
        subtitle={`Багш: ${currentClass.teacherName || session.userName}`}
        roleBadge="Ангийн багш"
        items={sidebarItems}
        actions={[
          {
            label: 'Excel татах (00_Dashboard)',
            icon: <Download className="w-4 h-4" />,
            onClick: handleExportExcel,
            variant: 'success',
          },
          {
            label: 'Сурагчдын код хэвлэх',
            icon: <Printer className="w-4 h-4" />,
            onClick: () => setShowPrintModal(true),
            variant: 'secondary',
          },
        ]}
        isOpenMobile={isMobileMenuOpen}
        onToggleMobile={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 w-full min-w-0">
        {/* Teacher Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 uppercase tracking-wide">
                  {currentClass.name} Анги
                </span>
                <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                  Багшийн код: {currentClass.teacherCode}
                </span>
                <span className="text-xs text-slate-500">
                  Багш: <strong className="text-slate-800">{currentClass.teacherName || session.userName}</strong>
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {currentClass.name} ангийн судалгаа & эрсдэлийн нэгдсэн хяналт
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Сургууль: {currentClass.schoolName} | Хичээлийн жил: {currentClass.academicYear} | 1г эрсдэл 2026
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCloudPush}
                disabled={isPushingCloud}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Ангийн сурагчдын мэдээлэл болон үнэлгээг Google Sheet рүү шууд хадгалж илгээх"
              >
                <UploadCloud className={`w-4 h-4 text-emerald-600 ${isPushingCloud ? 'animate-bounce' : ''}`} />
                <span>{isPushingCloud ? 'Илгээж байна...' : 'Sheet рүү синк хийх'}</span>
              </button>

              <button
                type="button"
                onClick={handleCloudPull}
                disabled={isSyncingCloud}
                className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Google Sheet-ээс сурагчдын шинэ бүртгэл болон бөглөсөн хариултыг татаж шинэчлэх"
              >
                <RefreshCw className={`w-4 h-4 text-blue-600 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                <span>{isSyncingCloud ? 'Татаж байна...' : 'Sheet сангаас шинэчлэх'}</span>
              </button>

              <button
                onClick={() => setShowPrintModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Сурагчдын нэвтрэх код, нууц үгийг хэвлэх"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Код хэвлэх</span>
              </button>

              <button
                id="btn-export-excel"
                onClick={handleExportExcel}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="00_Dashboard тэргүүтэй 14 хуудас бүхий албан ёсны Excel тайлан татах"
              >
                <Download className="w-4 h-4" />
                <span>Excel татах (14 хуудас)</span>
              </button>
            </div>
          </div>

          {cloudSyncMsg && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2 animate-fadeIn">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
              <span>{cloudSyncMsg}</span>
            </div>
          )}
        </div>

        {/* Horizontal Tabs Header for quick navigation */}
        <div className="border-b border-slate-200 mb-6 flex gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Хяналтын самбар</span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'roster'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Сурагчдын нэгдсэн хүснэгт ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('subgroups')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'subgroups'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Дэд бүлэг & Асуултын шинжилгээ</span>
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'add'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Сурагч нэмэх / Excel импорт</span>
          </button>
        </div>

        {/* DASHBOARD TAB SPECIFIC COMPONENTS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 mb-6">
            {/* 4 KPI Cards */}
            <TeacherKPICards
              totalStudents={totalCount}
              submittedCount={completedCount}
              unsubmittedCount={pendingCount}
              completionRate={completionRate}
            />

            {/* Empty student warning */}
            {totalCount === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-bold text-sm text-slate-900">Энэ ангид одоогоор бүртгэлтэй сурагч алга байна.</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Дээрх "Сурагч нэмэх / Excel импорт" цэсээр сурагчдаа бүртгэнэ үү.
                </p>
              </div>
            )}

            {/* Attention Section (Top high-risk indicators with drill-down) */}
            {totalCount > 0 && (
              <AttentionSection
                attentionItems={analytics.attentionItems}
                onFilterHighRisk={() => {
                  setRiskFilter('high');
                  setActiveTab('roster');
                }}
              />
            )}

            {/* Visual Charts: Donut + 8 Groups Horizontal Bar Chart with drill-down */}
            {totalCount > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RiskDonutChart
                  low={riskCounts?.low ?? 0}
                  med={riskCounts?.med ?? 0}
                  high={riskCounts?.high ?? 0}
                  totalSubmitted={completedCount}
                  title="Ангийн эрсдэлийн ерөнхий харьцаа"
                  onSelectRisk={(level) => {
                    setRiskFilter(level);
                    setActiveTab('roster');
                  }}
                />

                <GroupsHorizontalBarChart
                  sectionStats={analytics.sectionStats}
                  title="8 Бүлгийн эрсдэлийн дундаж үнэлгээ"
                  onSelectSection={(secId) => {
                    setSelectedSectionId(secId);
                    setActiveTab('subgroups');
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT 1: CONSOLIDATED STUDENT TABLE (СУРАГЧДЫН НЭГДСЭН ХҮСНЭГТ) */}
        {(activeTab === 'roster' || activeTab === 'dashboard') && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-3 items-start md:items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Сурагчдын нэгдсэн хүснэгт (I - VIII бүлэг ба нийт эрсдэл)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Сурагчийн мөр дээр дарж хувийн дэлгэрэнгүй хариулт, эрсдэлийн картыг нээнэ үү.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Search */}
              <div className="relative min-w-[200px] flex-1 md:flex-initial">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Нэр, кодоор хайх..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Бүх төлөв</option>
                <option value="submitted">Бөглөсөн ({completedCount})</option>
                <option value="unsubmitted">Бөглөөгүй ({pendingCount})</option>
              </select>

              {/* Risk Filter */}
              <select
                value={riskFilter}
                onChange={(e) => {
                  setRiskFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Бүх эрсдэл</option>
                <option value="low">🟢 Бага эрсдэл</option>
                <option value="medium">🟡 Дунд эрсдэл</option>
                <option value="high">🔴 Өндөр эрсдэл</option>
              </select>
            </div>
          </div>

          {/* Consolidated Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold select-none">
                  <th className="py-3 px-3 w-10 text-center">№</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:bg-slate-200/60"
                    onClick={() => {
                      if (sortField === 'code') setSortAsc(!sortAsc);
                      else { setSortField('code'); setSortAsc(true); }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Код</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:bg-slate-200/60"
                    onClick={() => {
                      if (sortField === 'name') setSortAsc(!sortAsc);
                      else { setSortField('name'); setSortAsc(true); }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Овог нэр</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-2 text-center">Хүйс</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 text-center"
                    onClick={() => {
                      if (sortField === 'status') setSortAsc(!sortAsc);
                      else { setSortField('status'); setSortAsc(true); }
                    }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Судалгаа</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  {/* 8 Section Scores: I through VIII */}
                  <th className="py-3 px-2 text-center text-[11px] font-bold" title="I. Ерөнхий мэдээлэл">I</th>
                  <th className="py-3 px-2 text-center text-[11px] font-bold" title="II. Эцэг эх, асран хамгаалагч">II</th>
                  <th className="py-3 px-2 text-center text-[11px] font-bold" title="III. Эрүүл мэнд, амьдрах эрх">III</th>
                  <th className="py-3 px-2 text-center text-[11px] font-bold" title="IV. Нийгмийн амьдрал">IV</th>
                  <th className="py-3 px-2 text-center text-[11px] font-bold" title="V. Сурч боловсрох">V</th>
                  <th className="py-3 px-2 text-center text-[11px] font-bold" title="VI. Хөдөлмөр эрхлэлт">VI</th>
                  <th className="py-3 px-2 text-center text-[11px] font-bold" title="VII. Орчны эрсдэл">VII</th>
                  <th className="py-3 px-2 text-center text-[11px] font-bold" title="VIII. Гэр бүл, зан чанар">VIII</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 text-center"
                    onClick={() => {
                      if (sortField === 'risk') setSortAsc(!sortAsc);
                      else { setSortField('risk'); setSortAsc(false); }
                    }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Нийт эрсдэл</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.length > 0 ? (
                  paginatedStudents.map((s, idx) => {
                    const rEval = studentEvaluationsMap.get(s.id);
                    const isHigh = s.isSubmitted && rEval?.level === 'high';
                    const isMed = s.isSubmitted && rEval?.level === 'medium';

                    return (
                      <tr
                        key={s.id}
                        className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${
                          isHigh ? 'bg-red-50/20' : isMed ? 'bg-amber-50/10' : ''
                        }`}
                        onClick={() => setSelectedStudentForDetail(s)}
                      >
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {s.studentCode}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {s.fullName}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-600">
                          {s.gender === '1' ? 'Эм' : s.gender === '2' ? 'Эр' : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {s.isSubmitted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle className="w-3 h-3" /> Бөглөсөн
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" /> Бөглөөгүй
                            </span>
                          )}
                        </td>

                        {/* Section columns: 1 through 8 */}
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((secNum) => {
                          const secScore = s.isSubmitted && rEval ? (rEval.sectionScores[secNum] || 0) : null;
                          let colorClass = 'text-slate-400';
                          if (secScore !== null) {
                            if (secScore >= 3) colorClass = 'text-red-700 bg-red-100 font-bold';
                            else if (secScore >= 1) colorClass = 'text-amber-700 bg-amber-100 font-semibold';
                            else colorClass = 'text-emerald-700 bg-emerald-50';
                          }

                          return (
                            <td key={secNum} className="py-2.5 px-1.5 text-center">
                              {s.isSubmitted ? (
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] min-w-[22px] ${colorClass}`}>
                                  {secScore}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Total Risk */}
                        <td className="py-2.5 px-3 text-center">
                          {!s.isSubmitted ? (
                            <span className="text-slate-400 text-[11px]">-</span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                rEval?.level === 'high'
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : rEval?.level === 'medium'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              <span>{rEval?.level === 'high' ? '🔴 Өндөр' : rEval?.level === 'medium' ? '🟡 Дунд' : '🟢 Бага'}</span>
                              <span className="text-[10px] opacity-75">({rEval?.totalScore} оноо)</span>
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedStudentForDetail(s)}
                              className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                              title="Дэлгэрэнгүй харах"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {s.isSubmitted && (
                              <button
                                onClick={() => handleToggleRetake(s.id, Boolean(s.canRetake))}
                                className={`p-1 rounded-lg cursor-pointer transition-colors ${
                                  s.canRetake
                                    ? 'text-amber-700 bg-amber-100 hover:bg-amber-200'
                                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                }`}
                                title={s.canRetake ? 'Дахин бөглөх эрх нээлттэй' : 'Дахин бөглөх эрх олгох'}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={15} className="py-12 text-center text-slate-400">
                      Шүүлтүүрт тохирох сурагч олдсонгүй.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Нийт <strong>{filteredAndSortedStudents.length}</strong> сурагчаас{' '}
              <strong>{(currentPage - 1) * pageSize + 1}</strong> -{' '}
              <strong>{Math.min(currentPage * pageSize, filteredAndSortedStudents.length)}</strong>-г харуулж байна
            </div>

            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value={10}>10-аар</option>
                <option value={15}>15-аар</option>
                <option value={25}>25-аар</option>
                <option value={50}>50-аар</option>
              </select>

              <div className="flex gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                >
                  Өмнөх
                </button>
                <span className="px-2.5 py-1 font-semibold text-slate-800">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                >
                  Дараах
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: SUBGROUPS & QUESTION BREAKDOWN (ДЭД БҮЛЭГ & АСУУЛТЫН ШИНЖИЛГЭЭ) */}
      {activeTab === 'subgroups' && (
        <div className="space-y-6">
          {/* Subgroups header controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>Дэд бүлгүүдийн нэгтгэл & Асуулт тус бүрийн статистик</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ҮНДСЭН БҮЛЭГ &rarr; ДЭД БҮЛЭГ &rarr; АСУУЛТ бүтцээр дэлгэн сонголт тус бүрийн хувийг харна уу.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedSectionId}
                onChange={(e) =>
                  setSelectedSectionId(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="all">Бүх 8 бүлэг</option>
                {SECTIONS.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.title}
                  </option>
                ))}
              </select>

              <button
                onClick={expandAllSubgroups}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Бүгдийг дэлгэх
              </button>
              <button
                onClick={collapseAllSubgroups}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Хураах
              </button>
            </div>
          </div>

          {/* Sections & Subgroups Accordions */}
          {analytics.sectionStats
            .filter((sec) => selectedSectionId === 'all' || sec.id === selectedSectionId)
            .map((sec) => (
              <div key={sec.id} className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                {/* Section Header */}
                <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {sec.id}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{sec.title}</h4>
                      <p className="text-[11px] text-slate-500">
                        {sec.questionCount} асуулт | {sec.subgroups.length} дэд бүлэг
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">Үнэлгээний хувь</span>
                      <strong className="text-slate-900 font-bold">{sec.scorePercentage}%</strong>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                        sec.riskLevel === 'high'
                          ? 'bg-red-100 text-red-800'
                          : sec.riskLevel === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {sec.riskLevel === 'high' ? '🔴 Өндөр эрсдэл' : sec.riskLevel === 'medium' ? '🟡 Дунд эрсдэл' : '🟢 Бага эрсдэл'}
                    </span>
                  </div>
                </div>

                {/* Subgroups List */}
                <div className="divide-y divide-slate-100">
                  {sec.subgroups.map((sub) => {
                    const isExpanded = expandedSubgroups.has(sub.id);

                    return (
                      <div key={sub.id} className="transition-colors">
                        {/* Subgroup Header (Click to expand) */}
                        <div
                          onClick={() => toggleSubgroup(sub.id)}
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors select-none"
                        >
                          <div className="flex items-center gap-3">
                            <button className="p-1 rounded text-slate-400 hover:text-slate-700">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-blue-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            <div>
                              <h5 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                                <span>{sub.title}</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({sub.questionCount} асуулт)
                                </span>
                              </h5>
                              <span className="text-[11px] text-slate-400">
                                Нийт хариулсан тоо: {sub.totalAnswered}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs">
                            <div className="hidden sm:block text-right">
                              <span className="font-bold text-slate-800">{sub.scorePercentage}%</span>
                            </div>
                            <span className="text-sm">
                              {sub.riskLevel === 'high' ? '🔴' : sub.riskLevel === 'medium' ? '🟡' : '🟢'}
                            </span>
                          </div>
                        </div>

                        {/* Expanded Question Breakdown */}
                        {isExpanded && (
                          <div className="p-4 bg-slate-50/50 border-t border-slate-100 space-y-4">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                              {sub.title} - Асуултуудын нарийвчилсан хариулт
                            </div>

                            {sub.questions.map((q) => (
                              <div
                                key={q.id}
                                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3"
                              >
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-blue-700 text-xs bg-blue-50 px-2 py-0.5 rounded">
                                        {q.id}
                                      </span>
                                      {q.riskLevel === 'high' && (
                                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">
                                          🔴 Эрсдэлтэй үзүүлэлт
                                        </span>
                                      )}
                                    </div>
                                    <p className="font-bold text-xs text-slate-900 leading-relaxed max-w-3xl">
                                      {q.question}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-3 text-xs shrink-0 self-end sm:self-start bg-slate-50 p-2 rounded-lg border border-slate-200">
                                    <div className="text-center">
                                      <span className="text-[10px] text-slate-400 block">Хариулсан</span>
                                      <strong className="text-emerald-700 font-bold">{q.answeredCount}</strong>
                                    </div>
                                    <div className="w-px h-5 bg-slate-200" />
                                    <div className="text-center">
                                      <span className="text-[10px] text-slate-400 block">Хариулаагүй</span>
                                      <strong className="text-slate-500 font-medium">{q.unansweredCount}</strong>
                                    </div>
                                  </div>
                                </div>

                                {/* Options Breakdown (Rule 17: denominator = answeredCount) */}
                                {q.options && q.options.length > 0 ? (
                                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                    {q.options.map((opt) => (
                                      <div key={opt.value} className="text-xs space-y-1">
                                        <div className="flex justify-between items-center text-[11px]">
                                          <span className="font-medium text-slate-700 truncate pr-2">
                                            {opt.label}
                                          </span>
                                          <div className="flex items-center gap-2 shrink-0">
                                            <strong className="text-slate-900">{opt.count} сурагч</strong>
                                            <span className="text-slate-500 font-mono w-12 text-right">
                                              {opt.percentage}%
                                            </span>
                                          </div>
                                        </div>
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                          <div
                                            className="bg-blue-600 h-full rounded-full transition-all"
                                            style={{ width: `${opt.percentage}%` }}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-slate-400 italic">
                                    Текст болон тусгай хэлбэрийн асуулт
                                  </div>
                                )}
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
      )}

      {/* TAB CONTENT 3: ADD STUDENT / BULK IMPORT */}
      {activeTab === 'add' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Single Student Registration */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-base">Ганц сурагч бүртгэх</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Сурагчийн овог нэрийг оруулахад систем автоматаар код (7A001 гэх мэт) болон нууц үг үүсгэнэ.
            </p>

            <form onSubmit={handleAddSingleStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Сурагчийн овог, нэр
                </label>
                <input
                  type="text"
                  placeholder="Жишээ: Батбаярын Тэмүүжин"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Хүйс
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="1"
                      checked={newStudentGender === '1'}
                      onChange={() => setNewStudentGender('1')}
                    />
                    <span>Эмэгтэй</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="2"
                      checked={newStudentGender === '2'}
                      onChange={() => setNewStudentGender('2')}
                    />
                    <span>Эрэгтэй</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Сурагчийг бүртгэх
              </button>
            </form>
          </div>

          {/* 2. Bulk Import from Excel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">Excel-ээс бөөнөөр импортлох</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Excel эсвэл жагсаалтаас сурагчдын нэрийг мөр мөрөөр хуулж тавина уу (Нэр, Хүйс)
            </p>

            {bulkMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 mb-3">
                {bulkMessage}
              </div>
            )}

            <div className="space-y-4">
              <textarea
                rows={6}
                placeholder={`Жишээ:\nБолдын Тэмүүлэн\tэр\nГанбаатарын Ариунболд\tэр\nЭнхбатын Номин\tэм`}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={handleBulkImport}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Бөөнөөр импортлож код үүсгэх
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE STUDENT CREDENTIALS MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Сурагчдын нэвтрэх кодын хуудас (Хэвлэх хувилбар)
                </h3>
                <p className="text-xs text-slate-500">
                  {currentClass.name} ангийн нийт {students.length} сурагчийн карт
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Хэвлэх
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {students.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-left"
                >
                  <div className="flex justify-between items-start text-xs mb-1">
                    <span className="font-bold text-blue-700">{s.className} анги</span>
                    <span className="text-[10px] text-slate-400">1г эрсдэл 2026</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm truncate mb-2">{s.fullName}</div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-1 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Код:</span>
                      <strong className="text-blue-600">{s.studentCode}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Нууц үг:</span>
                      <strong className="text-slate-800">{s.password}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* STUDENT DETAILED DRILL-DOWN MODAL (СУРАГЧИЙН ДЭЛГЭРЭНГҮЙ ҮР ДҮН) */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex justify-between items-start bg-slate-50/80">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-xs">
                    {selectedStudentForDetail.studentCode}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    {selectedStudentForDetail.className} анги
                  </span>
                  {selectedStudentForDetail.isSubmitted ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Бөглөсөн
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      Бөглөөгүй
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {selectedStudentForDetail.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  Хүйс: {selectedStudentForDetail.gender === '1' ? 'Эмэгтэй' : selectedStudentForDetail.gender === '2' ? 'Эрэгтэй' : 'Тодорхойгүй'} | 
                  Огноо: {selectedStudentForDetail.submittedAt ? new Date(selectedStudentForDetail.submittedAt).toLocaleDateString('mn-MN') : 'Хүлээгдэж буй'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedStudentForDetail.isSubmitted && (
                  <button
                    onClick={() =>
                      handleToggleRetake(
                        selectedStudentForDetail.id,
                        Boolean(selectedStudentForDetail.canRetake)
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      selectedStudentForDetail.canRetake
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {selectedStudentForDetail.canRetake
                      ? 'Дахин бөглөх эрхийг хаах'
                      : 'Дахин бөглөх эрх олгох'}
                  </button>
                )}
                <button
                  onClick={() => setSelectedStudentForDetail(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Risk Summary Card */}
              {(() => {
                const rEval = studentEvaluationsMap.get(selectedStudentForDetail.id);
                if (!selectedStudentForDetail.isSubmitted || !rEval) {
                  return (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Энэ сурагч одоогоор судалгаа бөглөөгүй байна. Судалгаа илгээгдсэний дараа эрсдэлийн үнэлгээ гарна.</span>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {/* Level Banner */}
                    <div
                      className={`p-4 rounded-xl border flex items-center justify-between ${
                        rEval.level === 'high'
                          ? 'bg-red-50 border-red-200 text-red-900'
                          : rEval.level === 'medium'
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide opacity-80">
                          Нэгдсэн эрсдэлийн түвшин
                        </div>
                        <div className="text-xl font-bold flex items-center gap-2 mt-0.5">
                          <span>{rEval.level === 'high' ? '🔴 ӨНДӨР ЭРСДЭЛ' : rEval.level === 'medium' ? '🟡 ДУНД ЭРСДЭЛ' : '🟢 БАГА ЭРСДЭЛ'}</span>
                          <span className="text-sm font-semibold opacity-75">({rEval.totalScore} оноо)</span>
                        </div>
                      </div>

                      <div className="text-right text-xs">
                        <span className="font-semibold block">
                          {rEval.level === 'high'
                            ? 'Сургуулийн хамтарсан багт мэдэгдэх'
                            : rEval.level === 'medium'
                            ? 'Ангийн багшийн зөвлөгөө'
                            : 'Хэвийн байдал'}
                        </span>
                      </div>
                    </div>

                    {/* Identified Flags */}
                    {rEval.identifiedFlags.length > 0 && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Илэрсэн онцлох эрсдэлт хүчин зүйлс ({rEval.identifiedFlags.length})</span>
                        </div>
                        <ul className="space-y-1 text-xs">
                          {rEval.identifiedFlags.map((flag, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-2 text-slate-700">
                              <span className="text-red-500 font-bold">&bull;</span>
                              <span>{flag}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 8 Groups Cards Grid */}
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2">
                        8 Бүлгийн үнэлгээний оноо
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {SECTIONS.map((sec) => {
                          const secScore = rEval.sectionScores[sec.id] || 0;
                          return (
                            <div key={sec.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                              <div className="text-[10px] text-slate-400 font-mono">Бүлэг {sec.id}</div>
                              <div className="font-semibold text-xs text-slate-800 truncate" title={sec.title}>
                                {sec.title.split('.')[1] || sec.title}
                              </div>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-lg font-bold text-slate-900">{secScore}</span>
                                <span className="text-xs">
                                  {secScore >= 3 ? '🔴' : secScore >= 1 ? '🟡' : '🟢'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Full Responses Section */}
              {selectedStudentForDetail.isSubmitted && (
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Судалгааны бүх хариултууд
                  </h4>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {RAW_QUESTIONS.map((q) => {
                      const sAnswers = responsesMap[selectedStudentForDetail.id] || {};
                      const ans = sAnswers[q.id];
                      if (ans === undefined || ans === '') return null;

                      let displayAns = ans;
                      if (q.options && q.options.length > 0) {
                        const opt = q.options.find((o) => o.value === ans);
                        if (opt) displayAns = opt.label;
                      }

                      return (
                        <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          <div className="text-[10px] font-bold text-blue-600 mb-0.5">
                            {q.id} &bull; {q.section}
                          </div>
                          <div className="font-semibold text-slate-800 mb-1 leading-snug">
                            {q.question}
                          </div>
                          <div className="text-slate-900 font-medium bg-white p-2 rounded-lg border border-slate-200">
                            Хариулт: <strong className="text-blue-700">{displayAns}</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
