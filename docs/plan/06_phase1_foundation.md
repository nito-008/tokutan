# Phase 1: 基盤構築 - 詳細実装ガイド

## 1.1 プロジェクト構造のセットアップ

### ディレクトリ作成

```bash
# srcディレクトリ内に構造を作成
mkdir -p src/components/layout
mkdir -p src/components/graduation
mkdir -p src/components/course
mkdir -p src/lib/db
mkdir -p src/lib/parsers
mkdir -p src/lib/calculator
mkdir -p src/lib/types
mkdir -p src/stores
mkdir -p src/data
```

### app.config.ts の更新

```typescript
// app.config.ts
import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  ssr: false,
  server: {
    preset: "static"
  }
});
```

## 1.2 SolidUIコンポーネント追加

```bash
# 必要なコンポーネントをインストール
npx solidui@latest add button
npx solidui@latest add card
npx solidui@latest add tabs
npx solidui@latest add dialog
npx solidui@latest add input
npx solidui@latest add select
npx solidui@latest add progress
npx solidui@latest add badge
npx solidui@latest add accordion
npx solidui@latest add tooltip
npx solidui@latest add separator
npx solidui@latest add label
npx solidui@latest add alert
npx solidui@latest add sonner  # トースト通知用
```

## 1.3 型定義の実装

### src/lib/types/index.ts

```typescript
export * from './requirements';
export * from './course';
export * from './enrollment';
```

### src/lib/types/requirements.ts

```typescript
// 卒業要件全体
export interface GraduationRequirements {
  id: string;
  name: string;
  year: number;
  department: string;
  totalCredits: number;
  categories: RequirementCategory[];
  version: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

// 要件カテゴリ
export interface RequirementCategory {
  id: string;
  name: string;
  subcategories: RequirementSubcategory[];
  minCredits?: number;
  maxCredits?: number;
}

// サブカテゴリ
export interface RequirementSubcategory {
  id: string;
  name: string;
  type: 'required' | 'elective' | 'free';
  minCredits: number;
  maxCredits?: number;
  rules: RequirementRule[];
  notes?: string;
}

// ルール
export interface RequirementRule {
  id: string;
  type: 'specific' | 'pattern' | 'group';
  description?: string;
  courseIds?: string[];
  courseIdPattern?: string;
  groupName?: string;
  groupCourseIds?: string[];
  minCredits?: number;
  maxCredits?: number;
  required?: boolean;
}

// 要件充足状況
export interface RequirementStatus {
  requirementsId: string;
  totalEarnedCredits: number;
  totalInProgressCredits: number;
  totalRequiredCredits: number;
  isGraduationEligible: boolean;
  categoryStatuses: CategoryStatus[];
  calculatedAt: string;
}

export interface CategoryStatus {
  categoryId: string;
  categoryName: string;
  earnedCredits: number;
  inProgressCredits: number;
  requiredCredits: number;
  maxCredits?: number;
  isSatisfied: boolean;
  subcategoryStatuses: SubcategoryStatus[];
}

export interface SubcategoryStatus {
  subcategoryId: string;
  subcategoryName: string;
  earnedCredits: number;
  inProgressCredits: number;
  requiredCredits: number;
  maxCredits?: number;
  isSatisfied: boolean;
  ruleStatuses: RuleStatus[];
  matchedCourses: MatchedCourse[];
}

export interface RuleStatus {
  ruleId: string;
  description: string;
  isSatisfied: boolean;
  earnedCredits: number;
  inProgressCredits: number;
  requiredCredits?: number;
  matchedCourses: MatchedCourse[];
}

export interface MatchedCourse {
  courseId: string;
  courseName: string;
  credits: number;
  grade: Grade;
  isPassed: boolean;
  isInProgress: boolean;
}
```

### src/lib/types/course.ts

