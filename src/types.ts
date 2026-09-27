export type Role = 'admin' | 'teacher' | 'student';

export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionSubSectionTheme {
  header: string;
  background: string;
  accent: string;
  border: string;
  badge: string;
  badge_text: string;
}

export interface Question {
  id: string;
  section_id: number;
  section: string;
  sub_section?: string;
  sub_section_id?: string;
  sub_section_color?: QuestionSubSectionTheme;
  responsive_grid?: string;
  source_row?: number;
  source_column?: number;
  question: string;
  type: 'select' | 'radio' | 'text' | 'registration_number' | 'phone';
  required: boolean;
  options: QuestionOption[];
}

export interface Section {
  id: number;
  title: string;
}

export interface Student {
  id: string;
  classId: string;
  className: string;
  studentCode: string; // e.g. 7A001
  password: string; // e.g. A8K29P
  fullName: string;
  gender?: '1' | '2'; // 1: эм, 2: эр
  isSubmitted: boolean;
  submittedAt?: string;
  canRetake?: boolean; // Admin can permit retake
  riskLevel?: 'low' | 'medium' | 'high';
  riskScore?: number;
}

export interface Teacher {
  id: string;
  name: string;
  teacherCode: string; // Used to login, e.g. TEACH-7A
  classId: string;
  className: string;
  phone?: string;
  password?: string;
}

export interface SchoolClass {
  id: string;
  name: string; // e.g. 7А
  grade: number; // 7
  sectionLetter: string; // А
  teacherId?: string;
  teacherName?: string;
  teacherCode: string;
  academicYear: string; // e.g. 2025-2026
  schoolName: string;
  studentCount?: number;
  isLocked?: boolean; // Ангийн эрсдэлийн үнэлгээ дууссан, судалгаа хаагдсан эсэх
  lockedAt?: string;
  lockedReason?: string;
}

export interface SystemSettings {
  schoolName: string;
  academicYear: string;
  surveyOpen: boolean;
  gasWebAppUrl: string;
  gasConnected: boolean;
  googleSheetsSpreadsheetId?: string;
  googleSheetsUrl?: string;
  googleSheetsConnected?: boolean;
  googleSheetsLastSync?: string;
  lastSyncedAt?: string;
}

export interface SurveyResponseRecord {
  timestamp: string;
  school: string;
  year: string;
  class: string;
  studentId: string;
  studentName: string;
  questionId: string;
  question: string;
  group: string;
  answer: string;
}

export interface StudentSurveyAnswers {
  studentId: string;
  classId: string;
  answers: Record<string, string>; // questionId -> answer string
  updatedAt: string;
  isCompleted: boolean;
}

export interface RiskEvaluation {
  studentId: string;
  studentName: string;
  className: string;
  totalScore: number;
  level: 'low' | 'medium' | 'high'; // 🟢 Бага, 🟡 Дунд, 🔴 Өндөр
  sectionScores: Record<number, number>;
  identifiedFlags: string[];
}

export interface SystemLog {
  id: string;
  timestamp: string;
  userRole: string;
  userName: string;
  action: string;
  details: string;
}
