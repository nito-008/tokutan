import * as v from "valibot";
import { IdSchema, YearSchema } from "../common";
import { CourseCategorySchema, GradeSchema } from "./grade";

/**
 * 学期
 */
export const SemesterSchema = v.picklist(["spring", "fall", "full"]);
export type Semester = v.InferOutput<typeof SemesterSchema>;

/**
 * TWINSからパースした科目データ
 */
export const TwinsCourseSchema = v.object({
  studentId: v.string(),
  studentName: v.string(),
  courseId: v.string(),
  courseName: v.string(),
  credits: v.pipe(v.number(), v.minValue(0)),
  springGrade: v.string(),
  fallGrade: v.string(),
  finalGrade: GradeSchema,
  category: CourseCategorySchema,
  year: YearSchema,
  type: v.string(),
});

export type TwinsCourse = v.InferOutput<typeof TwinsCourseSchema>;

/**
 * ユーザーの履修記録
 */
export const UserCourseRecordSchema = v.object({
  id: IdSchema,
  courseId: v.string(),
  courseName: v.string(),
  credits: v.pipe(v.number(), v.minValue(0)),
  grade: GradeSchema,
  year: YearSchema,
  semester: SemesterSchema,
  category: CourseCategorySchema,
  isPassed: v.boolean(),
  isInProgress: v.boolean(),
});

export type UserCourseRecord = v.InferOutput<typeof UserCourseRecordSchema>;