```typescript
// kdbから取得した科目データ
export interface KdbCourse {
  科目番号: string;
  科目名: string;
  授業方法: string;
  単位数: string;
  標準履修年次: string;
  実施学期: string;
  曜時限: string;
  担当教員: string;
  授業概要: string;
  備考: string;
  データ更新日: string;
}

// 内部形式の科目データ
export interface Course {
  id: string;
  name: string;
  method: string;
  credits: number;
  gradeYear: number;
  semester: string;
  schedule: string;
  instructor: string;
  description: string;
  notes: string;
  updatedAt: string;
  cachedAt?: string;
}

// kdbデータを内部形式に変換
export function convertKdbCourse(kdb: KdbCourse): Course {
  return {
    id: kdb.科目番号,
    name: kdb.科目名,
    method: kdb.授業方法,
    credits: parseFloat(kdb.単位数) || 0,
    gradeYear: parseInt(kdb.標準履修年次) || 0,
    semester: kdb.実施学期,
    schedule: kdb.曜時限,
    instructor: kdb.担当教員,
    description: kdb.授業概要,
    notes: kdb.備考,
    updatedAt: kdb.データ更新日
  };
}
```

### src/lib/types/enrollment.ts

```typescript
// 成績
export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'P' | '認' | '履修中' | '-';

// 科目区分（TWINSの値）
export type CourseCategory = 'A' | 'B' | 'C';

// TWINSからパースした科目データ
export interface TwinsCourse {
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  credits: number;
  springGrade: string;
  fallGrade: string;
  finalGrade: Grade;
  category: CourseCategory;
  year: number;
  type: string;
}

// ユーザーの履修記録
export interface UserCourseRecord {
  id: string;
  courseId: string;
  courseName: string;
  credits: number;
  grade: Grade;
  year: number;
  semester: 'spring' | 'fall' | 'full';
  category: CourseCategory;
  isPassed: boolean;
  isInProgress: boolean;
}

// 履修データ
export interface EnrollmentData {
  id: string;
  profileId: string;
  courses: UserCourseRecord[];
  importedAt: string;
  updatedAt: string;
}

// ユーザープロファイル
export interface UserProfile {
  id: string;
  name: string;
  studentId?: string;
  enrollmentYear: number;
  department: string;
  selectedRequirementsId?: string;
  createdAt: string;
  updatedAt: string;
}

// 履修計画
export interface CoursePlan {
  id: string;
  profileId: string;
  plans: SemesterPlan[];
  createdAt: string;
  updatedAt: string;
}

export interface SemesterPlan {
  year: number;
  semester: 'spring' | 'fall';
  courses: PlannedCourse[];
}

export interface PlannedCourse {
  courseId: string;
  courseName: string;
  credits: number;
  status: 'planned' | 'enrolled' | 'completed' | 'failed';
  actualGrade?: Grade;
  notes?: string;
}

// 成績判定
export function isPassed(grade: Grade): boolean {
  return ['A+', 'A', 'B', 'C', 'P', '認'].includes(grade);
}

export function isInProgress(grade: Grade): boolean {
  return grade === '履修中';
}

// カテゴリ名のマッピング
export const categoryNames: Record<CourseCategory, string> = {
  'A': '専門科目',
  'B': '専門基礎科目',
  'C': '共通科目'
};
```

## 1.4 IndexedDB操作の実装

### パッケージインストール

```bash
npm install dexie
```

### src/lib/db/index.ts

```typescript
import Dexie, { type Table } from 'dexie';
import type {
  GraduationRequirements,
  EnrollmentData,
  UserProfile,
  CoursePlan,
  Course
} from '../types';

export interface AppSettings {
  key: string;
  value: unknown;
  updatedAt: string;
}

export class TokutanDB extends Dexie {
  requirements!: Table<GraduationRequirements>;
  enrollment!: Table<EnrollmentData>;
  profiles!: Table<UserProfile>;
  coursePlans!: Table<CoursePlan>;
  kdbCache!: Table<Course>;
  settings!: Table<AppSettings>;

  constructor() {
    super('tokutan');

    this.version(1).stores({
      requirements: 'id, name, year, department, isDefault',
      enrollment: 'id, profileId',
      profiles: 'id, studentId',
      coursePlans: 'id, profileId',
      kdbCache: 'id, name',
      settings: 'key'
    });
  }
}

export const db = new TokutanDB();
```

### src/lib/db/settings.ts

