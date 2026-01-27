// 既存の型定義（段階的に廃止予定）
export * from "./course";
export * from "./enrollment";
export * from "./requirements";

// 新しいValibotスキーマ定義について:
// Valibot型定義は src/types/ に配置されています
// バリデーションが必要な場合は以下のように直接インポートしてください:
//   import { GraduationRequirementsSchema } from "@/types/requirements/graduation";
// 型のみが必要な場合は、このファイルから既存の型をインポートしてください
