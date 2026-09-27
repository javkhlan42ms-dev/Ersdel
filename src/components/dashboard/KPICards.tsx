import React from 'react';
import { Users, CheckCircle, Clock, Percent, School, UserCheck, AlertTriangle } from 'lucide-react';

interface TeacherKPICardsProps {
  totalCount?: number;
  totalStudents?: number;
  completedCount?: number;
  submittedCount?: number;
  pendingCount?: number;
  unsubmittedCount?: number;
  completionRate: number;
}

export const TeacherKPICards: React.FC<TeacherKPICardsProps> = (props) => {
  const totalCount = props.totalCount ?? props.totalStudents ?? 0;
  const completedCount = props.completedCount ?? props.submittedCount ?? 0;
  const pendingCount = props.pendingCount ?? props.unsubmittedCount ?? 0;
  const completionRate = props.completionRate ?? 0;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* KPI 1: Нийт сурагч */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-all hover:border-blue-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">1. Нийт сурагч</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{totalCount}</div>
        <p className="text-[11px] text-slate-400 mt-1">Ангийн нийт суралцагчид</p>
      </div>

      {/* KPI 2: Судалгаа бөглөсөн */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-all hover:border-emerald-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-700">2. Судалгаа бөглөсөн</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-700 tracking-tight">{completedCount}</div>
        <p className="text-[11px] text-emerald-600/80 mt-1">Судалгаагаа бүрэн илгээсэн</p>
      </div>

      {/* KPI 3: Судалгаа бөглөөгүй */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-all hover:border-amber-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-700">3. Судалгаа бөглөөгүй</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold text-amber-700 tracking-tight">{pendingCount}</div>
        <p className="text-[11px] text-amber-600/80 mt-1">Хүлээгдэж буй сурагч</p>
      </div>

      {/* KPI 4: Хамрагдалтын хувь */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-all hover:border-indigo-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-700">4. Хамрагдалтын хувь</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold text-indigo-700 tracking-tight">{completionRate}%</div>
        <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, completionRate)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

interface AdminKPICardsProps {
  totalStudents: number;
  totalClasses: number;
  totalTeachers: number;
  totalSubmitted: number;
  overallRate: number;
  lowRiskCount: number;
  medRiskCount: number;
  highRiskCount: number;
}

export const AdminKPICards: React.FC<AdminKPICardsProps> = ({
  totalStudents,
  totalClasses,
  totalTeachers,
  totalSubmitted,
  overallRate,
  lowRiskCount,
  medRiskCount,
  highRiskCount,
}) => {
  const lowPct = totalSubmitted > 0 ? Math.round((lowRiskCount / totalSubmitted) * 100) : 0;
  const medPct = totalSubmitted > 0 ? Math.round((medRiskCount / totalSubmitted) * 100) : 0;
  const highPct = totalSubmitted > 0 ? Math.round((highRiskCount / totalSubmitted) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
      {/* 1. Нийт сурагч */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-blue-300 transition-all">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-semibold">Нийт сурагч</span>
          <Users className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5">{totalStudents}</div>
        <p className="text-[10px] text-slate-400 mt-0.5">Сургуулийн нийт</p>
      </div>

      {/* 2. Нийт анги */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-indigo-300 transition-all">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-semibold">Нийт анги</span>
          <School className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5">{totalClasses}</div>
        <p className="text-[10px] text-slate-400 mt-0.5">Бүртгэлтэй анги</p>
      </div>

      {/* 3. Нийт багш */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-teal-300 transition-all">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-semibold">Нийт багш</span>
          <UserCheck className="w-4 h-4 text-teal-600" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5">{totalTeachers}</div>
        <p className="text-[10px] text-slate-400 mt-0.5">Багшийн эрх</p>
      </div>

      {/* 4. Судалгаанд хамрагдалт */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-blue-300 transition-all">
        <div className="flex items-center justify-between text-blue-700">
          <span className="text-[11px] font-semibold">Хамрагдалт</span>
          <Percent className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-blue-700 mt-1.5">{overallRate}%</div>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {totalSubmitted} / {totalStudents}
        </p>
      </div>

      {/* 5. Бага эрсдэл (#16A34A) */}
      <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs hover:border-emerald-400 transition-all">
        <div className="flex items-center justify-between text-emerald-800">
          <span className="text-[11px] font-semibold">Бага эрсдэл</span>
          <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-[#16A34A] mt-1.5">{lowRiskCount}</div>
        <p className="text-[10px] text-emerald-700 mt-0.5">{lowPct}% (Хэвийн)</p>
      </div>

      {/* 6. Дунд эрсдэл (#EAB308) */}
      <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs hover:border-amber-400 transition-all">
        <div className="flex items-center justify-between text-amber-800">
          <span className="text-[11px] font-semibold">Дунд эрсдэл</span>
          <div className="w-2 h-2 rounded-full bg-[#EAB308]" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-amber-600 mt-1.5">{medRiskCount}</div>
        <p className="text-[10px] text-amber-700 mt-0.5">{medPct}% (Анхаарах)</p>
      </div>

      {/* 7. Өндөр эрсдэл (#DC2626) */}
      <div className="bg-white border border-red-200 rounded-2xl p-4 shadow-xs hover:border-red-400 transition-all">
        <div className="flex items-center justify-between text-red-800">
          <span className="text-[11px] font-semibold">Өндөр эрсдэл</span>
          <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-[#DC2626] mt-1.5">{highRiskCount}</div>
        <p className="text-[10px] text-red-700 mt-0.5">{highPct}% (Нэн тэргүүнд)</p>
      </div>
    </div>
  );
};
