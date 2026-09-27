import { Question } from '../types';

export interface QuestionConditionState {
  disabled: boolean;
  disabledReason?: string;
  isRequired: boolean;
}

/**
 * Evaluates whether a question should be disabled or enabled based on prior answers.
 */
export function evaluateQuestionCondition(
  questionId: string,
  answers: Record<string, string>
): { disabled: boolean; disabledReason?: string } {
  const livingSituation = answers['Q012']; // Хэнтэйгээ хамт амьдардаг вэ?
  // 1: Эцэг эхтэйгээ
  // 2: Ээжтэйгээ
  // 3: Аавтайгаа
  // 4: Хойд ээжтэйгээ
  // 5: Хойд аавтайгаа
  // 6: Эмээтэйгээ
  // 7: Өвөөтэйгээ
  // 8: Нагац ах, эгчтэйгээ
  // 9: Авга ах, эгчтэйгээ
  // 10: Төрсөн ах, эгчтэйгээ

  const orphanStatus = answers['Q032']; // 1: Хагас өнчин, 2: Бүтэн өнчин, 3: Өнчин биш

  // Father-related fields: Q023 (Эцгийн нэр), Q024 (Эцгийн боловсрол), Q025 (Эрхэлж буй ажил)
  if (['Q023', 'Q024', 'Q025'].includes(questionId)) {
    if (orphanStatus === '2') {
      return {
        disabled: true,
        disabledReason: 'Бүтэн өнчин тул эцгийн мэдээлэл шаардлагагүй (Асран хамгаалагчийн мэдээлэл бөглөнө үү)'
      };
    }
    if (livingSituation === '2') {
      return {
        disabled: true,
        disabledReason: 'Ээжтэйгээ амьдардаг тул эцгийн мэдээлэл бөглөх шаардлагагүй'
      };
    }
    if (['6', '7', '8', '9', '10'].includes(livingSituation)) {
      return {
        disabled: true,
        disabledReason: 'Эцэг, эхтэйгээ амьдардаггүй тул асран хамгаалагчийн мэдээлэл бөглөнө үү'
      };
    }
  }

  // Mother-related fields: Q027 (Эхийн нэр), Q028 (Эхийн боловсрол)
  if (['Q027', 'Q028'].includes(questionId)) {
    if (orphanStatus === '2') {
      return {
        disabled: true,
        disabledReason: 'Бүтэн өнчин тул эхийн мэдээлэл шаардлагагүй (Асран хамгаалагчийн мэдээлэл бөглөнө үү)'
      };
    }
    if (livingSituation === '3') {
      return {
        disabled: true,
        disabledReason: 'Аавтайгаа амьдардаг тул эхийн мэдээлэл бөглөх шаардлагагүй'
      };
    }
    if (['6', '7', '8', '9', '10'].includes(livingSituation)) {
      return {
        disabled: true,
        disabledReason: 'Эцэг, эхтэйгээ амьдардаггүй тул асран хамгаалагчийн мэдээлэл бөглөнө үү'
      };
    }
  }

  // Guardian name: Q033 (Асран хамгаалагчийн нэр)
  if (questionId === 'Q033') {
    if (livingSituation === '1') {
      return {
        disabled: true,
        disabledReason: 'Эцэг эхтэйгээ амьдардаг тул тусдаа асран хамгаалагч шаардлагагүй'
      };
    }
  }

  // Q035-Q038 all "Үгүй" (No) -> Q039, Q040, Q041 disabled
  // Хэрэв 035-038 бүгд "Үгүй" бол 039-041 идэвхгүй, бусад тохиолдолд идэвхтэй байна.
  if (['Q039', 'Q040', 'Q041'].includes(questionId)) {
    const isNo = (val?: string) => val === '2' || val === 'Үгүй' || val?.toLowerCase() === 'үгүй';
    const q35 = answers['Q035'];
    const q36 = answers['Q036'];
    const q37 = answers['Q037'];
    const q38 = answers['Q038'];

    const allNo = isNo(q35) && isNo(q36) && isNo(q37) && isNo(q38);
    if (allNo) {
      return {
        disabled: true,
        disabledReason: '035-038-р асуултуудад бүгдэд нь "Үгүй" гэж хариулсан тул хүчирхийллийн талаарх асуулт хамаарахгүй (Идэвхгүй)'
      };
    }
  }

  // Q043 vs Q044: Хөгжлийн бэрхшээлтэй эсэх -> Үгүй бол Бэрхшээлийн хэлбэр идэвхгүй
  if (questionId === 'Q044') {
    const hasDisability = answers['Q043'];
    const isNo = hasDisability === '2' || hasDisability === 'Үгүй' || hasDisability?.toLowerCase() === 'үгүй';
    if (isNo || !hasDisability || hasDisability !== '1') {
      return {
        disabled: true,
        disabledReason: isNo
          ? 'Хөгжлийн бэрхшээлгүй ("Үгүй") гэж сонгосон тул бэрхшээлийн хэлбэр хамаарахгүй (Идэвхгүй)'
          : 'Эхлээд 043-р асуултад ("Хөгжлийн бэрхшээлтэй эсэх") хариулна уу'
      };
    }
  }

  // Q048 vs Q049: Биеийн өвчлөл -> Тийм бол дэлгэрэнгүй
  if (questionId === 'Q049') {
    const hasIllness = answers['Q048'];
    if (hasIllness !== '1') {
      return {
        disabled: true,
        disabledReason: 'Өвчлөлгүй гэж хариулсан тул тайлбар бичих шаардлагагүй'
      };
    }
  }

  // Q055 vs Q056: ДЗОУБ хамрагддаг -> Тийм бол код
  if (questionId === 'Q056') {
    const isInWorldVision = answers['Q055'];
    if (isInWorldVision !== '1') {
      return {
        disabled: true,
        disabledReason: 'ДЗОУБ-ын хөтөлбөрт хамрагддаггүй тул код шаардлагагүй'
      };
    }
  }

  // Q093 vs Q094-Q103: Хурдан морь унадаг дээр "Үгүй" сонгосон тохиолдолд 094-103 идэвхгүй
  const horseRidingQuestionIds = [
    'Q094', 'Q095', 'Q096', 'Q097', 'Q098',
    'Q099', 'Q100', 'Q101', 'Q102', 'Q103'
  ];
  if (horseRidingQuestionIds.includes(questionId)) {
    const ridesHorse = answers['Q093'];
    const isNo = ridesHorse === '2' || ridesHorse === 'Үгүй' || ridesHorse?.toLowerCase() === 'үгүй';
    if (isNo) {
      return {
        disabled: true,
        disabledReason: 'Хурдан морь унадаггүй ("Үгүй") гэж сонгосон тул морь унахтай холбоотой асуултууд хамаарахгүй (Идэвхгүй)'
      };
    }
  }

  // Q099 vs Q100: Унаж бэртэж байсан эсэх -> Тийм бол тодорхой бичих
  if (questionId === 'Q100') {
    const hadInjury = answers['Q099'];
    if (hadInjury !== '1') {
      return {
        disabled: true,
        disabledReason: 'Бэртэж байгаагүй тул тайлбар бичих шаардлагагүй'
      };
    }
  }

  return { disabled: false };
}

