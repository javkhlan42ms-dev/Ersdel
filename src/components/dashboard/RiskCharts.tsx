import React from 'react';
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
  CartesianGrid,
  Legend,
} from 'recharts';
import { SectionStat, ClassRiskStat, getRiskLevelBadge } from '../../utils/surveyAnalytics';

interface RiskDonutChartProps {
  low: number;
  med: number;
  high: number;
  totalSubmitted: number;
  title?: string;
  subtitle?: string;
  onSelectRisk?: (level: 'low' | 'medium' | 'high') => void;
}

export const RiskDonutChart: React.FC<RiskDonutChartProps> = ({
  low,
  med,
  high,
  totalSubmitted,
  title = 'Эрсдэлийн нэгдсэн түвшин (Donut Chart)',
  subtitle = 'Сурагчдын 8 бүлгийн нийт оноогоор үнэлэгдсэн эрсдэлийн тархалт',
}) => {
  const data = [
    { name: 'Бага эрсдэл', value: low, color: '#16A34A', key: 'low' },
    { name: 'Дунд эрсдэл', value: med, color: '#EAB308', key: 'med' },
    { name: 'Өндөр эрсдэл', value: high, color: '#DC2626', key: 'high' },
  ];

  const lowPct = totalSubmitted > 0 ? Math.round((low / totalSubmitted) * 100) : 0;
  const medPct = totalSubmitted > 0 ? Math.round((med / totalSubmitted) * 100) : 0;
  const highPct = totalSubmitted > 0 ? Math.round((high / totalSubmitted) * 100) : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <h3 className="font-bold text-sm text-slate-900">{title}</h3>
        <p className="text-[11px] text-slate-500 mb-3">{subtitle}</p>
      </div>

      <div className="relative h-56 w-full flex items-center justify-center">
        {totalSubmitted === 0 ? (
          <div className="text-center text-xs text-slate-400 p-4">
            Судалгааны хариулт хараахан ирээгүй байна.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(val: number, name: string) => [
                    `${val} сурагч (${totalSubmitted > 0 ? Math.round((val / totalSubmitted) * 100) : 0}%)`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                    padding: '8px 12px',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-900 leading-none">{totalSubmitted}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Бөглөсөн</span>
            </div>
          </>
        )}
      </div>

      {/* Legend & Breakdown */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
        <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
          <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span>Бага</span>
          </div>
          <div className="text-base font-bold text-emerald-900 mt-0.5">{low}</div>
          <span className="text-[10px] text-emerald-700 font-medium">{lowPct}%</span>
        </div>

        <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100">
          <div className="flex items-center justify-center gap-1.5 text-amber-800 font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#EAB308]" />
            <span>Дунд</span>
          </div>
          <div className="text-base font-bold text-amber-900 mt-0.5">{med}</div>
          <span className="text-[10px] text-amber-700 font-medium">{medPct}%</span>
        </div>

        <div className="p-2 rounded-xl bg-red-50/70 border border-red-100">
          <div className="flex items-center justify-center gap-1.5 text-red-800 font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
            <span>Өндөр</span>
          </div>
          <div className="text-base font-bold text-red-900 mt-0.5">{high}</div>
          <span className="text-[10px] text-red-700 font-medium">{highPct}%</span>
        </div>
      </div>
    </div>
  );
};

interface GroupsHorizontalBarChartProps {
  sectionStats: SectionStat[];
  onSelectSection?: (sectionId: number) => void;
  title?: string;
  subtitle?: string;
}

export const GroupsHorizontalBarChart: React.FC<GroupsHorizontalBarChartProps> = ({
  sectionStats,
  onSelectSection,
  title = 'Судалгааны 8 бүлгийн гүйцэтгэл & эрсдэл',
  subtitle = 'Бүлэг тус бүрийн дундаж эрсдэлийн хувь ба үнэлгээний түвшин',
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-bold text-sm text-slate-900">{title}</h3>
          <p className="text-[11px] text-slate-500">{subtitle}</p>
        </div>
        <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
          (0-33%: Бага, 34-66%: Дунд, 67-100%: Өндөр)
        </span>
      </div>

      <div className="space-y-2.5 py-1">
        {sectionStats.map((sec) => {
          const badge = getRiskLevelBadge(sec.riskLevel);
          const barColor =
            sec.riskLevel === 'high' ? '#DC2626' : sec.riskLevel === 'medium' ? '#EAB308' : '#16A34A';

          return (
            <div
              key={sec.id}
              onClick={() => onSelectSection && onSelectSection(sec.id)}
              className={`p-2 rounded-xl transition-all ${
                onSelectSection ? 'hover:bg-slate-50 cursor-pointer' : ''
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="font-bold text-slate-900 shrink-0">{sec.shortTitle}:</span>
                  <span className="text-slate-600 truncate text-[11px]">{sec.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-xs text-slate-800">{sec.scorePercentage}%</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
                    style={{ backgroundColor: badge.bg, color: badge.text }}
                  >
                    {badge.label}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(2, Math.min(100, sec.scorePercentage))}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface ClassRiskComparisonChartProps {
  classComparisons: ClassRiskStat[];
  onSelectClass?: (classId: string) => void;
}

export const ClassRiskComparisonChart: React.FC<ClassRiskComparisonChartProps> = ({
  classComparisons,
  onSelectClass,
}) => {
  const chartData = classComparisons.map((c) => ({
    classId: c.classId,
    name: c.className,
    low: c.lowRiskCount,
    med: c.medRiskCount,
    high: c.highRiskCount,
    total: c.submittedCount,
    highPct: c.highRiskPct,
  }));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900">
            Ангиудын эрсдэлийн түвшний харьцуулалт (Бүх анги)
          </h3>
          <p className="text-[11px] text-slate-500">
            X тэнхлэг = Анги, Y тэнхлэг = Сурагчдын тоо (Бага #16A34A / Дунд #EAB308 / Өндөр #DC2626)
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#16A34A]" />
            <span className="text-slate-600">Бага</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#EAB308]" />
            <span className="text-slate-600">Дунд</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626]" />
            <span className="text-slate-600">Өндөр</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Харьцуулах ангийн өгөгдөл байхгүй байна.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0] && onSelectClass) {
                  onSelectClass(e.activePayload[0].payload.classId);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#475569' }}
                interval={0}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  border: 'none',
                  padding: '8px 12px',
                }}
                formatter={(val: number, name: string) => [
                  `${val} сурагч`,
                  name === 'low' ? 'Бага эрсдэл' : name === 'med' ? 'Дунд эрсдэл' : 'Өндөр эрсдэл',
                ]}
              />
              <Bar dataKey="low" name="low" stackId="a" fill="#16A34A" radius={[0, 0, 0, 0]} />
              <Bar dataKey="med" name="med" stackId="a" fill="#EAB308" radius={[0, 0, 0, 0]} />
              <Bar dataKey="high" name="high" stackId="a" fill="#DC2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
