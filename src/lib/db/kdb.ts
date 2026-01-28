import type { Course, KdbCourse } from "~/types";
import { convertKdbCourse } from "~/types";
import { db } from "./index";
import { deleteSetting, getSetting, SettingKeys, setSetting } from "./settings";

const KDB_URL = "https://raw.githubusercontent.com/s7tya/kdb-crawler/master/dist/kdb.json";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24時間

// kdbキャッシュの年齢を取得（ミリ秒）
export async function getKdbCacheAge(): Promise<number> {
  const cachedAt = await getSetting<string>(SettingKeys.KDB_CACHED_AT);
  if (!cachedAt) return Infinity;
  return Date.now() - new Date(cachedAt).getTime();
}

// キャッシュが有効か確認
export async function isKdbCacheValid(): Promise<boolean> {
  const age = await getKdbCacheAge();
  return age < CACHE_DURATION;
}

// kdbデータをキャッシュから取得
export async function getCachedKdb(): Promise<Course[]> {
  return db.kdbCache.toArray();
}

// kdbキャッシュを更新
export async function refreshKdbCache(): Promise<void> {
  try {
    const response = await fetch(KDB_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch kdb: ${response.status}`);
    }

    const kdbData: KdbCourse[] = await response.json();
    const now = new Date().toISOString();

    // 内部形式に変換
    const courses: Course[] = kdbData.map((kdb) => ({
      ...convertKdbCourse(kdb),
      cachedAt: now,
    }));

    // トランザクションで一括更新
    await db.transaction("rw", db.kdbCache, async () => {
      await db.kdbCache.clear();
      await db.kdbCache.bulkAdd(courses);
    });

    await setSetting(SettingKeys.KDB_CACHED_AT, now);
    console.log(`kdb cache updated: ${courses.length} courses`);
  } catch (error) {
    console.error("Failed to refresh kdb cache:", error);
    throw error;
  }
}

// キャッシュがなければ自動更新
export async function ensureKdbCache(): Promise<void> {
  const count = await db.kdbCache.count();
  if (count === 0) {
    await refreshKdbCache();
  }
}

// 科目を検索
export async function searchKdb(query: string): Promise<Course[]> {
  return searchKdbWithRelatedName(query);
}

export async function searchKdbWithRelatedName(
  query: string,
  relatedCourseId?: string,
): Promise<Course[]> {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery && !relatedCourseId) return [];

  await ensureKdbCache();

  let allCourses: Course[] | null = null;
  let relatedCourses: Course[] = [];
  if (relatedCourseId) {
    const relatedCourse = await db.kdbCache.get(relatedCourseId.toUpperCase());
    if (relatedCourse) {
      allCourses = await db.kdbCache.toArray();
      relatedCourses = allCourses.filter((course) => course.name === relatedCourse.name);
    }
  }

  let results: Course[] = [];
  if (normalizedQuery) {
    const exactMatch = await db.kdbCache.get(normalizedQuery.toUpperCase());
    if (exactMatch) {
      results = [exactMatch];
    } else {
      if (!allCourses) {
        allCourses = await db.kdbCache.toArray();
      }
      results = allCourses.filter(
        (course) =>
          course.id.toLowerCase().includes(normalizedQuery) ||
          course.name.toLowerCase().includes(normalizedQuery),
      );
      results = results.slice(0, 50);
    }
  }

  const seen = new Set<string>();
  const merged: Course[] = [];
  const pushUnique = (course: Course) => {
    if (seen.has(course.id)) return;
    seen.add(course.id);
    merged.push(course);
  };

  for (const course of relatedCourses) {
    pushUnique(course);
  }
  for (const course of results) {
    pushUnique(course);
  }

  return merged;
}

// 科目番号で取得
export async function getCourseById(courseId: string): Promise<Course | undefined> {
  await ensureKdbCache();
  return db.kdbCache.get(courseId);
}

// 複数の科目番号で取得
export async function getCoursesByIds(courseIds: string[]): Promise<Course[]> {
  await ensureKdbCache();
  return db.kdbCache.where("id").anyOf(courseIds).toArray();
}

// kdbキャッシュの統計
export async function getKdbStats(): Promise<{
  count: number;
  cachedAt: string | null;
  isValid: boolean;
}> {
  const count = await db.kdbCache.count();
  const cachedAt = await getSetting<string>(SettingKeys.KDB_CACHED_AT);
  const isValid = await isKdbCacheValid();

  return {
    count,
    cachedAt: cachedAt || null,
    isValid,
  };
}

export async function clearKdbCache(): Promise<void> {
  await db.kdbCache.clear();
  await deleteSetting(SettingKeys.KDB_CACHED_AT);
}