/**
 * Determines whether a question is required.
 */
export function isQuestionRequired(q: Question, answers: Record<string, string>): boolean {
  const { disabled } = evaluateQuestionCondition(q.id, answers);
  if (disabled) return false;

  // Optional fields
  if (q.id === 'Q007' || q.id === 'Q026') {
    return false;
  }

  // If living with parents (Q012 === '1'), guardian name is not required
  if (q.id === 'Q033' && answers['Q012'] === '1') {
    return false;
  }

  // All other active questions across sections 1-8 are required for complete evaluation
  return true;
}

/**
 * Checks if a question has been validly and completely answered.
 */
export function isQuestionComplete(q: Question, answers: Record<string, string>): boolean {
  const { disabled } = evaluateQuestionCondition(q.id, answers);
  if (disabled) return true;

  const isReq = isQuestionRequired(q, answers);
  if (!isReq) return true;

  const val = answers[q.id];
  if (!val || typeof val !== 'string' || val.trim() === '') {
    return false;
  }

  // Specific length checks
  if (q.id === 'Q002' || q.type === 'registration_number') {
    return val.trim().length === 10;
  }

  if (q.id === 'Q034' || q.type === 'phone') {
    return val.replace(/\D/g, '').length === 8;
  }

  return true;
}

export interface SectionValidationResult {
  isValid: boolean;
  missingQuestionIds: string[];
  missingQuestions: Question[];
  totalActiveRequired: number;
  completedRequired: number;
}

/**
 * Validates whether all required active questions in a specific section have been answered.
 */
export function validateSection(
  sectionId: number,
  questions: Question[],
  answers: Record<string, string>
): SectionValidationResult {
  const sectionQuestions = questions.filter((q) => q.section_id === sectionId);
  const missingQuestions: Question[] = [];
  let totalActiveRequired = 0;
  let completedRequired = 0;

  for (const q of sectionQuestions) {
    const { disabled } = evaluateQuestionCondition(q.id, answers);
    if (disabled) continue;

    const req = isQuestionRequired(q, answers);
    if (req) {
      totalActiveRequired++;
      const complete = isQuestionComplete(q, answers);
      if (complete) {
        completedRequired++;
      } else {
        missingQuestions.push(q);
      }
    }
  }

  return {
    isValid: missingQuestions.length === 0,
    missingQuestionIds: missingQuestions.map((q) => q.id),
    missingQuestions,
    totalActiveRequired,
    completedRequired
  };
}
