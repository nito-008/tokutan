# Phase 3: 履修管理機能 - 詳細実装ガイド

## 3.1 kdbデータ取得・キャッシュ

### src/lib/db/kdb.ts

```typescript
import { db } from './index';
import type { Course, KdbCourse } from '../types';
import { convertKdbCourse } from '../types';
import { getSetting, setSetting } from './settings';

const KDB_URL = 'https://raw.githubusercontent.com/s7tya/kdb-crawler/master/dist/kdb.json';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24時間

// kdbキャッシュの年齢を取得（ミリ秒）
export async function getKdbCacheAge(): Promise<number> {
  const cachedAt = await getSetting<string>('kdbCachedAt');
  if (!cachedAt) return Infinity;
  return Date.now() - new Date(cachedAt).getTime();
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
    const courses: Course[] = kdbData.map(kdb => ({
      ...convertKdbCourse(kdb),
      cachedAt: now
    }));

    // トランザクションで一括更新
    await db.transaction('rw', db.kdbCache, async () => {
      await db.kdbCache.clear();
      await db.kdbCache.bulkAdd(courses);
    });

    await setSetting('kdbCachedAt', now);
    console.log(`kdb cache updated: ${courses.length} courses`);
  } catch (error) {
    console.error('Failed to refresh kdb cache:', error);
    throw error;
  }
}

// 科目を検索
export async function searchKdb(query: string): Promise<Course[]> {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) return [];

  // キャッシュがなければ更新
  const count = await db.kdbCache.count();
  if (count === 0) {
    await refreshKdbCache();
  }

  // 科目番号で完全一致検索
  const exactMatch = await db.kdbCache.get(normalizedQuery.toUpperCase());
  if (exactMatch) {
    return [exactMatch];
  }

  // 部分一致検索（科目番号または科目名）
  const allCourses = await db.kdbCache.toArray();
  const results = allCourses.filter(course =>
    course.id.toLowerCase().includes(normalizedQuery) ||
    course.name.toLowerCase().includes(normalizedQuery)
  );

  // 最大50件まで返す
  return results.slice(0, 50);
}

// 科目番号で取得
export async function getCourseById(courseId: string): Promise<Course | undefined> {
  return db.kdbCache.get(courseId);
}

// 複数の科目番号で取得
export async function getCoursesByIds(courseIds: string[]): Promise<Course[]> {
  return db.kdbCache.where('id').anyOf(courseIds).toArray();
}
```

### src/lib/db/coursePlans.ts

```typescript
import { db } from './index';
import type { CoursePlan, SemesterPlan, PlannedCourse } from '../types';

export async function getCoursePlan(profileId: string): Promise<CoursePlan | undefined> {
  return db.coursePlans.where('profileId').equals(profileId).first();
}

export async function saveCoursePlan(plan: CoursePlan): Promise<string> {
  const now = new Date().toISOString();
  const data = {
    ...plan,
    updatedAt: now,
    createdAt: plan.createdAt || now
  };
  await db.coursePlans.put(data);
  return data.id;
}

export async function createDefaultCoursePlan(profileId: string, enrollmentYear: number): Promise<CoursePlan> {
  const now = new Date().toISOString();

  // 4年分の空の学期プランを作成
  const plans: SemesterPlan[] = [];
  for (let i = 0; i < 4; i++) {
    const year = enrollmentYear + i;
    plans.push({ year, semester: 'spring', courses: [] });
    plans.push({ year, semester: 'fall', courses: [] });
  }

  const plan: CoursePlan = {
    id: `plan-${profileId}`,
    profileId,
    plans,
    createdAt: now,
    updatedAt: now
  };

  await db.coursePlans.add(plan);
  return plan;
}

export async function addCourseToSemester(
  profileId: string,
  year: number,
  semester: 'spring' | 'fall',
  course: PlannedCourse
): Promise<void> {
  const plan = await getCoursePlan(profileId);
  if (!plan) return;

  const semesterPlan = plan.plans.find(p => p.year === year && p.semester === semester);
  if (!semesterPlan) return;

  semesterPlan.courses.push(course);
  await saveCoursePlan(plan);
}

export async function removeCourseFromSemester(
  profileId: string,
  year: number,
  semester: 'spring' | 'fall',
  courseId: string
): Promise<void> {
  const plan = await getCoursePlan(profileId);
  if (!plan) return;

  const semesterPlan = plan.plans.find(p => p.year === year && p.semester === semester);
  if (!semesterPlan) return;

  semesterPlan.courses = semesterPlan.courses.filter(c => c.courseId !== courseId);
  await saveCoursePlan(plan);
}

export async function updateCourseInPlan(
  profileId: string,
  year: number,
  semester: 'spring' | 'fall',
  courseId: string,
  updates: Partial<PlannedCourse>
): Promise<void> {
  const plan = await getCoursePlan(profileId);
  if (!plan) return;

  const semesterPlan = plan.plans.find(p => p.year === year && p.semester === semester);
  if (!semesterPlan) return;

  const course = semesterPlan.courses.find(c => c.courseId === courseId);
  if (!course) return;

  Object.assign(course, updates);
  await saveCoursePlan(plan);
}
```

