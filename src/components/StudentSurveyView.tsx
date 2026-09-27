import React, { useState, useEffect, useMemo } from 'react';
import { ActiveSession, StorageService } from '../utils/storage';
import { Student } from '../types';
import { RAW_QUESTIONS, SECTIONS, SECTION_V_SUBSECTIONS } from '../data/questions';
import {
  evaluateQuestionCondition,
  isQuestionRequired,
  isQuestionComplete,
  validateSection
} from '../utils/surveyConditionLogic';
import { RegistrationNumberInput } from './RegistrationNumberInput';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Save,
  AlertCircle,
  CheckCircle2,
  Lock,
  ShieldAlert,
  Calendar,
  User,
  GraduationCap,
  Layers,
  FileCode,
  Download,
  X,
  Sparkles,
  Phone
} from 'lucide-react';

interface StudentSurveyViewProps {
  session: ActiveSession;
  onLogout: () => void;
}

export const StudentSurveyView: React.FC<StudentSurveyViewProps> = ({ session }) => {
  const [currentSectionId, setCurrentSectionId] = useState<number>(1);
  const [selectedSubSectionId, setSelectedSubSectionId] = useState<string>('all');
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  // Missing questions validation tracking
  const [highlightedMissingIds, setHighlightedMissingIds] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check if current class has concluded its risk assessment
  const studentClass = useMemo(() => {
    const classes = StorageService.getClasses();
    return classes.find(
      (c) => c.id === currentStudent?.classId || c.name === (currentStudent?.className || session.className)
    );
  }, [currentStudent?.classId, currentStudent?.className, session.className]);

  const isClassLocked = Boolean(studentClass?.isLocked);
  const isLocked = Boolean(isClassLocked || (currentStudent?.isSubmitted && !currentStudent?.canRetake));

  // Load student data & existing answers
  useEffect(() => {
    const students = StorageService.getStudents();
    let st = students.find((s) => s.id === session.userId || s.studentCode === session.studentCode);
    if (!st && session.studentCode) {
      // Fallback from activeSession for multi-device login
      st = {
        id: session.userId,
        classId: session.classId,
        className: session.className,
        studentCode: session.studentCode,
        password: '******',
        fullName: session.userName,
        gender: '1',
        isSubmitted: false
      };
      StorageService.upsertSingleStudent(st);
    }
    if (st) {
      setCurrentStudent(st);
      const existingAnswers = StorageService.getStudentResponses(st.id);
      setAnswers(existingAnswers);
    }
  }, [session.userId, session.studentCode, session.userName, session.classId, session.className]);

  // Current questions for the selected section
  const sectionQuestions = useMemo(() => {
    return RAW_QUESTIONS.filter((q) => q.section_id === currentSectionId);
  }, [currentSectionId]);

  const currentSection = useMemo(() => {
    return SECTIONS.find((s) => s.id === currentSectionId) || SECTIONS[0];
  }, [currentSectionId]);

  // Validation of the current active section
  const currentSectionValidation = useMemo(() => {
    return validateSection(currentSectionId, RAW_QUESTIONS, answers);
  }, [currentSectionId, answers]);

  // Autosave handler with debounce & condition field cleanups
  const handleAnswerChange = (questionId: string, value: string) => {
    if (isLocked) return;

    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value };

      // Dynamic condition cleanups when switching answers:
      // If Q012 (Хэнтэйгээ амьдардаг вэ?) is selected:
      if (questionId === 'Q012') {
        if (value === '2') {
          // Mother only -> clear father details
          delete next['Q023'];
          delete next['Q024'];
          delete next['Q025'];
        } else if (value === '3') {
          // Father only -> clear mother details
          delete next['Q027'];
          delete next['Q028'];
        } else if (value === '1') {
          // Living with parents -> guardian not needed
          delete next['Q033'];
        } else if (['6', '7', '8', '9', '10'].includes(value)) {
          // Relatives/grandparents -> clear parent details
          delete next['Q023'];
          delete next['Q024'];
          delete next['Q025'];
          delete next['Q027'];
          delete next['Q028'];
        }
      }

      // If Q032 (Хагас бүтэн өнчин эсэх) is full orphan:
      if (questionId === 'Q032' && value === '2') {
        delete next['Q023'];
        delete next['Q024'];
        delete next['Q025'];
        delete next['Q027'];
        delete next['Q028'];
      }

      // If Q035..Q038 are all "Үгүй" (value '2') -> clear Q039, Q040, Q041
      if (['Q035', 'Q036', 'Q037', 'Q038'].includes(questionId)) {
        const isNo = (v?: string) => v === '2' || v === 'Үгүй' || v?.toLowerCase() === 'үгүй';
        if (isNo(next['Q035']) && isNo(next['Q036']) && isNo(next['Q037']) && isNo(next['Q038'])) {
          delete next['Q039'];
          delete next['Q040'];
          delete next['Q041'];
        }
      }

      // If Q043 (Хөгжлийн бэрхшээлтэй эсэх) is No -> clear Q044 (Бэрхшээлийн хэлбэр)
      if (questionId === 'Q043' && value !== '1') {
        delete next['Q044'];
      }

      // If Q048 (Өвчлөл байгаа эсэх) is No -> clear Q049 description
      if (questionId === 'Q048' && value !== '1') {
        delete next['Q049'];
      }

      // If Q055 (ДЗОУБ хамрагддаг) is No -> clear Q056 code
      if (questionId === 'Q055' && value !== '1') {
        delete next['Q056'];
      }

      // If Q093 (Хурдан морь унадаг) is No -> clear Q094-Q103
      if (questionId === 'Q093' && value !== '1') {
        const horseRidingIds = [
          'Q094', 'Q095', 'Q096', 'Q097', 'Q098',
          'Q099', 'Q100', 'Q101', 'Q102', 'Q103'
        ];
        horseRidingIds.forEach((id) => {
          delete next[id];
        });
      }

      // If Q099 (Унаж бэртсэн эсэх) is No -> clear Q100 details
      if (questionId === 'Q099' && value !== '1') {
        delete next['Q100'];
      }

      if (currentStudent) {
        StorageService.saveStudentDraft(currentStudent.id, next);
        setIsSavedRecently(true);
        setTimeout(() => setIsSavedRecently(false), 2000);
      }
      return next;
    });

    // Remove from missing highlights once answered
    setHighlightedMissingIds((prev) => {
      const remaining = prev.filter((id) => id !== questionId);
      if (remaining.length === 0) {
        setValidationError(null);
      }
      return remaining;
    });
  };

  // Progress metrics
  const totalQuestions = RAW_QUESTIONS.length;
  const answeredCount = Object.values(answers).filter(
    (val) => typeof val === 'string' && val.trim() !== ''
  ).length;
  const overallPercentage = Math.round((answeredCount / totalQuestions) * 100);

  const sectionAnsweredCount = sectionQuestions.filter(
    (q) => typeof answers[q.id] === 'string' && answers[q.id].trim() !== ''
  ).length;

  const handleNext = () => {
    if (currentStudent?.isSubmitted && !currentStudent.canRetake) {
      if (currentSectionId < 8) {
        setCurrentSectionId((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const validation = validateSection(currentSectionId, RAW_QUESTIONS, answers);
    if (!validation.isValid) {
      setHighlightedMissingIds(validation.missingQuestionIds);
      setValidationError(
        `Бүлэг ${currentSectionId}-ийн заавал бөглөх ${validation.missingQuestionIds.length} асуултыг гүйцээнэ үү!`
      );

      // Scroll smoothly to first missing question
      const firstMissingId = validation.missingQuestionIds[0];
      const el = document.getElementById(`q-card-${firstMissingId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const inputEl = document.getElementById(`input-${firstMissingId}`);
        if (inputEl) inputEl.focus();
      }
      return;
    }

    setHighlightedMissingIds([]);
    setValidationError(null);
    if (currentSectionId < 8) {
      setCurrentSectionId((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setHighlightedMissingIds([]);
    setValidationError(null);
    if (currentSectionId > 1) {
      setCurrentSectionId((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTabClick = (targetSectionId: number) => {
    if (targetSectionId === currentSectionId) return;

    // Navigating backwards is always allowed
    if (targetSectionId < currentSectionId) {
      setHighlightedMissingIds([]);
      setValidationError(null);
      setCurrentSectionId(targetSectionId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Navigating forward requires completing current section
    if (!currentStudent?.isSubmitted || currentStudent?.canRetake) {
      const validation = validateSection(currentSectionId, RAW_QUESTIONS, answers);
      if (!validation.isValid) {
        setHighlightedMissingIds(validation.missingQuestionIds);
        setValidationError(
          `Бүлэг ${currentSectionId}-ийг бүрэн бөглөсний дараа дараагийн бүлгүүд рүү шилжих боломжтой! (${validation.missingQuestionIds.length} асуулт дутуу)`
        );
        const firstMissingId = validation.missingQuestionIds[0];
        const el = document.getElementById(`q-card-${firstMissingId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
    }

    setHighlightedMissingIds([]);
    setValidationError(null);
    setCurrentSectionId(targetSectionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async () => {
    if (!currentStudent || isSubmitting) return;
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const result = await StorageService.submitStudentSurvey(currentStudent.id, answers);
      setIsSubmitting(false);

      if (result.success) {
        setShowConfirmModal(false);
        setSubmitSuccess(true);
        // Reload student state
        const students = StorageService.getStudents();
        const st = students.find((s) => s.id === currentStudent.id || s.studentCode === currentStudent.studentCode);
        if (st) setCurrentStudent(st);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSubmissionError(result.message);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmissionError(err.message || 'Судалгааг хадгалахад алдаа гарлаа.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Student Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {currentStudent?.fullName || session.userName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  {currentStudent?.className || session.className}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span>Код: <strong className="text-slate-700 font-mono">{currentStudent?.studentCode || session.studentCode}</strong></span>
                <span>•</span>
                <span>Хүйс: {currentStudent?.gender === '1' ? 'Эмэгтэй' : 'Эрэгтэй'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 justify-end">
                <Save className="w-3.5 h-3.5 text-slate-400" />
                {isSavedRecently ? (
                  <span className="text-emerald-600 font-medium">Ноорог хадгалагдлаа</span>
                ) : (
                  <span>Автомат хадгалалт идэвхтэй</span>
                )}
              </div>
              <div className="text-xs font-semibold text-slate-800 mt-0.5">
                {answeredCount} / {totalQuestions} асуулт ({overallPercentage}%)
              </div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full mt-4 overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.max(overallPercentage, 3)}%` }}
          />
        </div>
      </div>

      {/* Class Level Locked Banner if Class Risk Assessment Concluded */}
      {isClassLocked && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center mb-6 shadow-xs animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-rose-950">
            {studentClass?.name || currentStudent?.className || session.className} ангийн эрсдэлийн үнэлгээ дууссан байна
          </h3>
          <p className="text-sm text-rose-800 mt-1.5 max-w-lg mx-auto leading-relaxed">
            Сургуулийн удирдлагаас тус ангийн эрсдэлийн үнэлгээг албан ёсоор дуусгавар болгосон тул судалгааг хаасан байна. Дахин судалгаа өгөх эсвэл хариулт өөрчлөх боломжгүй (Зөвхөн харах горим).
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white border border-rose-200 text-xs text-rose-700 font-medium">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Судалгаа хаагдсан төлөвтэй • Хариултууд түгжигдсэн</span>
          </div>
        </div>
      )}

      {/* Submitted Banner if Locked Individually */}
      {!isClassLocked && isLocked && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center mb-6 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-emerald-900">
            Судалгааг амжилттай илгээсэн байна
          </h3>
          <p className="text-sm text-emerald-700 mt-1 max-w-md mx-auto">
            Илгээсэн огноо: {currentStudent?.submittedAt ? new Date(currentStudent.submittedAt).toLocaleString('mn-MN') : 'Бүртгэгдсэн'}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 border border-emerald-300 text-xs text-emerald-800">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Судалгааны хариулт түгжигдсэн байна. Хэрэв өөрчлөх шаардлагатай бол сургуулийн админд хандана уу.</span>
          </div>
        </div>
      )}

      {/* 8 Section Stepper Tabs (Mobile Scrollable) */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {SECTIONS.map((sec) => {
          const isCurrent = sec.id === currentSectionId;
          const secValidation = validateSection(sec.id, RAW_QUESTIONS, answers);
          const isComplete = secValidation.isValid && secValidation.totalActiveRequired > 0;

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => handleTabClick(sec.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border shrink-0 cursor-pointer ${
                isCurrent
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : isComplete
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>Бүлэг {sec.id}</span>
              {isComplete ? (
                <CheckCircle className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-emerald-600'}`} />
              ) : (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isCurrent ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {secValidation.completedRequired}/{secValidation.totalActiveRequired}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Section Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Бүлэг {currentSection.id} / 8
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              {currentSection.title}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {currentSection.id === 5 && (
              <button
                type="button"
                onClick={() => setShowJsonModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                title="V бүлгийн JSON бүтцийг харах, татаж авах"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>JSON бүтэц</span>
              </button>
            )}
            {currentSectionValidation.isValid ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Бүлэг бүрэн бөглөгдсөн ({currentSectionValidation.completedRequired}/{currentSectionValidation.totalActiveRequired})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Заавал бөглөх: {currentSectionValidation.completedRequired} / {currentSectionValidation.totalActiveRequired} ({currentSectionValidation.missingQuestionIds.length} дутуу)
              </span>
            )}
          </div>
        </div>

        {/* Section V Sub-sections Interactive Legend & Filter */}
        {currentSection.id === 5 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                4 Дэд бүлгээр ангилсан байдал (Нийт 21 асуулт):
              </span>
              <span className="text-[11px] text-slate-400">
                Дэд бүлэг дээр дарж шүүнэ үү
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {SECTION_V_SUBSECTIONS.map((sub) => {
                const subQuestions = sectionQuestions.filter((q) => q.sub_section_id === sub.id);
                const subAnswered = subQuestions.filter(
                  (q) => typeof answers[q.id] === 'string' && answers[q.id].trim() !== ''
                ).length;
                const isSelected = selectedSubSectionId === sub.id;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() =>
                      setSelectedSubSectionId((prev) => (prev === sub.id ? 'all' : sub.id))
                    }
                    className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 shadow-xs'
                        : 'hover:shadow-2xs opacity-90 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: sub.theme.background,
                      borderColor: sub.theme.border,
                      boxShadow: isSelected ? `0 0 0 2px ${sub.theme.header}` : undefined
                    }}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
                        style={{
                          backgroundColor: sub.theme.badge,
                          color: sub.theme.badge_text
                        }}
                      >
                        ДЭД {sub.order}
                      </span>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: sub.theme.badge,
                          color: sub.theme.badge_text
                        }}
                      >
                        {sub.color_name.split('/')[0].trim()}
                      </span>
                    </div>
                    <div
                      className="text-xs font-bold line-clamp-1"
                      style={{ color: sub.theme.header }}
                    >
                      {sub.title}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-600">
                      <span>Хариулсан:</span>
                      <span className="font-semibold" style={{ color: sub.theme.header }}>
                        {subAnswered} / {sub.questions_count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedSubSectionId !== 'all' && (
              <div className="mt-3 flex items-center justify-between bg-blue-50/70 border border-blue-200 px-3 py-1.5 rounded-lg text-xs">
                <span className="text-blue-900 font-medium">
                  Зөвхөн сонгосон дэд бүлгийн асуултууд харагдаж байна
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSubSectionId('all')}
                  className="text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                >
                  Бүх 21 асуултыг харах
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Validation Error Banner if user tries to jump or advance with incomplete fields */}
      {validationError && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Бүлэг дуусаагүй байна</h4>
              <p className="text-xs text-amber-800 mt-0.5">{validationError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const firstId = highlightedMissingIds[0];
              if (firstId) {
                const el = document.getElementById(`q-card-${firstId}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const inputEl = document.getElementById(`input-${firstId}`);
                inputEl?.focus();
              }
            }}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer shrink-0"
          >
            Дутуу асуулт руу очих
          </button>
        </div>
      )}

      {/* Questions List for Current Section */}
      <div className="space-y-4">
        {sectionQuestions
          .filter((q) => selectedSubSectionId === 'all' || q.sub_section_id === selectedSubSectionId)
          .map((q, idx, currentArray) => {
            const currentVal = answers[q.id] || '';
            const condition = evaluateQuestionCondition(q.id, answers);
            const isQuestionDisabled = condition.disabled;
            const isReq = isQuestionRequired(q, answers);
            const isComplete = isQuestionComplete(q, answers);
            const isAnswered = Boolean(currentVal && currentVal.trim() !== '');
            const isHighlightedMissing = highlightedMissingIds.includes(q.id);

            const isNewSubSection =
              Boolean(q.sub_section) &&
              (idx === 0 || currentArray[idx - 1].sub_section_id !== q.sub_section_id);

            return (
              <React.Fragment key={q.id}>
                {/* Sub-section Header Banner */}
                {isNewSubSection && q.sub_section && q.sub_section_color && (
                  <div
                    id={q.sub_section_id}
                    className="rounded-2xl p-4 border transition-all mt-6 first:mt-0 shadow-xs"
                    style={{
                      backgroundColor: q.sub_section_color.background,
                      borderTopColor: q.sub_section_color.border,
                      borderRightColor: q.sub_section_color.border,
                      borderBottomColor: q.sub_section_color.border,
                      borderLeftColor: q.sub_section_color.header,
                      borderTopWidth: '1px',
                      borderRightWidth: '1px',
                      borderBottomWidth: '1px',
                      borderLeftWidth: '6px'
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono tracking-wide"
                          style={{
                            backgroundColor: q.sub_section_color.badge,
                            color: q.sub_section_color.badge_text
                          }}
                        >
                          {q.sub_section_id === 'sub_5_1' && 'ДЭД БҮЛЭГ 1'}
                          {q.sub_section_id === 'sub_5_2' && 'ДЭД БҮЛЭГ 2'}
                          {q.sub_section_id === 'sub_5_3' && 'ДЭД БҮЛЭГ 3'}
                          {q.sub_section_id === 'sub_5_4' && 'ДЭД БҮЛЭГ 4'}
                        </span>
                        <h4
                          className="text-base font-bold tracking-tight"
                          style={{ color: q.sub_section_color.header }}
                        >
                          {q.sub_section}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: q.sub_section_color.badge,
                            color: q.sub_section_color.badge_text
                          }}
                        >
                          {SECTION_V_SUBSECTIONS.find((s) => s.id === q.sub_section_id)?.color_name}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 bg-white/90 px-2.5 py-0.5 rounded-full border border-slate-200">
                          {sectionQuestions.filter((sq) => sq.sub_section_id === q.sub_section_id).length} асуулт
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Individual Question Card */}
                <div
                  id={`q-card-${q.id}`}
                  className={`border rounded-2xl p-5 transition-all shadow-2xs scroll-mt-24 ${
                    isQuestionDisabled
                      ? 'bg-slate-50/70 border-dashed border-slate-300 opacity-60'
                      : isHighlightedMissing
                      ? 'bg-red-50/20 border-red-400 ring-2 ring-red-300'
                      : isAnswered
                      ? 'bg-white border-slate-200'
                      : 'bg-white border-slate-200'
                  }`}
                  style={
                    !isQuestionDisabled && !isHighlightedMissing && q.sub_section_color
                      ? {
                          borderTopColor: isAnswered ? q.sub_section_color.border : '#e2e8f0',
                          borderRightColor: isAnswered ? q.sub_section_color.border : '#e2e8f0',
                          borderBottomColor: isAnswered ? q.sub_section_color.border : '#e2e8f0',
                          borderLeftColor: q.sub_section_color.accent,
                          borderTopWidth: '1px',
                          borderRightWidth: '1px',
                          borderBottomWidth: '1px',
                          borderLeftWidth: '5px',
                          backgroundColor: '#ffffff'
                        }
                      : undefined
                  }
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`shrink-0 w-8 h-8 rounded-xl text-xs font-bold flex items-center justify-center font-mono mt-0.5 border ${
                        isQuestionDisabled
                          ? 'bg-slate-200 text-slate-500 border-slate-300'
                          : isHighlightedMissing
                          ? 'bg-red-100 text-red-700 border-red-300'
                          : ''
                      }`}
                      style={
                        !isQuestionDisabled && !isHighlightedMissing && q.sub_section_color
                          ? {
                              backgroundColor: q.sub_section_color.badge,
                              color: q.sub_section_color.badge_text,
                              borderColor: q.sub_section_color.border
                            }
                          : !isQuestionDisabled && !isHighlightedMissing
                          ? {
                              backgroundColor: '#f1f5f9',
                              color: '#334155',
                              borderColor: '#e2e8f0'
                            }
                          : undefined
                      }
                    >
                      {q.id.replace('Q', '')}
                    </span>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <label className="block text-sm font-semibold text-slate-900 leading-relaxed">
                          {q.question}
                          {isReq && <span className="text-red-500 ml-1 font-bold" title="Заавал бөглөх">*</span>}
                        </label>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isQuestionDisabled ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-md">
                              <Lock className="w-3 h-3" />
                              Идэвхгүй
                            </span>
                          ) : isComplete ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Бөглөсөн
                            </span>
                          ) : isReq ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Заавал
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              Заавал биш
                            </span>
                          )}

                          {q.sub_section && (
                            <span
                              className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-md font-medium"
                              style={{
                                backgroundColor: q.sub_section_color?.badge,
                                color: q.sub_section_color?.badge_text
                              }}
                            >
                              {q.sub_section}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Condition Disabled Callout */}
                      {isQuestionDisabled && (
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-200/70 border border-slate-300/80 px-3 py-1.5 rounded-xl mt-2 mb-2">
                          <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{condition.disabledReason || 'Энэ асуулт өмнөх сонголтын дагуу хамаарахгүй тул бөглөх шаардлагагүй'}</span>
                        </div>
                      )}

                      {/* Highlighted Missing Question Warning Callout */}
                      {isHighlightedMissing && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-100/70 border border-red-200 px-3 py-1.5 rounded-xl mt-2 mb-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                          <span>Дараагийн бүлэг рүү шилжихийн тулд энэ асуултыг заавал бөглөнө үү!</span>
                        </div>
                      )}

                      {/* Input Rendering based on Question Type */}
                      {q.type === 'radio' && q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
                          {q.options.map((opt) => {
                            const checked = currentVal === opt.value;
                            return (
                              <label
                                key={opt.value}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                  isLocked || isQuestionDisabled
                                    ? 'cursor-not-allowed opacity-70 bg-slate-100/60'
                                    : 'cursor-pointer'
                                } ${
                                  checked
                                    ? q.sub_section_color
                                      ? 'font-medium'
                                      : 'bg-blue-50/80 border-blue-500 text-blue-900 font-medium'
                                    : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                                }`}
                                style={
                                  checked && q.sub_section_color && !isQuestionDisabled
                                    ? {
                                        backgroundColor: q.sub_section_color.background,
                                        borderColor: q.sub_section_color.accent,
                                        color: q.sub_section_color.header
                                      }
                                    : undefined
                                }
                              >
                                <input
                                  type="radio"
                                  name={q.id}
                                  value={opt.value}
                                  checked={checked}
                                  disabled={isLocked || isQuestionDisabled}
                                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                                />
                                <span className="text-sm">{opt.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'select' && q.options && q.options.length > 0 && (
                        <div className="relative max-w-md mt-2.5">
                          <select
                            id={`select-${q.id}`}
                            value={currentVal}
                            disabled={isLocked || isQuestionDisabled}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                              isLocked || isQuestionDisabled
                                ? 'cursor-not-allowed opacity-70 bg-slate-100'
                                : 'bg-white'
                            } ${
                              currentVal
                                ? 'border-slate-400 text-slate-900 font-medium'
                                : 'border-slate-300 text-slate-600'
                            }`}
                            style={{
                              borderColor:
                                currentVal && q.sub_section_color && !isQuestionDisabled
                                  ? q.sub_section_color.accent
                                  : undefined
                            }}
                          >
                            <option value="">-- Сонголтоос сонгоно уу --</option>
                            {q.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Registration Number custom input (Section 1: 2 letters dropdown + 8 numeric digits) */}
                      {(q.type === 'registration_number' ||
                        q.id === 'Q002' ||
                        (q.section_id === 1 && q.question.toLowerCase().includes('регистрийн'))) && (
                        <div className="mt-2.5">
                          <RegistrationNumberInput
                            id={`reg-${q.id}`}
                            value={currentVal}
                            disabled={isLocked || isQuestionDisabled}
                            onChange={(newVal) => handleAnswerChange(q.id, newVal)}
                          />
                        </div>
                      )}

                      {/* Phone Number custom input (Q034: 8-digit phone number strictly validated) */}
                      {(q.type === 'phone' || q.id === 'Q034') && (
                        <div className="max-w-md mt-2.5">
                          <div className="relative flex items-center">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <Phone className="w-4 h-4" />
                            </div>
                            <input
                              type="tel"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={8}
                              id={`input-${q.id}`}
                              value={currentVal}
                              disabled={isLocked || isQuestionDisabled}
                              placeholder={isQuestionDisabled ? 'Бөглөх шаардлагагүй' : 'Жишээ нь: 99112233'}
                              onChange={(e) => {
                                const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 8);
                                handleAnswerChange(q.id, digitsOnly);
                              }}
                              className={`w-full pl-10 pr-24 py-2.5 border rounded-xl text-sm font-mono tracking-wider focus:outline-none focus:ring-2 transition-all ${
                                isLocked || isQuestionDisabled
                                  ? 'bg-slate-100 cursor-not-allowed text-slate-500'
                                  : 'bg-slate-50 focus:bg-white'
                              } ${
                                currentVal.length === 8
                                  ? 'border-emerald-500 focus:ring-emerald-500 text-emerald-950 font-semibold'
                                  : currentVal.length > 0
                                  ? 'border-amber-400 focus:ring-amber-500 text-slate-900'
                                  : 'border-slate-300 focus:ring-blue-500 text-slate-900'
                              }`}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              {currentVal.length === 8 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  8/8
                                </span>
                              ) : (
                                <span
                                  className={`text-[11px] font-mono px-2 py-0.5 rounded-md ${
                                    currentVal.length > 0
                                      ? 'text-amber-700 bg-amber-50 border border-amber-200'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {currentVal.length}/8 орон
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-xs">
                            {currentVal.length === 8 ? (
                              <p className="text-emerald-600 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                8 оронтой дугаар зөв бүртгэгдлээ
                              </p>
                            ) : currentVal.length > 0 ? (
                              <p className="text-amber-600">
                                Зөвхөн 8 оронтой тоо оруулна уу (Үлдсэн: {8 - currentVal.length})
                              </p>
                            ) : (
                              <p className="text-slate-500">
                                Зөвхөн 8 оронтой тоо оруулах боломжтой (Жишээ: 99112233)
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {q.type === 'text' &&
                        !(
                          q.id === 'Q002' ||
                          q.id === 'Q034' ||
                          (q.section_id === 1 && q.question.toLowerCase().includes('регистрийн'))
                        ) && (
                          <div className="max-w-xl mt-2.5">
                            <input
                              type="text"
                              id={`input-${q.id}`}
                              value={currentVal}
                              disabled={isLocked || isQuestionDisabled}
                              placeholder={isQuestionDisabled ? 'Бөглөх шаардлагагүй' : 'Хариултаа энд бичнэ үү...'}
                              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                isLocked || isQuestionDisabled
                                  ? 'bg-slate-100 cursor-not-allowed text-slate-500'
                                  : 'bg-slate-50 focus:bg-white border-slate-300'
                              }`}
                            />
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
      </div>

      {/* Navigation Buttons: Previous / Next / Final Submit */}
      <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentSectionId === 1}
          className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Өмнөх бүлэг</span>
        </button>

        <div className="flex items-center gap-2">
          {currentSectionId < 8 ? (
            <button
              type="button"
              onClick={handleNext}
              className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
                currentSectionValidation.isValid
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <span>Дараах бүлэг</span>
              {!currentSectionValidation.isValid && (
                <span className="text-[11px] bg-amber-800/60 px-2 py-0.5 rounded-full font-mono">
                  {currentSectionValidation.missingQuestionIds.length} дутуу
                </span>
              )}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            !isLocked && (
              <button
                type="button"
                onClick={() => {
                  if (!currentSectionValidation.isValid) {
                    setHighlightedMissingIds(currentSectionValidation.missingQuestionIds);
                    setValidationError(
                      `Судалгааг илгээхийн тулд энэ бүлгийн ${currentSectionValidation.missingQuestionIds.length} асуултыг заавал бөглөнө үү!`
                    );
                    const firstId = currentSectionValidation.missingQuestionIds[0];
                    const el = document.getElementById(`q-card-${firstId}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                  }
                  setShowConfirmModal(true);
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Судалгааг илгээх</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Confirmation Modal for Final Submit */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-4">
              <Send className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              Судалгааг илгээх үү?
            </h3>
            <p className="text-sm text-slate-600 text-center leading-relaxed">
              Та нийт <strong>{answeredCount}</strong> асуултад хариулсан байна.
              Судалгааг илгээсний дараа хариултаа өөрчлөх боломжгүй бөгөөд зөвхөн сургуулийн админы зөвшөөрлөөр дахин бөглөх боломжтойг анхаарна уу.
            </p>

            {submissionError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{submissionError}</span>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Буцах, шалгах
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-xs"
              >
                {isSubmitting ? 'Илгээж байна...' : 'Тийм, илгээх'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section V JSON Structure Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] flex flex-col animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    V Бүлгийн JSON өгөгдлийн бүтэц (21 асуулт, 4 дэд бүлэг)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Дэд бүлэг бүрийн өнгөний код, асуултын төрөл, сонголтууд
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-section summary chips in modal */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4">
              {SECTION_V_SUBSECTIONS.map((sub) => (
                <div
                  key={sub.id}
                  className="p-2 rounded-xl border text-xs"
                  style={{
                    backgroundColor: sub.theme.background,
                    borderColor: sub.theme.border
                  }}
                >
                  <div className="font-bold truncate" style={{ color: sub.theme.header }}>
                    {sub.title}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    {sub.questions_count} асуулт • {sub.color_name.split('/')[0]}
                  </div>
                </div>
              ))}
            </div>

            {/* JSON Code snippet box */}
            <div className="flex-1 overflow-auto bg-slate-950 rounded-xl p-4 text-slate-100 font-mono text-xs border border-slate-800">
              <pre>
                {JSON.stringify(
                  {
                    section_title: 'V. Сурч боловсрох эрхийн хүрээнд',
                    total_questions: 21,
                    sub_sections: SECTION_V_SUBSECTIONS.map((sub) => ({
                      title: sub.title,
                      color: sub.color_name,
                      theme: sub.theme,
                      questions_count: sub.questions_count,
                      questions: sectionQuestions
                        .filter((q) => q.sub_section_id === sub.id)
                        .map((q) => ({
                          id: q.id,
                          question: q.question,
                          type: q.type,
                          options_count: q.options.length
                        }))
                    }))
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              <a
                href="/section_v_questions.json"
                download="section_v_questions.json"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>section_v_questions.json татаж авах</span>
              </a>

              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
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
