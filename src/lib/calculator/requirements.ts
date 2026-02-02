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

// サブカテゴリ内の全グループのexcludeRules.courseNamesを収集
// これにより、後のグループで除外指定された科目が、前のグループでマッチするのを防ぐ
function collectSubcategoryExcludedCourseNames(groups: RequirementGroup[]): Set<string> {
  const excludedNames = new Set<string>();
  for (const group of groups) {
    if (group.excludeRules?.courseNames) {
      for (const name of group.excludeRules.courseNames) {
        const normalized = normalizeCourseName(name);
        if (normalized) {
          excludedNames.add(normalized);
        }
      }
    }
  }
  return excludedNames;
}

// 全要件からincludeRules.courseNamesで明示的に指定された科目名を収集
// これらの科目はprefix/categoriesでのマッチでは使用せず、courseNamesでの明示的なマッチでのみ使用可能
function collectExplicitlyIncludedCourseNames(requirements: GraduationRequirements): Set<string> {
  const explicitNames = new Set<string>();
  for (const category of requirements.categories) {
    for (const subcategory of category.subcategories) {
      for (const group of subcategory.groups) {
        if (group.includeRules?.courseNames) {
          for (const name of group.includeRules.courseNames) {
            const normalized = normalizeCourseName(name);
            if (normalized) {
              explicitNames.add(normalized);
            }
          }
        }
      }
    }
  }
  return explicitNames;
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

/**
 * サブカテゴリの最大単位数に合わせてマッチ結果を上限内に絞り込む
 * @param matches マッチした科目一覧
 * @param maxCredits サブカテゴリの最大単位数
 * @returns 上限内に収まった科目と除外された科目
 */
function limitMatchedCoursesByMaxCredits(
  matches: MatchedCourse[],
  maxCredits: number | undefined,
): { kept: MatchedCourse[]; dropped: MatchedCourse[]; remainingCredits: number | undefined } {
  if (maxCredits === undefined) {
    return { kept: matches, dropped: [], remainingCredits: undefined };
  }

  const kept: MatchedCourse[] = [];
  const dropped: MatchedCourse[] = [];
  let remainingCredits = maxCredits;

  for (const match of matches) {
    const countableCredits = match.isPassed ? match.credits : 0;
    if (countableCredits > 0 && remainingCredits <= 0) {
      dropped.push(match);
      continue;
    }
    if (countableCredits > remainingCredits) {
      dropped.push(match);
      continue;
    }
    kept.push(match);
    remainingCredits -= countableCredits;
  }

  return { kept, dropped, remainingCredits };
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
  const invalidCourses: MatchedCourse[] = [];
  // 全必修科目番号（および科目名）を収集
  const requiredCourseExclusion = buildRequiredCourseExclusionSet(
    requirements,
    kdbMap,
    courseNameToIdMap,
  );

  // 全要件から明示的にcourseNamesで指定された科目名を収集
  // これらの科目はprefix/categoriesでのマッチでは使用せず、courseNamesでの明示的なマッチでのみ使用
  const explicitlyIncludedCourseNames = collectExplicitlyIncludedCourseNames(requirements);

  const categoryStatuses: CategoryStatus[] = requirements.categories.map((category) => {
    const subcategoryStatuses: SubcategoryStatus[] = category.subcategories.map((subcategory) => {
      const groupStatuses: GroupStatus[] = [];
      const matchedCourses: MatchedCourse[] = [];

      if (subcategory.type === "required") {
        // 各グループを処理
        for (const group of subcategory.groups) {
          const groupMatches: MatchedCourse[] = [];
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
            groupMatches.push(...requiredMatches);
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
            const groupCourseMatches = matchCoursesToGroup(
              courses,
              tempGroup,
              usedCourseIds,
              requiredCourseExclusion,
              courseTypeMaster,
              courseNameToIdMap,
              undefined,
              explicitlyIncludedCourseNames,
            );
            groupMatches.push(...groupCourseMatches);
          }

          const earnedCredits = groupMatches
            .filter((m) => m.isPassed)
            .reduce((sum, m) => sum + m.credits, 0);

          const inProgressCredits = groupMatches
            .filter((m) => m.isInProgress)
            .reduce((sum, m) => sum + m.credits, 0);

          const fallbackRequiredCredits = groupMatches.reduce((sum, m) => sum + m.credits, 0);
          const requiredCredits = group.requiredCredits ?? fallbackRequiredCredits;

          const isSatisfied =
            group.requiredCredits !== undefined
              ? earnedCredits + inProgressCredits >= group.requiredCredits
              : groupMatches.every((m) => m.isPassed || m.isInProgress);

          groupStatuses.push({
            groupId: group.id,
            isSatisfied,
            earnedCredits,
            inProgressCredits,
            requiredCredits,
            maxCredits: undefined,
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

        const totalRequiredCredits =
          groupStatuses.length > 0
            ? groupStatuses.reduce((sum, group) => sum + group.requiredCredits, 0)
            : matchedCourses.reduce((sum, m) => sum + m.credits, 0);

        const isSatisfied =
          groupStatuses.length > 0
            ? groupStatuses.every((group) => group.isSatisfied)
            : matchedCourses.every((m) => m.isPassed || m.isInProgress);

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

      let remainingMaxCredits = subcategory.maxCredits;

      // サブカテゴリ内の全グループのexcludeRules.courseNamesを事前収集
      // これにより、後のグループで除外指定された科目が、前のグループでマッチするのを防ぐ
      const subcategoryExcludedCourseNames = collectSubcategoryExcludedCourseNames(
        subcategory.groups,
      );

      // courseNamesで明示的に科目を指定したグループを先に処理し、それ以外は元の順序を維持
      // これにより、明示的に指定された科目がサブカテゴリの単位上限の予算を優先的に使える
      const processingOrder = subcategory.groups
        .map((group, index) => ({ group, index }))
        .sort((a, b) => {
          const aHasCourseNames =
            a.group.includeRules?.courseNames?.some((n) => n.trim() !== "") ?? false;
          const bHasCourseNames =
            b.group.includeRules?.courseNames?.some((n) => n.trim() !== "") ?? false;
          if (aHasCourseNames && !bHasCourseNames) return -1;
          if (!aHasCourseNames && bHasCourseNames) return 1;
          return 0;
        });

      const groupResultMap = new Map<
        number,
        { status: GroupStatus; keptCourses: MatchedCourse[] }
      >();

      for (const { group, index } of processingOrder) {
        const groupMatches = matchCoursesToGroup(
          courses,
          group,
          usedCourseIds,
          requiredCourseExclusion,
          courseTypeMaster,
          courseNameToIdMap,
          subcategoryExcludedCourseNames,
          explicitlyIncludedCourseNames,
        );

        const limitedMatches = limitMatchedCoursesByMaxCredits(groupMatches, remainingMaxCredits);

        remainingMaxCredits = limitedMatches.remainingCredits;
        invalidCourses.push(...limitedMatches.dropped);

        const earnedCredits = limitedMatches.kept
          .filter((m) => m.isPassed)
          .reduce((sum, m) => sum + m.credits, 0);

        const inProgressCredits = limitedMatches.kept
          .filter((m) => m.isInProgress)
          .reduce((sum, m) => sum + m.credits, 0);

        const minCredits = group.minCredits ?? 0;
        const isSatisfied =
          earnedCredits >= minCredits &&
          (group.maxCredits === undefined || earnedCredits <= group.maxCredits);

        groupResultMap.set(index, {
          status: {
            groupId: group.id,
            isSatisfied,
            earnedCredits,
            inProgressCredits,
            requiredCredits: minCredits,
            maxCredits: group.maxCredits,
            matchedCourses: limitedMatches.kept,
          },
          keptCourses: limitedMatches.kept,
        });
      }

      // 元のグループ順序で結果を再構成（UI表示用）
      for (let i = 0; i < subcategory.groups.length; i++) {
        const result = groupResultMap.get(i);
        if (result) {
          groupStatuses.push(result.status);
          matchedCourses.push(...result.keptCourses);
        }
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

  const unmatchedCourses: MatchedCourse[] = [
    ...invalidCourses,
    ...courses
      .filter((course) => !usedCourseIds.has(course.id))
      .map((course) => ({
        courseId: course.courseId,
        courseName: course.courseName,
        credits: course.credits,
        grade: course.grade,
        isPassed: course.isPassed,
        isInProgress: course.isInProgress,
      })),
  ];

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
  subcategoryExcludedCourseNames?: Set<string>,
  explicitlyIncludedCourseNames?: Set<string>,
): MatchedCourse[] {
  const matches: MatchedCourse[] = [];

  for (const course of courses) {
    const normalizedCourseName = normalizeCourseName(course.courseName);

    // 既に使用済みの科目はスキップ
    if (usedCourseIds.has(course.id)) {
      continue;
    }
    if (isCourseExcludedByRequirements(course, excludedCourseIds)) {
      continue;
    }

    // Step 0: サブカテゴリ全体で除外指定された科目名をチェック
    // ただし、このグループのincludeRules.courseNamesで明示的に指定されている場合は除外しない
    if (subcategoryExcludedCourseNames && subcategoryExcludedCourseNames.size > 0) {
      if (subcategoryExcludedCourseNames.has(normalizedCourseName)) {
        // このグループのincludeRules.courseNamesに含まれていれば除外しない
        const isExplicitlyIncluded = group.includeRules?.courseNames?.some(
          (name) => normalizeCourseName(name) === normalizedCourseName,
        );
        if (!isExplicitlyIncluded) {
          continue;
        }
      }
    }

    // Step 0.5: 全要件のどこかでcourseNamesで明示的に指定されている科目は、
    // このグループのcourseNamesで指定されていない限りスキップ
    // これにより、prefix/categoriesでのマッチを防ぎ、明示的に指定されたグループでのみ使用される
    if (explicitlyIncludedCourseNames && explicitlyIncludedCourseNames.size > 0) {
      if (explicitlyIncludedCourseNames.has(normalizedCourseName)) {
        const isIncludedInThisGroup = group.includeRules?.courseNames?.some(
          (name) => normalizeCourseName(name) === normalizedCourseName,
        );
        if (!isIncludedInThisGroup) {
          continue;
        }
      }
    }

    // Step 1: includeRulesが設定されている場合はホワイトリスト方式でチェック
    // 未設定または空の場合は全科目を対象（ブラックリスト方式）
    if (group.includeRules && !isRulesEmpty(group.includeRules)) {
      const isIncluded = matchCourseToRules(
        course,
        group.includeRules,
        courseTypeMaster,
        courseNameToIdMap,
      );
      if (!isIncluded) {
        continue;
      }
    }

    // Step 2: excludeRulesのいずれかにマッチするか（除外）
    if (group.excludeRules) {
      const isExcluded = matchCourseToRules(
        course,
        group.excludeRules,
        courseTypeMaster,
        courseNameToIdMap,
      );
      if (isExcluded) {
        continue;
      }
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
