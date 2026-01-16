# 実装手順

## 概要

実装は段階的に行い、各フェーズで動作確認可能な状態を維持する。

## 重要: 静的SPAとしてビルド

SSR機能は使用せず、完全な静的アセットとして配信可能にする。

### app.config.ts の設定

```typescript
import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  ssr: false,  // SSRを無効化
  server: {
    preset: "static"  // 静的ビルド
  }
});
```

### ビルドコマンド

```bash
npm run build
# 出力: .output/public/ または dist/ に静的アセット
```

これにより、GitHub Pages、Netlify、Vercel、S3などの静的ホスティングで配信可能。

## Phase 1: 基盤構築

### 1.1 プロジェクト構造のセットアップ

**目標**: 必要なディレクトリとファイルを作成

```bash
# ディレクトリ構造
src/
├── routes/
│   └── index.tsx              # メインページ（書き換え）
├── components/
│   ├── ui/                    # SolidUIコンポーネント（追加）
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── TabNavigation.tsx
│   ├── graduation/            # 卒業要件チェック
│   │   ├── GraduationChecker.tsx
│   │   ├── RequirementsSummary.tsx
│   │   ├── DonutChart.tsx
│   │   ├── RequirementTree.tsx
│   │   ├── RequirementEditor.tsx
│   │   └── CsvUploader.tsx
│   └── course/                # 履修管理
│       ├── CourseManager.tsx
│       ├── SemesterView.tsx
│       ├── CourseCard.tsx
│       └── CourseSearchDialog.tsx
├── lib/
│   ├── utils.ts               # 既存
│   ├── db/
│   │   ├── index.ts           # IndexedDB初期化
│   │   ├── requirements.ts    # 要件CRUD
│   │   ├── enrollment.ts      # 履修データCRUD
│   │   └── settings.ts        # 設定CRUD
│   ├── parsers/
│   │   ├── twins-csv.ts       # TWINS CSVパーサー
│   │   └── kdb.ts             # kdbデータ処理
│   ├── calculator/
│   │   └── requirements.ts    # 要件充足計算
│   └── types/
│       ├── index.ts           # 全型エクスポート
│       ├── requirements.ts    # 要件型
│       ├── course.ts          # 科目型
│       └── enrollment.ts      # 履修型
└── stores/
    ├── app.ts                 # アプリ状態
    ├── requirements.ts        # 要件状態
    └── enrollment.ts          # 履修状態
```

**タスク**:
1. [ ] ディレクトリ作成
2. [ ] 型定義ファイル作成
3. [ ] 基本コンポーネントファイル作成（空）

### 1.2 SolidUIコンポーネント追加

**目標**: 必要なUIコンポーネントをインストール

```bash
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
```

**タスク**:
1. [ ] 各UIコンポーネントをインストール
2. [ ] 動作確認

### 1.3 型定義の実装

**目標**: TypeScript型を定義

**ファイル**: `src/lib/types/`

```typescript
// requirements.ts
export interface GraduationRequirements { ... }
export interface RequirementCategory { ... }
export interface RequirementSubcategory { ... }
export interface RequirementRule { ... }

// course.ts
export interface Course { ... }
export interface KdbCourse { ... }

// enrollment.ts
export interface TwinsCourse { ... }
export interface UserCourseRecord { ... }
export interface EnrollmentData { ... }
export type Grade = ...
export type CourseCategory = ...
```

**タスク**:
1. [ ] requirements.ts 作成
2. [ ] course.ts 作成
3. [ ] enrollment.ts 作成
4. [ ] index.ts でエクスポート

### 1.4 IndexedDB操作の実装

**目標**: データ永続化層を実装

**使用ライブラリ**: `idb` または `dexie`

```bash
npm install dexie
```

**タスク**:
1. [ ] dexieインストール
2. [ ] DBスキーマ定義
3. [ ] requirements CRUD実装
4. [ ] enrollment CRUD実装
5. [ ] settings CRUD実装

### 1.5 基本レイアウトの実装

