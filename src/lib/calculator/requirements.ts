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

function splitRequiredCourseGroup(value: string): string[] {
  return value
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id);
}

function parseRequiredCourseGroups(courseIds: string[]): string[][] {
  return courseIds.map(splitRequiredCourseGroup).filter((group) => group.length > 0);
}

// 全必修科目番号を収集するヘルパー関数
function collectAllRequiredCourseIds(requirements: GraduationRequirements): Set<string> {
  const requiredCourseIds = new Set<string>();

  for (const category of requirements.categories) {
    for (const subcategory of category.subcategories) {
      if (subcategory.type !== "required") continue;
      const groups = parseRequiredCourseGroups(subcategory.courseIds ?? []);
      for (const group of groups) {
        for (const courseId of group) {
          requiredCourseIds.add(courseId);
        }
      }
    }
  }

  return requiredCourseIds;
}

function matchRequiredCourseGroups(
  courseGroups: string[][],
  courses: UserCourseRecord[],
  usedCourseIds: Set<string>,
  kdbMap: Map<string, Course>,
): MatchedCourse[] {
  const matches: MatchedCourse[] = [];
  const coursesById = new Map<string, UserCourseRecord[]>();

  for (const course of courses) {
    const list = coursesById.get(course.courseId);
    if (list) {
      list.push(course);
    } else {
      coursesById.set(course.courseId, [course]);
    }
  }

  for (const group of courseGroups) {
    const primaryCourseId = group[0];
    if (!primaryCourseId) continue;
    let selected: UserCourseRecord | null = null;

    for (const courseId of group) {
      const records = coursesById.get(courseId);
      if (!records) continue;
      const record = records.find((item) => !usedCourseIds.has(item.id));
      if (record) {
        selected = record;
        break;
      }
    }

    if (selected) {
      usedCourseIds.add(selected.id);
      matches.push({
        courseId: selected.courseId,
        courseName: selected.courseName,
        credits: selected.credits,
        grade: selected.grade,
        isPassed: selected.isPassed,
        isInProgress: selected.isInProgress,
      });
      continue;
    }

    const kdbCourse = kdbMap.get(primaryCourseId);
    matches.push({
      courseId: primaryCourseId,
      courseName: kdbCourse?.name ?? primaryCourseId,
      credits: kdbCourse?.credits ?? 2,
      grade: "未履修",
      isPassed: false,
      isInProgress: false,
      isUnregistered: true,
    });
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
        const courseGroups = parseRequiredCourseGroups(subcategory.courseIds ?? []);
        const requiredMatches = matchRequiredCourseGroups(
          courseGroups,
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

        const requiredCredits = requiredMatches.reduce((sum, m) => sum + m.credits, 0);
        const isSatisfied = requiredMatches.every((m) => m.isPassed || m.isInProgress);

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
