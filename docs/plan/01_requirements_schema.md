# 卒業要件スキーマ設計

## 概要

卒業要件をJSONで表現し、編集・共有可能にする。2024年入学 工学システム学類の要件を基準に設計。

## 卒業要件構造（2024年入学 工学システム学類）

### 必要単位数: 125単位

画像から読み取った卒業要件:

| カテゴリ | 区分 | 必要単位数 | 備考 |
|---------|------|-----------|------|
| **専門科目** | 必修科目 | 25 | |
| | 選択科目 | 40〜49 | |
| **専門基礎科目** | 必修科目 | 31 | 数学リテラシー1〜2、線形代数1〜3等 |
| | 選択科目 | 0 | |
| | 自由科目 | 0 | |
| **共通科目** | 総合科目（FYS、学問への誘い） | 2 | |
| | 総合科目（学士基礎科目） | 1〜3 | |
| | 体育 | 3 | |
| | 第1外国語（英語） | 4 | |
| | 第2外国語（初修外国語） | 0〜4 | |
| | 芸術 | 0〜1 | |
| | 国語 | 0〜1 | |
| **基礎科目** | 関連科目 | | |
| | 他学群又は他学類の授業科目 | 6〜15 | |
| **合計** | | 125 | |

### 専門科目 必修科目一覧

| 科目番号 | 科目名 | 単位数 |
|---------|--------|-------|
| FG11,FG21〜 | プログラミング序論C | 2 |
| FG11,FG21〜 | プログラミング序論D | 1 |
| | 工学システム基礎実験A | 2 |
| FG12,FG22〜 | 工学システム基礎実験B | 2 |
| FG13,FG23〜 | 始まる科目（実務系） | 1 |
| | 工学者のための倫理 | 1 |
| | 専門英語A | 1 |
| | 専門英語B（注10） | 1 |
| | 専門英語演習（注10） | 1 |
| FG17,FG24,FG25 | 始まる授業科目 | 16〜 |
| | 卒業研究A | 4 |
| | 卒業研究B | 4 |

### 専門基礎科目 必修科目一覧

| 科目番号 | 科目名 | 単位数 |
|---------|--------|-------|
| | 数学リテラシー1 | 1 |
| | 数学リテラシー2 | 1 |
| | 線形代数1 | 1 |
| | 線形代数2 | 1 |
| | 微積分1 | 1 |
| | 微積分2 | 1 |
| | 微積分3 | 1 |
| | 力学1 | 1 |
| | 力学2 | 1 |
| | 力学3 | 1 |
| | 電磁気学1 | 1 |
| | 電磁気学2 | 1 |
| | 電磁気学3 | 1 |
| | 工学システム原論 | 1 |
| | 線形代数総論A | 1 |
| | 線形代数総論B | 2 |
| | 解析学総論 | 1 |
| | 常微分方程式 | 2 |
| | 力学総論 | 1 |
| | 電磁気学総論 | 1 |
| | 材料力学基礎 | 1 |
| | 熱力学基礎 | 1 |
| | 流体力学基礎 | 1 |
| | 複素解析 | 2 |
| | プログラミング序論A | 2 |
| | プログラミング序論B | 1 |

## JSONスキーマ設計

```typescript
// 卒業要件全体の型
interface GraduationRequirements {
  id: string;                    // ユニークID
  name: string;                  // 要件名（例: "2024年入学 工学システム学類"）
  year: number;                  // 入学年度
  department: string;            // 学類名
  totalCredits: number;          // 卒業に必要な総単位数
  categories: RequirementCategory[];  // カテゴリ一覧
  version: string;               // スキーマバージョン
  createdAt: string;             // 作成日時
  updatedAt: string;             // 更新日時
}

// 要件カテゴリ（専門科目、専門基礎科目、共通科目など）
interface RequirementCategory {
  id: string;
  name: string;                  // カテゴリ名
  subcategories: RequirementSubcategory[];  // サブカテゴリ
  minCredits?: number;           // カテゴリ全体の最小単位数
  maxCredits?: number;           // カテゴリ全体の最大単位数
}

// サブカテゴリ（必修、選択など）
interface RequirementSubcategory {
  id: string;
  name: string;                  // サブカテゴリ名（必修、選択、自由など）
  type: 'required' | 'elective' | 'free';
  minCredits: number;            // 最小必要単位数
  maxCredits?: number;           // 最大単位数（上限がある場合）
  rules: RequirementRule[];      // ルール一覧
  notes?: string;                // 備考
}

// 要件ルール（科目の条件）
interface RequirementRule {
  id: string;
  type: 'specific' | 'pattern' | 'group';
  description?: string;          // ルールの説明

  // type: 'specific' の場合 - 特定の科目を指定
  courseIds?: string[];          // 科目番号リスト

  // type: 'pattern' の場合 - 科目番号パターンで指定
  courseIdPattern?: string;      // 正規表現パターン（例: "^FG1[78]"）

  // type: 'group' の場合 - グループからN単位取得
  groupName?: string;            // グループ名
  groupCourseIds?: string[];     // グループに含まれる科目

  minCredits?: number;           // このルールで必要な最小単位数
  maxCredits?: number;           // このルールで認められる最大単位数
  required?: boolean;            // 必須かどうか（specific typeの場合）
}

// 科目情報（kdbから取得）
interface Course {
  id: string;                    // 科目番号
  name: string;                  // 科目名
  credits: number;               // 単位数
  grade?: number;                // 標準履修年次
  semester?: string;             // 実施学期
  schedule?: string;             // 曜時限
  instructor?: string;           // 担当教員
  description?: string;          // 授業概要
  notes?: string;                // 備考
}

// ユーザーの履修記録（TWINSから）
interface UserCourse {
  courseId: string;              // 科目番号
  courseName: string;            // 科目名
  credits: number;               // 単位数
  grade: Grade;                  // 成績
  year: number;                  // 開講年度
  semester: 'spring' | 'fall' | 'full';  // 学期
  category: string;              // 科目区分
}

// 成績
type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'P' | '認' | '履修中';

// 成績が合格かどうかを判定
function isPassed(grade: Grade): boolean {
  return ['A+', 'A', 'B', 'C', 'P', '認'].includes(grade);
}
```