## 3.2 学期ビューの実装

### src/components/course/SemesterView.tsx

```typescript
import { Component, For, Show, createSignal } from 'solid-js';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { CourseCard } from './CourseCard';
import { CourseSearchDialog } from './CourseSearchDialog';
import type { SemesterPlan, PlannedCourse, UserCourseRecord } from '~/lib/types';

interface SemesterViewProps {
  plan: SemesterPlan;
  enrolledCourses: UserCourseRecord[];  // TWINSから読み込んだ実際の履修データ
  onAddCourse: (course: PlannedCourse) => void;
  onRemoveCourse: (courseId: string) => void;
  onUpdateCourse: (courseId: string, updates: Partial<PlannedCourse>) => void;
}

export const SemesterView: Component<SemesterViewProps> = (props) => {
  const [showSearch, setShowSearch] = createSignal(false);

  // 履修計画と実際の履修データをマージ
  const allCourses = () => {
    const plannedIds = new Set(props.plan.courses.map(c => c.courseId));
    const enrolled = props.enrolledCourses.filter(c => !plannedIds.has(c.courseId));

    // 実際の履修データを PlannedCourse 形式に変換
    const enrolledAsPlanned: PlannedCourse[] = enrolled.map(c => ({
      courseId: c.courseId,
      courseName: c.courseName,
      credits: c.credits,
      status: c.isPassed ? 'completed' as const :
              c.isInProgress ? 'enrolled' as const :
              c.grade === 'D' ? 'failed' as const : 'planned' as const,
      actualGrade: c.grade
    }));

    return [...props.plan.courses, ...enrolledAsPlanned];
  };

  // 単位数を計算
  const totalCredits = () => allCourses().reduce((sum, c) => sum + c.credits, 0);
  const earnedCredits = () => allCourses()
    .filter(c => c.status === 'completed')
    .reduce((sum, c) => sum + c.credits, 0);

  const semesterLabel = () => props.plan.semester === 'spring' ? '春学期' : '秋学期';

  const statusSummary = () => {
    const courses = allCourses();
    const completed = courses.filter(c => c.status === 'completed').length;
    const enrolled = courses.filter(c => c.status === 'enrolled').length;
    const planned = courses.filter(c => c.status === 'planned').length;

    if (enrolled > 0) return `履修中: ${totalCredits()}単位`;
    if (completed > 0 && planned === 0) return `取得: ${earnedCredits()}単位`;
    if (planned > 0) return `計画: ${totalCredits()}単位`;
    return '科目なし';
  };

  const handleAddCourse = (course: PlannedCourse) => {
    props.onAddCourse(course);
    setShowSearch(false);
  };

  return (
    <Card>
      <CardHeader class="pb-3">
        <div class="flex items-center justify-between">
          <CardTitle class="text-base">
            {props.plan.year}年度 {semesterLabel()}
          </CardTitle>
          <span class="text-sm text-muted-foreground">
            {statusSummary()}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          <For each={allCourses()}>
            {(course) => (
              <CourseCard
                course={course}
                onRemove={() => props.onRemoveCourse(course.courseId)}
                onUpdate={(updates) => props.onUpdateCourse(course.courseId, updates)}
              />
            )}
          </For>

          <Show when={allCourses().length === 0}>
            <p class="text-sm text-muted-foreground text-center py-4">
              科目がありません
            </p>
          </Show>

          <Button
            variant="outline"
            size="sm"
            class="w-full"
            onClick={() => setShowSearch(true)}
          >
            + 科目を追加
          </Button>
        </div>

        <CourseSearchDialog
          open={showSearch()}
          onClose={() => setShowSearch(false)}
          onSelect={handleAddCourse}
        />
      </CardContent>
    </Card>
  );
};
```

