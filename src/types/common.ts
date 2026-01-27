import * as v from "valibot";

/**
 * 共通スキーマ定義
 */

// UUID形式のID
export const IdSchema = v.pipe(v.string(), v.minLength(1));
export type Id = v.InferOutput<typeof IdSchema>;

// ISO8601形式の日時文字列
export const DateTimeSchema = v.pipe(v.string(), v.isoDateTime());
export type DateTime = v.InferOutput<typeof DateTimeSchema>;

// 年度
export const YearSchema = v.pipe(v.number(), v.integer(), v.minValue(1900), v.maxValue(2100));
export type Year = v.InferOutput<typeof YearSchema>;

// バージョン文字列
export const VersionSchema = v.pipe(v.string(), v.minLength(1));
export type Version = v.InferOutput<typeof VersionSchema>;
