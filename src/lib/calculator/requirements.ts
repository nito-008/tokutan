import type {
  CategoryStatus,
  GraduationRequirements,
  GroupRule,
  GroupStatus,
  MatchedCourse,
  RequirementGroup,
  RequirementStatus,
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

type RequiredCourseExclusion = {
  courseIds: Set<string>;
  courseNames: Set<string>;
};

function buildRequiredCourseExclusionSet(
  requirements: GraduationRequirements,
  kdbMap: Map<string, Course>,
): RequiredCourseExclusion {
  const exclusion: RequiredCourseExclusion = {
    courseIds: new Set<string>(),
    courseNames: new Set<string>(),
  };

  const nameToId = new Map<string, string>();
  for (const [courseId, course] of kdbMap.entries()) {
    const name = course.name?.trim();
    if (name) {
      nameToId.set(name, courseId);
    }
  }

  for (const category of requirements.categories) {
    for (const subcategory of category.subcategories) {
      if (subcategory.type !== "required") continue;
      for (const rawCourse of subcategory.courseIds ?? []) {
        const courseKey = rawCourse?.trim();
        if (!courseKey) continue;
        exclusion.courseNames.add(courseKey);

        if (kdbMap.has(courseKey)) {
          exclusion.courseIds.add(courseKey);
          continue;
        }

        const mappedId = nameToId.get(courseKey);
        if (mappedId) {
          exclusion.courseIds.add(mappedId);
        }
      }
    }
  }

  return exclusion;
}

function isCourseExcludedByRequirements(
  course: UserCourseRecord,
  exclusion: RequiredCourseExclusion,
): boolean {
  return exclusion.courseIds.has(course.courseId) || exclusion.courseNames.has(course.courseName);
}

function matchRequiredCourseGroups(
  courseGroups: string[][],
  courses: UserCourseRecord[],
  usedCourseIds: Set<string>,
  _kdbMap: Map<string, Course>,
): MatchedCourse[] {
  const matches: MatchedCourse[] = [];
  const coursesByName = new Map<string, UserCourseRecord[]>();

  for (const course of courses) {
    const list = coursesByName.get(course.courseName);
    if (list) {
      list.push(course);
    } else {
      coursesByName.set(course.courseName, [course]);
    }
  }

  for (const group of courseGroups) {
    const primaryCourseName = group[0];
    if (!primaryCourseName) continue;
    let selected: UserCourseRecord | null = null;

    for (const courseName of group) {
      const records = coursesByName.get(courseName);
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

    // 未履修の場合、科目名を表示（courseIdは空文字）
    matches.push({
      courseId: "",
      courseName: primaryCourseName,
      credits: 2, // デフォルト単位数
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

  // kdbキャッシュのMapを作成（科目番号→科目情報）
  const kdbMap = new Map<string, Course>();
  for (const course of kdbCourses) {
    kdbMap.set(course.id, course);
  }
  // 全必修科目番号（および科目名）を収集
  const requiredCourseExclusion = buildRequiredCourseExclusionSet(requirements, kdbMap);

  const categoryStatuses: CategoryStatus[] = requirements.categories.map((category) => {
    const subcategoryStatuses: SubcategoryStatus[] = category.subcategories.map((subcategory) => {
      const groupStatuses: GroupStatus[] = [];
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
          subcategoryType: subcategory.type,
          earnedCredits,
          inProgressCredits,
          requiredCredits,
          maxCredits: undefined,
          isSatisfied,
          groupStatuses,
          matchedCourses,
        };
      }

      for (const group of subcategory.groups) {
        const groupMatches = matchCoursesToGroup(
          courses,
          group,
          usedCourseIds,
          requiredCourseExclusion,
        );

        const earnedCredits = groupMatches
          .filter((m) => m.isPassed)
          .reduce((sum, m) => sum + m.credits, 0);

        const inProgressCredits = groupMatches
          .filter((m) => m.isInProgress)
          .reduce((sum, m) => sum + m.credits, 0);

        const isSatisfied =
          earnedCredits >= group.minCredits &&
          (group.maxCredits === undefined || earnedCredits <= group.maxCredits);

        groupStatuses.push({
          groupId: group.id,
          isSatisfied,
          earnedCredits,
          inProgressCredits,
          requiredCredits: group.minCredits,
          maxCredits: group.maxCredits,
          matchedCourses: groupMatches,
        });

        matchedCourses.push(...groupMatches);
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
        subcategoryType: subcategory.type,
        earnedCredits,
        inProgressCredits,
        requiredCredits: subcategory.minCredits,
        maxCredits: subcategory.maxCredits,
        isSatisfied,
        groupStatuses,
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

  const unmatchedCourses: MatchedCourse[] = courses
    .filter((course) => !usedCourseIds.has(course.id))
    .map((course) => ({
      courseId: course.courseId,
      courseName: course.courseName,
      credits: course.credits,
      grade: course.grade,
      isPassed: course.isPassed,
      isInProgress: course.isInProgress,
    }));

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
    unmatchedCourses,
    calculatedAt: new Date().toISOString(),
  };
}

// 科目をグループにマッチング
function matchCoursesToGroup(
  courses: UserCourseRecord[],
  group: RequirementGroup,
  usedCourseIds: Set<string>,
  excludedCourseIds: RequiredCourseExclusion,
): MatchedCourse[] {
  const matches: MatchedCourse[] = [];
  const groupExcludedCourseIds = new Set<string>();
  for (const rule of group.rules) {
    if (rule.type !== "exclude") continue;
    for (const courseId of rule.courseIds) {
      if (!courseId) continue;
      groupExcludedCourseIds.add(courseId);
    }
  }

  for (const course of courses) {
    // 既に使用済みの科目はスキップ
    if (usedCourseIds.has(course.id)) continue;
    if (groupExcludedCourseIds.has(course.courseId)) continue;
    if (isCourseExcludedByRequirements(course, excludedCourseIds)) continue;

    let isMatch = false;

    // グループ内のいずれかのルールにマッチするかチェック
    for (const rule of group.rules) {
      if (rule.type === "exclude") continue;
      if (matchCourseToRule(course, rule, excludedCourseIds)) {
        isMatch = true;
        break;
      }
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

// 科目が単一ルールにマッチするかチェック
function matchCourseToRule(
  course: UserCourseRecord,
  rule: GroupRule,
  excludedCourseIds: RequiredCourseExclusion,
): boolean {
  if (isCourseExcludedByRequirements(course, excludedCourseIds)) return false;
  switch (rule.type) {
    case "exclude":
      return false;
    case "specific":
      return rule.courseIds.includes(course.courseId);

    case "prefix":
      // 必修科目として定義されているものは除外
      if (excludedCourseIds.courseIds.has(course.courseId)) {
        return false;
      }
      return course.courseId.startsWith(rule.prefix);
  }
}
