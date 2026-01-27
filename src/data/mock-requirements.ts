import type { GraduationRequirements } from "~/lib/types";

export const mockRequirements: GraduationRequirements[] = [
  {
    id: "sosys-2024",
    year: 2024,
    department: "社会工学類",
    major: "社会工学専攻",
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
            type: "required",
            courseIds: [],
          },
          {
            id: "specialized-elective",
            type: "elective",
            minCredits: 40,
            groups: [],
          },
        ],
      },
      {
        id: "foundation",
        name: "専門基礎科目",
        subcategories: [
          {
            id: "foundation-required",
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
            type: "required",
            courseIds: [],
          },
          {
            id: "common-pe",
            type: "required",
            courseIds: [],
          },
          {
            id: "common-english",
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
            type: "elective",
            minCredits: 15,
            groups: [],
          },
        ],
      },
    ],
  },
  {
    id: "klis-2024",
    year: 2024,
    department: "知識情報・図書館学類",
    major: "知識情報専攻",
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
            type: "required",
            courseIds: [],
          },
          {
            id: "specialized-elective",
            type: "elective",
            minCredits: 40,
            groups: [],
          },
        ],
      },
      {
        id: "foundation",
        name: "専門基礎科目",
        subcategories: [
          {
            id: "foundation-required",
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
            type: "required",
            courseIds: [],
          },
          {
            id: "common-pe",
            type: "required",
            courseIds: [],
          },
          {
            id: "common-english",
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
            type: "elective",
            minCredits: 15,
            groups: [],
          },
        ],
      },
    ],
  },
  {
    id: "coins-2024",
    year: 2024,
    department: "情報科学類",
    major: "情報科学専攻",
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
            type: "required",
            courseIds: [],
          },
          {
            id: "specialized-elective",
            type: "elective",
            minCredits: 40,
            groups: [],
          },
        ],
      },
      {
        id: "foundation",
        name: "専門基礎科目",
        subcategories: [
          {
            id: "foundation-required",
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
            type: "required",
            courseIds: [],
          },
          {
            id: "common-pe",
            type: "required",
            courseIds: [],
          },
          {
            id: "common-english",
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
            type: "elective",
            minCredits: 15,
            groups: [],
          },
        ],
      },
    ],
  },
];
