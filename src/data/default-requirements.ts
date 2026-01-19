import type { GraduationRequirements } from "~/lib/types";

export const defaultRequirements: GraduationRequirements = {
  id: "esys-2024",
  name: "2024年入学 工学システム学類",
  year: 2024,
  department: "工学システム学類",
  totalCredits: 125,
  version: "1.0.0",
  isDefault: true,
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
          requiredCourses: [
            { id: "req-1", equivalentIds: ["FG20204"] },
            { id: "req-2", equivalentIds: ["FG20214"] },
            { id: "req-3", equivalentIds: ["FG19103"] },
            { id: "req-4", equivalentIds: ["FG19113"] },
            { id: "req-5", equivalentIds: ["FG18112"] },
            { id: "req-6", equivalentIds: ["FG20222"] },
          ],
        },
        {
          id: "specialized-elective",
          name: "選択科目",
          type: "elective",
          minCredits: 40,
          maxCredits: 49,
          rules: [
            {
              id: "fg-ff-gb",
              type: "pattern",
              courseIdPattern: "^(FG|FF|GB)",
              description: "FG, FF, GBで始まる専門選択科目",
            },
            {
              id: "fg17-24-25",
              type: "pattern",
              courseIdPattern: "^FG(17|24|25)",
              description: "FG17, FG24, FG25で始まる授業科目",
            },
          ],
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
          requiredCourses: [
            { id: "req-7", equivalentIds: ["FA01141"] },
            { id: "req-8", equivalentIds: ["FA01241"] },
            { id: "req-9", equivalentIds: ["FA01641"] },
            { id: "req-10", equivalentIds: ["FA01741"] },
            { id: "req-11", equivalentIds: ["FA01841"] },
            { id: "req-12", equivalentIds: ["FA01341"] },
            { id: "req-13", equivalentIds: ["FA01441"] },
            { id: "req-14", equivalentIds: ["FA01541"] },
            { id: "req-15", equivalentIds: ["FCB1201"] },
            { id: "req-16", equivalentIds: ["FCB1241"] },
            { id: "req-17", equivalentIds: ["FCB1291"] },
            { id: "req-18", equivalentIds: ["FCB1321"] },
            { id: "req-19", equivalentIds: ["FCB1361"] },
            { id: "req-20", equivalentIds: ["FCB1381"] },
            { id: "req-21", equivalentIds: ["FG10651"] },
            { id: "req-22", equivalentIds: ["FG10704"] },
            { id: "req-23", equivalentIds: ["FG10724"] },
            { id: "req-24", equivalentIds: ["FG10744"] },
            { id: "req-25", equivalentIds: ["FG10764"] },
            { id: "req-26", equivalentIds: ["FG10814"] },
            { id: "req-27", equivalentIds: ["FG10834"] },
            { id: "req-28", equivalentIds: ["FG10864"] },
            { id: "req-29", equivalentIds: ["FG10911"] },
            { id: "req-30", equivalentIds: ["FG10851"] },
            { id: "req-31", equivalentIds: ["FG10784"] },
            { id: "req-32", equivalentIds: ["FG10874"] },
            { id: "req-33", equivalentIds: ["FG10904"] },
          ],
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
          requiredCourses: [
            { id: "req-34", equivalentIds: ["1116302"] },
            { id: "req-35", equivalentIds: ["1227491"] },
          ],
        },
        {
          id: "common-bachelor",
          name: "総合科目（学士基礎科目）",
          type: "elective",
          minCredits: 1,
          maxCredits: 3,
          rules: [],
        },
        {
          id: "common-pe",
          name: "体育",
          type: "elective",
          minCredits: 3,
          rules: [
            {
              id: "pe",
              type: "pattern",
              courseIdPattern: "^21[0-9]{5}",
              description: "体育科目",
            },
          ],
        },
        {
          id: "common-english",
          name: "第1外国語（英語）",
          type: "elective",
          minCredits: 4,
          rules: [
            {
              id: "english",
              type: "pattern",
              courseIdPattern: "^31[A-Z]{2}",
              description: "英語科目",
            },
          ],
        },
        {
          id: "common-second",
          name: "第2外国語（初修外国語）",
          type: "elective",
          minCredits: 0,
          maxCredits: 4,
          rules: [
            {
              id: "second-lang",
              type: "pattern",
              courseIdPattern: "^34[A-Z0-9]{2}",
              description: "初修外国語",
            },
          ],
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
          minCredits: 6,
          maxCredits: 15,
          rules: [
            {
              id: "other-dept",
              type: "pattern",
              courseIdPattern: "^(GB|GC|GA|GE|BC)",
              description: "他学類の科目",
            },
          ],
          notes: "情報学群、他学類の科目",
        },
      ],
    },
  ],
};
