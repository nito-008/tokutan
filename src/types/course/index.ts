import * as v from "valibot";

export const KdbCourseSchema = v.object({
  科目番号: v.string(),
  科目名: v.string(),
  授業方法: v.string(),
  単位数: v.string(),
  標準履修年次: v.string(),
  実施学期: v.string(),
  曜時限: v.string(),
  担当教員: v.string(),
  授業概要: v.string(),
  備考: v.string(),
  データ更新日: v.string(),
});
export type KdbCourse = v.InferOutput<typeof KdbCourseSchema>;

export const CourseSchema = v.object({
  id: v.string(),
  name: v.string(),
  method: v.string(),
  credits: v.number(),
  gradeYear: v.number(),
  semester: v.string(),
  schedule: v.string(),
  instructor: v.string(),
  description: v.string(),
  notes: v.string(),
  updatedAt: v.string(),
  cachedAt: v.optional(v.string()),
});
export type Course = v.InferOutput<typeof CourseSchema>;

export function convertKdbCourse(kdb: KdbCourse): Course {
  return {
    id: kdb.科目番号,
    name: kdb.科目名,
    method: kdb.授業方法,
    credits: parseFloat(kdb.単位数) || 0,
    gradeYear: parseInt(kdb.標準履修年次, 10) || 0,
    semester: kdb.実施学期,
    schedule: kdb.曜時限,
    instructor: kdb.担当教員,
    description: kdb.授業概要,
    notes: kdb.備考,
    updatedAt: kdb.データ更新日,
  };
}
