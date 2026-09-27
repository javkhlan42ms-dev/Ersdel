import React, { useState } from 'react';
import { StorageService, ActiveSession, normalizeCode } from '../utils/storage';
import { GasService } from '../utils/gasService';
import { GraduationCap, UserCheck, ShieldCheck, KeyRound, AlertCircle, ArrowRight, Lock, EyeOff, RefreshCw } from 'lucide-react';
import schoolLogo from '../assets/logo.png';

interface LoginViewProps {
  onLoginSuccess: (session: ActiveSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'admin'>('student');

  // Student inputs
  const [studentCode, setStudentCode] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  // Teacher inputs
  const [teacherUsername, setTeacherUsername] = useState('');

  // Admin inputs
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const rawCode = studentCode.trim();
    const codeNorm = normalizeCode(rawCode);
    const codeUpper = rawCode.toUpperCase();
    const pass = studentPassword.trim();

    if (!rawCode || !pass) {
      setErrorMessage('Сурагчийн код болон нууц үгээ бүрэн оруулна уу.');
      return;
    }

    setIsLoading(true);

    // 1. Direct Real-time Cloud Auth via Google Apps Script (Works across all devices)
    let settings = StorageService.getSettings();
    if (!settings.gasWebAppUrl) {
      try {
        const sRes = await fetch('/api/settings');
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData?.settings?.gasWebAppUrl) {
            settings = { ...settings, ...sData.settings };
            StorageService.saveSettings(settings);
          }
        }
      } catch (err) {
        // Continue to other methods
      }
    }

    if (settings.gasWebAppUrl) {
      try {
        const gasAuth = await GasService.login(settings.gasWebAppUrl, {
          studentCode: rawCode,
          password: pass,
          role: 'student'
        });

        if (gasAuth.success && gasAuth.user) {
          const u = gasAuth.user;
          const session: ActiveSession = {
            role: 'student',
            userId: u.id || ('STU_' + (u.studentCode || rawCode)),
            userName: u.fullName || u.student_name || rawCode,
            classId: u.classId || ('CLS_' + (u.className || u.class || 'DEFAULT')),
            className: u.className || u.class || 'Анги',
            studentCode: u.studentCode || rawCode,
            token: `stu_tok_${u.studentCode || rawCode}`
          };
          StorageService.setSession(session);
          StorageService.upsertSingleStudent({
            id: session.userId,
            classId: session.classId,
            className: session.className,
            studentCode: session.studentCode!,
            password: pass,
            fullName: session.userName,
            gender: u.gender || '1',
            isSubmitted: Boolean(u.isSubmitted),
            submittedAt: u.submittedAt,
            riskLevel: u.riskLevel,
            riskScore: u.riskScore
          });
          StorageService.addLog('STUDENT', session.userName, 'LOGIN', `${session.studentCode} сурагч амжилттай нэвтэрлээ`);
          setIsLoading(false);
          onLoginSuccess(session);
          return;
        } else if (gasAuth.success === false && gasAuth.message) {
          if (gasAuth.message.includes('нууц үг')) {
            setIsLoading(false);
            setErrorMessage(gasAuth.message);
            return;
          }
        }
      } catch (gasErr) {
        console.warn('Direct GAS login error, checking server fallback:', gasErr);
      }
    }

    // 2. Direct server fallback check
    try {
      const res = await fetch('/api/auth/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentCode: rawCode, password: pass })
      });
      if (res.ok) {
        const authData = await res.json();
        if (authData?.success && authData.session) {
          StorageService.setSession(authData.session);
          if (authData.student) {
            StorageService.upsertSingleStudent(authData.student);
          }
          await StorageService.syncFromServer();
          setIsLoading(false);
          onLoginSuccess(authData.session);
          return;
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 401 || (errData && errData.message && errData.message.includes('нууц үг'))) {
          setIsLoading(false);
          setErrorMessage(errData.message || 'Нэвтрэх нууц үг буруу байна.');
          return;
        }
      }
    } catch (err) {
      console.warn('Server auth failed, checking offline cache:', err);
    }

    // 3. Local / Offline fallback check - Strictly verify studentCode and password
    const students = StorageService.getStudents();
    const foundStudent = students.find((s) => {
      const sNorm = normalizeCode(s.studentCode);
      const sUpper = s.studentCode.toUpperCase().trim();
      return sNorm === codeNorm || sUpper === codeUpper;
    });

    if (foundStudent) {
      const pNorm = foundStudent.password.trim();
      const passMatches = (pNorm === pass || pNorm.toUpperCase() === pass.toUpperCase());
      if (!passMatches) {
        setIsLoading(false);
        setErrorMessage('Нэвтрэх нууц үг буруу байна. Ангийн багшаасаа нууц үгээ авна уу.');
        return;
      }

      const session: ActiveSession = {
        role: 'student',
        userId: foundStudent.id,
        userName: foundStudent.fullName,
        classId: foundStudent.classId,
        className: foundStudent.className,
        studentCode: foundStudent.studentCode,
        token: `stu_tok_${foundStudent.id}`
      };
      StorageService.setSession(session);
      StorageService.addLog('STUDENT', foundStudent.fullName, 'LOGIN', `${foundStudent.studentCode} сурагч нэвтэрлээ (Офлайн)`);
      setIsLoading(false);
      onLoginSuccess(session);
    } else {
      setIsLoading(false);
      setErrorMessage('Сурагчийн код олдсонгүй. Ангийн багшаасаа шалгана уу.');
    }
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const rawUser = teacherUsername.trim();

    if (!rawUser) {
      setErrorMessage('Багшийн нэвтрэх нэр эсвэл ангийн нэрээ оруулна уу.');
      return;
    }

    const normInput = normalizeCode(rawUser);
    const upperRaw = rawUser.toUpperCase();
    const rawDigitsOnly = rawUser.replace(/[^0-9]/g, '');

    setIsLoading(true);

    // 1. Direct Real-time Cloud Auth via Google Apps Script
    let settings = StorageService.getSettings();
    if (!settings.gasWebAppUrl) {
      try {
        const sRes = await fetch('/api/settings');
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData?.settings?.gasWebAppUrl) {
            settings = { ...settings, ...sData.settings };
            StorageService.saveSettings(settings);
          }
        }
      } catch (err) {}
    }

    if (settings.gasWebAppUrl) {
      try {
        const gasAuth = await GasService.login(settings.gasWebAppUrl, {
          username: rawUser,
          code: rawUser,
          role: 'teacher'
        });

        if (gasAuth.success && gasAuth.user) {
          const u = gasAuth.user;
          const session: ActiveSession = {
            role: 'teacher',
            userId: u.id || ('TCH_' + (u.teacherCode || u.className)),
            userName: u.fullName || u.name || 'Ангийн багш',
            classId: u.classId || ('CLS_' + u.className),
            className: u.className || u.class,
            token: `tch_tok_${u.teacherCode || u.className}`
          };
          StorageService.setSession(session);
          StorageService.addLog('TEACHER', session.userName, 'LOGIN', `${session.userName} багш нэвтэрлээ`);
          setIsLoading(false);
          onLoginSuccess(session);
          return;
        }
      } catch (gasErr) {
        console.warn('Direct GAS teacher login error, falling back:', gasErr);
      }
    }

    // 2. Direct server fallback check - verifies registered teacher username/code
    try {
      const res = await fetch('/api/auth/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: rawUser })
      });
      if (res.ok) {
        const authData = await res.json();
        if (authData?.success && authData.session) {
          StorageService.setSession(authData.session);
          await StorageService.syncFromServer();
          setIsLoading(false);
          onLoginSuccess(authData.session);
          return;
        }
      }
    } catch (err) {
      console.warn('Server auth failed, checking local cache:', err);
    }

    // 3. Local cache check - Strictly verify registered username exists
    const tryFindTeacher = (teachersList: any[], classesList: any[]) => {
      let foundTeacher = teachersList.find((t) => {
        const tCodeNorm = normalizeCode(t.teacherCode);
        const tClassNorm = normalizeCode(t.className);
        const tPhoneDigits = t.phone ? t.phone.replace(/[^0-9]/g, '') : '';
        const tNameUpper = (t.name || '').toUpperCase().trim();

        return (
          t.teacherCode.toUpperCase() === upperRaw ||
          tCodeNorm === normInput ||
          t.className.toUpperCase() === upperRaw ||
          tClassNorm === normInput ||
          tNameUpper === upperRaw ||
          (rawDigitsOnly.length >= 6 && tPhoneDigits === rawDigitsOnly)
        );
      });

      let foundClass = classesList.find((c) => {
        const cCodeNorm = normalizeCode(c.teacherCode);
        const cNameNorm = normalizeCode(c.name);

        return (
          c.teacherCode.toUpperCase() === upperRaw ||
          cCodeNorm === normInput ||
          c.name.toUpperCase() === upperRaw ||
          cNameNorm === normInput
        );
      });

      if (!foundTeacher && foundClass) {
        foundTeacher = teachersList.find((t) => t.classId === foundClass!.id || t.className === foundClass!.name);
      }
      if (!foundClass && foundTeacher) {
        foundClass = classesList.find((c) => c.id === foundTeacher!.classId || c.name === foundTeacher!.className);
      }

      return { foundTeacher, foundClass };
    };

    let teachers = StorageService.getTeachers();
    let classes = StorageService.getClasses();
    let { foundTeacher, foundClass } = tryFindTeacher(teachers, classes);

    if (!foundTeacher && !foundClass) {
      setIsLoading(false);
      setErrorMessage('Багшийн нэвтрэх нэр олдсонгүй. Анги бүлэг эсвэл кодоо шалгана уу.');
      return;
    }

    const className = foundClass ? foundClass.name : foundTeacher?.className || 'Анги';
    const classId = foundClass ? foundClass.id : foundTeacher?.classId || '';
    const teacherName = foundTeacher ? foundTeacher.name : `${className} Ангийн багш`;

    const session: ActiveSession = {
      role: 'teacher',
      userId: foundTeacher?.id || 'TCH_' + classId,
      userName: teacherName,
      classId,
      className,
      token: `tch_tok_${classId}`
    };
    StorageService.setSession(session);
    StorageService.addLog('TEACHER', teacherName, 'LOGIN', `${className} ангийн эрхээр нэвтэрлээ (${rawUser})`);
    setIsLoading(false);
    onLoginSuccess(session);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const u = adminUsername.trim().toLowerCase();
    const p = adminPassword.trim();

    if (!u || !p) {
      setErrorMessage('Админы нэвтрэх нэр, нууц үгийг оруулна уу.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const allowedUsers = [
        'admin',
        'javkhlan42ms@moes.edu.mn',
        'javkhlan',
        'ерөнхий администратор',
        'administrator'
      ];
      const isUserValid = allowedUsers.includes(u);
      const isPassValid = (p === 'AmjilT2019@' || p === 'admin');

      if (isUserValid && isPassValid) {
        const session: ActiveSession = {
          role: 'admin',
          userId: 'ADM_001',
          userName: u.includes('javkhlan') ? 'Жавхлан (Администратор)' : 'Ерөнхий Администратор',
          token: 'adm_token_001'
        };
        StorageService.setSession(session);
        StorageService.addLog('ADMIN', session.userName, 'LOGIN', 'Админ системд нэвтэрлээ');
        onLoginSuccess(session);
      } else {
        setErrorMessage('Админы нэвтрэх нэр эсвэл нууц үг тохирохгүй байна.');
      }
      setIsLoading(false);
    }, 250);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* App Title Card */}
        <div className="text-center">
          <div className="mx-auto w-24 h-24 mb-3.5 flex items-center justify-center">
            <img
              src={schoolLogo}
              alt="Сургуулийн лого"
              className="w-24 h-24 object-contain rounded-full shadow-md drop-shadow-sm hover:scale-105 transition-transform duration-200 bg-white"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.tried) {
                  target.dataset.tried = 'true';
                  target.src = './logo.png';
                }
              }}
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Сургуулийн цахим үнэлгээний систем
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Судалгаа бөглөх болон үр дүн харах хэсэг рүү нэвтрэх
          </p>
        </div>

        {/* Role Tab Selector */}
        <div className="bg-slate-100 p-1 rounded-xl flex">
          <button
            type="button"
            id="tab-student"
            onClick={() => {
              setActiveTab('student');
              setErrorMessage('');
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'student'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Сурагч / Эцэг эх</span>
          </button>

          <button
            type="button"
            id="tab-teacher"
            onClick={() => {
              setActiveTab('teacher');
              setErrorMessage('');
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'teacher'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Ангийн багш</span>
          </button>

          <button
            type="button"
            id="tab-admin"
            onClick={() => {
              setActiveTab('admin');
              setErrorMessage('');
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Админ</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 sm:p-7">
          {/* 1. STUDENT LOGIN */}
          {activeTab === 'student' && (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div className="text-left mb-2">
                <h3 className="text-base font-semibold text-slate-900">
                  Сурагчийн эрхээр нэвтрэх
                </h3>
                <p className="text-xs text-slate-500">
                  Ангийн багшаас олгосон сурагчийн код болон нууц үгээ оруулна уу
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Сурагчийн код (Username)
                </label>
                <input
                  type="text"
                  id="input-student-code"
                  placeholder="Сурагчийн код"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck="false"
                  inputMode="text"
                  className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all uppercase tracking-wider font-mono min-h-[46px]"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 Монгол эсвэл англи үсгээр бичсэн ч автоматаар танина.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Нэвтрэх нууц үг (Password)
                </label>
                <div className="relative">
                  <input
                    type={showStudentPassword ? 'text' : 'password'}
                    id="input-student-password"
                    placeholder="Нууц үг"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    className="w-full pl-3.5 pr-11 py-3 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all tracking-wider font-mono min-h-[46px]"
                    required
                  />
                  <button
                    type="button"
                    id="btn-toggle-student-password"
                    onClick={() => setShowStudentPassword(!showStudentPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer touch-manipulation min-w-[38px] min-h-[38px] flex items-center justify-center"
                    title={showStudentPassword ? 'Нууц үг нуух' : 'Нууц үг харах (түгжээ тайлах)'}
                    aria-label="Нууц үг харах"
                  >
                    {showStudentPassword ? (
                      <EyeOff className="w-5 h-5 sm:w-4 sm:h-4 text-blue-600" />
                    ) : (
                      <Lock className="w-5 h-5 sm:w-4 sm:h-4" />
                    )}
                  </button>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none hover:text-slate-900 py-1">
                    <input
                      type="checkbox"
                      id="check-show-student-password"
                      checked={showStudentPassword}
                      onChange={(e) => setShowStudentPassword(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                    />
                    <span>Нууц үг ил харах</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                id="btn-student-submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 sm:py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 min-h-[46px] touch-manipulation"
              >
                {isLoading ? 'Шалгаж байна...' : 'Судалгаа бөглөхөөр нэвтрэх'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* 2. TEACHER LOGIN */}
          {activeTab === 'teacher' && (
            <form onSubmit={handleTeacherLogin} className="space-y-4">
              <div className="text-left mb-2">
                <h3 className="text-base font-semibold text-slate-900">
                  Ангийн багшийн нэвтрэлт
                </h3>
                <p className="text-xs text-slate-500">
                  Анги бүлэг (эсвэл багшийн код) болон нэвтрэх нууц үгээ оруулна уу
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Багшийн нэвтрэх нэр (Анги бүлэг эсвэл Код)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="input-teacher-username"
                    placeholder="Жишээ нь: 7А, 8Б эсвэл TEACH-7926"
                    value={teacherUsername}
                    onChange={(e) => setTeacherUsername(e.target.value)}
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck="false"
                    className="w-full pl-3.5 pr-10 py-3 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono uppercase tracking-wider min-h-[46px]"
                    required
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 Бүртгэлтэй ангийн нэр (жишээ: 7А, 8Б) эсвэл багшийн нэвтрэх кодоо зөв оруулна.
                </p>
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                🔒 Багш зөвхөн бүртгэлтэй нэвтрэх нэрээ зөв оруулж өөрийн хариуцсан ангийн удирдлагад нэвтэрнэ.
              </p>

              <button
                type="submit"
                id="btn-teacher-submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 sm:py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 min-h-[46px] touch-manipulation"
              >
                {isLoading ? 'Шалгаж байна...' : 'Багшийн удирдлагын хэсэгт нэвтрэх'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* 3. ADMIN LOGIN */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="text-left mb-2">
                <h3 className="text-base font-semibold text-slate-900">
                  Администраторын нэвтрэлт
                </h3>
                <p className="text-xs text-slate-500">
                  Сургууль, анги, багшийн код үүсгэх ба нэгдсэн статистик хяналт
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Нэвтрэх нэр (Username эсвэл Имэйл)
                </label>
                <input
                  type="text"
                  id="input-admin-username"
                  placeholder="Нэвтрэх нэр эсвэл имэйл"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  autoComplete="username"
                  className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all min-h-[46px]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Нууц үг (Password)
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    id="input-admin-password"
                    placeholder="Нууц үг"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    autoComplete="current-password"
                    className="w-full pl-3.5 pr-11 py-3 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all min-h-[46px]"
                    required
                  />
                  <button
                    type="button"
                    id="btn-toggle-admin-password"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer touch-manipulation min-w-[38px] min-h-[38px] flex items-center justify-center"
                    title={showAdminPassword ? 'Нууц үг нуух' : 'Нууц үг харах (түгжээ тайлах)'}
                    aria-label="Нууц үг харах"
                  >
                    {showAdminPassword ? (
                      <EyeOff className="w-5 h-5 sm:w-4 sm:h-4 text-blue-600" />
                    ) : (
                      <Lock className="w-5 h-5 sm:w-4 sm:h-4" />
                    )}
                  </button>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none hover:text-slate-900 py-1">
                    <input
                      type="checkbox"
                      id="check-show-admin-password"
                      checked={showAdminPassword}
                      onChange={(e) => setShowAdminPassword(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                    />
                    <span>Нууц үг ил харах</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                id="btn-admin-submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 sm:py-3 px-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 min-h-[46px] touch-manipulation"
              >
                {isLoading ? 'Шалгаж байна...' : 'Админы эрхээр нэвтрэх'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