**目標**: ヘッダーとタブナビゲーションを実装

**タスク**:
1. [ ] Header.tsx 実装
2. [ ] TabNavigation.tsx 実装
3. [ ] index.tsx をメインレイアウトに書き換え

---

## Phase 2: 卒業要件チェック機能

### 2.1 TWINSパーサーの実装

**目標**: CSVをパースして内部形式に変換

**ファイル**: `src/lib/parsers/twins-csv.ts`

```typescript
export function parseTwinsCsv(csvContent: string): TwinsCourse[]
export function validateTwinsCsv(courses: TwinsCourse[]): ValidationResult
```

**タスク**:
1. [ ] CSVパース関数実装
2. [ ] バリデーション関数実装
3. [ ] ユニットテスト

### 2.2 要件判定ロジックの実装

**目標**: 履修データと要件を照合して充足状況を計算

**ファイル**: `src/lib/calculator/requirements.ts`

```typescript
export function calculateRequirementStatus(
  requirements: GraduationRequirements,
  courses: UserCourseRecord[]
): RequirementStatus

export function matchCourseToRule(
  course: UserCourseRecord,
  rule: RequirementRule
): boolean

export function isPassed(grade: Grade): boolean
```

**タスク**:
1. [ ] isPassed関数実装
2. [ ] matchCourseToRule関数実装
3. [ ] calculateRequirementStatus関数実装
4. [ ] ユニットテスト

### 2.3 CSVアップローダーの実装

**目標**: ファイルアップロードUIを実装

**ファイル**: `src/components/graduation/CsvUploader.tsx`

**タスク**:
1. [ ] ドラッグ&ドロップ対応
2. [ ] ファイル選択対応
3. [ ] パース結果のプレビュー
4. [ ] エラーハンドリング

### 2.4 ドーナツチャートの実装

**目標**: カテゴリ別進捗を可視化

**ファイル**: `src/components/graduation/DonutChart.tsx`

**選択肢**:
- Chart.js + solid-chartjs
- D3.js
- 自前SVG実装

**タスク**:
1. [ ] チャートライブラリ選定・インストール
2. [ ] DonutChart コンポーネント実装
3. [ ] アニメーション追加
4. [ ] ホバー時の詳細表示

### 2.5 要件ツリーの実装

**目標**: 詳細な要件充足状況を階層表示

**ファイル**: `src/components/graduation/RequirementTree.tsx`

**タスク**:
1. [ ] ツリー構造のレンダリング
2. [ ] 折りたたみ機能
3. [ ] 充足/未充足アイコン
4. [ ] 科目詳細ポップオーバー

### 2.6 サマリー表示の実装

**目標**: 卒業可否と概要を表示

**ファイル**: `src/components/graduation/RequirementsSummary.tsx`

**タスク**:
1. [ ] サマリーカード実装
2. [ ] 卒業可否判定表示
3. [ ] 必要残単位数表示

### 2.7 要件エディターの実装

**目標**: 卒業要件の編集機能

**ファイル**: `src/components/graduation/RequirementEditor.tsx`

**タスク**:
1. [ ] カテゴリ追加/編集/削除
2. [ ] サブカテゴリ追加/編集/削除
3. [ ] ルール追加/編集/削除
4. [ ] 科目検索・追加
5. [ ] JSONインポート/エクスポート

### 2.8 デフォルト要件データ作成

**目標**: 2024年入学工学システム学類の要件JSONを作成

**ファイル**: `src/data/default-requirements.json`

**タスク**:
1. [ ] 画像から要件を正確に抽出
2. [ ] JSON形式で記述
3. [ ] 初回起動時に自動読み込み

---

## Phase 3: 履修管理機能

### 3.1 kdbデータ取得・キャッシュ

**目標**: kdb.jsonを取得してIndexedDBにキャッシュ

**ファイル**: `src/lib/parsers/kdb.ts`

```typescript
export async function fetchKdbData(): Promise<Course[]>
export async function searchCourses(query: string): Promise<Course[]>
```