## 2024年入学 工学システム学類 デフォルト要件JSON

```json
{
  "id": "esys-2024",
  "name": "2024年入学 工学システム学類",
  "year": 2024,
  "department": "工学システム学類",
  "totalCredits": 125,
  "version": "1.0.0",
  "categories": [
    {
      "id": "specialized",
      "name": "専門科目",
      "subcategories": [
        {
          "id": "specialized-required",
          "name": "必修科目",
          "type": "required",
          "minCredits": 25,
          "rules": [
            {
              "id": "prog-c",
              "type": "specific",
              "courseIds": ["FG20204"],
              "description": "プログラミング序論C",
              "required": true
            },
            {
              "id": "prog-d",
              "type": "specific",
              "courseIds": ["FG20214"],
              "description": "プログラミング序論D",
              "required": true
            },
            {
              "id": "exp-a",
              "type": "specific",
              "courseIds": ["FG19103"],
              "description": "工学システム基礎実験A",
              "required": true
            },
            {
              "id": "exp-b",
              "type": "specific",
              "courseIds": ["FG19113"],
              "description": "工学システム基礎実験B",
              "required": true
            },
            {
              "id": "eng-a",
              "type": "specific",
              "courseIds": ["FG18112"],
              "description": "専門英語A",
              "required": true
            },
            {
              "id": "eng-b",
              "type": "specific",
              "courseIds": ["FG20222"],
              "description": "専門英語B",
              "required": true
            },
            {
              "id": "fg17-24-25",
              "type": "pattern",
              "courseIdPattern": "^FG(17|24|25)",
              "description": "FG17, FG24, FG25で始まる授業科目",
              "minCredits": 16
            }
          ]
        },
        {
          "id": "specialized-elective",
          "name": "選択科目",
          "type": "elective",
          "minCredits": 40,
          "maxCredits": 49,
          "rules": [
            {
              "id": "fg-pattern",
              "type": "pattern",
              "courseIdPattern": "^FG",
              "description": "FGで始まる授業科目"
            }
          ]
        }
      ]
    },
    {
      "id": "specialized-foundation",
      "name": "専門基礎科目",
      "subcategories": [
        {
          "id": "foundation-required",
          "name": "必修科目",
          "type": "required",
          "minCredits": 31,
          "rules": [
            {
              "id": "math-literacy",
              "type": "specific",
              "courseIds": ["FA01141", "FA01241"],
              "description": "数学リテラシー1, 2",
              "required": true
            },
            {
              "id": "linear-algebra",
              "type": "specific",
              "courseIds": ["FA01641", "FA01741", "FA01841"],
              "description": "線形代数1, 2, 3",
              "required": true
            },
            {
              "id": "calculus",
              "type": "specific",
              "courseIds": ["FA01341", "FA01441", "FA01541"],
              "description": "微積分1, 2, 3",
              "required": true
            },
            {
              "id": "mechanics",
              "type": "specific",
              "courseIds": ["FCB1201", "FCB1241", "FCB1291"],
              "description": "力学1, 2, 3",
              "required": true
            },
            {
              "id": "electromagnetism",
              "type": "specific",
              "courseIds": ["FCB1321", "FCB1361", "FCB1381"],
              "description": "電磁気学1, 2, 3",
              "required": true
            },
            {
              "id": "esys-intro",
              "type": "specific",
              "courseIds": ["FG10651"],
              "description": "工学システム原論",
              "required": true
            },
            {
              "id": "linear-algebra-adv",
              "type": "specific",
              "courseIds": ["FG10704", "FG10724"],
              "description": "線形代数総論A, B",
              "required": true
            },
            {
              "id": "analysis",
              "type": "specific",
              "courseIds": ["FG10744"],
              "description": "解析学総論",
              "required": true
            },
            {
              "id": "ode",
              "type": "specific",
              "courseIds": ["FG10764"],
              "description": "常微分方程式",
              "required": true
            },
            {
              "id": "mechanics-adv",
              "type": "specific",
              "courseIds": ["FG10814"],
              "description": "力学総論",
              "required": true
            },
            {
              "id": "em-adv",
              "type": "specific",
              "courseIds": ["FG10834"],
              "description": "電磁気学総論",
              "required": true
            },
            {
              "id": "material-mech",
              "type": "specific",
              "courseIds": ["FG10864"],
              "description": "材料力学基礎",
              "required": true
            },
            {
              "id": "thermodynamics",
              "type": "specific",
              "courseIds": ["FG10911"],
              "description": "熱力学基礎",
              "required": true
            },
            {
              "id": "fluid",
              "type": "specific",
              "courseIds": ["FG10851"],
              "description": "流体力学基礎",
              "required": true
            },
            {
              "id": "complex",
              "type": "specific",
              "courseIds": ["FG10784"],
              "description": "複素解析",
              "required": true
            },
            {
              "id": "prog-a",
              "type": "specific",
              "courseIds": ["FG10874"],
              "description": "プログラミング序論A",
              "required": true
            },
            {
              "id": "prog-b",
              "type": "specific",
              "courseIds": ["FG10904"],
              "description": "プログラミング序論B",
              "required": true
            }
          ]
        }
      ]
    },
    {
      "id": "common",
      "name": "共通科目",
      "subcategories": [
        {
          "id": "common-general",
          "name": "総合科目（FYS、学問への誘い）",
          "type": "required",
          "minCredits": 2,
          "rules": [
            {
              "id": "fys",
              "type": "specific",
              "courseIds": ["1116302"],
              "description": "ファーストイヤーセミナー",
              "required": true
            },
            {
              "id": "intro",
              "type": "specific",
              "courseIds": ["1227491"],
              "description": "学問への誘い",
              "required": true
            }
          ]
        },
        {
          "id": "common-bachelor",
          "name": "総合科目（学士基礎科目）",
          "type": "elective",
          "minCredits": 1,
          "maxCredits": 3,
          "rules": []
        },
        {
          "id": "common-pe",
          "name": "体育",
          "type": "required",
          "minCredits": 3,
          "rules": [
            {
              "id": "pe-basic",
              "type": "pattern",
              "courseIdPattern": "^21[0-9]{5}",
              "description": "体育科目"
            }
          ]
        },
        {
          "id": "common-english",
          "name": "第1外国語（英語）",
          "type": "required",
          "minCredits": 4,
          "rules": [
            {
              "id": "english",
              "type": "pattern",
              "courseIdPattern": "^31[A-Z]{2}",
              "description": "英語科目"
            }
          ]
        },
        {
          "id": "common-second-lang",
          "name": "第2外国語（初修外国語）",
          "type": "elective",
          "minCredits": 0,
          "maxCredits": 4,
          "rules": [
            {
              "id": "second-lang",
              "type": "pattern",
              "courseIdPattern": "^34[A-Z0-9]{2}",
              "description": "初修外国語"
            }
          ]
        },
        {
          "id": "common-art",
          "name": "芸術",
          "type": "elective",
          "minCredits": 0,
          "maxCredits": 1,
          "rules": []
        },
        {
          "id": "common-japanese",
          "name": "国語",
          "type": "elective",
          "minCredits": 0,
          "maxCredits": 1,
          "rules": []
        }
      ]
    },
    {
      "id": "foundation",
      "name": "基礎科目",
      "subcategories": [
        {
          "id": "foundation-related",
          "name": "関連科目",
          "type": "elective",
          "minCredits": 0,
          "rules": []
        },
        {
          "id": "foundation-other",
          "name": "他学群又は他学類の授業科目",
          "type": "elective",
          "minCredits": 6,
          "maxCredits": 15,
          "rules": [
            {
              "id": "other-dept",
              "type": "pattern",
              "courseIdPattern": "^(GB|GC|GA|GE)",
              "description": "他学類の科目（情報学群など）"
            }
          ],
          "notes": "注9参照"
        }
      ]
    }
  ]
}
```

## 科目区分の判定ロジック

TWINSのCSVには `科目区分` フィールドがある:
- `A`: 専門科目
- `B`: 専門基礎科目
- `C`: 共通科目

これを使って自動分類を行い、さらに科目番号パターンで詳細分類する。

## 備考・注釈の扱い

画像の注釈（注1〜注13）は重要な情報を含むため、ルールの `notes` フィールドに保存する。

## 編集機能の実装

- カテゴリの追加・削除・編集
- サブカテゴリの追加・削除・編集
- ルールの追加・削除・編集
- 必要単位数の変更
- 科目番号の追加・削除

UIでは以下を提供:
1. ツリー構造での要件表示
2. 各項目の編集ダイアログ
3. 科目検索（kdbから）と追加
4. JSON形式でのインポート/エクスポート
