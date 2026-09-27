import { Student, SchoolClass } from '../types';
import { RAW_QUESTIONS, SECTIONS } from '../data/questions';
import { evaluateStudentRisk } from './riskCalculator';

export interface OptionStat {
  value: string;
  label: string;
  text: string;
  count: number;
  percentage: number; // calculated as count / totalAnswered * 100
  isRisk: boolean;
}

export interface QuestionStat {
  id: string;
  code: string;
  sectionId: number;
  sectionTitle: string;
  subgroupTitle: string;
  question: string;
  text: string;
  type: string;
  answeredCount: number;
  unansweredCount: number;
  options: OptionStat[];
  riskCount: number; // number of students with a risk response for this question
  riskAnswersCount: number;
  riskPercentage: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SubgroupStat {
  id: string;
  sectionId: number;
  title: string;
  questionCount: number;
  totalAnswered: number;
  scorePercentage: number; // 0 - 100% (higher = better/safer)
  riskLevel: 'low' | 'medium' | 'high';
  questions: QuestionStat[];
}

export interface SectionStat {
  id: number;
  title: string;
  shortTitle: string;
  questionCount: number;
  totalQuestions: number;
  evaluatedStudentsCount: number;
  riskStudentsCount: number;
  avgScore: number;
  scorePercentage: number; // 0 - 100%
  riskLevel: 'low' | 'medium' | 'high';
  subgroups: SubgroupStat[];
}

export interface AttentionItem {
  id: string;
  title: string;
  sectionId: number;
  sectionTitle: string;
  subgroupTitle: string;
  riskStudentsCount: number;
  riskPercentage: number;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
  category: string;
}

export interface RiskSummary {
  low: number;
  med: number;
  high: number;
  lowPct: number;
  medPct: number;
  highPct: number;
}

export interface SurveyAnalyticsResult {
  submittedCount: number;
  totalCount: number;
  totalStudents: number;
  pendingCount: number;
  unsubmittedCount: number;
  completionRate: number;
  questionStatsMap: Map<string, QuestionStat>;
  sectionStats: SectionStat[];
  attentionItems: AttentionItem[];
  riskSummary: RiskSummary;
  studentRiskMap: Map<string, any>;
}

export interface ClassRiskStat {
  classId: string;
  className: string;
  grade: number;
  teacherName: string;
  totalStudents: number;
  submittedCount: number;
  pendingCount: number;
  completionRate: number;
  lowRiskCount: number;
  medRiskCount: number;
  highRiskCount: number;
  lowRiskPct: number;
  medRiskPct: number;
  highRiskPct: number;
  avgTotalScore: number;
  isLocked?: boolean;
}

// Critical risk indicator questions mapping
const CRITICAL_RISK_QUESTIONS: Record<string, { label: string; riskValues: string[]; severity: 'high' | 'medium' }> = {
  'Q035': { label: 'Бие махбодийн хүчирхийлэлд өртсөн байж болзошгүй', riskValues: ['1'], severity: 'high' },
  'Q036': { label: 'Бэлгийн хүчирхийлэлд өртсөн байж болзошгүй', riskValues: ['1'], severity: 'high' },
  'Q037': { label: 'Сэтгэл санааны хүчирхийлэлд өртсөн', riskValues: ['1'], severity: 'high' },
  'Q038': { label: 'Үл хайхрах хүчирхийлэлд өртсөн', riskValues: ['1'], severity: 'high' },
  'Q116': { label: 'Сургууль, дотуур байранд үе тэнгийн дээрэлхэлтэд өртдөг', riskValues: ['1'], severity: 'high' },
  'Q117': { label: 'Үе тэнгийн дарамт, сүрдүүлэгт өртсөн', riskValues: ['1'], severity: 'high' },
  'Q118': { label: 'Багш, ажилтны ёс зүйгүй харилцаа, дарамтад өртсөн', riskValues: ['1'], severity: 'high' },
  'Q123': { label: 'Гэр бүлийн хүчирхийлэлд өртдөг', riskValues: ['1'], severity: 'high' },
  'Q141': { label: 'Сэтгэцэд нөлөөлөх эм бэлдмэл, мансууруулах бодис хэрэглэдэг', riskValues: ['1'], severity: 'high' },
  'Q140': { label: 'Архи, согтууруулах ундаа хэрэглэдэг', riskValues: ['1'], severity: 'high' },
  'Q127': { label: 'Гэр бүлийн орчинд архины хамааралтай хүнтэй', riskValues: ['1', '3'], severity: 'medium' },
  'Q092': { label: 'Хичээлээс гадуур хөдөлмөр эрхэлдэг', riskValues: ['1', '2', '3', '4', '5', '6', '7'], severity: 'medium' },
  'Q108': { label: 'Харанхуй гудамж, жалгаар явж харьдаг (Орчны эрсдэл)', riskValues: ['1'], severity: 'medium' },
  'Q114': { label: 'Хичээл таслалт, хоцролт өндөр', riskValues: ['1'], severity: 'medium' },
  'Q142': { label: 'Тамхи татдаг (электрон эсвэл утаат)', riskValues: ['1', '2'], severity: 'medium' },
  'Q143': { label: 'Дэлгэц болон цахим тоглоомын хамааралтай', riskValues: ['1'], severity: 'medium' }
};

// Helper: Determine risk level from percentage / score
export function getRiskLevelFromScore(percentage: number): 'low' | 'medium' | 'high' {
  // percentage represents positive/healthy score (higher = safer)
  if (percentage >= 70) return 'low';
  if (percentage >= 40) return 'medium';
  return 'high';
}

export function getRiskLevelBadge(level: 'low' | 'medium' | 'high') {
  switch (level) {
    case 'high':
      return {
        label: 'Өндөр эрсдэл',
        emoji: '🔴',
        icon: '🔴',
        color: 'text-red-700 bg-red-50 border-red-200',
        bg: '#FEE2E2',
        text: '#991B1B'
      };
    case 'medium':
      return {
        label: 'Дунд эрсдэл',
        emoji: '🟡',
        icon: '🟡',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        bg: '#FEF3C7',
        text: '#92400E'
      };
    case 'low':
    default:
      return {
        label: 'Бага эрсдэл',
        emoji: '🟢',
        icon: '🟢',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        bg: '#DCFCE7',
        text: '#166534'
      };
  }
}

/**
 * Calculates comprehensive question, subgroup, and section statistics
 * Denominator rule (Rule 17):
 * Unanswered questions are excluded from denominator (percentage = count / answeredCount * 100).
 * Unsubmitted students are excluded from risk calculations.
 */
export function calculateSurveyAnalytics(
  students: Student[],
  responsesMap: Record<string, Record<string, string>>
) {
  const submittedStudents = students.filter((s) => s.isSubmitted);
  const submittedCount = submittedStudents.length;

  // 1. Calculate question-level statistics
  const questionStatsMap = new Map<string, QuestionStat>();

  RAW_QUESTIONS.forEach((q) => {
    let answeredCount = 0;
    let unansweredCount = 0;
    const optionCounts: Record<string, number> = {};
    (q.options || []).forEach((opt) => {
      optionCounts[opt.value] = 0;
    });

    let riskCount = 0;
    const crit = CRITICAL_RISK_QUESTIONS[q.id];

    submittedStudents.forEach((s) => {
      const sAnswers = responsesMap[s.id] || {};
      const val = sAnswers[q.id];

      if (val !== undefined && val !== null && String(val).trim() !== '') {
        answeredCount++;
        const strVal = String(val).trim();
        optionCounts[strVal] = (optionCounts[strVal] || 0) + 1;

        if (crit && crit.riskValues.includes(strVal)) {
          riskCount++;
        }
      } else {
        unansweredCount++;
      }
    });

    // Option statistics with safe denominator = answeredCount
    const options: OptionStat[] = (q.options || []).map((opt) => {
      const count = optionCounts[opt.value] || 0;
      const percentage = answeredCount > 0 ? Math.round((count / answeredCount) * 1000) / 10 : 0;
      const isRisk = Boolean(crit && crit.riskValues.includes(opt.value));
      return {
        value: opt.value,
        label: opt.label,
        text: opt.label,
        count,
        percentage,
        isRisk
      };
    });

    const riskPercentage = answeredCount > 0 ? Math.round((riskCount / answeredCount) * 1000) / 10 : 0;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (crit) {
      if (crit.severity === 'high' && riskCount > 0) riskLevel = 'high';
      else if (riskPercentage >= 20) riskLevel = 'high';
      else if (riskPercentage >= 5) riskLevel = 'medium';
    }

    const subgroupTitle = q.sub_section || getDefaultSubgroupTitle(q.section_id);

    questionStatsMap.set(q.id, {
      id: q.id,
      code: q.id,
      sectionId: q.section_id,
      sectionTitle: q.section,
      subgroupTitle,
      question: q.question,
      text: q.question,
      type: q.type,
      answeredCount,
      unansweredCount,
      options,
      riskCount,
      riskAnswersCount: riskCount,
      riskPercentage,
      riskLevel
    });
  });

  // 2. Subgroups and Section level aggregation
  const sectionStats: SectionStat[] = SECTIONS.map((sec) => {
    const secQuestions = RAW_QUESTIONS.filter((q) => q.section_id === sec.id);

    // Group questions by subgroup
    const subgroupsMap = new Map<string, QuestionStat[]>();
    secQuestions.forEach((q) => {
      const qStat = questionStatsMap.get(q.id);
      if (!qStat) return;
      const subTitle = qStat.subgroupTitle;
      if (!subgroupsMap.has(subTitle)) {
        subgroupsMap.set(subTitle, []);
      }
      subgroupsMap.get(subTitle)!.push(qStat);
    });

    const subgroups: SubgroupStat[] = [];
    let secTotalScorePct = 0;

    subgroupsMap.forEach((qList, subTitle) => {
      let totalAnswered = 0;
      let totalHighRisk = 0;
      let totalMedRisk = 0;

      qList.forEach((qs) => {
        totalAnswered += qs.answeredCount;
        if (qs.riskLevel === 'high') totalHighRisk++;
        if (qs.riskLevel === 'medium') totalMedRisk++;
      });

      // Compute healthy score %: 100 minus risk impact
      const riskRatio = qList.length > 0 ? (totalHighRisk * 2 + totalMedRisk) / (qList.length * 2) : 0;
      const scorePercentage = Math.max(0, Math.min(100, Math.round((1 - riskRatio) * 100)));
      const subRiskLevel: 'low' | 'medium' | 'high' =
        scorePercentage >= 75 ? 'low' : scorePercentage >= 50 ? 'medium' : 'high';

      secTotalScorePct += scorePercentage;

      subgroups.push({
        id: `sub_${sec.id}_${subgroups.length + 1}`,
        sectionId: sec.id,
        title: subTitle,
        questionCount: qList.length,
        totalAnswered,
        scorePercentage,
        riskLevel: subRiskLevel,
        questions: qList
      });
    });

    const avgSubgroupScore =
      subgroups.length > 0 ? Math.round(secTotalScorePct / subgroups.length) : 85;

    // Also calculate actual student section risk averages
    let totalSecStudentScore = 0;
    let evaluatedStudentsCount = 0;

    submittedStudents.forEach((s) => {
      const answers = responsesMap[s.id] || {};
      const risk = evaluateStudentRisk(s, answers);
      totalSecStudentScore += risk.sectionScores[sec.id] || 0;
      evaluatedStudentsCount++;
    });

    const avgScore =
      evaluatedStudentsCount > 0
        ? Math.round((totalSecStudentScore / evaluatedStudentsCount) * 10) / 10
        : 0;

    // High risk if avgScore is high, or scorePercentage is low
    let secRiskLevel: 'low' | 'medium' | 'high' = 'low';
    if (avgScore >= 3 || avgSubgroupScore < 50) {
      secRiskLevel = 'high';
    } else if (avgScore >= 1.5 || avgSubgroupScore < 75) {
      secRiskLevel = 'medium';
    }

    const shortTitles: Record<number, string> = {
      1: 'I. Ерөнхий',
      2: 'II. Асран хамгаалагч',
      3: 'III. Эрүүл мэнд',
      4: 'IV. Нийгмийн амьдрал',
      5: 'V. Сурч боловсрох',
      6: 'VI. Хөдөлмөр',
      7: 'VII. Орчны эрсдэл',
      8: 'VIII. Гэр бүл, зан чанар'
    };

    // Calculate how many students showed risk in this section
    let riskStudentsInSection = 0;
    submittedStudents.forEach((s) => {
      const answers = responsesMap[s.id] || {};
      const risk = evaluateStudentRisk(s, answers);
      if ((risk.sectionScores[sec.id] || 0) >= 1.5) {
        riskStudentsInSection++;
      }
    });

    return {
      id: sec.id,
      title: sec.title,
      shortTitle: shortTitles[sec.id] || `Бүлэг ${sec.id}`,
      questionCount: secQuestions.length,
      totalQuestions: secQuestions.length,
      evaluatedStudentsCount,
      riskStudentsCount: riskStudentsInSection,
      avgScore,
      scorePercentage: avgSubgroupScore,
      riskLevel: secRiskLevel,
      subgroups
    };
  });

  // 3. Top Attention Indicators (Section 7 in user requirements)
  const attentionItems: AttentionItem[] = [];

  // Check critical questions
  Object.entries(CRITICAL_RISK_QUESTIONS).forEach(([qId, crit]) => {
    const qStat = questionStatsMap.get(qId);
    if (qStat && qStat.riskCount > 0) {
      attentionItems.push({
        id: qId,
        title: crit.label,
        sectionId: qStat.sectionId,
        sectionTitle: qStat.sectionTitle,
        subgroupTitle: qStat.subgroupTitle,
        riskStudentsCount: qStat.riskCount,
        riskPercentage: qStat.riskPercentage,
        riskLevel: qStat.riskLevel,
        description: `Тухайн ангийн ${qStat.riskCount} сурагч (${qStat.riskPercentage}%) дээр илэрсэн.`,
        category: qStat.sectionTitle
      });
    }
  });

  // Also include low scoring sections/subgroups if attention is needed
  sectionStats.forEach((sec) => {
    if (sec.riskLevel === 'high' || sec.scorePercentage < 60) {
      attentionItems.push({
        id: `sec_${sec.id}`,
        title: `${sec.title} — Үнэлгээ ${sec.scorePercentage}%`,
        sectionId: sec.id,
        sectionTitle: sec.title,
        subgroupTitle: 'Бүлгийн ерөнхий үзүүлэлт',
        riskStudentsCount: submittedCount,
        riskPercentage: 100 - sec.scorePercentage,
        riskLevel: sec.riskLevel,
        description: `Энэ бүлгийн дундаж үзүүлэлт ${sec.scorePercentage}% буюу анхаарал шаардах түвшинд байна.`,
        category: 'Үндсэн бүлэг'
      });
    }
  });

  // Sort attention items by priority (high risk first, then highest risk percentage)
  attentionItems.sort((a, b) => {
    const levelWeight = { high: 3, medium: 2, low: 1 };
    if (levelWeight[a.riskLevel] !== levelWeight[b.riskLevel]) {
      return levelWeight[b.riskLevel] - levelWeight[a.riskLevel];
    }
    return b.riskPercentage - a.riskPercentage;
  });

  // Calculate overall risk summary for students who have submitted
  let lowRiskCount = 0;
  let medRiskCount = 0;
  let highRiskCount = 0;
  const studentRiskMap = new Map<string, any>();

  students.forEach((s) => {
    const sAnswers = responsesMap[s.id] || {};
    const r = evaluateStudentRisk(s, sAnswers);
    studentRiskMap.set(s.id, r);
    if (s.studentCode) {
      studentRiskMap.set(s.studentCode, r);
    }
  });

  submittedStudents.forEach((s) => {
    const r = studentRiskMap.get(s.id) || evaluateStudentRisk(s, responsesMap[s.id] || {});
    if (r.level === 'high') highRiskCount++;
    else if (r.level === 'medium') medRiskCount++;
    else lowRiskCount++;
  });

  const lowRiskPct = submittedCount > 0 ? Math.round((lowRiskCount / submittedCount) * 1000) / 10 : 0;
  const medRiskPct = submittedCount > 0 ? Math.round((medRiskCount / submittedCount) * 1000) / 10 : 0;
  const highRiskPct = submittedCount > 0 ? Math.round((highRiskCount / submittedCount) * 1000) / 10 : 0;

  const riskSummary: RiskSummary = {
    low: lowRiskCount,
    med: medRiskCount,
    high: highRiskCount,
    lowPct: lowRiskPct,
    medPct: medRiskPct,
    highPct: highRiskPct
  };

  return {
    submittedCount,
    totalCount: students.length,
    totalStudents: students.length,
    pendingCount: students.length - submittedCount,
    unsubmittedCount: students.length - submittedCount,
    completionRate: students.length > 0 ? Math.round((submittedCount / students.length) * 1000) / 10 : 0,
    questionStatsMap,
    sectionStats,
    attentionItems: attentionItems.slice(0, 5), // Top 3 - 5 attention areas
    riskSummary,
    studentRiskMap
  };
}

function getDefaultSubgroupTitle(sectionId: number): string {
  switch (sectionId) {
    case 1:
      return 'Сурагчийн ерөнхий анкет';
    case 2:
      return 'Эцэг эх, асран хамгаалагчийн мэдээлэл';
    case 3:
      return 'Эрүүл мэнд, амьдрах орчин';
    case 4:
      return 'Нийгмийн амьдралд оролцох эрх';
    case 5:
      return 'Сурч боловсрох эрхийн орчин';
    case 6:
      return 'Хөдөлмөр эрхлэлт, ачаалал';
    case 7:
      return 'Нийгмийн болон сургуулийн орчны эрсдэл';
    case 8:
      return 'Гэр бүлийн болон хувийн зан төлөв';
    default:
      return 'Ерөнхий үзүүлэлтүүд';
  }
}

/**
 * Compare all classes across the school for Admin Dashboard
 */
export function calculateSchoolClassComparisons(
  classes: SchoolClass[],
  students: Student[],
  responsesMap: Record<string, Record<string, string>>
): ClassRiskStat[] {
  return classes.map((cls) => {
    const classStudents = students.filter((s) => s.classId === cls.id || s.className === cls.name);
    const total = classStudents.length;
    const submitted = classStudents.filter((s) => s.isSubmitted).length;
    const pending = total - submitted;
    const completionRate = total > 0 ? Math.round((submitted / total) * 100) : 0;

    let lowRiskCount = 0;
    let medRiskCount = 0;
    let highRiskCount = 0;
    let totalScoreSum = 0;

    classStudents.forEach((s) => {
      if (!s.isSubmitted) return;
      const sAnswers = responsesMap[s.id] || {};
      const r = evaluateStudentRisk(s, sAnswers);
      totalScoreSum += r.totalScore;
      if (r.level === 'high') highRiskCount++;
      else if (r.level === 'medium') medRiskCount++;
      else lowRiskCount++;
    });

    const evaluated = submitted;
    const lowRiskPct = evaluated > 0 ? Math.round((lowRiskCount / evaluated) * 100) : 0;
    const medRiskPct = evaluated > 0 ? Math.round((medRiskCount / evaluated) * 100) : 0;
    const highRiskPct = evaluated > 0 ? Math.round((highRiskCount / evaluated) * 100) : 0;
    const avgTotalScore = evaluated > 0 ? Math.round((totalScoreSum / evaluated) * 10) / 10 : 0;

    return {
      classId: cls.id,
      className: cls.name,
      grade: cls.grade || 0,
      teacherName: cls.teacherName || 'Багш',
      totalStudents: total,
      submittedCount: submitted,
      pendingCount: pending,
      completionRate,
      lowRiskCount,
      medRiskCount,
      highRiskCount,
      lowRiskPct,
      medRiskPct,
      highRiskPct,
      avgTotalScore,
      isLocked: Boolean(cls.isLocked)
    };
  });
}
