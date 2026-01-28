import type { CoursePlan, PlannedCourse, SemesterPlan } from "~/types";
import { db } from "./index";

// 履修計画を取得
export async function getCoursePlan(profileId: string): Promise<CoursePlan | undefined> {
  return db.coursePlans.where("profileId").equals(profileId).first();
}

// 履修計画を保存
export async function saveCoursePlan(plan: CoursePlan): Promise<string> {
  const now = new Date().toISOString();
  const data = {
    ...plan,
    updatedAt: now,
    createdAt: plan.createdAt || now,
  };
  await db.coursePlans.put(data);
  return data.id;
}

// デフォルトの履修計画を作成
export async function createDefaultCoursePlan(
  profileId: string,
  enrollmentYear: number,
): Promise<CoursePlan> {
  const now = new Date().toISOString();

  // 4年分の空の学期プランを作成
  const plans: SemesterPlan[] = [];
  for (let i = 0; i < 4; i++) {
    const year = enrollmentYear + i;
    plans.push({ year, semester: "spring", courses: [] });
    plans.push({ year, semester: "fall", courses: [] });
  }

  const plan: CoursePlan = {
    id: `plan-${profileId}`,
    profileId,
    plans,
    createdAt: now,
    updatedAt: now,
  };

  await db.coursePlans.add(plan);
  return plan;
}

// 履修計画があることを保証
export async function ensureCoursePlan(
  profileId: string,
  enrollmentYear: number,
): Promise<CoursePlan> {
  const existing = await getCoursePlan(profileId);
  if (existing) return existing;
  return createDefaultCoursePlan(profileId, enrollmentYear);
}

// 学期に科目を追加
export async function addCourseToSemester(
  profileId: string,
  year: number,
  semester: "spring" | "fall",
  course: PlannedCourse,
): Promise<void> {
  const plan = await getCoursePlan(profileId);
  if (!plan) return;

  const semesterPlan = plan.plans.find((p) => p.year === year && p.semester === semester);
  if (!semesterPlan) return;

  // 重複チェック
  const exists = semesterPlan.courses.some((c) => c.courseId === course.courseId);
  if (exists) return;

  semesterPlan.courses.push(course);
  await saveCoursePlan(plan);
}

// 学期から科目を削除
export async function removeCourseFromSemester(
  profileId: string,
  year: number,
  semester: "spring" | "fall",
  courseId: string,
): Promise<void> {
  const plan = await getCoursePlan(profileId);
  if (!plan) return;

  const semesterPlan = plan.plans.find((p) => p.year === year && p.semester === semester);
  if (!semesterPlan) return;

  semesterPlan.courses = semesterPlan.courses.filter((c) => c.courseId !== courseId);
  await saveCoursePlan(plan);
}

// 履修計画内の科目を更新
export async function updateCourseInPlan(
  profileId: string,
  year: number,
  semester: "spring" | "fall",
  courseId: string,
  updates: Partial<PlannedCourse>,
): Promise<void> {
  const plan = await getCoursePlan(profileId);
  if (!plan) return;

  const semesterPlan = plan.plans.find((p) => p.year === year && p.semester === semester);
  if (!semesterPlan) return;

  const course = semesterPlan.courses.find((c) => c.courseId === courseId);
  if (!course) return;

  Object.assign(course, updates);
  await saveCoursePlan(plan);
}

// 科目を別の学期に移動
export async function moveCourseToSemester(
  profileId: string,
  fromYear: number,
  fromSemester: "spring" | "fall",
  toYear: number,
  toSemester: "spring" | "fall",
  courseId: string,
): Promise<void> {
  const plan = await getCoursePlan(profileId);
  if (!plan) return;

  const fromPlan = plan.plans.find((p) => p.year === fromYear && p.semester === fromSemester);
  const toPlan = plan.plans.find((p) => p.year === toYear && p.semester === toSemester);
  if (!fromPlan || !toPlan) return;

  const courseIndex = fromPlan.courses.findIndex((c) => c.courseId === courseId);
  if (courseIndex < 0) return;

  const [course] = fromPlan.courses.splice(courseIndex, 1);
  toPlan.courses.push(course);

  await saveCoursePlan(plan);
}

// 履修計画を削除
export async function deleteCoursePlan(profileId: string): Promise<void> {
  await db.coursePlans.where("profileId").equals(profileId).delete();
}

// 学期の単位合計を取得
export function getSemesterCredits(semesterPlan: SemesterPlan): number {
  return semesterPlan.courses.reduce((sum, c) => sum + c.credits, 0);
}

// 履修計画全体の統計
export async function getCoursePlanStats(profileId: string): Promise<{
  totalPlanned: number;
  totalEnrolled: number;
  totalCompleted: number;
  totalFailed: number;
  creditsByYear: Record<number, number>;
}> {
  const plan = await getCoursePlan(profileId);
  if (!plan) {
    return {
      totalPlanned: 0,
      totalEnrolled: 0,
      totalCompleted: 0,
      totalFailed: 0,
      creditsByYear: {},
    };
  }

  const allCourses = plan.plans.flatMap((p) => p.courses);
  const creditsByYear: Record<number, number> = {};

  for (const sp of plan.plans) {
    const year = sp.year;
    creditsByYear[year] = (creditsByYear[year] || 0) + getSemesterCredits(sp);
  }

  return {
    totalPlanned: allCourses
      .filter((c) => c.status === "planned")
      .reduce((s, c) => s + c.credits, 0),
    totalEnrolled: allCourses
      .filter((c) => c.status === "enrolled")
      .reduce((s, c) => s + c.credits, 0),
    totalCompleted: allCourses
      .filter((c) => c.status === "completed")
      .reduce((s, c) => s + c.credits, 0),
    totalFailed: allCourses.filter((c) => c.status === "failed").reduce((s, c) => s + c.credits, 0),
    creditsByYear,
  };
}
