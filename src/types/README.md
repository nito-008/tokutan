# Valibot型定義

このディレクトリには、Valibotベースの型定義とスキーマが含まれています。

## 概要

- **バリデーション**: Valibotスキーマを使用してランタイムバリデーションが可能
- **JSON Schema生成**: `npm run gen` で自動的にJSON Schemaを生成
- **型安全性**: TypeScriptの型推論により、スキーマから型を自動生成

## ディレクトリ構成

```
src/types/
├── common.ts              # 共通スキーマ（ID、日時など）
├── requirements/          # 卒業要件関連
│   ├── group-rule.ts      # グループルール（4種類）
│   ├── requirement-group.ts
│   ├── subcategory.ts     # サブカテゴリ（3種類）
│   ├── category.ts
│   ├── graduation.ts      # 卒業要件全体
│   └── status.ts          # 充足状況
└── enrollment/            # 履修データ関連
    ├── grade.ts
    ├── course-record.ts
    ├── user-profile.ts
    ├── enrollment-data.ts
    └── course-plan.ts
```

## 使用方法

### 型として使用

```typescript
import type { GraduationRequirements } from "@/types/requirements/graduation";

const requirements: GraduationRequirements = {
  id: "req-001",
  year: 2024,
  department: "情報科学類",
  // ...
};
```

### バリデーションに使用

```typescript
import { parse } from "valibot";
import { GraduationRequirementsSchema } from "@/types/requirements/graduation";

// データをバリデーション
const result = parse(GraduationRequirementsSchema, data);

// または、安全なパース
import { safeParse } from "valibot";
const result = safeParse(GraduationRequirementsSchema, data);
if (result.success) {
  console.log(result.output);
} else {
  console.error(result.issues);
}
```

### JSON Schema生成

```bash
npm run gen
```

生成されたスキーマは `schema/` ディレクトリに出力されます：

- `requirements.json` - 卒業要件スキーマ
- `requirement_status.json` - 充足状況スキーマ
- `user_profile.json` - ユーザープロファイルスキーマ
- `enrollment_data.json` - 履修データスキーマ
- `course_plan.json` - 履修計画スキーマ

## 既存の型定義との関係

現在、`src/lib/types/` には従来のTypeScript型定義が残っています。
これらは段階的に廃止される予定です。

**新規コードでは、`src/types/` のValibot定義を使用してください。**

### 移行期間中の使い分け

- **型のみが必要な場合**: どちらでも使用可能（互換性あり）
- **バリデーションが必要な場合**: `src/types/` のValibot定義を使用

```typescript
// 既存の型定義
import type { GraduationRequirements } from "@/lib/types";

// 新しいValibot定義（バリデーション付き）
import { GraduationRequirementsSchema, type GraduationRequirements } from "@/types/requirements/graduation";
```

## 型の追加・変更

1. 対応するファイルでスキーマを更新
2. `npm run gen` でJSON Schemaを再生成
3. `npm run typecheck` で型エラーがないことを確認

## スキーマの特徴

### ユニオン型のサポート

Valibotの `variant` を使用して、判別可能なユニオン型を定義：

```typescript
// GroupRule: 4種類のルール
export const GroupRuleSchema = v.variant("type", [
  SpecificRuleSchema,    // type: "specific"
  PrefixRuleSchema,      // type: "prefix"
  ExcludeRuleSchema,     // type: "exclude"
  CategoryRuleSchema,    // type: "category"
]);
```

### バリデーションルール

- 文字列の最小長チェック
- 数値の範囲チェック（最小値・最大値）
- ISO 8601日時フォーマットチェック
- 必須フィールドとオプショナルフィールドの区別

## 参考

- [Valibot公式ドキュメント](https://valibot.dev/)
- [JSON Schema変換](https://valibot.dev/guides/methods/#tojsonschema)