**タスク**:
1. [ ] fetchKdbData実装（キャッシュ付き）
2. [ ] searchCourses実装
3. [ ] 定期更新ロジック

### 3.2 学期ビューの実装

**目標**: 学期ごとの履修科目を表示

**ファイル**: `src/components/course/SemesterView.tsx`

**タスク**:
1. [ ] 学期ヘッダー
2. [ ] 科目リスト
3. [ ] 単位合計表示
4. [ ] 科目追加ボタン

### 3.3 科目カードの実装

**目標**: 各科目の情報を表示

**ファイル**: `src/components/course/CourseCard.tsx`

**タスク**:
1. [ ] 科目情報表示
2. [ ] 成績カラーコード
3. [ ] 削除ボタン
4. [ ] 編集機能

### 3.4 科目検索ダイアログの実装

**目標**: kdbから科目を検索して追加

**ファイル**: `src/components/course/CourseSearchDialog.tsx`

**タスク**:
1. [ ] 検索フォーム
2. [ ] 検索結果リスト
3. [ ] 科目追加機能
4. [ ] 手動追加フォーム

### 3.5 TWINSデータ連携

**目標**: TWINSデータを履修管理に反映

**タスク**:
1. [ ] 成績データのマッピング
2. [ ] 履修中科目の表示
3. [ ] 計画科目との連携

---

## Phase 4: 仕上げ

### 4.1 データエクスポート/インポート

**目標**: 全データをJSONでバックアップ・復元

**タスク**:
1. [ ] エクスポート機能
2. [ ] インポート機能
3. [ ] データ形式の検証

### 4.2 要件共有機能

**目標**: 卒業要件JSONを共有可能に

**タスク**:
1. [ ] 要件JSONのエクスポート
2. [ ] 要件JSONのインポート
3. [ ] URLでの共有（オプション）

### 4.3 UI/UX改善

**タスク**:
1. [ ] ローディング状態の表示
2. [ ] エラーメッセージの改善
3. [ ] アニメーション追加
4. [ ] レスポンシブ対応確認

### 4.4 テスト・デバッグ

**タスク**:
1. [ ] 手動テスト
2. [ ] エッジケースの確認
3. [ ] バグ修正

---

## 実装チェックリスト（進捗管理用）

### Phase 1: 基盤構築
- [ ] 1.1 プロジェクト構造のセットアップ
- [ ] 1.2 SolidUIコンポーネント追加
- [ ] 1.3 型定義の実装
- [ ] 1.4 IndexedDB操作の実装
- [ ] 1.5 基本レイアウトの実装

### Phase 2: 卒業要件チェック機能
- [ ] 2.1 TWINSパーサーの実装
- [ ] 2.2 要件判定ロジックの実装
- [ ] 2.3 CSVアップローダーの実装
- [ ] 2.4 ドーナツチャートの実装
- [ ] 2.5 要件ツリーの実装
- [ ] 2.6 サマリー表示の実装
- [ ] 2.7 要件エディターの実装
- [ ] 2.8 デフォルト要件データ作成

### Phase 3: 履修管理機能
- [ ] 3.1 kdbデータ取得・キャッシュ
- [ ] 3.2 学期ビューの実装
- [ ] 3.3 科目カードの実装
- [ ] 3.4 科目検索ダイアログの実装
- [ ] 3.5 TWINSデータ連携

### Phase 4: 仕上げ
- [ ] 4.1 データエクスポート/インポート
- [ ] 4.2 要件共有機能
- [ ] 4.3 UI/UX改善
- [ ] 4.4 テスト・デバッグ

---

## 追加ライブラリ（予定）

```json
{
  "dependencies": {
    "dexie": "^4.x",           // IndexedDB
    "chart.js": "^4.x",        // チャート（検討中）
    "solid-chartjs": "^1.x",   // Solid用Chart.js（検討中）
    "papaparse": "^5.x"        // CSVパース（オプション）
  }
}
```
