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

// 全必修科目番号を収集するヘルパー関数
function collectAllRequiredCourseIds(requirements: GraduationRequirements): Set<string> {
  const requiredCourseIds = new Set<string>();

  for (const category of requirements.categories) {
    for (const subcategory of category.subcategories) {
      if (subcategory.type !== "required") continue;
      for (const course of subcategory.requiredCourses ?? []) {
        for (const courseId of course.equivalentIds) {
          requiredCourseIds.add(courseId);
        }
      }
    }
  }

  return requiredCourseIds;
}

function matchRequiredCourses(
  requiredCourses: import("../types").RequiredCourse[],
  courses: UserCourseRecord[],
  usedCourseIds: Set<string>,
  kdbMap: Map<string, Course>,
): MatchedCourse[] {
  const matches: MatchedCourse[] = [];

  for (const requiredCourse of requiredCourses) {
    const equivalentIds = requiredCourse.equivalentIds;
    if (equivalentIds.length === 0) continue;

    // 各RequiredCourseエントリに対して、equivalentIdsの中から履修済みの科目を探す
    let matched = false;
    for (const course of courses) {
      if (!equivalentIds.includes(course.courseId)) continue;
      if (usedCourseIds.has(course.id)) continue;

      usedCourseIds.add(course.id);
      matches.push({
        courseId: course.courseId,
        courseName: course.courseName,
        credits: course.credits,
        grade: course.grade,
        isPassed: course.isPassed,
        isInProgress: course.isInProgress,
      });
      matched = true;
      break; // 同等科目のうち1つ見つかればOK
    }

    // 履修していない場合、equivalentIdsの最初の科目を未履修として表示
    if (!matched) {
      const representativeCourseId = equivalentIds[0];
      const kdbCourse = kdbMap.get(representativeCourseId);
      matches.push({
        courseId: representativeCourseId,
        courseName: kdbCourse?.name ?? representativeCourseId,
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

// 要件充足状況を計算
export function calculateRequirementStatus(
  requirements: GraduationRequirements,
  courses: UserCourseRecord[],
  kdbCourses: Course[] = [],
): RequirementStatus {
  // 各科目が使用済みかどうかを追跡（同じ科目を複数カテゴリでカウントしない）
  const usedCourseIds = new Set<string>();

  // 全必修科目番号を収集
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

      if (subcategory.type === "required") {
        const requiredCourses = subcategory.requiredCourses ?? [];
        const requiredMatches = matchRequiredCourses(
          requiredCourses,
          courses,
          usedCourseIds,
          kdbMap,
        );
        matchedCourses.push(...requiredMatches);

        const earnedCredits = matchedCourses
          .filter((m) => m.isPassed)
          .reduce((sum, m) => sum + m.credits, 0);

        const inProgressCredits = matchedCourses
          .filter((m) => m.isInProgress)
          .reduce((sum, m) => sum + m.credits, 0);

        // 各RequiredCourseエントリの代表科目の単位数を合計
        const requiredCredits = requiredCourses.reduce((sum, course) => {
          if (course.equivalentIds.length === 0) return sum;
          const representativeCourseId = course.equivalentIds[0];
          return sum + (kdbMap.get(representativeCourseId)?.credits ?? 2);
        }, 0);

        // 各RequiredCourseエントリにつき、equivalentIdsのいずれか1つが履修済みまたは履修中ならOK
        const isSatisfied = requiredCourses.every((course) =>
          course.equivalentIds.some((courseId) =>
            matchedCourses.some((m) => m.courseId === courseId && (m.isPassed || m.isInProgress)),
          ),
        );

        return {
          subcategoryId: subcategory.id,
          subcategoryName: subcategory.name,
          earnedCredits,
          inProgressCredits,
          requiredCredits,
          maxCredits: undefined,
          isSatisfied,
          ruleStatuses,
          matchedCourses,
        };
      }

      for (const rule of subcategory.rules) {
        const ruleMatches = matchCoursesToRule(courses, rule, usedCourseIds, excludedCourseIds);

        const earnedCredits = ruleMatches
          .filter((m) => m.isPassed)
          .reduce((sum, m) => sum + m.credits, 0);

        const inProgressCredits = ruleMatches
          .filter((m) => m.isInProgress)
          .reduce((sum, m) => sum + m.credits, 0);

        const isSatisfied = rule.minCredits ? earnedCredits >= rule.minCredits : true;

        ruleStatuses.push({
          ruleId: rule.id,
          description: rule.description,
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
    const requiredCredits = subcategoryStatuses.reduce((sum, s) => sum + s.requiredCredits, 0);
    const isSatisfied = subcategoryStatuses.every((s) => s.isSatisfied);

    return {
      categoryId: category.id,
      categoryName: category.name,
      earnedCredits,
      inProgressCredits,
      requiredCredits,
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
): MatchedCourse[] {
  const matches: MatchedCourse[] = [];

  for (const course of courses) {
    // 既に使用済みの科目はスキップ
    if (usedCourseIds.has(course.id)) continue;

    let isMatch = false;

    switch (rule.type) {
      case "specific":
        isMatch = rule.courseIds.includes(course.courseId);
        break;

      case "pattern":
        {
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

  return matches;
}
