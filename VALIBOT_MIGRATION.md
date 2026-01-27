# Valibot型定義移行 - 実装完了報告

## 実装内容

TypeScript型定義をValibotベースに移行し、JSONスキーマの自動生成を可能にしました。

## 実装されたファイル

### 1. 依存関係
- `valibot` - バリデーションライブラリ
- `@valibot/to-json-schema` - JSON Schema生成
- `tsx` - TypeScript実行環境

### 2. 新規作成ファイル

#### 共通スキーマ
- `src/types/common.ts` - ID、日時、年度などの共通スキーマ

#### 卒業要件関連（`src/types/requirements/`）
1. `group-rule.ts` - 4種類のグループルール（specific, prefix, exclude, category）
2. `requirement-group.ts` - 要件グループ
3. `subcategory.ts` - 3種類のサブカテゴリ（required, elective, free）
4. `category.ts` - 要件カテゴリ
5. `graduation.ts` - 卒業要件全体
6. `status.ts` - 充足状況の計算結果
7. `index.ts` - エクスポート

#### 履修データ関連（`src/types/enrollment/`）
1. `grade.ts` - 成績と科目区分
2. `course-record.ts` - 履修記録とTWINSデータ
3. `user-profile.ts` - ユーザープロファイル
4. `enrollment-data.ts` - 履修データ
5. `course-plan.ts` - 履修計画
6. `index.ts` - エクスポート

#### メインエクスポート
- `src/types/index.ts` - 全スキーマの統合エクスポート

#### スクリプト
- `scripts/generate-schemas.ts` - JSON Schema生成スクリプト

#### ドキュメント
- `src/types/README.md` - 使用方法とガイド
- `src/types/__tests__/validation.test.ts` - バリデーションテスト例

### 3. 更新ファイル

- `package.json` - `gen` スクリプト追加
- `src/lib/types/index.ts` - 既存型定義を維持、新型定義へのコメント追加

## 生成されたJSONスキーマ

`schema/` ディレクトリに以下のファイルが生成されます：

1. `requirements.json` (20KB) - 卒業要件の定義スキーマ
2. `requirement_status.json` (8KB) - 要件充足状況スキーマ
3. `user_profile.json` (1KB) - ユーザープロファイルスキーマ
4. `enrollment_data.json` (2KB) - 履修データスキーマ
5. `course_plan.json` (2KB) - 履修計画スキーマ

## 使用方法

### スキーマ生成

```bash
npm run gen
```

### 型として使用

```typescript
import type { GraduationRequirements } from "@/types/requirements/graduation";

const requirements: GraduationRequirements = {
  // ...
};
```

### バリデーション

```typescript
import { safeParse } from "valibot";
import { GraduationRequirementsSchema } from "@/types/requirements/graduation";

const result = safeParse(GraduationRequirementsSchema, data);
if (result.success) {
  console.log(result.output);
} else {
  console.error(result.issues);
}
```

## 検証結果

### ✅ スキーマ生成
```bash
npm run gen
```
- 5つのJSONスキーマファイルが正常に生成されました

### ✅ 型チェック
```bash
npm run typecheck
```
- 型エラーなし

### ✅ ビルド
```bash
npm run build
```
- 正常にビルド完了

## 主な機能

### 1. ユニオン型のサポート
Valibotの `variant` を使用した判別可能なユニオン型：
- `GroupRule` - 4種類のルール（specific/prefix/exclude/category）
- `RequirementSubcategory` - 3種類（required/elective/free）

### 2. バリデーションルール
- 文字列の最小長チェック
- 数値の範囲チェック（0以上、年度は1900-2100）
- ISO 8601日時フォーマットチェック
- 必須・オプショナルフィールドの区別

### 3. JSON Schema出力
- Draft 7準拠
- ユニオン型は `oneOf` で表現
- 各スキーマに説明（description）を付与

## 既存コードとの互換性

### 移行期間中の対応
- `src/lib/types/` の既存型定義は維持
- 新旧どちらの型定義も使用可能
- 型の互換性は保たれている

### 推奨される使い分け
- **型のみ必要**: 既存の型定義を継続使用可能
- **バリデーション必要**: 新しいValibot定義を使用

## 今後の移行計画

1. 既存コードでバリデーションが必要な箇所を特定
2. 段階的に新しいValibot定義へ移行
3. 移行完了後、`src/lib/types/requirements.ts` と `enrollment.ts` を削除
4. `src/lib/types/course.ts` は移行対象外として維持

## 参考資料

- [Valibot公式ドキュメント](https://valibot.dev/)
- プロジェクト内ドキュメント: `src/types/README.md`
