# IndexedDB & ストレージ設計

## 概要

全データをブラウザのIndexedDBに保存し、完全にクライアントサイドで動作するSPAとして設計。
SSRは使用せず、静的アセットとして配信可能。

## SolidStartの静的ビルド設定

### app.config.ts の変更

```typescript
import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  // SSRを無効化し、完全なSPAとして動作
  ssr: false,
  // 静的サイト生成（オプション）
  server: {
    preset: "static"
  }
});
```

### 静的ビルドコマンド

```bash
npm run build
# 出力: .output/public/ に静的アセット
```

## IndexedDB スキーマ

### Dexie.js を使用したDB定義

```typescript
// src/lib/db/index.ts
import Dexie, { type Table } from 'dexie';
import type {
  GraduationRequirements,
  EnrollmentData,
  UserProfile,
  CoursePlan,
  Course,
  AppSettings
} from '../types';

export class TokutanDB extends Dexie {
  // テーブル定義
  requirements!: Table<GraduationRequirements>;
  enrollment!: Table<EnrollmentData>;
  profiles!: Table<UserProfile>;
  coursePlans!: Table<CoursePlan>;
  kdbCache!: Table<Course>;
  settings!: Table<AppSettings>;

  constructor() {
    super('tokutan');

    this.version(1).stores({
      // プライマリキーとインデックス
      requirements: 'id, name, year, department',
      enrollment: 'id, profileId',
      profiles: 'id, studentId',
      coursePlans: 'id, profileId',
      kdbCache: 'id, name',  // id = 科目番号
      settings: 'key'
    });
  }
}

export const db = new TokutanDB();
```

## ストア構造

### 1. requirements テーブル

```typescript
// 卒業要件定義を保存
interface RequirementsStore {
  id: string;                    // UUID
  name: string;                  // "2024年入学 工学システム学類"
  year: number;                  // 2024
  department: string;            // "工学システム学類"
  totalCredits: number;          // 125
  categories: RequirementCategory[];
  version: string;               // "1.0.0"
  isDefault: boolean;            // デフォルト要件かどうか
  createdAt: string;
  updatedAt: string;
}
```

**操作**:
```typescript
// src/lib/db/requirements.ts
export async function getRequirements(id: string): Promise<GraduationRequirements | undefined>
export async function getAllRequirements(): Promise<GraduationRequirements[]>
export async function saveRequirements(req: GraduationRequirements): Promise<string>
export async function deleteRequirements(id: string): Promise<void>
export async function getDefaultRequirements(): Promise<GraduationRequirements | undefined>
export async function setDefaultRequirements(id: string): Promise<void>
```

### 2. enrollment テーブル

```typescript
// ユーザーの履修データを保存
interface EnrollmentStore {
  id: string;                    // UUID
  profileId: string;             // UserProfileへの参照
  courses: UserCourseRecord[];   // 科目リスト
  importedAt: string;            // TWINSインポート日時
  updatedAt: string;
}
```

**操作**:
```typescript
// src/lib/db/enrollment.ts
export async function getEnrollment(profileId: string): Promise<EnrollmentData | undefined>
export async function saveEnrollment(data: EnrollmentData): Promise<string>
export async function updateEnrollmentFromTwins(profileId: string, twinsCourses: TwinsCourse[]): Promise<void>
export async function clearEnrollment(profileId: string): Promise<void>
```

### 3. profiles テーブル

```typescript
// ユーザープロファイル
interface ProfileStore {
  id: string;                    // UUID
  name: string;                  // 表示名
  studentId?: string;            // 学籍番号
  enrollmentYear: number;        // 入学年度
  department: string;            // 学類
  selectedRequirementsId?: string; // 選択中の卒業要件
  createdAt: string;
  updatedAt: string;
}
```

**操作**:
```typescript
// src/lib/db/profiles.ts
export async function getProfile(id: string): Promise<UserProfile | undefined>
export async function getCurrentProfile(): Promise<UserProfile | undefined>
export async function saveProfile(profile: UserProfile): Promise<string>
export async function setCurrentProfile(id: string): Promise<void>
```

### 4. coursePlans テーブル

```typescript
// 履修計画
interface CoursePlanStore {
  id: string;
  profileId: string;
  plans: SemesterPlan[];
  createdAt: string;
  updatedAt: string;
}
```

### 5. kdbCache テーブル

```typescript
// kdbデータのキャッシュ
interface KdbCacheStore {
  id: string;                    // 科目番号
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
  cachedAt: string;              // キャッシュ日時
}
```

**操作**:
```typescript
// src/lib/db/kdb.ts
export async function getCachedKdb(): Promise<Course[]>
export async function refreshKdbCache(): Promise<void>
export async function searchKdb(query: string): Promise<Course[]>
export async function getKdbCacheAge(): Promise<number> // ミリ秒
```

### 6. settings テーブル

```typescript
// アプリ設定（Key-Valueストア）
interface SettingsStore {
  key: string;
  value: any;
  updatedAt: string;
}

// 設定キー例
type SettingsKey =
  | 'currentProfileId'       // 現在のプロファイルID
  | 'theme'                  // テーマ（light/dark）
  | 'kdbCachedAt'           // kdbキャッシュ日時
  | 'lastExportAt'          // 最終エクスポート日時
```

**操作**:
```typescript
// src/lib/db/settings.ts
export async function getSetting<T>(key: SettingsKey): Promise<T | undefined>
export async function setSetting<T>(key: SettingsKey, value: T): Promise<void>
export async function deleteSetting(key: SettingsKey): Promise<void>
```

