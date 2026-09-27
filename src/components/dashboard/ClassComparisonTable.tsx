import React, { useState } from 'react';
import { Eye, ArrowUpDown, ChevronRight, School, Users, Lock } from 'lucide-react';
import { ClassRiskStat } from '../../utils/surveyAnalytics';

interface ClassComparisonTableProps {
  classComparisons: ClassRiskStat[];
  onSelectClass: (classId: string) => void;
}

export const ClassComparisonTable: React.FC<ClassComparisonTableProps> = ({
  classComparisons,
  onSelectClass,
}) => {
  const [sortField, setSortField] = useState<
    'className' | 'totalStudents' | 'submittedCount' | 'completionRate' | 'highRiskCount'
  >('className');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (
    field: 'className' | 'totalStudents' | 'submittedCount' | 'completionRate' | 'highRiskCount'
  ) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending for metrics
    }
  };

  const sortedClasses = [...classComparisons].sort((a, b) => {
    let diff = 0;
    if (sortField === 'className') {
      diff = a.className.localeCompare(b.className, 'mn');
    } else if (sortField === 'totalStudents') {
      diff = a.totalStudents - b.totalStudents;
    } else if (sortField === 'submittedCount') {
      diff = a.submittedCount - b.submittedCount;
    } else if (sortField === 'completionRate') {
      diff = a.completionRate - b.completionRate;
    } else if (sortField === 'highRiskCount') {
      diff = a.highRiskCount - b.highRiskCount;
    }
    return sortAsc ? diff : -diff;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <School className="w-4 h-4 text-blue-600" />
            <span>Ангиудын харьцуулалт ба эрсдэлийн хүснэгт</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Анги дээр дарж тухайн ангийн нарийвчилсан судалгаа, 8 бүлэг болон сурагчдын мэдээлэл рүү шилжинэ үү (Drill-down).
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs shrink-0">
          Нийт анги: {classComparisons.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
              <th
                onClick={() => handleSort('className')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Анги</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4">Ангийн багш</th>
              <th
                onClick={() => handleSort('totalStudents')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Сурагч</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('submittedCount')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Бөглөсөн</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('completionRate')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Хамрагдалт</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4">
                <span className="text-emerald-700 font-bold">Бага эрсдэл</span>
              </th>
              <th className="py-3 px-4">
                <span className="text-amber-700 font-bold">Дунд эрсдэл</span>
              </th>
              <th
                onClick={() => handleSort('highRiskCount')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1 text-red-700 font-bold">
                  <span>Өндөр эрсдэл</span>
                  <ArrowUpDown className="w-3 h-3 text-red-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedClasses.map((cls) => (
              <tr
                key={cls.classId}
                onClick={() => onSelectClass(cls.classId)}
                className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
              >
                <td className="py-3 px-4 font-bold text-slate-900">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="group-hover:text-blue-600 transition-colors">{cls.className}</span>
                    {cls.isLocked && (
                      <span
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
                        title="Үнэлгээ дууссан, судалгаа хаагдсан"
                      >
                        <Lock className="w-2.5 h-2.5" />
                        <span>Хаагдсан</span>
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-700">{cls.teacherName || 'Багш'}</td>
                <td className="py-3 px-4 text-slate-600">{cls.totalStudents}</td>
                <td className="py-3 px-4 text-slate-700 font-medium">{cls.submittedCount}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{cls.completionRate}%</span>
                    <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${cls.completionRate}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 text-[11px]">
                    {cls.lowRiskCount} <span className="text-[10px] text-emerald-600">({cls.lowRiskPct}%)</span>
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200 text-[11px]">
                    {cls.medRiskCount} <span className="text-[10px] text-amber-600">({cls.medRiskPct}%)</span>
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-800 font-bold border border-red-200 text-[11px]">
                    {cls.highRiskCount} <span className="text-[10px] text-red-600">({cls.highRiskPct}%)</span>
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClass(cls.classId);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Дэлгэрэнгүй</span>
                  </button>
                </td>
              </tr>
            ))}
            {sortedClasses.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                  Бүртгэлтэй анги олдсонгүй.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
