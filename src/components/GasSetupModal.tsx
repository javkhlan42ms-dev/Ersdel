import React, { useState } from 'react';
import { StorageService } from '../utils/storage';
import { GasService } from '../utils/gasService';
import { GAS_ALL_IN_ONE_SCRIPT } from '../utils/gasScriptTemplate';
import { RAW_QUESTIONS } from '../data/questions';
import {
  FileSpreadsheet,
  CheckCircle2,
  X,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Database,
  ArrowRight,
  UploadCloud,
  DownloadCloud,
  Layers,
  Code2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface GasSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectedChange?: (connected: boolean) => void;
  onDataRefreshed?: () => void;
}

export const GasSetupModal: React.FC<GasSetupModalProps> = ({
  isOpen,
  onClose,
  onConnectedChange,
  onDataRefreshed
}) => {
  const [settings, setSettings] = useState(StorageService.getSettings());
  const [gasUrl, setGasUrl] = useState(settings.gasWebAppUrl || '');
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GAS_ALL_IN_ONE_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveAndTest = async () => {
    if (!gasUrl.trim()) {
      const updated = { ...settings, gasWebAppUrl: '', gasConnected: false };
      StorageService.saveSettings(updated);
      setSettings(updated);
      setTestResult({ success: false, message: 'Google Apps Script холболтыг салгалаа.' });
      if (onConnectedChange) onConnectedChange(false);
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await GasService.ping(gasUrl.trim());
      const updated = { ...settings, gasWebAppUrl: gasUrl.trim(), gasConnected: true };
      StorageService.saveSettings(updated);
      setSettings(updated);
      await StorageService.syncToServer();
      setTestResult({
        success: true,
        message: res.message || 'Амжилттай холбогдлоо! Google Sheet дээр өгөгдөл шууд синхрончлогдоно.'
      });
      if (onConnectedChange) onConnectedChange(true);
    } catch (err: any) {
      // If ping has CORS issue but URL is valid Apps Script exec URL
      if (gasUrl.includes('script.google.com/macros/s/')) {
        const updated = { ...settings, gasWebAppUrl: gasUrl.trim(), gasConnected: true };
        StorageService.saveSettings(updated);
        setSettings(updated);
        await StorageService.syncToServer();
        setTestResult({
          success: true,
          message: 'URL хадгалагдлаа. (Зөвлөмж: Apps Script дээр "Deploy" хийхдээ "Who has access" сонголтыг "Anyone" сонгосон эсэхээ шалгаарай).'
        });
        if (onConnectedChange) onConnectedChange(true);
      } else {
        setTestResult({
          success: false,
          message: err.message || 'Холбогдож чадсангүй. Web App URL-аа зөв хуулсан эсэхээ шалгана уу.'
        });
      }
    } finally {
      setIsTesting(false);
    }
  };

  // Request Sync all local data to GAS
  const requestSyncAllToGas = () => {
    if (!gasUrl.trim()) {
      setTestResult({
        success: false,
        message: 'Эхлээд дээрх талбарт Google Apps Script Web App URL-аа оруулж холбоно уу.'
      });
      return;
    }

    const classes = StorageService.getClasses();
    const students = StorageService.getStudents();

    setConfirmDialog({
      title: 'Google Sheet рүү өгөгдөл илгээх үү?',
      description: `Системийн нийт ${classes.length} анги, ${students.length} сурагчийн код, нууц үг, судалгааны явцыг Google Sheet рүү синк хийж бичнэ.`,
      confirmText: 'Тийм, Google Sheet рүү илгээх',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setIsSyncing(true);
          const teachers = StorageService.getTeachers();
          const responses = StorageService.getAllResponses();
          const currentSettings = StorageService.getSettings();

          const res = await GasService.syncAllToGas(gasUrl.trim(), {
            classes,
            teachers,
            students,
            responses,
            settings: currentSettings
          });

          const updated = {
            ...currentSettings,
            gasWebAppUrl: gasUrl.trim(),
            gasConnected: true,
            googleSheetsLastSync: new Date().toISOString()
          };
          StorageService.saveSettings(updated);
          setSettings(updated);
          await StorageService.syncToServer();

          setTestResult({
            success: true,
            message: res.message || `Амжилттай: ${students.length} сурагч, ${classes.length} ангийн өгөгдөл Google Sheet рүү амжилттай синк хийгдлээ!`
          });
        } catch (err: any) {
          const msg = err.message || 'Web app эрхээ шалгана уу';
          setTestResult({
            success: false,
            message: 'Өгөгдөл илгээхэд алдаа гарлаа: ' + msg
          });
        } finally {
          setIsSyncing(false);
        }
      }
    });
  };

  // Request Load all data from GAS
  const requestLoadAllFromGas = () => {
    if (!gasUrl.trim()) {
      setTestResult({
        success: false,
        message: 'Эхлээд дээрх талбарт Google Apps Script Web App URL-аа оруулна уу.'
      });
      return;
    }

    setConfirmDialog({
      title: 'Google Sheet-ээс өгөгдлийг татаж шинэчлэх үү?',
      description: 'Google Sheet дээр байгаа бүх анги, багш, сурагчдын өгөгдөл болон судалгааны хариултыг татаж систем рүү шинэчилнэ.',
      confirmText: 'Тийм, Sheet-ээс өгөгдөл татах',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setIsSyncing(true);
          const data = await GasService.loadAllFromGas(gasUrl.trim());

          if (data.classes && data.classes.length > 0) {
            StorageService.saveClasses(data.classes);
          }
          if (data.teachers && data.teachers.length > 0) {
            StorageService.saveTeachers(data.teachers);
          }
          if (data.students && data.students.length > 0) {
            StorageService.saveStudents(data.students);
          }
          if (data.responses && Object.keys(data.responses).length > 0) {
            StorageService.saveResponses(data.responses);
          }

          setTestResult({
            success: true,
            message: `Google Sheet-ээс амжилттай татлаа (${data.classes?.length || 0} анги, ${data.students?.length || 0} сурагч).`
          });
          onDataRefreshed?.();
        } catch (err: any) {
          setTestResult({
            success: false,
            message: 'Өгөгдөл татахад алдаа гарлаа: ' + (err.message || 'Web app эрхээ шалгана уу')
          });
        } finally {
          setIsSyncing(false);
        }
      }
    });
  };

  // Request Import questions to GAS
  const requestSyncQuestions = () => {
    if (!gasUrl.trim()) {
      setTestResult({
        success: false,
        message: 'Эхлээд дээрх талбарт Google Apps Script Web App URL-аа оруулна уу.'
      });
      return;
    }

    setConfirmDialog({
      title: '143 асуултуудыг Google Sheet рүү хуулах уу?',
      description: 'Google Sheet доторх "Асуултууд" хуудас руу бүх 143 асуулт болон хариултын хувилбаруудыг импортлон хадгална.',
      confirmText: 'Тийм, Асуултуудыг хуулах',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setIsSyncing(true);
          await fetch(gasUrl.trim(), {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'importQuestions',
              questions: RAW_QUESTIONS
            })
          });
          setTestResult({
            success: true,
            message: 'Бүх 143 асуултууд Google Sheet-ийн "Асуултууд" хуудас руу амжилттай импортлогдлоо!'
          });
        } catch {
          setTestResult({
            success: false,
            message: 'Асуултуудыг илгээхэд алдаа гарлаа. Web app-ын эрхээ шалгана уу.'
          });
        } finally {
          setIsSyncing(false);
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-scaleUp">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  Google Apps Script (GAS) Төв Өгөгдлийн Сан
                </h3>
                {settings.gasConnected && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Холбогдсон
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Домэйн шаардахгүй, өөрийн Google Sheet дээр шууд өгөгдлийн бааз ажиллуулах холболт
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Why GAS Banner */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <p className="font-bold text-sm text-emerald-900 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Хамгийн хялбар бөгөөд найдвартай арга
              </p>
              <p className="text-emerald-800 leading-relaxed">
                Энэ арга нь <strong>ямар ч нэвтрэх эрх, домэйны хязгаарлалт шаардахгүй</strong> бөгөөд компьютер, гар утас, таблет аль ч төхөөрөмжөөс сурагчид судалгаа бөглөхөд Google Sheet рүү бодит цагт бичигдэнэ.
              </p>
            </div>
            <a
              href={`https://docs.google.com/spreadsheets/d/${settings.googleSheetsSpreadsheetId || '1khD5nF99T5v9NqZgX4kiC4Cc-JiohM2nJfPXRVR9ZEg'}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold flex items-center gap-1.5 whitespace-nowrap shadow-xs cursor-pointer transition-colors"
            >
              <span>Google Sheet нээх</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Setup Steps */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">1</span>
              <span>Код хуулах & Apps Script дээр тавих</span>
            </h4>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="text-slate-700 font-medium">
                  Бүх хүснэгт, синк болон хариулт бичих боломжтой <strong>Бэлэн Код</strong>:
                </span>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Код хуулагдлаа!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Бүх кодыг хуулах (1-товшилт)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code preview accordion */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setShowCodePreview(!showCodePreview)}
                  className="w-full px-3 py-2 text-left font-semibold text-slate-700 flex justify-between items-center hover:bg-slate-50 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-slate-500" />
                    <span>Кодыг харах / шалгах</span>
                  </span>
                  {showCodePreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showCodePreview && (
                  <pre className="p-3 bg-slate-900 text-slate-100 text-[11px] font-mono max-h-60 overflow-y-auto leading-relaxed">
                    {GAS_ALL_IN_ONE_SCRIPT}
                  </pre>
                )}
              </div>
            </div>

            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 pt-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">2</span>
              <span>Google Sheet дээр байршуулах (3 алхам)</span>
            </h4>

            <ol className="space-y-2 text-xs text-slate-600 list-decimal list-inside leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-4">
              <li>
                Google Sheet дээрээ очоод цэснээс <strong>Өргөтгөлүүд (Extensions) ➜ Apps Script</strong> руу орно.
              </li>
              <li>
                Гарч ирсэн <code>Code.gs</code> доторх кодыг арилгаад дээрх хуулж авсан <strong>кодыг тавина (Ctrl+V)</strong> ба хадгална (Ctrl+S).
              </li>
              <li>
                Дээрх цэсний функцууд дундаас <strong>setupInitialSheets</strong>-ийг сонгоод <strong>Run (Ажиллуулах)</strong> дарна (Хүснэгтүүд автоматаар үүснэ).
              </li>
              <li>
                Баруун дээд талын <strong>Deploy (Байрлуулах) ➜ New deployment (Шинэ байршуулалт)</strong> сонгоно.
                <div className="pl-4 pt-1 font-semibold text-slate-800 space-y-0.5">
                  <p>• Төрөл: <strong>Web app</strong></p>
                  <p>• Execute as: <strong>Me</strong></p>
                  <p className="text-amber-700 font-bold">• Who has access: <strong>Anyone (Хүн бүр)</strong> ⚠️ Заавал үүнийг сонгоно уу!</p>
                </div>
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 font-normal">
                  <strong>💡 Хэрэв өмнө нь байршуулсан байсан бол:</strong> Дээрх 1-р алхмын шинэ кодыг хуулж тавьсны дараа заавал <strong>Deploy ➜ Manage deployments ➜ Засах (Харандаа) ➜ Version хэсгээс 'New version' сонгоод Deploy</strong> дарж шинэчилнэ үү. Зөвхөн Save хийхэд хуучин код нь ажилладаг тул энэ алхам чухал.
                </div>
              </li>
              <li>
                Үүссэн <strong>Web app URL</strong>-ийг хуулж аваад доорх талбарт оруулна.
              </li>
            </ol>

            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 pt-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">3</span>
              <span>Web App URL холбох</span>
            </h4>

            {/* Web App URL Form */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-semibold text-slate-800">
                Google Apps Script Web App URL
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={gasUrl}
                  onChange={(e) => setGasUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleSaveAndTest}
                  disabled={isTesting}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 justify-center"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Шалгаж байна...</span>
                    </>
                  ) : (
                    <span>Хадгалах & Шалгах</span>
                  )}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            {/* Sync actions when connected or URL entered */}
            {(settings.gasConnected || gasUrl.trim()) && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3">
                <h5 className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-700" />
                  <span>Өгөгдөл Синхрончлол (Sync)</span>
                </h5>
                <p className="text-[11px] text-emerald-800">
                  Систем дээрх бүх анги, багш, сурагчдын нэрс, нууц үг болон судалгааны явцыг Google Sheet рүү шууд илгээх эсвэл Google Sheet-ээс татаж шинэчлэх боломжтой:
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={requestSyncAllToGas}
                    disabled={isSyncing}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isSyncing ? 'Илгээж байна...' : 'Google Sheet рүү синк хийх (Экспорт)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={requestLoadAllFromGas}
                    disabled={isSyncing}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    <span>Google Sheet-ээс өгөгдөл татах (Импорт)</span>
                  </button>

                  <button
                    type="button"
                    onClick={requestSyncQuestions}
                    disabled={isSyncing}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-slate-500" />
                    <span>143 Асуултыг импортлох</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50/50 rounded-b-2xl">
          <div className="text-xs text-slate-500">
            {settings.gasConnected ? 'Төлөв: Google Apps Script холбогдсон' : 'Төлөв: Холбогдоогүй'}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Хаах
          </button>
        </div>

        {/* In-Modal Confirmation Dialog */}
        {confirmDialog && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
              <h4 className="font-bold text-slate-900 text-base">
                {confirmDialog.title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {confirmDialog.description}
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Болих
                </button>
                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
