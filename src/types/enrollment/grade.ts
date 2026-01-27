import * as v from "valibot";

/**
 * 成績
 */
export const GradeSchema = v.picklist(["A+", "A", "B", "C", "D", "P", "認", "履修中", "-"]);
export type Grade = v.InferOutput<typeof GradeSchema>;

/**
 * 科目区分（TWINSの値）
 */
export const CourseCategorySchema = v.picklist(["A", "B", "C"]);
export type CourseCategory = v.InferOutput<typeof CourseCategorySchema>;

/**
 * 成績判定ヘルパー関数
 */
export function isPassed(grade: Grade): boolean {
  return ["A+", "A", "B", "C", "P", "認"].includes(grade);
}

export function isInProgress(grade: Grade): boolean {
  return grade === "履修中";
}

/**
 * カテゴリ名のマッピング
 */
export const categoryNames: Record<CourseCategory, string> = {
  A: "専門科目",
  B: "専門基礎科目",
  C: "共通科目",
};
