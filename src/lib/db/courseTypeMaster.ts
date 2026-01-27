import { db } from "./index";

const MASTER_DATA_URL =
  "https://raw.githubusercontent.com/Make-IT-TSUKUBA/alternative-tsukuba-kdb/refs/heads/main/frontend/src/kdb/code-types-undergrad.json";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CourseTypeMasterNode {
  name: string;
  children: (CourseTypeMasterNode | string)[];
}

/**
 * 科目区分マスターデータを取得（キャッシュから、または外部から）
 */
export async function getCourseTypeMaster(): Promise<CourseTypeMasterNode[]> {
  const cached = await db.courseTypeMaster.get("master");

  if (cached) {
    const cachedAt = new Date(cached.cachedAt);
    const now = new Date();
    const age = now.getTime() - cachedAt.getTime();

    if (age < CACHE_DURATION_MS) {
      return cached.data as CourseTypeMasterNode[];
    }
  }

  // キャッシュが古いか存在しないので、外部から取得
  return await refreshCourseTypeMaster();
}

/**
 * 科目区分マスターデータを外部から再取得してキャッシュを更新
 */
export async function refreshCourseTypeMaster(): Promise<CourseTypeMasterNode[]> {
  try {
    const response = await fetch(MASTER_DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch master data: ${response.status}`);
    }

    const data = await response.json();

    await db.courseTypeMaster.put({
      id: "master",
      data,
      cachedAt: new Date().toISOString(),
    });

    return data;
  } catch (error) {
    console.error("Failed to refresh course type master:", error);

    // フォールバック: キャッシュが存在すれば古くても返す
    const cached = await db.courseTypeMaster.get("master");
    if (cached) {
      return cached.data as CourseTypeMasterNode[];
    }

    throw error;
  }
}

/**
 * 指定されたカテゴリ階層に該当する科目番号のリストを取得
 */
export function getCourseIdsFromCategory(
  master: CourseTypeMasterNode[],
  majorCategory: string,
  middleCategory?: string,
  minorCategory?: string,
): string[] {
  const courseIds: string[] = [];

  // 大項目を探す
  const majorNode = master.find((node) => node.name === majorCategory);
  if (!majorNode) {
    return courseIds;
  }

  // 中項目が指定されていない場合、大項目配下すべてを収集
  if (!middleCategory) {
    collectCourseIds(majorNode.children, courseIds);
    return courseIds;
  }

  // 中項目を探す
  const middleNode = majorNode.children.find(
    (child): child is CourseTypeMasterNode =>
      typeof child !== "string" && child.name === middleCategory,
  );
  if (!middleNode) {
    return courseIds;
  }

  // 小項目が指定されていない場合、中項目配下すべてを収集
  if (!minorCategory) {
    collectCourseIds(middleNode.children, courseIds);
    return courseIds;
  }

  // 小項目を探す
  const minorNode = middleNode.children.find(
    (child): child is CourseTypeMasterNode =>
      typeof child !== "string" && child.name === minorCategory,
  );
  if (!minorNode) {
    return courseIds;
  }

  // 小項目配下の科目番号を収集
  collectCourseIds(minorNode.children, courseIds);
  return courseIds;
}

/**
 * 再帰的に科目番号を収集するヘルパー関数
 */
function collectCourseIds(children: (CourseTypeMasterNode | string)[], courseIds: string[]): void {
  for (const child of children) {
    if (typeof child === "string") {
      courseIds.push(child);
    } else {
      collectCourseIds(child.children, courseIds);
    }
  }
}

/**
 * マスターデータから大項目のリストを取得
 */
export function getMajorCategories(master: CourseTypeMasterNode[]): string[] {
  return master.map((node) => node.name);
}

/**
 * マスターデータから指定された大項目の中項目リストを取得
 */
export function getMiddleCategories(
  master: CourseTypeMasterNode[],
  majorCategory: string,
): string[] {
  const majorNode = master.find((node) => node.name === majorCategory);
  if (!majorNode) {
    return [];
  }

  return majorNode.children
    .filter((child): child is CourseTypeMasterNode => typeof child !== "string")
    .map((node) => node.name);
}

/**
 * マスターデータから指定された大項目・中項目の小項目リストを取得
 */
export function getMinorCategories(
  master: CourseTypeMasterNode[],
  majorCategory: string,
  middleCategory: string,
): string[] {
  const majorNode = master.find((node) => node.name === majorCategory);
  if (!majorNode) {
    return [];
  }

  const middleNode = majorNode.children.find(
    (child): child is CourseTypeMasterNode =>
      typeof child !== "string" && child.name === middleCategory,
  );
  if (!middleNode) {
    return [];
  }

  return middleNode.children
    .filter((child): child is CourseTypeMasterNode => typeof child !== "string")
    .map((node) => node.name);
}
