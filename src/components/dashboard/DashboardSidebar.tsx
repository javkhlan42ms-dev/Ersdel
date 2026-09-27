import React from 'react';
import {
  LayoutDashboard,
  Users,
  School,
  Activity,
  Layers,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  Menu,
  X,
  Plus,
  Printer,
  Download,
} from 'lucide-react';

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  onClick: () => void;
  active?: boolean;
}

interface DashboardSidebarProps {
  title: string;
  subtitle?: string;
  roleBadge: string;
  items: SidebarItem[];
  actions?: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'success';
  }[];
  isOpenMobile: boolean;
  onToggleMobile: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  title,
  subtitle,
  roleBadge,
  items,
  actions = [],
  isOpenMobile,
  onToggleMobile,
}) => {
  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 mb-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onToggleMobile}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            aria-label="Цэс нээх"
          >
            {isOpenMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="min-w-0">
            <h2 className="font-bold text-sm text-slate-900 truncate">{title}</h2>
            <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider block">
              {roleBadge}
            </span>
          </div>
        </div>

        {actions.length > 0 && (
          <button
            onClick={actions[0].onClick}
            className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
            title={actions[0].label}
          >
            {actions[0].icon}
            <span className="hidden sm:inline">{actions[0].label}</span>
          </button>
        )}
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div
          onClick={onToggleMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-4 z-40 lg:z-10 h-screen lg:h-[calc(100vh-2rem)] w-64 bg-white border-r lg:border border-slate-200 lg:rounded-2xl shadow-xs transition-transform duration-200 flex flex-col justify-between ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 overflow-y-auto">
          {/* Header */}
          <div className="mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wide">
                {roleBadge}
              </span>
              <button
                onClick={onToggleMobile}
                className="lg:hidden p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-bold text-base text-slate-900 mt-2 leading-snug">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick();
                  if (isOpenMobile) onToggleMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  item.active
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={item.active ? 'text-white' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      item.active
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Action Buttons at bottom of sidebar */}
        {actions.length > 0 && (
          <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50 rounded-b-2xl">
            {actions.map((act, i) => (
              <button
                key={i}
                onClick={act.onClick}
                className={`w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                  act.variant === 'primary'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : act.variant === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {act.icon}
                <span>{act.label}</span>
              </button>
            ))}
          </div>
        )}
      </aside>
    </>
  );
};
