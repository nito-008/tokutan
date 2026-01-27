import * as v from "valibot";
import { DateTimeSchema, IdSchema, YearSchema } from "../common";
import { SemesterSchema } from "./course-record";
import { GradeSchema } from "./grade";

/**
 * 計画科目のステータス
 */
export const PlannedCourseStatusSchema = v.picklist(["planned", "enrolled", "completed", "failed"]);
export type PlannedCourseStatus = v.InferOutput<typeof PlannedCourseStatusSchema>;

/**
 * 計画中の科目
 */
export const PlannedCourseSchema = v.object({
  courseId: v.string(),
  courseName: v.string(),
  credits: v.pipe(v.number(), v.minValue(0)),
  status: PlannedCourseStatusSchema,
  actualGrade: v.optional(GradeSchema),
  notes: v.optional(v.string()),
});

export type PlannedCourse = v.InferOutput<typeof PlannedCourseSchema>;

/**
 * 学期ごとの履修計画
 */
export const SemesterPlanSchema = v.object({
  year: YearSchema,
  semester: SemesterSchema,
  courses: v.array(PlannedCourseSchema),
});

export type SemesterPlan = v.InferOutput<typeof SemesterPlanSchema>;

/**
 * 履修計画全体
 */
export const CoursePlanSchema = v.object({
  id: IdSchema,
  profileId: IdSchema,
  plans: v.array(SemesterPlanSchema),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export type CoursePlan = v.InferOutput<typeof CoursePlanSchema>;
