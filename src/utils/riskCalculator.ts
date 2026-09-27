import { RiskEvaluation, Student } from '../types';

interface AnswerMap {
  [questionId: string]: string;
}

export function evaluateStudentRisk(
  student: Student,
  answers: AnswerMap
): RiskEvaluation {
  let totalScore = 0;
  const sectionScores: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0
  };
  const identifiedFlags: string[] = [];

  // Critical indicators in Section III (Violence / Health)
  if (answers['Q035'] === '1') {
    totalScore += 5;
    sectionScores[3] += 5;
    identifiedFlags.push('Бие махбодийн хүчирхийлэлд өртсөн байж болзошгүй');
  }
  if (answers['Q036'] === '1') {
    totalScore += 6;
    sectionScores[3] += 6;
    identifiedFlags.push('Бэлгийн хүчирхийлэлд өртсөн байж болзошгүй');
  }
  if (answers['Q037'] === '1') {
    totalScore += 4;
    sectionScores[3] += 4;
    identifiedFlags.push('Сэтгэл санааны хүчирхийлэлд өртсөн байж болзошгүй');
  }
  if (answers['Q038'] === '1') {
    totalScore += 4;
    sectionScores[3] += 4;
    identifiedFlags.push('Үл хайхрах хүчирхийлэлд өртсөн байж болзошгүй');
  }
  if (answers['Q051'] && answers['Q051'] !== '6') {
    totalScore += 2;
    sectionScores[3] += 2;
    identifiedFlags.push('Нийгмийн орчинд гадуурхагддаг шинжтэй');
  }

  // Section II Vulnerabilities
  if (answers['Q030'] === '1' || answers['Q030'] === '11') {
    totalScore += 2;
    sectionScores[2] += 2;
    identifiedFlags.push('Өрхийн орлого нэн бага эсвэл зөвхөн хүүхдийн мөнгөөр амьдардаг');
  }
  if (answers['Q032'] === '2') {
    totalScore += 2;
    sectionScores[2] += 2;
    identifiedFlags.push('Бүтэн өнчин');
  } else if (answers['Q032'] === '1') {
    totalScore += 1;
    sectionScores[2] += 1;
  }

  // Section VI Child Labor / Jockey
  if (answers['Q092'] && answers['Q092'] !== '8') {
    totalScore += 3;
    sectionScores[6] += 3;
    identifiedFlags.push('Хичээлээс гадуур хөдөлмөр эрхэлдэг');
  }
  if (answers['Q093'] === '1') {
    totalScore += 2;
    sectionScores[6] += 2;
    if (answers['Q099'] === '1') {
      totalScore += 3;
      identifiedFlags.push('Хурдан мориноос унаж бэртэж байсан');
    }
  }

  // Section VII School & Social Environment Risks
  if (answers['Q108'] === '1') {
    totalScore += 1;
    sectionScores[7] += 1;
    identifiedFlags.push('Харанхуй гудамж, жалгаар явж харьдаг');
  }
  if (answers['Q109'] === '1') {
    totalScore += 2;
    sectionScores[7] += 2;
    identifiedFlags.push('Цахим сөрөг мэдээлэлд автсан');
  }
  if (answers['Q110'] === '1' || answers['Q111'] === '1') {
    totalScore += 3;
    sectionScores[7] += 3;
    identifiedFlags.push('Насанд хүрээгүй үедээ авто/мотоцикл жолооддог');
  }
  if (answers['Q114'] === '1' || answers['Q115'] === '1') {
    totalScore += 2;
    sectionScores[7] += 2;
    identifiedFlags.push('Хичээл хоцролт, таслалт өндөр');
  }
  if (answers['Q116'] === '1' || answers['Q117'] === '1' || answers['Q119'] === '1') {
    totalScore += 4;
    sectionScores[7] += 4;
    identifiedFlags.push('Сургууль, дотуур байр, үе тэнгийнхний дарамтад өртдөг');
  }
  if (answers['Q118'] === '1') {
    totalScore += 4;
    sectionScores[7] += 4;
    identifiedFlags.push('Багш, ажилтны ёс зүйгүй харилцаа, дарамтад өртсөн');
  }

  // Section VIII Family & Personal Behavior Risks
  if (answers['Q123'] === '1') {
    totalScore += 5;
    sectionScores[8] += 5;
    identifiedFlags.push('Гэр бүлийн хүчирхийлэлд өртдөг');
  }
  if (answers['Q126'] === '1') {
    totalScore += 2;
    sectionScores[8] += 2;
    identifiedFlags.push('Ар гэрийн хараа хяналт сул');
  }
  if (answers['Q127'] === '1' || answers['Q127'] === '3') {
    totalScore += 3;
    sectionScores[8] += 3;
    identifiedFlags.push('Гэр бүлийн орчинд архины хамааралтай хүнтэй');
  }
  if (answers['Q132'] === '1') {
    totalScore += 2;
    sectionScores[8] += 2;
    identifiedFlags.push('Гэрээс гадуур тэнэдэг');
  }
  if (answers['Q134'] === '1') {
    totalScore += 1;
    sectionScores[8] += 1;
    identifiedFlags.push('Ганцаардмал зожиг байдал илэрсэн');
  }
  if (answers['Q140'] === '1') {
    totalScore += 4;
    sectionScores[8] += 4;
    identifiedFlags.push('Архи, пиво уудаг эрсдэлтэй');
  }
  if (answers['Q141'] === '1') {
    totalScore += 6;
    sectionScores[8] += 6;
    identifiedFlags.push('Сэтгэцэд нөлөөлөх эм бодис хэрэглэдэг эрсдэлтэй');
  }
  if (answers['Q142'] === '1' || answers['Q142'] === '2') {
    totalScore += 2;
    sectionScores[8] += 2;
    identifiedFlags.push('Тамхи татдаг (электрон эсвэл утаат)');
  }
  if (answers['Q143'] === '1' || answers['Q144'] === '1') {
    totalScore += 2;
    sectionScores[8] += 2;
    identifiedFlags.push('Дэлгэц болон цахим тоглоомын хамааралтай');
  }
  if (answers['Q145'] === '1' || answers['Q138'] === '1') {
    totalScore += 3;
    sectionScores[8] += 3;
    identifiedFlags.push('Хулгай болон зөвшөөрөлгүй юм авах зөрчил');
  }

  // Determine Level:
  // Red (Өндөр): totalScore >= 8 or severe flag
  // Yellow (Дунд): totalScore >= 3 and < 8
  // Green (Бага): totalScore < 3
  const hasSevereFlag =
    answers['Q035'] === '1' ||
    answers['Q036'] === '1' ||
    answers['Q037'] === '1' ||
    answers['Q038'] === '1' ||
    answers['Q123'] === '1' ||
    answers['Q141'] === '1' ||
    answers['Q118'] === '1';

  let level: 'low' | 'medium' | 'high' = 'low';
  if (hasSevereFlag || totalScore >= 8) {
    level = 'high';
  } else if (totalScore >= 3) {
    level = 'medium';
  }

  return {
    studentId: student.id,
    studentName: student.fullName,
    className: student.className,
    totalScore,
    level,
    sectionScores,
    identifiedFlags
  };
}
