import type { GraduationRequirements } from "~/lib/types";

export const mockRequirements: GraduationRequirements[] = [
  {
    id: "sosys-2024",
    name: "2024年入学 社会工学類",
    year: 2024,
    department: "社会工学類",
    totalCredits: 125,
    version: "1.0.0",
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    categories: [
      {
        id: "specialized",
        name: "専門科目",
        subcategories: [
          {
            id: "specialized-required",
            name: "必修科目",
            type: "required",
            courseIds: [],
          },
          {
            id: "specialized-elective",
            name: "選択科目",
            type: "elective",
            minCredits: 40,
            rules: [],
          },
        ],
      },
      {
        id: "foundation",
        name: "専門基礎科目",
        subcategories: [
          {
            id: "foundation-required",
            name: "必修科目",
            type: "required",
            courseIds: [],
          },
        ],
      },
      {
        id: "common",
        name: "共通科目",
        subcategories: [
          {
            id: "common-fys",
            name: "総合科目（FYS、学問への誘い）",
            type: "required",
            courseIds: [],
          },
          {
            id: "common-pe",
            name: "体育",
            type: "required",
            courseIds: [],
          },
          {
            id: "common-english",
            name: "第1外国語（英語）",
            type: "required",
            courseIds: [],
          },
        ],
      },
      {
        id: "basic",
        name: "基礎科目",
        subcategories: [
          {
            id: "basic-other",
            name: "他学群又は他学類の授業科目",
            type: "elective",
            minCredits: 15,
            rules: [],
          },
        ],
      },
    ],
  },
  {
    id: "klis-2024",
    name: "2024年入学 知識情報・図書館学類",
    year: 2024,
    department: "知識情報・図書館学類",
    totalCredits: 125,
    version: "1.0.0",
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    categories: [
      {
        id: "specialized",
        name: "専門科目",
        subcategories: [
          {
            id: "specialized-required",
            name: "必修科目",
            type: "required",
            courseIds: [],
          },
          {
            id: "specialized-elective",
            name: "選択科目",
            type: "elective",
            minCredits: 40,
            rules: [],
          },
        ],
      },
      {
        id: "foundation",
        name: "専門基礎科目",
        subcategories: [
          {
            id: "foundation-required",
            name: "必修科目",
            type: "required",
            courseIds: [],
          },
        ],
      },
      {
        id: "common",
        name: "共通科目",
        subcategories: [
          {
            id: "common-fys",
            name: "総合科目（FYS、学問への誘い）",
            type: "required",
            courseIds: [],
          },
          {
            id: "common-pe",
            name: "体育",
            type: "required",
            courseIds: [],
          },
          {
            id: "common-english",
            name: "第1外国語（英語）",
            type: "required",
            courseIds: [],
          },
        ],
      },
      {
        id: "basic",
        name: "基礎科目",
        subcategories: [
          {
            id: "basic-other",
            name: "他学群又は他学類の授業科目",
            type: "elective",
            minCredits: 15,
            rules: [],
          },
        ],
      },
    ],
  },
  {
    id: "coins-2024",
    name: "2024年入学 情報科学類",
    year: 2024,
    department: "情報科学類",
    totalCredits: 125,
    version: "1.0.0",
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    categories: [
      {
        id: "specialized",
        name: "専門科目",
        subcategories: [
          {
            id: "specialized-required",
            name: "必修科目",
            type: "required",
            courseIds: [],
          },
          {
            id: "specialized-elective",
            name: "選択科目",
            type: "elective",
            minCredits: 40,
            rules: [],
          },
        ],
      },
      {
        id: "foundation",
        name: "専門基礎科目",
        subcategories: [
          {
            id: "foundation-required",
            name: "必修科目",
            type: "required",
            courseIds: [],
          },
        ],
      },
      {
        id: "common",
        name: "共通科目",
        subcategories: [
          {
            id: "common-fys",
            name: "総合科目（FYS、学問への誘い）",
            type: "required",
            courseIds: [],
          },
          {
            id: "common-pe",
            name: "体育",
            type: "required",
            courseIds: [],
          },
          {
            id: "common-english",
            name: "第1外国語（英語）",
            type: "required",
            courseIds: [],
          },
        ],
      },
      {
        id: "basic",
        name: "基礎科目",
        subcategories: [
          {
            id: "basic-other",
            name: "他学群又は他学類の授業科目",
            type: "elective",
            minCredits: 15,
            rules: [],
          },
        ],
      },
    ],
  },
];
