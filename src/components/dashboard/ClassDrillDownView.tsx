import React, { useState, useMemo } from 'react';
import { SchoolClass, Student } from '../../types';
import { calculateSurveyAnalytics, getRiskLevelBadge } from '../../utils/surveyAnalytics';
import { RAW_QUESTIONS, SECTIONS } from '../../data/questions';
import { TeacherKPICards } from './KPICards';
import { RiskDonutChart, GroupsHorizontalBarChart } from './RiskCharts';
import { AttentionSection } from './AttentionSection';
import {
  ArrowLeft,
  Download,
  Users,
  Search,
  Filter,
  Eye,
  X,
  Printer,
  ChevronDown,
  ChevronRight,
  Layers,
  CheckCircle,
  Lock,
  Unlock,
} from 'lucide-react';
import { exportSurveyDataToExcel } from '../../utils/excelExport';

interface ClassDrillDownViewProps {
  schoolClass: SchoolClass;
  students: Student[];
  responsesMap: Record<string, Record<string, any>>;
  onBack: () => void;
  onToggleLock?: (schoolClass: SchoolClass) => void;
}

export const ClassDrillDownView: React.FC<ClassDrillDownViewProps> = ({
  schoolClass,
  students,
  responsesMap,
  onBack,
  onToggleLock,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'students' | 'subgroups'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'unsubmitted'>('all');
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);
  const [expandedSubgroups, setExpandedSubgroups] = useState<Set<string>>(new Set());

  // Filter students for this class
  const classStudents = useMemo(() => {
    return students.filter(
      (s) => s.classId === schoolClass.id || s.className === schoolClass.name
    );
  }, [students, schoolClass]);

  const analytics = useMemo(() => {
    return calculateSurveyAnalytics(classStudents, responsesMap);
  }, [classStudents, responsesMap]);

  const handleExportClassExcel = () => {
    exportSurveyDataToExcel(
      schoolClass,
      classStudents,
      responsesMap
    );
  };

  const filteredStudents = useMemo(() => {
    return classStudents.filter((student) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        student.fullName.toLowerCase().includes(q) ||
        student.studentCode.toLowerCase().includes(q);

      const rStat = analytics.studentRiskMap[student.id];
      let matchesRisk = true;
      if (riskFilter === 'unsubmitted') {
        matchesRisk = !student.isSubmitted;
      } else if (riskFilter !== 'all') {
        matchesRisk = Boolean(student.isSubmitted && rStat && rStat.overallLevel === riskFilter);
      }

      return matchesSearch && matchesRisk;
    });
  }, [classStudents, searchQuery, riskFilter, analytics]);

  const toggleSubgroupExpand = (subKey: string) => {
    setExpandedSubgroups((prev) => {
      const next = new Set(prev);
      if (next.has(subKey)) next.delete(subKey);
      else next.add(subKey);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
              title="Нэгдсэн самбар руу буцах"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  {schoolClass.name} Анги
                </span>
                <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                  Багшийн код: {schoolClass.teacherCode}
                </span>
                <span className="text-xs text-slate-500">
                  Багш: <strong className="text-slate-800">{schoolClass.teacherName || 'Багш'}</strong>
                </span>
                {schoolClass.isLocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <Lock className="w-3 h-3 text-rose-600" />
                    <span>Үнэлгээ дууссан (Түгжигдсэн)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Unlock className="w-3 h-3 text-emerald-600" />
                    <span>Судалгаа нээлттэй</span>
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {schoolClass.name} ангийн судалгаа & эрсдэлийн дэлгэрэнгүй шинжилгээ
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onToggleLock && (
              schoolClass.isLocked ? (
                <button
                  type="button"
                  onClick={() => onToggleLock(schoolClass)}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Энэ ангийн судалгааг дахин нээх"
                >
                  <Unlock className="w-4 h-4 text-amber-600" />
                  <span>Судалгааг дахин нээх</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onToggleLock(schoolClass)}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Ангийн эрсдэлийн үнэлгээг дуусгавар болгож хаах"
                >
                  <Lock className="w-4 h-4 text-rose-600" />
                  <span>Үнэлгээ дуусгах (Түгжих)</span>
                </button>
              )
            )}
            <button
              onClick={handleExportClassExcel}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Энэ ангийн Excel тайлан</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPIs for this class */}
      <TeacherKPICards
        totalCount={analytics.totalStudents}
        completedCount={analytics.submittedCount}
        pendingCount={analytics.unsubmittedCount}
        completionRate={analytics.completionRate}
      />

      {/* Navigation Subtabs */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Ерөнхий график & Анхааруулга
        </button>
        <button
          onClick={() => setActiveSubTab('students')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'students'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Сурагчдын нэгдсэн хүснэгт ({classStudents.length})
        </button>
        <button
          onClick={() => setActiveSubTab('subgroups')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'subgroups'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Дэд бүлэг & Асуултын шинжилгээ
        </button>
      </div>

      {/* SUBTAB 1: OVERVIEW CHARTS & ATTENTION */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <AttentionSection
            attentionItems={analytics.attentionItems}
            onFilterHighRisk={() => {
              setActiveSubTab('students');
              setRiskFilter('high');
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RiskDonutChart
              low={analytics?.riskSummary?.low ?? 0}
              med={analytics?.riskSummary?.med ?? 0}
              high={analytics?.riskSummary?.high ?? 0}
              totalSubmitted={analytics?.submittedCount ?? 0}
              title={`${schoolClass.name} ангийн эрсдэлийн түвшин`}
            />

            <GroupsHorizontalBarChart
              sectionStats={analytics.sectionStats}
              title={`${schoolClass.name} ангийн 8 бүлгийн үнэлгээ`}
            />
          </div>
        </div>
      )}

      {/* SUBTAB 2: CLASS STUDENTS TABLE */}
      {activeSubTab === 'students' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Сурагчийн нэр, кодоор хайх..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Бүх сурагч</option>
                <option value="low">Бага эрсдэлтэй</option>
                <option value="medium">Дунд эрсдэлтэй</option>
                <option value="high">Өндөр эрсдэлтэй</option>
                <option value="unsubmitted">Бөглөөгүй</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4 w-12 text-center">№</th>
                  <th className="py-3 px-4">Код</th>
                  <th className="py-3 px-4">Овог, Нэр</th>
                  <th className="py-3 px-4">Төлөв</th>
                  <th className="py-3 px-4">Эрсдэлийн түвшин</th>
                  <th className="py-3 px-4">Эрсдэлт бүлгийн тоо</th>
                  <th className="py-3 px-4 text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, idx) => {
                  const rStat = analytics.studentRiskMap[student.id];
                  const badge = rStat ? getRiskLevelBadge(rStat.overallLevel) : null;

                  return (
                    <tr
                      key={student.id}
                      onClick={() => setSelectedStudentForDetail(student)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{student.studentCode}</td>
                      <td className="py-3 px-4 font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                        {student.fullName}
                      </td>
                      <td className="py-3 px-4">
                        {student.isSubmitted ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-[11px]">
                            Илгээсэн
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium text-[11px]">
                            Бөглөөгүй
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {badge && student.isSubmitted ? (
                          <span
                            className="px-2 py-0.5 rounded text-[11px] font-bold inline-flex items-center gap-1"
                            style={{ backgroundColor: badge.bg, color: badge.text }}
                          >
                            <span>{badge.icon}</span>
                            <span>{badge.label}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {rStat && student.isSubmitted ? (
                          <span>{rStat.highSectionsCount > 0 ? `${rStat.highSectionsCount} бүлэгт өндөр` : 'Хэвийн'}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudentForDetail(student);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Харах</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      Шүүлтүүрт тохирох сурагч олдсонгүй.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: SUBGROUPS & QUESTIONS */}
      {activeSubTab === 'subgroups' && (
        <div className="space-y-4">
          {analytics.sectionStats.map((sec) => (
            <div key={sec.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {sec.shortTitle}: {sec.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Асуултын тоо: {sec.totalQuestions} | Эрсдэлтэй сурагч: {sec.riskStudentsCount}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">{sec.scorePercentage}%</span>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-bold"
                    style={{
                      backgroundColor: sec.riskLevel === 'high' ? '#fef2f2' : sec.riskLevel === 'medium' ? '#fefce8' : '#f0fdf4',
                      color: sec.riskLevel === 'high' ? '#991b1b' : sec.riskLevel === 'medium' ? '#854d0e' : '#166534',
                    }}
                  >
                    {sec.riskLevel === 'high' ? 'Өндөр эрсдэл' : sec.riskLevel === 'medium' ? 'Дунд эрсдэл' : 'Бага эрсдэл'}
                  </span>
                </div>
              </div>

              {/* Subgroups list */}
              <div className="space-y-3">
                {sec.subgroups.map((sub) => {
                  const subKey = `${sec.id}-${sub.id}`;
                  const isExpanded = expandedSubgroups.has(subKey);

                  return (
                    <div key={sub.id} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div
                        onClick={() => toggleSubgroupExpand(subKey)}
                        className="p-3.5 bg-slate-50 hover:bg-slate-100/70 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {sub.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-semibold text-slate-700">
                            {sub.scorePercentage}%
                          </span>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{
                              backgroundColor: sub.riskLevel === 'high' ? '#fee2e2' : sub.riskLevel === 'medium' ? '#fef3c7' : '#dcfce7',
                              color: sub.riskLevel === 'high' ? '#b91c1c' : sub.riskLevel === 'medium' ? '#b45309' : '#15803d',
                            }}
                          >
                            {sub.riskLevel === 'high' ? 'Өндөр' : sub.riskLevel === 'medium' ? 'Дунд' : 'Бага'}
                          </span>
                        </div>
                      </div>

                      {/* Expandable questions list */}
                      {isExpanded && (
                        <div className="p-4 bg-white divide-y divide-slate-100 text-xs space-y-3">
                          {sub.questions.map((q) => (
                            <div key={q.id} className="pt-2 first:pt-0">
                              <div className="flex justify-between items-start gap-2 mb-1.5">
                                <span className="font-medium text-slate-900">
                                  {q.code}. {q.text}
                                </span>
                                <span className="text-slate-500 font-semibold shrink-0">
                                  {q.riskPercentage}% ({q.riskAnswersCount} сурагч)
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                                {q.options.map((opt, i) => (
                                  <div
                                    key={i}
                                    className={`p-2 rounded-lg border text-[11px] ${
                                      opt.isRisk
                                        ? 'bg-red-50 border-red-200 text-red-800'
                                        : 'bg-slate-50 border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    <div className="truncate font-medium">{opt.text}</div>
                                    <div className="font-bold mt-1">
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
      )}

      {/* Student Detail Modal */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <span className="text-xs font-bold text-blue-600 font-mono">
                  {selectedStudentForDetail.studentCode}
                </span>
                <h3 className="font-bold text-base text-slate-900">
                  {selectedStudentForDetail.fullName} - Судалгааны хувийн карт
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500">Анги:</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {selectedStudentForDetail.className}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500">Төлөв:</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {selectedStudentForDetail.isSubmitted ? 'Илгээсэн' : 'Бөглөөгүй'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500">Нэгдсэн эрсдэл:</span>
                  <div className="font-bold text-sm mt-0.5">
                    {analytics.studentRiskMap[selectedStudentForDetail.id]?.overallLevel === 'high' ? (
                      <span className="text-red-600">Өндөр</span>
                    ) : analytics.studentRiskMap[selectedStudentForDetail.id]?.overallLevel === 'medium' ? (
                      <span className="text-amber-600">Дунд</span>
                    ) : (
                      <span className="text-emerald-600">Бага</span>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500">Эрсдэлт бүлэг:</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {analytics.studentRiskMap[selectedStudentForDetail.id]?.highSectionsCount || 0} бүлэгт
                  </div>
                </div>
              </div>

              {/* 8 Sections summary for this student */}
              {analytics.studentRiskMap[selectedStudentForDetail.id] && (
                <div className="space-y-2 mt-4">
                  <h4 className="text-xs font-bold text-slate-700">8 бүлгийн эрсдэлийн түвшин:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {analytics.studentRiskMap[selectedStudentForDetail.id].sectionLevels.map((sec) => (
                      <div
                        key={sec.sectionId}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white"
                      >
                        <span className="text-[10px] text-slate-500 block">Бүлэг {sec.sectionId}</span>
                        <span
                          className="font-bold text-xs"
                          style={{
                            color:
                              sec.level === 'high' ? '#dc2626' : sec.level === 'medium' ? '#d97706' : '#16a34a',
                          }}
                        >
                          {sec.level === 'high' ? 'Өндөр' : sec.level === 'medium' ? 'Дунд' : 'Бага'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
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