```typescript
import { db, type AppSettings } from './index';

export type SettingsKey =
  | 'currentProfileId'
  | 'theme'
  | 'kdbCachedAt'
  | 'lastExportAt';

export async function getSetting<T>(key: SettingsKey): Promise<T | undefined> {
  const setting = await db.settings.get(key);
  return setting?.value as T | undefined;
}

export async function setSetting<T>(key: SettingsKey, value: T): Promise<void> {
  await db.settings.put({
    key,
    value,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteSetting(key: SettingsKey): Promise<void> {
  await db.settings.delete(key);
}
```

### src/lib/db/requirements.ts

```typescript
import { db } from './index';
import type { GraduationRequirements } from '../types';

export async function getRequirements(id: string): Promise<GraduationRequirements | undefined> {
  return db.requirements.get(id);
}

export async function getAllRequirements(): Promise<GraduationRequirements[]> {
  return db.requirements.toArray();
}

export async function saveRequirements(req: GraduationRequirements): Promise<string> {
  const now = new Date().toISOString();
  const data = {
    ...req,
    updatedAt: now,
    createdAt: req.createdAt || now
  };
  await db.requirements.put(data);
  return data.id;
}

export async function deleteRequirements(id: string): Promise<void> {
  await db.requirements.delete(id);
}

export async function getDefaultRequirements(): Promise<GraduationRequirements | undefined> {
  return db.requirements.where('isDefault').equals(1).first();
}

export async function setDefaultRequirements(id: string): Promise<void> {
  await db.transaction('rw', db.requirements, async () => {
    // 既存のデフォルトを解除
    await db.requirements.where('isDefault').equals(1).modify({ isDefault: false });
    // 新しいデフォルトを設定
    await db.requirements.update(id, { isDefault: true });
  });
}
```

### src/lib/db/enrollment.ts

```typescript
import { db } from './index';
import type { EnrollmentData, TwinsCourse, UserCourseRecord } from '../types';
import { isPassed, isInProgress } from '../types';

export async function getEnrollment(profileId: string): Promise<EnrollmentData | undefined> {
  return db.enrollment.where('profileId').equals(profileId).first();
}

export async function saveEnrollment(data: EnrollmentData): Promise<string> {
  const now = new Date().toISOString();
  const toSave = {
    ...data,
    updatedAt: now
  };
  await db.enrollment.put(toSave);
  return data.id;
}

export async function updateEnrollmentFromTwins(
  profileId: string,
  twinsCourses: TwinsCourse[]
): Promise<EnrollmentData> {
  const now = new Date().toISOString();

  const courses: UserCourseRecord[] = twinsCourses.map((tc, index) => ({
    id: `${profileId}-${tc.courseId}-${tc.year}-${index}`,
    courseId: tc.courseId,
    courseName: tc.courseName,
    credits: tc.credits,
    grade: tc.finalGrade,
    year: tc.year,
    semester: 'full' as const,
    category: tc.category,
    isPassed: isPassed(tc.finalGrade),
    isInProgress: isInProgress(tc.finalGrade)
  }));

  const enrollment: EnrollmentData = {
    id: `enrollment-${profileId}`,
    profileId,
    courses,
    importedAt: now,
    updatedAt: now
  };

  await db.enrollment.put(enrollment);
  return enrollment;
}

export async function clearEnrollment(profileId: string): Promise<void> {
  await db.enrollment.where('profileId').equals(profileId).delete();
}
```

### src/lib/db/profiles.ts

```typescript
import { db } from './index';
import type { UserProfile } from '../types';
import { getSetting, setSetting } from './settings';

export async function getProfile(id: string): Promise<UserProfile | undefined> {
  return db.profiles.get(id);
}

export async function getCurrentProfile(): Promise<UserProfile | undefined> {
  const currentId = await getSetting<string>('currentProfileId');
  if (!currentId) return undefined;
  return db.profiles.get(currentId);
}

export async function saveProfile(profile: UserProfile): Promise<string> {
  const now = new Date().toISOString();
  const data = {
    ...profile,
    updatedAt: now,
    createdAt: profile.createdAt || now
  };
  await db.profiles.put(data);
  return data.id;
}

export async function setCurrentProfile(id: string): Promise<void> {
  await setSetting('currentProfileId', id);
}

export async function createDefaultProfile(): Promise<string> {
  const profile: UserProfile = {
    id: crypto.randomUUID(),
    name: 'デフォルトユーザー',
    enrollmentYear: new Date().getFullYear(),
    department: '工学システム学類',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await db.profiles.add(profile);
  await setCurrentProfile(profile.id);
  return profile.id;
}
```

