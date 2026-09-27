import * as XLSX from 'xlsx';
import { Student, SchoolClass } from '../types';
import { RAW_QUESTIONS } from '../data/questions';
import { evaluateStudentRisk } from './riskCalculator';
import { calculateSurveyAnalytics } from './surveyAnalytics';

export function exportSurveyDataToExcel(
  schoolClass: SchoolClass,
  students: Student[],
  responsesMap: Record<string, Record<string, string>> // studentId -> questionId -> answer
) {
  const wb = XLSX.utils.book_new();

  // Helper to get human label for an answer value
  const getAnswerLabel = (qId: string, val: string | undefined): string => {
    if (!val) return '';
    const q = RAW_QUESTIONS.find((item) => item.id === qId);
    if (!q) return val;
    if (q.options && q.options.length > 0) {
      const opt = q.options.find((o) => o.value === val);
      return opt ? opt.label : val;
    }
    return val;
  };

  // Pre-calculate metrics
  const analytics = calculateSurveyAnalytics(students, responsesMap);
  const submittedStudents = students.filter((s) => s.isSubmitted);
  const totalCount = students.length;
  const completedCount = submittedStudents.length;
  const pendingCount = totalCount - completedCount;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 1000) / 10 : 0;

  let lowRiskCount = 0;
  let medRiskCount = 0;
  let highRiskCount = 0;

  submittedStudents.forEach((s) => {
    const sAnswers = responsesMap[s.id] || {};
    const risk = evaluateStudentRisk(s, sAnswers);
    if (risk.level === 'high') highRiskCount++;
    else if (risk.level === 'medium') medRiskCount++;
    else lowRiskCount++;
  });

  const lowRiskPct = completedCount > 0 ? Math.round((lowRiskCount / completedCount) * 1000) / 10 : 0;
  const medRiskPct = completedCount > 0 ? Math.round((medRiskCount / completedCount) * 1000) / 10 : 0;
  const highRiskPct = completedCount > 0 ? Math.round((highRiskCount / completedCount) * 1000) / 10 : 0;

  // ==========================================
  // 0. SHEET: 00_Dashboard (FIRST SHEET!)
  // ==========================================
  const dashboardRows: any[][] = [
    ['СУРГУУЛИЙН ХҮҮХДИЙН ЭРСДЭЛИЙН ҮНЭЛГЭЭНИЙ НЭГДСЭН ТАЙЛАН & DASHBOARD'],
    ['Сургууль:', schoolClass.schoolName, '', 'Хичээлийн жил:', schoolClass.academicYear],
    ['Анги бүлэг:', schoolClass.name, '', 'Ангийн багш:', schoolClass.teacherName || '-'],
    ['Тайлан үүсгэсэн:', new Date().toLocaleString('mn-MN'), '', 'Систем:', '1г эрсдэл 2026'],
    [],
    ['I. ҮНДСЭН ҮЗҮҮЛЭЛТ (KPI METRICS)'],
    ['Үзүүлэлт', 'Тоон утга', 'Хувь (%)', 'Тайлбар'],
    ['Нийт сурагчид', totalCount, '100%', 'Ангийн нийт бүртгэлтэй сурагчид'],
    ['Судалгаа бөглөсөн', completedCount, `${completionRate}%`, 'Судалгаагаа бүрэн илгээсэн суралцагчид'],
    ['Судалгаа бөглөөгүй', pendingCount, `${Math.round((100 - completionRate) * 10) / 10}%`, 'Хүлээгдэж буй сурагчид'],
    ['Хамрагдалтын хувь', `${completionRate}%`, '-', 'Судалгааны ирц, хамрагдалтын түвшин'],
    [],
    ['II. ЭРСДЭЛИЙН НЭГДСЭН ТҮВШИН (Зөвхөн бөглөсөн сурагчдаар)'],
    ['Эрсдэлийн зэрэг', 'Сурагчийн тоо', 'Эзлэх хувь (%)', 'Статус / Анхааруулга'],
    ['🟢 Бага эрсдэл', lowRiskCount, `${lowRiskPct}%`, 'Хэвийн, тогтвортой'],
    ['🟡 Дунд эрсдэл', medRiskCount, `${medRiskPct}%`, 'Анхаарал хандуулах шаардлагатай'],
    ['🔴 Өндөр эрсдэл', highRiskCount, `${highRiskPct}%`, 'Нэн тэргүүний тусламж, дэмжлэг'],
    ['Нийт үнэлэгдсэн', completedCount, '100%', 'Бөглөөгүй сурагч эрсдэлийн тоонд ороогүй'],
    [],
    ['III. 8 ҮНДСЭН БҮЛГИЙН ХАРЬЦУУЛАЛТ & СТАТИСТИК'],
    ['Бүлгийн дугаар', 'Үндсэн бүлгийн нэр', 'Асуултын тоо', 'Дундаж оноо', 'Үнэлгээний хувь (%)', 'Эрсдэлийн түвшин']
  ];

  analytics.sectionStats.forEach((sec) => {
    dashboardRows.push([
      `Бүлэг ${sec.id}`,
      sec.title,
      sec.questionCount,
      sec.avgScore,
      `${sec.scorePercentage}%`,
      sec.riskLevel === 'high' ? '🔴 Өндөр' : sec.riskLevel === 'medium' ? '🟡 Дунд' : '🟢 Бага'
    ]);
  });

  dashboardRows.push([]);
  dashboardRows.push(['IV. ДЭД БҮЛГҮҮДИЙН НЭГТГЭЛ']);
  dashboardRows.push(['Үндсэн бүлэг', 'Дэд бүлгийн нэр', 'Асуултын тоо', 'Хариулсан тоо', 'Үнэлгээний хувь (%)', 'Эрсдэл']);

  analytics.sectionStats.forEach((sec) => {
    sec.subgroups.forEach((sub) => {
      dashboardRows.push([
        sec.shortTitle,
        sub.title,
        sub.questionCount,
        sub.totalAnswered,
        `${sub.scorePercentage}%`,
        sub.riskLevel === 'high' ? '🔴 Өндөр' : sub.riskLevel === 'medium' ? '🟡 Дунд' : '🟢 Бага'
      ]);
    });
  });

  dashboardRows.push([]);
  dashboardRows.push(['V. НЭН ТЭРГҮҮНД АНХААРАХ ШААРДЛАГАТАЙ ҮЗҮҮЛЭЛТҮҮД']);
  dashboardRows.push(['№', 'Үзүүлэлт / Эрсдэлт хүчин зүйл', 'Холбогдох бүлэг', 'Илэрсэн сурагч', 'Хувь (%)', 'Түвшин']);

  if (analytics.attentionItems.length > 0) {
    analytics.attentionItems.forEach((item, idx) => {
      dashboardRows.push([
        idx + 1,
        item.title,
        item.sectionTitle,
        item.riskStudentsCount,
        `${item.riskPercentage}%`,
        item.riskLevel === 'high' ? '🔴 Өндөр' : '🟡 Дунд'
      ]);
    });
  } else {
    dashboardRows.push(['-', 'Онцгой ноцтой эрсдэлт хүчин зүйл илрээгүй', 'Хэвийн', 0, '0%', '🟢 Бага']);
  }

  const ws00 = XLSX.utils.aoa_to_sheet(dashboardRows);
  ws00['!cols'] = [
    { wch: 20 },
    { wch: 45 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 30 }
  ];
  // A4 Landscape Print setup
  ws00['!pageSetup'] = { orientation: 'landscape', paperSize: 9, fitToWidth: 1, fitToHeight: 0 };
  ws00['!margins'] = { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 };
  XLSX.utils.book_append_sheet(wb, ws00, '00_Dashboard');

  // ==========================================
  // 1. SHEET: 01_Сурагчид
  // ==========================================
  const sheet01Data = students.map((s, idx) => ({
    '№': idx + 1,
    'Сурагчийн код': s.studentCode,
    'Овог нэр': s.fullName,
    'Анги': s.className,
    'Хүйс': s.gender === '1' ? 'Эмэгтэй' : s.gender === '2' ? 'Эрэгтэй' : 'Тодорхойгүй',
    'Нэвтрэх нууц үг': s.password,
    'Судалгаа бөглөсөн эсэх': s.isSubmitted ? 'Тийм' : 'Үгүй',
    'Бөглөсөн огноо': s.submittedAt || '-'
  }));
  const ws01 = XLSX.utils.json_to_sheet(sheet01Data);
  ws01['!cols'] = [
    { wch: 5 },
    { wch: 16 },
    { wch: 28 },
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
    { wch: 15 },
    { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(wb, ws01, '01_Сурагчид');

  // ==========================================
  // 2. SHEET: 02_Судалгааны_хариулт
  // ==========================================
  const sheet02Data: any[] = [];
  students.forEach((s) => {
    const sAnswers = responsesMap[s.id] || {};
    RAW_QUESTIONS.forEach((q) => {
      const rawAns = sAnswers[q.id];
      if (rawAns !== undefined && rawAns !== '') {
        sheet02Data.push({
          'Timestamp': s.submittedAt || new Date().toISOString(),
          'School': schoolClass.schoolName,
          'Year': schoolClass.academicYear,
          'Class': s.className,
          'StudentID': s.studentCode,
          'StudentName': s.fullName,
          'QuestionID': q.id,
          'Question': q.question,
          'Group': q.section,
          'SubGroup': q.sub_section || '-',
          'Answer': getAnswerLabel(q.id, rawAns)
        });
      }
    });
  });
  const ws02 = XLSX.utils.json_to_sheet(
    sheet02Data.length > 0
      ? sheet02Data
      : [{ 'Мэдээлэл': 'Одоогоор судалгааны хариулт бүртгэгдээгүй байна' }]
  );
  ws02['!cols'] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
    { wch: 25 },
    { wch: 12 },
    { wch: 45 },
    { wch: 30 },
    { wch: 25 },
    { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, ws02, '02_Судалгааны_хариулт');

  // ==========================================
  // 3 - 10. SHEETS: 03_I_бүлэг through 10_VIII_бүлэг
  // ==========================================
  const sectionSheets = [
    { num: '03', secId: 1, name: '03_I_бүлэг' },
    { num: '04', secId: 2, name: '04_II_бүлэг' },
    { num: '05', secId: 3, name: '05_III_бүлэг' },
    { num: '06', secId: 4, name: '06_IV_бүлэг' },
    { num: '07', secId: 5, name: '07_V_бүлэг' },
    { num: '08', secId: 6, name: '08_VI_бүлэг' },
    { num: '09', secId: 7, name: '09_VII_бүлэг' },
    { num: '10', secId: 8, name: '10_VIII_бүлэг' }
  ];

  sectionSheets.forEach((sec) => {
    const secQuestions = RAW_QUESTIONS.filter((q) => q.section_id === sec.secId);
    const secRows = students.map((s, idx) => {
      const rowObj: any = {
        '№': idx + 1,
        'Сурагчийн код': s.studentCode,
        'Овог нэр': s.fullName,
        'Төлөв': s.isSubmitted ? 'Бөглөсөн' : 'Бөглөөгүй'
      };
      const sAnswers = responsesMap[s.id] || {};
      secQuestions.forEach((q) => {
        rowObj[`[${q.id}] ${q.question.substring(0, 35)}...`] = getAnswerLabel(q.id, sAnswers[q.id]) || '-';
      });
      return rowObj;
    });
    const wsSec = XLSX.utils.json_to_sheet(secRows);
    XLSX.utils.book_append_sheet(wb, wsSec, sec.name);
  });

  // ==========================================
  // 11. SHEET: 11_Нэгдсэн_дүн
  // ==========================================
  const sheet11Data = students.map((s, idx) => {
    const sAnswers = responsesMap[s.id] || {};
    const risk = evaluateStudentRisk(s, sAnswers);
    return {
      '№': idx + 1,
      'Сурагчийн код': s.studentCode,
      'Овог нэр': s.fullName,
      'Анги': s.className,
      'Бөглөсөн эсэх': s.isSubmitted ? 'Бөглөсөн' : 'Бөглөөгүй',
      'I бүлэг оноо': s.isSubmitted ? (risk.sectionScores[1] || 0) : '-',
      'II бүлэг оноо': s.isSubmitted ? (risk.sectionScores[2] || 0) : '-',
      'III бүлэг оноо': s.isSubmitted ? (risk.sectionScores[3] || 0) : '-',
      'IV бүлэг оноо': s.isSubmitted ? (risk.sectionScores[4] || 0) : '-',
      'V бүлэг оноо': s.isSubmitted ? (risk.sectionScores[5] || 0) : '-',
      'VI бүлэг оноо': s.isSubmitted ? (risk.sectionScores[6] || 0) : '-',
      'VII бүлэг оноо': s.isSubmitted ? (risk.sectionScores[7] || 0) : '-',
      'VIII бүлэг оноо': s.isSubmitted ? (risk.sectionScores[8] || 0) : '-',
      'Нийт эрсдэлийн оноо': s.isSubmitted ? risk.totalScore : '-',
      'Эрсдэлийн түвшин': !s.isSubmitted
        ? 'Бөглөөгүй'
        : risk.level === 'high'
        ? '🔴 Өндөр'
        : risk.level === 'medium'
        ? '🟡 Дунд'
        : '🟢 Бага'
    };
  });
  const ws11 = XLSX.utils.json_to_sheet(sheet11Data);
  ws11['!cols'] = [
    { wch: 5 },
    { wch: 14 },
    { wch: 25 },
    { wch: 10 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(wb, ws11, '11_Нэгдсэн_дүн');

  // ==========================================
  // 12. SHEET: 12_Эрсдэлийн_шинжилгээ
  // ==========================================
  const sheet12Data = students.map((s, idx) => {
    const sAnswers = responsesMap[s.id] || {};
    const risk = evaluateStudentRisk(s, sAnswers);
    return {
      '№': idx + 1,
      'Сурагчийн код': s.studentCode,
      'Овог нэр': s.fullName,
      'Бөглөсөн төлөв': s.isSubmitted ? 'Бөглөсөн' : 'Бөглөөгүй',
      'Эрсдэлийн түвшин': !s.isSubmitted
        ? 'Бөглөөгүй'
        : risk.level === 'high'
        ? '🔴 ӨНДӨР'
        : risk.level === 'medium'
        ? '🟡 ДУНД'
        : '🟢 БАГА',
      'Нийт эрсдэлийн оноо': s.isSubmitted ? risk.totalScore : '-',
      'Илэрсэн эрсдэлт хүчин зүйлс': !s.isSubmitted
        ? 'Судалгаа бөглөөгүй'
        : risk.identifiedFlags.length > 0
        ? risk.identifiedFlags.join('; ')
        : 'Онцлох эрсдэлгүй',
      'Зөвлөмж/Арга хэмжээ': !s.isSubmitted
        ? 'Судалгаанд хамруулах'
        : risk.level === 'high'
        ? 'Сургуулийн хамтарсан баг, сэтгэл зүйчийн шуурхай дэмжлэг шаардлагатай'
        : risk.level === 'medium'
        ? 'Ангийн багшийн тогтмол анхаарал, гэр бүлтэй зөвлөлдөх'
        : 'Хэвийн, тогтмол дэмжлэг үзүүлэх'
    };
  });
  const ws12 = XLSX.utils.json_to_sheet(sheet12Data);
  ws12['!cols'] = [
    { wch: 5 },
    { wch: 14 },
    { wch: 25 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 45 },
    { wch: 45 }
  ];
  XLSX.utils.book_append_sheet(wb, ws12, '12_Эрсдэлийн_шинжилгээ');

  // ==========================================
  // 13. SHEET: 13_Бөглөсөн_эсэх
  // ==========================================
  const summaryMeta = [
    { 'Үзүүлэлт': 'Сургууль', 'Утга': schoolClass.schoolName },
    { 'Үзүүлэлт': 'Хичээлийн жил', 'Утга': schoolClass.academicYear },
    { 'Үзүүлэлт': 'Анги бүлэг', 'Утга': schoolClass.name },
    { 'Үзүүлэлт': 'Ангийн багш', 'Утга': schoolClass.teacherName || 'Багш' },
    { 'Үзүүлэлт': 'Нийт сурагчид', 'Утга': totalCount },
    { 'Үзүүлэлт': 'Судалгаа бөглөсөн', 'Утга': completedCount },
    { 'Үзүүлэлт': 'Бөглөөгүй үлдсэн', 'Утга': pendingCount },
    { 'Үзүүлэлт': 'Бөглөлтийн хувь', 'Утга': `${completionRate}%` },
    { 'Үзүүлэлт': 'Бага эрсдэлтэй сурагч', 'Утга': `${lowRiskCount} (${lowRiskPct}%)` },
    { 'Үзүүлэлт': 'Дунд эрсдэлтэй сурагч', 'Утга': `${medRiskCount} (${medRiskPct}%)` },
    { 'Үзүүлэлт': 'Өндөр эрсдэлтэй сурагч', 'Утга': `${highRiskCount} (${highRiskPct}%)` },
    { 'Үзүүлэлт': 'Тайлан үүсгэсэн огноо', 'Утга': new Date().toLocaleString('mn-MN') }
  ];
  const ws13 = XLSX.utils.json_to_sheet(summaryMeta);
  ws13['!cols'] = [{ wch: 28 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, ws13, '13_Бөглөсөн_эсэх');

  // Write file
  const fileName = `${schoolClass.name}_Эрсдэлийн_үнэлгээний_тайлан_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
