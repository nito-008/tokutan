#!/usr/bin/env tsx

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { toJsonSchema } from "@valibot/to-json-schema";
import { GraduationRequirementsSchema } from "../src/types/requirements/graduation";

const schemaDir = join(process.cwd(), "schema");
mkdirSync(schemaDir, { recursive: true });

const jsonSchema = toJsonSchema(GraduationRequirementsSchema);
jsonSchema.description = "卒業要件の定義スキーマ（学年・学科・専攻ごとの単位要件）";

const filePath = join(schemaDir, "requirements.json");
writeFileSync(filePath, JSON.stringify(jsonSchema, null, 2), "utf-8");
console.log(`Generated: ${filePath}`);