## 3.3 科目カードの実装

### src/components/course/CourseCard.tsx

```typescript
import { Component, Show } from 'solid-js';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import type { PlannedCourse } from '~/lib/types';

interface CourseCardProps {
  course: PlannedCourse;
  onRemove: () => void;
  onUpdate: (updates: Partial<PlannedCourse>) => void;
}

export const CourseCard: Component<CourseCardProps> = (props) => {
  const statusStyles = {
    planned: 'bg-gray-100 border-gray-200',
    enrolled: 'bg-blue-50 border-blue-200',
    completed: 'bg-green-50 border-green-200',
    failed: 'bg-red-50 border-red-200'
  };

  const gradeColors: Record<string, string> = {
    'A+': 'bg-green-500',
    'A': 'bg-lime-500',
    'B': 'bg-yellow-500',
    'C': 'bg-orange-500',
    'D': 'bg-red-500',
    'P': 'bg-purple-500',
    '認': 'bg-purple-500',
    '履修中': 'bg-blue-500'
  };

  const statusLabels = {
    planned: '計画',
    enrolled: '履修中',
    completed: '修了',
    failed: '不可'
  };

  return (
    <div class={`
      flex items-center gap-3 p-3 rounded-lg border
      ${statusStyles[props.course.status]}
    `}>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="font-medium text-sm truncate">
            {props.course.courseName}
          </span>
          <span class="text-xs text-muted-foreground">
            ({props.course.credits}単位)
          </span>
        </div>
        <div class="flex items-center gap-2 mt-1">
          <span class="text-xs text-muted-foreground">
            {props.course.courseId}
          </span>
          <Badge variant="outline" class="text-xs">
            {statusLabels[props.course.status]}
          </Badge>
          <Show when={props.course.actualGrade && props.course.actualGrade !== '-'}>
            <Badge class={`${gradeColors[props.course.actualGrade!] || 'bg-gray-500'} text-white text-xs`}>
              {props.course.actualGrade}
            </Badge>
          </Show>
        </div>
      </div>

      <Show when={props.course.status === 'planned'}>
        <Button
          variant="ghost"
          size="sm"
          class="h-8 w-8 p-0"
          onClick={props.onRemove}
        >
          ×
        </Button>
      </Show>
    </div>
  );
};
```

## 3.4 科目検索ダイアログの実装

### src/components/course/CourseSearchDialog.tsx

