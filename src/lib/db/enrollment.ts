import { db } from './index';
import type { EnrollmentData, UserCourseRecord, TwinsCourse } from '../types';
import { isPassed, isInProgress } from '../types';

// プロファイルの履修データを取得
export async function getEnrollment(profileId: string): Promise<EnrollmentData | undefined> {
  return db.enrollment.where('profileId').equals(profileId).first();
}

// 履修データを保存
export async function saveEnrollment(data: EnrollmentData): Promise<string> {
  const now = new Date().toISOString();
  const enrollment: EnrollmentData = {
    ...data,
    updatedAt: now,
    importedAt: data.importedAt || now
  };
  await db.enrollment.put(enrollment);
  return enrollment.id;
}

// TWINSデータから履修データを作成
export async function importTwinsData(
  profileId: string,
  twinsCourses: TwinsCourse[]
): Promise<EnrollmentData> {
  const now = new Date().toISOString();

  // TWINSデータをUserCourseRecordに変換
  const courses: UserCourseRecord[] = twinsCourses.map((tc, index) => ({
    id: `course-${profileId}-${index}-${Date.now()}`,
    courseId: tc.courseId,
    courseName: tc.courseName,
    credits: tc.credits,
    grade: tc.finalGrade,
    year: tc.year,
    semester: determineSemester(tc),
    category: tc.category,
    isPassed: isPassed(tc.finalGrade),
    isInProgress: isInProgress(tc.finalGrade)
  }));

  // 既存データを取得
  const existing = await getEnrollment(profileId);

  const enrollment: EnrollmentData = {
    id: existing?.id || `enrollment-${profileId}`,
    profileId,
    courses: mergeCourses(existing?.courses || [], courses),
    importedAt: now,
    updatedAt: now
  };

  await saveEnrollment(enrollment);
  return enrollment;
}

// 学期を判定
function determineSemester(tc: TwinsCourse): 'spring' | 'fall' | 'full' {
  const hasSpring = tc.springGrade && tc.springGrade !== '-';
  const hasFall = tc.fallGrade && tc.fallGrade !== '-';

  if (hasSpring && hasFall) return 'full';
  if (hasSpring) return 'spring';
  if (hasFall) return 'fall';
  return 'spring'; // デフォルト
}

// 科目をマージ（重複を更新）
function mergeCourses(
  existing: UserCourseRecord[],
  newCourses: UserCourseRecord[]
): UserCourseRecord[] {
  const map = new Map<string, UserCourseRecord>();

  // 既存データをマップに追加
  for (const course of existing) {
    const key = `${course.courseId}-${course.year}`;
    map.set(key, course);
  }

  // 新しいデータで上書きまたは追加
  for (const course of newCourses) {
    const key = `${course.courseId}-${course.year}`;
    map.set(key, course);
  }

  return Array.from(map.values());
}

// 履修データを削除
export async function deleteEnrollment(profileId: string): Promise<void> {
  await db.enrollment.where('profileId').equals(profileId).delete();
}

// 単一科目を追加
export async function addCourse(
  profileId: string,
  course: Omit<UserCourseRecord, 'id'>
): Promise<void> {
  const enrollment = await getEnrollment(profileId);
  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  const newCourse: UserCourseRecord = {
    ...course,
    id: `course-${profileId}-${Date.now()}`
  };

  enrollment.courses.push(newCourse);
  await saveEnrollment(enrollment);
}

// 科目を削除
export async function removeCourse(profileId: string, courseRecordId: string): Promise<void> {
  const enrollment = await getEnrollment(profileId);
  if (!enrollment) return;

  enrollment.courses = enrollment.courses.filter(c => c.id !== courseRecordId);
  await saveEnrollment(enrollment);
}

// 科目を更新
export async function updateCourse(
  profileId: string,
  courseRecordId: string,
  updates: Partial<UserCourseRecord>
): Promise<void> {
  const enrollment = await getEnrollment(profileId);
  if (!enrollment) return;

  const index = enrollment.courses.findIndex(c => c.id === courseRecordId);
  if (index >= 0) {
    enrollment.courses[index] = { ...enrollment.courses[index], ...updates };
    await saveEnrollment(enrollment);
  }
}

// 統計を取得
export async function getEnrollmentStats(profileId: string): Promise<{
  totalCredits: number;
  earnedCredits: number;
  inProgressCredits: number;
  passedCount: number;
  failedCount: number;
  inProgressCount: number;
}> {
  const enrollment = await getEnrollment(profileId);
  if (!enrollment) {
    return {
      totalCredits: 0,
      earnedCredits: 0,
      inProgressCredits: 0,
      passedCount: 0,
      failedCount: 0,
      inProgressCount: 0
    };
  }

  const courses = enrollment.courses;
  return {
    totalCredits: courses.reduce((sum, c) => sum + c.credits, 0),
    earnedCredits: courses.filter(c => c.isPassed).reduce((sum, c) => sum + c.credits, 0),
    inProgressCredits: courses.filter(c => c.isInProgress).reduce((sum, c) => sum + c.credits, 0),
    passedCount: courses.filter(c => c.isPassed).length,
    failedCount: courses.filter(c => !c.isPassed && !c.isInProgress).length,
    inProgressCount: courses.filter(c => c.isInProgress).length
  };
}
