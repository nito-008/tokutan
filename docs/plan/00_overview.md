# 筑波大学卒業要件チェッカー - 実装計画概要

## プロジェクト概要

筑波大学生向けの卒業要件チェッカーWebアプリケーション。TWINSからエクスポートしたCSVデータを読み込み、卒業要件の達成状況を可視化する。

## 技術スタック

- **フレームワーク**: SolidStart + SolidUI
- **スタイリング**: TailwindCSS
- **データベース**: IndexedDB（ブラウザ内永続化）
- **授業データソース**: kdb-crawler (https://raw.githubusercontent.com/s7tya/kdb-crawler/master/dist/kdb.json)

## 主要機能

### タブ1: 卒業要件チェック機能
1. TWINSのCSVデータ読み込み
2. 卒業要件達成状況の表示（ドーナツグラフ等）
3. 詳細な要件ごとの達成状況表示
4. 卒業要件のカスタマイズ（他学類・学年対応）
5. 卒業要件JSONのエクスポート/インポート（共有機能）

### タブ2: 4年間の履修管理機能
1. 学期ごとの履修科目管理
2. 成績反映（TWINSデータ連携）
3. 単位取得状況の可視化
4. 履修計画の作成支援

## データ構造概要

### 入力データ
- **TWINS CSV**: 学籍番号、科目番号、科目名、単位数、成績など
- **kdb.json**: 科目詳細情報（科目番号、科目名、単位数、開講学期など）

### 保存データ（IndexedDB）
- 卒業要件定義（JSON）
- ユーザーの履修データ
- 設定・プリファレンス

## 画面構成

```
┌─────────────────────────────────────────┐
│  ヘッダー: ロゴ + エクスポート/インポート │
├─────────────────────────────────────────┤
│  タブ: [卒業要件チェック] [履修管理]     │
├─────────────────────────────────────────┤
│                                         │
│  メインコンテンツエリア                  │
│                                         │
└─────────────────────────────────────────┘
```

## ファイル構成（予定）

```
src/
├── routes/
│   ├── index.tsx              # メインページ
│   └── [...404].tsx
├── components/
│   ├── ui/                    # SolidUI コンポーネント
│   ├── GraduationChecker/     # 卒業要件チェック関連
│   │   ├── RequirementEditor.tsx
│   │   ├── RequirementChart.tsx
│   │   ├── RequirementDetail.tsx
│   │   └── CsvUploader.tsx
│   └── CourseManager/         # 履修管理関連
│       ├── SemesterView.tsx
│       ├── CourseCard.tsx
│       └── CourseSearch.tsx
├── lib/
│   ├── utils.ts
│   ├── db/                    # IndexedDB操作
│   │   ├── index.ts
│   │   ├── requirements.ts
│   │   └── courses.ts
│   ├── parsers/               # データパーサー
│   │   ├── twins-csv.ts
│   │   └── kdb.ts
│   └── types/                 # TypeScript型定義
│       ├── requirements.ts
│       ├── course.ts
│       └── twins.ts
└── stores/                    # 状態管理
    ├── requirements.ts
    └── courses.ts
```

## 実装フェーズ

### Phase 1: 基盤構築
- プロジェクト構造のセットアップ
- 型定義の作成
- IndexedDB操作の実装
- 基本UIコンポーネントの追加

### Phase 2: 卒業要件チェック機能
- 卒業要件JSONスキーマの設計・実装
- TWINS CSV パーサーの実装
- 要件判定ロジックの実装
- 可視化コンポーネントの実装

### Phase 3: 履修管理機能
- kdbデータの取得・キャッシュ
- 履修管理UIの実装
- TWINSデータとの連携

### Phase 4: 仕上げ
- データエクスポート/インポート機能
- UI/UXの改善
- テスト・デバッグ

## 次のステップ

詳細な計画は以下のドキュメントで定義:
1. [01_requirements_schema.md](./01_requirements_schema.md) - 卒業要件スキーマ
2. [02_data_model.md](./02_data_model.md) - データモデル設計
3. [03_ui_design.md](./03_ui_design.md) - UI/UX設計
4. [04_implementation.md](./04_implementation.md) - 実装手順
5. [05_storage.md](./05_storage.md) - IndexedDB設計
