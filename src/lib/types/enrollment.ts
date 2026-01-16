// 成績
export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'P' | '認' | '履修中' | '-';

// 科目区分(TWINSの値)
export type CourseCategory = 'A' | 'B' | 'C';

// TWINSからパースした科目データ
export interface TwinsCourse {
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  credits: number;
  springGrade: string;
  fallGrade: string;
  finalGrade: Grade;
  category: CourseCategory;
  year: number;
  type: string;
}

// ユーザーの履修記録
export interface UserCourseRecord {
  id: string;
  courseId: string;
  courseName: string;
  credits: number;
  grade: Grade;
  year: number;
  semester: 'spring' | 'fall' | 'full';
  category: CourseCategory;
  isPassed: boolean;
  isInProgress: boolean;
}

// 履修データ
export interface EnrollmentData {
  id: string;
  profileId: string;
  courses: UserCourseRecord[];
  importedAt: string;
  updatedAt: string;
}

// ユーザープロファイル
export interface UserProfile {
  id: string;
  name: string;
  studentId?: string;
  enrollmentYear: number;
  department: string;
  selectedRequirementsId?: string;
  createdAt: string;
  updatedAt: string;
}

// 履修計画
export interface CoursePlan {
  id: string;
  profileId: string;
  plans: SemesterPlan[];
  createdAt: string;
  updatedAt: string;
}

export interface SemesterPlan {
  year: number;
  semester: 'spring' | 'fall';
  courses: PlannedCourse[];
}

export interface PlannedCourse {
  courseId: string;
  courseName: string;
  credits: number;
  status: 'planned' | 'enrolled' | 'completed' | 'failed';
  actualGrade?: Grade;
  notes?: string;
}

// 成績判定
export function isPassed(grade: Grade): boolean {
  return ['A+', 'A', 'B', 'C', 'P', '認'].includes(grade);
}

export function isInProgress(grade: Grade): boolean {
  return grade === '履修中';
}

// カテゴリ名のマッピング
export const categoryNames: Record<CourseCategory, string> = {
  'A': '専門科目',
  'B': '専門基礎科目',
  'C': '共通科目'
};
