import * as v from "valibot";
import { DateTimeSchema, IdSchema, YearSchema } from "../common";

/**
 * ユーザープロファイル
 */
export const UserProfileSchema = v.object({
  id: IdSchema,
  name: v.pipe(v.string(), v.minLength(1)),
  studentId: v.optional(v.string()),
  enrollmentYear: YearSchema,
  department: v.pipe(v.string(), v.minLength(1)),
  selectedRequirementsId: v.optional(IdSchema),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export type UserProfile = v.InferOutput<typeof UserProfileSchema>;