## データエクスポート/インポート

### エクスポート形式

```typescript
interface ExportData {
  version: string;               // エクスポート形式バージョン
  exportedAt: string;
  profiles: UserProfile[];
  requirements: GraduationRequirements[];
  enrollments: EnrollmentData[];
  coursePlans: CoursePlan[];
  settings: Record<string, any>;
}
```

### エクスポート関数

```typescript
// src/lib/db/export.ts
export async function exportAllData(): Promise<ExportData> {
  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    profiles: await db.profiles.toArray(),
    requirements: await db.requirements.toArray(),
    enrollments: await db.enrollment.toArray(),
    coursePlans: await db.coursePlans.toArray(),
    settings: await exportSettings()
  };
}

export function downloadAsJson(data: ExportData, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

### インポート関数

```typescript
// src/lib/db/import.ts
export async function importAllData(data: ExportData): Promise<ImportResult> {
  // バージョン確認
  if (!isCompatibleVersion(data.version)) {
    throw new Error('Incompatible export version');
  }

  // トランザクションで一括インポート
  await db.transaction('rw',
    [db.profiles, db.requirements, db.enrollment, db.coursePlans, db.settings],
    async () => {
      // 既存データをクリア（オプション）
      // await clearAllData();

      // インポート
      await db.profiles.bulkPut(data.profiles);
      await db.requirements.bulkPut(data.requirements);
      await db.enrollment.bulkPut(data.enrollments);
      await db.coursePlans.bulkPut(data.coursePlans);
      await importSettings(data.settings);
    }
  );

  return { success: true, importedAt: new Date().toISOString() };
}
```

## 要件JSONの共有

### 要件エクスポート（単独）

```typescript
// src/lib/db/requirements-share.ts
export async function exportRequirements(id: string): Promise<string> {
  const req = await db.requirements.get(id);
  if (!req) throw new Error('Requirements not found');

  // 共有用にメタデータを追加
  const shareData = {
    ...req,
    sharedAt: new Date().toISOString(),
    shareVersion: '1.0.0'
  };

  return JSON.stringify(shareData, null, 2);
}

export async function importRequirements(json: string): Promise<string> {
  const data = JSON.parse(json);

  // バリデーション
  validateRequirementsSchema(data);

  // 新しいIDを生成（重複防止）
  const newId = crypto.randomUUID();
  const imported = {
    ...data,
    id: newId,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await db.requirements.add(imported);
  return newId;
}
```

## 初期化フロー

```typescript
// src/lib/db/init.ts
export async function initializeApp(): Promise<void> {
  // 1. DB接続確認
  await db.open();

  // 2. デフォルト要件がなければ追加
  const defaultReq = await db.requirements.where('isDefault').equals(1).first();
  if (!defaultReq) {
    await loadDefaultRequirements();
  }

  // 3. プロファイルがなければ作成
  const currentProfileId = await getSetting<string>('currentProfileId');
  if (!currentProfileId) {
    const profileId = await createDefaultProfile();
    await setSetting('currentProfileId', profileId);
  }

  // 4. kdbキャッシュの更新確認（24時間以上経過していれば更新）
  const cacheAge = await getKdbCacheAge();
  if (cacheAge > 24 * 60 * 60 * 1000) {
    // バックグラウンドで更新
    refreshKdbCache().catch(console.error);
  }
}
```

## Solidストア連携

```typescript
// src/stores/app.ts
import { createStore } from 'solid-js/store';
import { createEffect } from 'solid-js';

interface AppState {
  isInitialized: boolean;
  currentProfile: UserProfile | null;
  currentRequirements: GraduationRequirements | null;
  enrollment: EnrollmentData | null;
  requirementStatus: RequirementStatus | null;
  isLoading: boolean;
  error: string | null;
}

const [appState, setAppState] = createStore<AppState>({
  isInitialized: false,
  currentProfile: null,
  currentRequirements: null,
  enrollment: null,
  requirementStatus: null,
  isLoading: true,
  error: null
});

// 初期化
export async function initApp() {
  try {
    setAppState('isLoading', true);
    await initializeApp();

    // データ読み込み
    const profile = await getCurrentProfile();
    const requirements = await getDefaultRequirements();
    const enrollment = profile ? await getEnrollment(profile.id) : null;

    setAppState({
      isInitialized: true,
      currentProfile: profile,
      currentRequirements: requirements,
      enrollment,
      isLoading: false
    });

    // 要件充足状況を計算
    if (requirements && enrollment) {
      const status = calculateRequirementStatus(requirements, enrollment.courses);
      setAppState('requirementStatus', status);
    }
  } catch (error) {
    setAppState({ error: error.message, isLoading: false });
  }
}
```

## データ整合性

### トランザクション

```typescript
// 複数テーブルを更新する場合はトランザクションを使用
await db.transaction('rw', [db.enrollment, db.profiles], async () => {
  await db.enrollment.put(enrollmentData);
  await db.profiles.update(profileId, { updatedAt: new Date().toISOString() });
});
```

### マイグレーション

```typescript
// スキーマ変更時
export class TokutanDB extends Dexie {
  constructor() {
    super('tokutan');

    // バージョン1
    this.version(1).stores({
      requirements: 'id, name, year, department',
      // ...
    });

    // バージョン2（将来の変更）
    this.version(2).stores({
      requirements: 'id, name, year, department, *tags',  // tagsインデックス追加
      // ...
    }).upgrade(tx => {
      // マイグレーション処理
      return tx.table('requirements').toCollection().modify(req => {
        req.tags = req.tags || [];
      });
    });
  }
}
```