```typescript
import { Component, createSignal, Show, For } from 'solid-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { searchKdb } from '~/lib/db/kdb';
import type { Course, PlannedCourse } from '~/lib/types';

interface CourseSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (course: PlannedCourse) => void;
}

export const CourseSearchDialog: Component<CourseSearchDialogProps> = (props) => {
  const [query, setQuery] = createSignal('');
  const [results, setResults] = createSignal<Course[]>([]);
  const [isSearching, setIsSearching] = createSignal(false);
  const [showManual, setShowManual] = createSignal(false);

  // 手動入力用
  const [manualId, setManualId] = createSignal('');
  const [manualName, setManualName] = createSignal('');
  const [manualCredits, setManualCredits] = createSignal('2');

  let searchTimeout: number | null = null;

  const handleSearch = (value: string) => {
    setQuery(value);

    // デバウンス処理
    if (searchTimeout) clearTimeout(searchTimeout);

    if (value.length < 2) {
      setResults([]);
      return;
    }

    searchTimeout = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const found = await searchKdb(value);
        setResults(found);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelectCourse = (course: Course) => {
    props.onSelect({
      courseId: course.id,
      courseName: course.name,
      credits: course.credits,
      status: 'planned'
    });
  };

  const handleManualAdd = () => {
    if (!manualId() || !manualName()) return;

    props.onSelect({
      courseId: manualId(),
      courseName: manualName(),
      credits: parseFloat(manualCredits()) || 2,
      status: 'planned'
    });

    // リセット
    setManualId('');
    setManualName('');
    setManualCredits('2');
  };

  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent class="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>科目を追加</DialogTitle>
        </DialogHeader>

        <div class="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* 検索フォーム */}
          <Input
            placeholder="科目番号または科目名で検索..."
            value={query()}
            onInput={(e) => handleSearch(e.currentTarget.value)}
          />

          {/* 検索結果 */}
          <div class="flex-1 overflow-y-auto">
            <Show when={isSearching()}>
              <p class="text-sm text-muted-foreground text-center py-4">
                検索中...
              </p>
            </Show>

            <Show when={!isSearching() && results().length > 0}>
              <div class="space-y-2">
                <For each={results()}>
                  {(course) => (
                    <div
                      class="p-3 border rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => handleSelectCourse(course)}
                    >
                      <div class="flex items-center justify-between">
                        <span class="font-medium">{course.name}</span>
                        <span class="text-sm text-muted-foreground">
                          {course.credits}単位
                        </span>
                      </div>
                      <div class="text-xs text-muted-foreground mt-1">
                        {course.id} / {course.semester} {course.schedule}
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>

            <Show when={!isSearching() && query().length >= 2 && results().length === 0}>
              <p class="text-sm text-muted-foreground text-center py-4">
                該当する科目が見つかりません
              </p>
            </Show>
          </div>

          {/* 手動追加フォーム */}
          <div class="border-t pt-4">
            <Button
              variant="link"
              class="p-0 h-auto"
              onClick={() => setShowManual(!showManual())}
            >
              {showManual() ? '▲ 手動入力を閉じる' : '▼ 手動で追加'}
            </Button>

            <Show when={showManual()}>
              <div class="grid grid-cols-3 gap-2 mt-3">
                <div>
                  <Label class="text-xs">科目番号</Label>
                  <Input
                    placeholder="FG10784"
                    value={manualId()}
                    onInput={(e) => setManualId(e.currentTarget.value)}
                  />
                </div>
                <div class="col-span-2">
                  <Label class="text-xs">科目名</Label>
                  <Input
                    placeholder="複素解析"
                    value={manualName()}
                    onInput={(e) => setManualName(e.currentTarget.value)}
                  />
                </div>
                <div>
                  <Label class="text-xs">単位数</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={manualCredits()}
                    onInput={(e) => setManualCredits(e.currentTarget.value)}
                  />
                </div>
                <div class="col-span-2 flex items-end">
                  <Button
                    size="sm"
                    class="w-full"
                    onClick={handleManualAdd}
                    disabled={!manualId() || !manualName()}
                  >
                    追加
                  </Button>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

## 3.5 メインコンポーネント（履修管理）

### src/components/course/CourseManager.tsx

```typescript
import { Component, For, Show, createSignal, createEffect, onMount } from 'solid-js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { SemesterView } from './SemesterView';
import type {
  CoursePlan,
  EnrollmentData,
  PlannedCourse,
  UserCourseRecord
} from '~/lib/types';
import {
  getCoursePlan,
  saveCoursePlan,
  createDefaultCoursePlan,
  addCourseToSemester,
  removeCourseFromSemester,
  updateCourseInPlan
} from '~/lib/db/coursePlans';
import { refreshKdbCache, getKdbCacheAge } from '~/lib/db/kdb';