## 1.5 基本レイアウトの実装

### src/components/layout/Header.tsx

```typescript
import { Component } from 'solid-js';
import { Button } from '~/components/ui/button';

interface HeaderProps {
  onExport: () => void;
  onImport: () => void;
}

export const Header: Component<HeaderProps> = (props) => {
  return (
    <header class="border-b bg-background">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-bold">tokutan</h1>
          <span class="text-sm text-muted-foreground">卒業要件チェッカー</span>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={props.onImport}>
            インポート
          </Button>
          <Button variant="outline" size="sm" onClick={props.onExport}>
            エクスポート
          </Button>
        </div>
      </div>
    </header>
  );
};
```

### src/components/layout/TabNavigation.tsx

```typescript
import { Component } from 'solid-js';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';

interface TabNavigationProps {
  activeTab: 'graduation' | 'course';
  onTabChange: (tab: 'graduation' | 'course') => void;
}

export const TabNavigation: Component<TabNavigationProps> = (props) => {
  return (
    <div class="border-b">
      <div class="container mx-auto px-4">
        <Tabs
          value={props.activeTab}
          onChange={(value) => props.onTabChange(value as 'graduation' | 'course')}
        >
          <TabsList class="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="graduation">卒業要件チェック</TabsTrigger>
            <TabsTrigger value="course">履修管理</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};
```

### src/routes/index.tsx（更新）

```typescript
import { Component, createSignal, onMount, Show } from 'solid-js';
import { Header } from '~/components/layout/Header';
import { TabNavigation } from '~/components/layout/TabNavigation';
// import { GraduationChecker } from '~/components/graduation/GraduationChecker';
// import { CourseManager } from '~/components/course/CourseManager';

const Home: Component = () => {
  const [activeTab, setActiveTab] = createSignal<'graduation' | 'course'>('graduation');
  const [isLoading, setIsLoading] = createSignal(true);

  onMount(async () => {
    // 初期化処理（Phase 2で実装）
    setIsLoading(false);
  });

  const handleExport = () => {
    // エクスポート処理（Phase 4で実装）
    console.log('Export');
  };

  const handleImport = () => {
    // インポート処理（Phase 4で実装）
    console.log('Import');
  };

  return (
    <div class="min-h-screen bg-background">
      <Header onExport={handleExport} onImport={handleImport} />
      <TabNavigation activeTab={activeTab()} onTabChange={setActiveTab} />

      <main class="container mx-auto px-4 py-6">
        <Show when={!isLoading()} fallback={<div>読み込み中...</div>}>
          <Show when={activeTab() === 'graduation'}>
            <div class="text-center text-muted-foreground py-12">
              卒業要件チェック機能（Phase 2で実装）
            </div>
          </Show>
          <Show when={activeTab() === 'course'}>
            <div class="text-center text-muted-foreground py-12">
              履修管理機能（Phase 3で実装）
            </div>
          </Show>
        </Show>
      </main>
    </div>
  );
};

export default Home;
```

### src/app.tsx（更新）

```typescript
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { Toaster } from "~/components/ui/sonner";
import "./app.css";

export default function App() {
  return (
    <Router
      root={props => (
        <>
          <Suspense>{props.children}</Suspense>
          <Toaster />
        </>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
```

## Phase 1 完了チェックリスト

- [ ] ディレクトリ構造作成
- [ ] app.config.ts の SSR無効化設定
- [ ] SolidUI コンポーネントインストール
- [ ] 型定義ファイル作成
  - [ ] types/index.ts
  - [ ] types/requirements.ts
  - [ ] types/course.ts
  - [ ] types/enrollment.ts
- [ ] IndexedDB 設定
  - [ ] dexie インストール
  - [ ] db/index.ts
  - [ ] db/settings.ts
  - [ ] db/requirements.ts
  - [ ] db/enrollment.ts
  - [ ] db/profiles.ts
- [ ] 基本レイアウト
  - [ ] Header.tsx
  - [ ] TabNavigation.tsx
  - [ ] routes/index.tsx 更新
  - [ ] app.tsx 更新
- [ ] 動作確認（`npm run dev`）
