import type {
  CategoryStatus,
  Course,
  ExcludeRules,
  GraduationRequirements,
  GroupStatus,
  IncludeRules,
  MatchedCourse,
  RequirementGroup,
  RequirementStatus,
  SubcategoryStatus,
  UserCourseRecord,
} from "~/types";
import {
  type CourseTypeMasterNode,
  getCourseIdsFromCategory,
  getCourseTypeMaster,
} from "../db/courseTypeMaster";

// includeRules/excludeRules が実質的に空かどうかを判定
function isRulesEmpty(rules: IncludeRules | ExcludeRules | undefined): boolean {
  if (!rules) return true;
  const hasNames = rules.courseNames?.some((n) => n.trim() !== "");
  const hasPrefixes = rules.prefixes && rules.prefixes.length > 0;
  const hasCategories = rules.categories && rules.categories.length > 0;
  return !hasNames && !hasPrefixes && !hasCategories;
}

function splitRequiredCourseGroup(value: string): string[] {
  return value
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id);
}

function normalizeCourseName(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

type RequiredCourseExclusion = {
  courseIds: Set<string>;
  courseNames: Set<string>;
};

function buildCourseNameToIdMap(kdbMap: Map<string, Course>): Map<string, string> {
  const courseNameToIdMap = new Map<string, string>();
  for (const [courseId, course] of kdbMap.entries()) {
    const normalizedName = normalizeCourseName(course.name);
    if (normalizedName) {
      courseNameToIdMap.set(normalizedName, courseId);
    }
  }
  return courseNameToIdMap;
}

function buildRequiredCourseExclusionSet(
  requirements: GraduationRequirements,
  kdbMap: Map<string, Course>,
  courseNameToIdMap: Map<string, string>,
): RequiredCourseExclusion {
  const exclusion: RequiredCourseExclusion = {
    courseIds: new Set<string>(),
    courseNames: new Set<string>(),
  };

  for (const category of requirements.categories) {
    for (const subcategory of category.subcategories) {
      if (subcategory.type !== "required") continue;

      // groupsのincludeRulesからcourseNamesを抽出
      for (const group of subcategory.groups) {
        const courseNames = group.includeRules?.courseNames;
        if (!courseNames) continue;

        for (const rawCourse of courseNames) {
          const courseKey = rawCourse?.trim();
          if (!courseKey) continue;
          const normalizedCourseName = normalizeCourseName(courseKey);
          if (normalizedCourseName) {
            exclusion.courseNames.add(normalizedCourseName);
          }

          if (kdbMap.has(courseKey)) {
            exclusion.courseIds.add(courseKey);
            continue;
          }

          const mappedId = courseNameToIdMap.get(courseKey);
          if (mappedId) {
            exclusion.courseIds.add(mappedId);
          }
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
  const normalizedCourseName = normalizeCourseName(course.courseName);
  const isNameExcluded =
    normalizedCourseName.length > 0 && exclusion.courseNames.has(normalizedCourseName);
  return exclusion.courseIds.has(course.courseId) || isNameExcluded;
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
export async function calculateRequirementStatus(
  requirements: GraduationRequirements,
  courses: UserCourseRecord[],
  kdbCourses: Course[] = [],
): Promise<RequirementStatus> {
  // 科目区分マスターデータを取得
  let courseTypeMaster: CourseTypeMasterNode[] = [];
  try {
    courseTypeMaster = await getCourseTypeMaster();
  } catch (error) {
    console.warn("Failed to load course type master, category rules will not work:", error);
  }
  // 各科目が使用済みかどうかを追跡（同じ科目を複数カテゴリでカウントしない）
  const usedCourseIds = new Set<string>();

  // kdbキャッシュのMapを作成（科目番号→科目情報）
  const kdbMap = new Map<string, Course>();
  for (const course of kdbCourses) {
    kdbMap.set(course.id, course);
  }
  const courseNameToIdMap = buildCourseNameToIdMap(kdbMap);
  // 全必修科目番号（および科目名）を収集
  const requiredCourseExclusion = buildRequiredCourseExclusionSet(
    requirements,
    kdbMap,
    courseNameToIdMap,
  );

  const categoryStatuses: CategoryStatus[] = requirements.categories.map((category) => {
    const subcategoryStatuses: SubcategoryStatus[] = category.subcategories.map((subcategory) => {
      const groupStatuses: GroupStatus[] = [];
      const matchedCourses: MatchedCourse[] = [];

      if (subcategory.type === "required") {
        // 各グループを処理
        for (const group of subcategory.groups) {
          // courseNames の処理（未履修表示のため別処理が必要）
          const courseNames = group.includeRules?.courseNames;
          if (courseNames && courseNames.length > 0) {
            const courseGroups: string[][] = [];
            for (const courseName of courseNames) {
              const parsedGroup = splitRequiredCourseGroup(courseName);
              if (parsedGroup.length > 0) {
                courseGroups.push(parsedGroup);
              }
            }
            const requiredMatches = matchRequiredCourseGroups(
              courseGroups,
              courses,
              usedCourseIds,
              kdbMap,
            );
            matchedCourses.push(...requiredMatches);
          }

          // categories / prefixes の処理（courseNamesを除外したルールで実行）
          const hasCategoriesOrPrefixes =
            (group.includeRules?.categories && group.includeRules.categories.length > 0) ||
            (group.includeRules?.prefixes && group.includeRules.prefixes.length > 0);

          if (hasCategoriesOrPrefixes) {
            const nonCourseRules: IncludeRules = {
              prefixes: group.includeRules?.prefixes,
              categories: group.includeRules?.categories,
            };
            const tempGroup = { ...group, includeRules: nonCourseRules };
            const groupMatches = matchCoursesToGroup(
              courses,
              tempGroup,
              usedCourseIds,
              requiredCourseExclusion,
              courseTypeMaster,
              courseNameToIdMap,
            );
            matchedCourses.push(...groupMatches);
          }
        }

        const earnedCredits = matchedCourses
          .filter((m) => m.isPassed)
          .reduce((sum, m) => sum + m.credits, 0);

        const inProgressCredits = matchedCourses
          .filter((m) => m.isInProgress)
          .reduce((sum, m) => sum + m.credits, 0);

        const totalRequiredCredits = matchedCourses.reduce((sum, m) => sum + m.credits, 0);

        const isSatisfied = matchedCourses.every((m) => m.isPassed || m.isInProgress);

        return {
          subcategoryId: subcategory.id,
          subcategoryType: subcategory.type,
          earnedCredits,
          inProgressCredits,
          requiredCredits: totalRequiredCredits,
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
          courseTypeMaster,
          courseNameToIdMap,
        );

        const earnedCredits = groupMatches
          .filter((m) => m.isPassed)
          .reduce((sum, m) => sum + m.credits, 0);

        const inProgressCredits = groupMatches
          .filter((m) => m.isInProgress)
          .reduce((sum, m) => sum + m.credits, 0);

        const minCredits = group.minCredits ?? 0;
        const isSatisfied =
          earnedCredits >= minCredits &&
          (group.maxCredits === undefined || earnedCredits <= group.maxCredits);

        groupStatuses.push({
          groupId: group.id,
          isSatisfied,
          earnedCredits,
          inProgressCredits,
          requiredCredits: minCredits,
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
  courseTypeMaster: CourseTypeMasterNode[],
  courseNameToIdMap: Map<string, string>,
): MatchedCourse[] {
  const matches: MatchedCourse[] = [];

  for (const course of courses) {
    // 既に使用済みの科目はスキップ
    if (usedCourseIds.has(course.id)) continue;
    if (isCourseExcludedByRequirements(course, excludedCourseIds)) continue;

    // Step 1: includeRulesが設定されている場合はホワイトリスト方式でチェック
    // 未設定または空の場合は全科目を対象（ブラックリスト方式）
    if (group.includeRules && !isRulesEmpty(group.includeRules)) {
      const isIncluded = matchCourseToRules(
        course,
        group.includeRules,
        courseTypeMaster,
        courseNameToIdMap,
      );
      if (!isIncluded) continue;
    }

    // Step 2: excludeRulesのいずれかにマッチするか（除外）
    if (group.excludeRules) {
      const isExcluded = matchCourseToRules(
        course,
        group.excludeRules,
        courseTypeMaster,
        courseNameToIdMap,
      );
      if (isExcluded) continue;
    }

    // マッチ成功
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

  return matches;
}

// 科目がルールオブジェクトにマッチするかチェック
function matchCourseToRules(
  course: UserCourseRecord,
  rules: IncludeRules | ExcludeRules,
  courseTypeMaster: CourseTypeMasterNode[],
  courseNameToIdMap: Map<string, string>,
): boolean {
  // courseNames チェック
  if (rules.courseNames) {
    const normalizedCourseName = normalizeCourseName(course.courseName);
    for (const rawValue of rules.courseNames) {
      const specificKey = rawValue?.trim();
      if (!specificKey) continue;
      if (course.courseId === specificKey) return true;
      if (course.courseName === specificKey) return true;
      const normalizedSpecificKey = normalizeCourseName(specificKey);
      if (normalizedSpecificKey && normalizedSpecificKey === normalizedCourseName) return true;
      const mappedId = courseNameToIdMap.get(normalizedSpecificKey);
      if (mappedId && course.courseId === mappedId) return true;
    }
  }

  // prefixes チェック
  if (rules.prefixes) {
    if (rules.prefixes.some((prefix) => course.courseId.startsWith(prefix))) return true;
  }

  // categories チェック
  if (rules.categories) {
    for (const cat of rules.categories) {
      const categoryCourseIds = getCourseIdsFromCategory(
        courseTypeMaster,
        cat.majorCategory,
        cat.middleCategory,
        cat.minorCategory,
      );
      if (categoryCourseIds.some((id) => course.courseId.startsWith(id))) return true;
    }
  }

  return false;
}
