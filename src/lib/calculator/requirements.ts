import type {
  CategoryStatus,
  GraduationRequirements,
  MatchedCourse,
  RequirementRule,
  RequirementStatus,
  RuleStatus,
  SubcategoryStatus,
  UserCourseRecord,
} from "../types";
import type { Course } from "../types/course";

// 全必修科目IDを収集するヘルパー関数
function collectAllRequiredCourseIds(requirements: GraduationRequirements): Set<string> {
  const requiredCourseIds = new Set<string>();

  for (const category of requirements.categories) {
    for (const subcategory of category.subcategories) {
      for (const rule of subcategory.rules) {
        if (rule.required && rule.type === "specific" && rule.courseIds) {
          for (const courseId of rule.courseIds) {
            requiredCourseIds.add(courseId);
          }
        }
      }
    }
  }

  return requiredCourseIds;
}

// 要件充足状況を計算
export function calculateRequirementStatus(
  requirements: GraduationRequirements,
  courses: UserCourseRecord[],
  kdbCourses: Course[] = [],
): RequirementStatus {
  // 各科目が使用済みかどうかを追跡（同じ科目を複数カテゴリでカウントしない）
  const usedCourseIds = new Set<string>();

  // 全必修科目IDを収集
  const excludedCourseIds = collectAllRequiredCourseIds(requirements);

  // kdbキャッシュのMapを作成（科目番号→科目情報）
  const kdbMap = new Map<string, Course>();
  for (const course of kdbCourses) {
    kdbMap.set(course.id, course);
  }

  const categoryStatuses: CategoryStatus[] = requirements.categories.map((category) => {
    const subcategoryStatuses: SubcategoryStatus[] = category.subcategories.map((subcategory) => {
      const ruleStatuses: RuleStatus[] = [];
      const matchedCourses: MatchedCourse[] = [];

      for (const rule of subcategory.rules) {
        const ruleMatches = matchCoursesToRule(courses, rule, usedCourseIds, excludedCourseIds, kdbMap);

        const earnedCredits = ruleMatches
          .filter((m) => m.isPassed)
          .reduce((sum, m) => sum + m.credits, 0);

        const inProgressCredits = ruleMatches
          .filter((m) => m.isInProgress)
          .reduce((sum, m) => sum + m.credits, 0);

        const isSatisfied = rule.required
          ? ruleMatches.every((m) => m.isPassed || m.isInProgress)
          : rule.minCredits
            ? earnedCredits >= rule.minCredits
            : true;

        ruleStatuses.push({
          ruleId: rule.id,
          description: rule.description || "",
          isSatisfied,
          earnedCredits,
          inProgressCredits,
          requiredCredits: rule.minCredits,
          matchedCourses: ruleMatches,
        });

        matchedCourses.push(...ruleMatches);
      }

      const earnedCredits = matchedCourses
        .filter((m) => m.isPassed)
        .reduce((sum, m) => sum + m.credits, 0);

      const inProgressCredits = matchedCourses
        .filter((m) => m.isInProgress)
        .reduce((sum, m) => sum + m.credits, 0);

      const isSatisfied = earnedCredits >= subcategory.minCredits;

      return {
        subcategoryId: subcategory.id,
        subcategoryName: subcategory.name,
        earnedCredits,
        inProgressCredits,
        requiredCredits: subcategory.minCredits,
        maxCredits: subcategory.maxCredits,
        isSatisfied,
        ruleStatuses,
        matchedCourses,
      };
    });

    const earnedCredits = subcategoryStatuses.reduce((sum, s) => sum + s.earnedCredits, 0);
    const inProgressCredits = subcategoryStatuses.reduce((sum, s) => sum + s.inProgressCredits, 0);
    const requiredCredits =
      category.minCredits || subcategoryStatuses.reduce((sum, s) => sum + s.requiredCredits, 0);
    const isSatisfied = subcategoryStatuses.every((s) => s.isSatisfied);

    return {
      categoryId: category.id,
      categoryName: category.name,
      earnedCredits,
      inProgressCredits,
      requiredCredits,
      maxCredits: category.maxCredits,
      isSatisfied,
      subcategoryStatuses,
    };
  });

  const totalEarnedCredits = categoryStatuses.reduce((sum, c) => sum + c.earnedCredits, 0);
  const totalInProgressCredits = categoryStatuses.reduce((sum, c) => sum + c.inProgressCredits, 0);
  const isGraduationEligible = totalEarnedCredits >= requirements.totalCredits;

  return {
    requirementsId: requirements.id,
    totalEarnedCredits,
    totalInProgressCredits,
    totalRequiredCredits: requirements.totalCredits,
    isGraduationEligible,
    categoryStatuses,
    calculatedAt: new Date().toISOString(),
  };
}

// 科目をルールにマッチング
function matchCoursesToRule(
  courses: UserCourseRecord[],
  rule: RequirementRule,
  usedCourseIds: Set<string>,
  excludedCourseIds: Set<string>,
  kdbMap: Map<string, Course>,
): MatchedCourse[] {
  const matches: MatchedCourse[] = [];

  for (const course of courses) {
    // 既に使用済みの科目はスキップ
    if (usedCourseIds.has(course.id)) continue;

    let isMatch = false;

    switch (rule.type) {
      case "specific":
        isMatch = rule.courseIds?.includes(course.courseId) || false;
        break;

      case "pattern":
        if (rule.courseIdPattern) {
          const regex = new RegExp(rule.courseIdPattern);
          // 必修科目として定義されているものは除外
          if (excludedCourseIds.has(course.courseId)) {
            isMatch = false;
          } else {
            isMatch = regex.test(course.courseId);
          }
        }
        break;
    }

    if (isMatch) {
      usedCourseIds.add(course.id);
      matches.push({
        courseId: course.courseId,
        courseName: course.courseName,
        credits: course.credits,
        grade: course.grade,
        isPassed: course.isPassed,
        isInProgress: course.isInProgress,
      });
    }
  }

  // 必修科目ルールの場合、未履修科目も追加
  if (rule.required && rule.type === "specific" && rule.courseIds) {
    for (const courseId of rule.courseIds) {
      // 既にマッチした科目はスキップ
      if (matches.some((m) => m.courseId === courseId)) continue;

      // kdbから科目情報を取得
      const kdbCourse = kdbMap.get(courseId);
      matches.push({
        courseId,
        courseName: kdbCourse?.name ?? courseId,
        credits: kdbCourse?.credits ?? 2,
        grade: "未履修",
        isPassed: false,
        isInProgress: false,
        isUnregistered: true,
      });
    }
  }

  return matches;
}
