import React from 'react';
import { ActiveSession } from '../utils/storage';
import { School, User, LogOut, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import schoolLogo from '../assets/logo.png';

interface NavbarProps {
  session: ActiveSession | null;
  onLogout: () => void;
  onOpenGasModal: () => void;
  onOpenGoogleSheetsModal?: () => void;
  gasConnected?: boolean;
  sheetsConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  session,
  onLogout,
  onOpenGasModal,
  onOpenGoogleSheetsModal,
  gasConnected,
  sheetsConnected
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img
              src={schoolLogo}
              alt="Сургуулийн лого"
              className="w-11 h-11 object-contain rounded-full shadow-xs shrink-0 bg-white"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.tried) {
                  target.dataset.tried = 'true';
                  target.src = './logo.png';
                }
              }}
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 text-base sm:text-lg leading-tight">
                  Сургуулийн хүүхдийн эрсдэлийн үнэлгээ
                </h1>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Боловсролын цахим эрсдэлийн судалгаа ба шинжилгээний нэгдсэн систем
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Google Apps Script (GAS) Button (Admin only) */}
            {session?.role === 'admin' && (
              <button
                id="btn-gas-db"
                onClick={onOpenGasModal}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-2xs transition-all cursor-pointer ${
                  gasConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                title="Google Apps Script (GAS) холболт"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Google Apps Script</span>
                {gasConnected ? (
                  <span className="flex items-center text-emerald-600 gap-1 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Холбогдсон
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 hidden md:inline">Тохируулах</span>
                )}
              </button>
            )}

            {/* Google Sheets Direct Database Button (Admin only) */}
            {session?.role === 'admin' && (
              <button
                id="btn-google-sheets-db"
                onClick={onOpenGoogleSheetsModal || onOpenGasModal}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-2xs transition-all cursor-pointer ${
                  sheetsConnected
                    ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                title="Google Sheet OAuth Төв Өгөгдлийн Сан"
              >
                <span className="hidden sm:inline">Google OAuth</span>
                {sheetsConnected && (
                  <span className="flex items-center text-blue-600 gap-1 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
            )}

            {/* User Session Info */}
            {session && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex flex-col text-right hidden sm:flex">
                  <span className="text-xs font-semibold text-slate-800">
                    {session.userName}
                  </span>
                  <span className="text-[11px] text-slate-500 capitalize">
                    {session.role === 'admin'
                      ? 'Ерөнхий Админ'
                      : session.role === 'teacher'
                      ? `${session.className} Ангийн багш`
                      : `${session.className} | ${session.studentCode}`}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                  <User className="w-4 h-4" />
                </div>

                <button
                  id="btn-logout"
                  onClick={onLogout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Системээс гарах"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
