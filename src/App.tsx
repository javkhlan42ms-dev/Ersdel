import React, { useState, useEffect } from 'react';
import { StorageService, ActiveSession } from './utils/storage';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { StudentSurveyView } from './components/StudentSurveyView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { GasSetupModal } from './components/GasSetupModal';
import { GoogleSheetsDatabaseModal } from './components/GoogleSheetsDatabaseModal';

export default function App() {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [gasConnected, setGasConnected] = useState(false);
  const [sheetsConnected, setSheetsConnected] = useState(false);

  useEffect(() => {
    // Initial sync from central server and cloud Google Sheet to ensure all devices share classes, teachers & surveys
    StorageService.loadAllFromCloudDatabase().then(() => {
      const active = StorageService.getSession();
      if (active) {
        setSession(active);
      }
      const settings = StorageService.getSettings();
      setGasConnected(Boolean(settings.gasConnected && settings.gasWebAppUrl));
      setSheetsConnected(Boolean(settings.googleSheetsConnected && settings.googleSheetsSpreadsheetId));
    });

    // Periodic sync every 25 seconds for real-time consistency across mobile devices
    const interval = setInterval(() => {
      StorageService.syncFromServer();
      const settings = StorageService.getSettings();
      setGasConnected(Boolean(settings.gasConnected && settings.gasWebAppUrl));
      setSheetsConnected(Boolean(settings.googleSheetsConnected && settings.googleSheetsSpreadsheetId));
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (newSession: ActiveSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    StorageService.clearSession();
    setSession(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation Header */}
      <Navbar
        session={session}
        onLogout={handleLogout}
        onOpenGasModal={() => setIsGasModalOpen(true)}
        onOpenGoogleSheetsModal={() => setIsSheetsModalOpen(true)}
        gasConnected={gasConnected}
        sheetsConnected={sheetsConnected}
      />

      {/* Main Content View by Session State */}
      <main className="flex-1">
        {!session && (
          <LoginView onLoginSuccess={handleLoginSuccess} />
        )}

        {session?.role === 'student' && (
          <StudentSurveyView session={session} onLogout={handleLogout} />
        )}

        {session?.role === 'teacher' && (
          <TeacherDashboard session={session} />
        )}

        {session?.role === 'admin' && (
          <AdminDashboard
            session={session}
            onOpenGasModal={() => setIsGasModalOpen(true)}
            onOpenGoogleSheetsModal={() => setIsSheetsModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex justify-center items-center">
          <span>Суралцагчийн аюулгүй байдал, эрсдлийн цахим үнэлгээ © 2026</span>
        </div>
      </footer>

      {/* Google Sheets / Apps Script Integration Modal */}
      <GasSetupModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
        onConnectedChange={(connected) => setGasConnected(connected)}
      />

      {/* Google Sheets Central Database Modal */}
      <GoogleSheetsDatabaseModal
        isOpen={isSheetsModalOpen}
        onClose={() => {
          setIsSheetsModalOpen(false);
          const settings = StorageService.getSettings();
          setSheetsConnected(Boolean(settings.googleSheetsConnected && settings.googleSheetsSpreadsheetId));
        }}
        onDataRefreshed={() => {
          const settings = StorageService.getSettings();
          setSheetsConnected(Boolean(settings.googleSheetsConnected && settings.googleSheetsSpreadsheetId));
        }}
      />
    </div>
  );
}
