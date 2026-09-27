import React from 'react';
import { AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { AttentionItem } from '../../utils/surveyAnalytics';

interface AttentionSectionProps {
  attentionItems: AttentionItem[];
  onSelectIndicator?: (item: AttentionItem) => void;
  onFilterHighRisk?: () => void;
  maxItems?: number;
}

export const AttentionSection: React.FC<AttentionSectionProps> = ({
  attentionItems,
  onSelectIndicator,
  onFilterHighRisk,
  maxItems = 5,
}) => {
  const displayItems = attentionItems.slice(0, maxItems);

  return (
    <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>⚠️ Анхаарал хандуулах шаардлагатай гол үзүүлэлтүүд (TOP {displayItems.length})</span>
            </h3>
            <p className="text-[11px] text-amber-800/80">
              Судалгааны хариултуудаас илэрсэн хамгийн өндөр эрсдэлтэй хүчин зүйлс
            </p>
          </div>
        </div>

        {onFilterHighRisk && (
          <button
            onClick={onFilterHighRisk}
            className="text-xs font-semibold text-amber-900 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer"
          >
            <span>Эрсдэлтэй сурагчдыг шүүж харах</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {displayItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {displayItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => onSelectIndicator && onSelectIndicator(item)}
              className={`p-3.5 bg-white rounded-xl border border-amber-200/80 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all flex flex-col justify-between ${
                onSelectIndicator ? 'cursor-pointer group' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-bold text-amber-800 truncate pr-1">
                    {idx + 1}. {item.category}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      item.riskLevel === 'high'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.riskLevel === 'high' ? '🔴 Өндөр' : '🟡 Дунд'}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h4>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Илэрсэн: <strong className="text-red-600">{item.riskStudentsCount}</strong> сурагч
                </span>
                <span className="font-bold text-amber-900">{item.riskPercentage}%</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3.5 bg-white rounded-xl border border-amber-200 text-xs text-slate-600 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Одоогоор онцгой ноцтой эрсдэлт үзүүлэлт илрээгүй байна.</span>
        </div>
      )}
    </div>
  );
};