interface CourseManagerProps {
  profileId: string;
  enrollmentYear: number;
  enrollment: EnrollmentData | null;
  onSyncTwins: () => void;
}

export const CourseManager: Component<CourseManagerProps> = (props) => {
  const [plan, setPlan] = createSignal<CoursePlan | null>(null);
  const [selectedYear, setSelectedYear] = createSignal<number>(props.enrollmentYear);
  const [isLoading, setIsLoading] = createSignal(true);
  const [isRefreshingKdb, setIsRefreshingKdb] = createSignal(false);

  // 履修計画を読み込み
  onMount(async () => {
    let existingPlan = await getCoursePlan(props.profileId);

    if (!existingPlan) {
      existingPlan = await createDefaultCoursePlan(props.profileId, props.enrollmentYear);
    }

    setPlan(existingPlan);
    setIsLoading(false);
  });

  // 選択した年度の学期を取得
  const yearSemesters = () => {
    const p = plan();
    if (!p) return [];
    return p.plans.filter(s => s.year === selectedYear());
  };

  // 選択した年度の履修データを取得
  const getEnrolledCoursesForSemester = (year: number, semester: 'spring' | 'fall'): UserCourseRecord[] => {
    if (!props.enrollment) return [];

    // TWINSデータには学期情報が明確でないため、年度でフィルタ
    return props.enrollment.courses.filter(c => c.year === year);
  };

  // 科目を追加
  const handleAddCourse = async (year: number, semester: 'spring' | 'fall', course: PlannedCourse) => {
    await addCourseToSemester(props.profileId, year, semester, course);

    // 状態を更新
    const updated = await getCoursePlan(props.profileId);
    setPlan(updated || null);
  };

  // 科目を削除
  const handleRemoveCourse = async (year: number, semester: 'spring' | 'fall', courseId: string) => {
    await removeCourseFromSemester(props.profileId, year, semester, courseId);

    const updated = await getCoursePlan(props.profileId);
    setPlan(updated || null);
  };

  // 科目を更新
  const handleUpdateCourse = async (
    year: number,
    semester: 'spring' | 'fall',
    courseId: string,
    updates: Partial<PlannedCourse>
  ) => {
    await updateCourseInPlan(props.profileId, year, semester, courseId, updates);

    const updated = await getCoursePlan(props.profileId);
    setPlan(updated || null);
  };

  // kdbデータを更新
  const handleRefreshKdb = async () => {
    setIsRefreshingKdb(true);
    try {
      await refreshKdbCache();
    } catch (error) {
      console.error('Failed to refresh kdb:', error);
    } finally {
      setIsRefreshingKdb(false);
    }
  };

  // 年度選択肢
  const yearOptions = () => {
    const years: number[] = [];
    for (let i = 0; i < 4; i++) {
      years.push(props.enrollmentYear + i);
    }
    return years;
  };

  return (
    <div class="space-y-6">
      {/* ヘッダー */}
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Select
            value={String(selectedYear())}
            onChange={(value) => setSelectedYear(parseInt(value || String(props.enrollmentYear)))}
          >
            <SelectTrigger class="w-32">
              <SelectValue placeholder="年度" />
            </SelectTrigger>
            <SelectContent>
              <For each={yearOptions()}>
                {(year) => (
                  <SelectItem value={String(year)}>{year}年度</SelectItem>
                )}
              </For>
            </SelectContent>
          </Select>
        </div>

        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshKdb}
            disabled={isRefreshingKdb()}
          >
            {isRefreshingKdb() ? '更新中...' : 'kdb更新'}
          </Button>
          <Button variant="outline" size="sm" onClick={props.onSyncTwins}>
            TWINSデータを同期
          </Button>
        </div>
      </div>

      {/* 学期ビュー */}
      <Show when={!isLoading()} fallback={<div>読み込み中...</div>}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <For each={yearSemesters()}>
            {(semester) => (
              <SemesterView
                plan={semester}
                enrolledCourses={getEnrolledCoursesForSemester(semester.year, semester.semester)}
                onAddCourse={(course) => handleAddCourse(semester.year, semester.semester, course)}
                onRemoveCourse={(courseId) => handleRemoveCourse(semester.year, semester.semester, courseId)}
                onUpdateCourse={(courseId, updates) =>
                  handleUpdateCourse(semester.year, semester.semester, courseId, updates)
                }
              />
            )}
          </For>
        </div>
      </Show>

      {/* 全体サマリー */}
      <Show when={plan()}>
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">4年間の履修状況</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-4 gap-4 text-center">
              <For each={yearOptions()}>
                {(year) => {
                  const yearPlans = plan()!.plans.filter(p => p.year === year);
                  const totalCredits = yearPlans.reduce((sum, p) =>
                    sum + p.courses.reduce((s, c) => s + c.credits, 0), 0
                  );
                  const enrolled = props.enrollment?.courses.filter(c => c.year === year) || [];
                  const earnedCredits = enrolled
                    .filter(c => c.isPassed)
                    .reduce((sum, c) => sum + c.credits, 0);

                  return (
                    <div class="p-3 border rounded-lg">
                      <div class="text-sm text-muted-foreground">{year}年度</div>
                      <div class="text-lg font-bold mt-1">
                        {earnedCredits > 0 ? earnedCredits : totalCredits}
                        <span class="text-sm font-normal text-muted-foreground">単位</span>
                      </div>
                      <div class="text-xs text-muted-foreground mt-1">
                        {earnedCredits > 0 ? '取得済み' : totalCredits > 0 ? '計画' : '未設定'}
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </CardContent>
        </Card>
      </Show>
    </div>
  );
};
```

## 3.6 TWINSデータとの連携

### src/lib/sync/twins.ts

```typescript
import type { CoursePlan, EnrollmentData, PlannedCourse } from '../types';
import { getCoursePlan, saveCoursePlan } from '../db/coursePlans';
import { isPassed, isInProgress } from '../types';

// TWINSデータを履修計画に反映
export async function syncTwinsToCoursePlan(
  profileId: string,
  enrollment: EnrollmentData
): Promise<void> {
  const plan = await getCoursePlan(profileId);
  if (!plan) return;

  for (const course of enrollment.courses) {
    // 該当する学期を探す（TWINSデータには学期が明確でないため年度で判断）
    const semesterPlan = plan.plans.find(p => p.year === course.year);
    if (!semesterPlan) continue;

    // 既存の計画を探す
    const existingIndex = semesterPlan.courses.findIndex(c => c.courseId === course.courseId);

    const status: PlannedCourse['status'] =
      course.isPassed ? 'completed' :
      course.isInProgress ? 'enrolled' :
      course.grade === 'D' ? 'failed' : 'planned';

    const plannedCourse: PlannedCourse = {
      courseId: course.courseId,
      courseName: course.courseName,
      credits: course.credits,
      status,
      actualGrade: course.grade
    };

    if (existingIndex >= 0) {
      // 既存の計画を更新
      semesterPlan.courses[existingIndex] = plannedCourse;
    } else {
      // 新規追加
      semesterPlan.courses.push(plannedCourse);
    }
  }

  await saveCoursePlan(plan);
}
```

## Phase 3 完了チェックリスト

- [ ] 3.1 kdbデータ取得・キャッシュ
  - [ ] getKdbCacheAge関数
  - [ ] getCachedKdb関数
  - [ ] refreshKdbCache関数
  - [ ] searchKdb関数
- [ ] 3.2 履修計画DB操作
  - [ ] getCoursePlan関数
  - [ ] saveCoursePlan関数
  - [ ] createDefaultCoursePlan関数
- [ ] 3.3 SemesterViewコンポーネント
- [ ] 3.4 CourseCardコンポーネント
- [ ] 3.5 CourseSearchDialogコンポーネント
- [ ] 3.6 CourseManagerコンポーネント
- [ ] 3.7 TWINSデータ同期機能
- [ ] 動作確認
