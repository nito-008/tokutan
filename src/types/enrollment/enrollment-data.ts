import * as v from "valibot";
import { DateTimeSchema, IdSchema } from "../common";
import { UserCourseRecordSchema } from "./course-record";

/**
 * 履修データ
 */
export const EnrollmentDataSchema = v.object({
  id: IdSchema,
  profileId: IdSchema,
  courses: v.array(UserCourseRecordSchema),
  importedAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export type EnrollmentData = v.InferOutput<typeof EnrollmentDataSchema>;
