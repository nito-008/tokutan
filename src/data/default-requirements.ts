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
          courseIds: ["FG20204", "FG20214", "FG19103", "FG19113", "FG18112", "FG20222"],
        },
        {
          id: "specialized-elective",
          name: "選択科目",
          type: "elective",
          minCredits: 40,
          maxCredits: 49,
          groups: [
            {
              id: "fg-ff-gb-group",
              minCredits: 0,
              rules: [
                { id: "fg-prefix", type: "prefix", prefix: "FG" },
                { id: "ff-prefix", type: "prefix", prefix: "FF" },
                { id: "gb-prefix", type: "prefix", prefix: "GB" },
              ],
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
          courseIds: [
            "FA01141",
            "FA01241",
            "FA01641",
            "FA01741",
            "FA01841",
            "FA01341",
            "FA01441",
            "FA01541",
            "FCB1201",
            "FCB1241",
            "FCB1291",
            "FCB1321",
            "FCB1361",
            "FCB1381",
            "FG10651",
            "FG10704",
            "FG10724",
            "FG10744",
            "FG10764",
            "FG10814",
            "FG10834",
            "FG10864",
            "FG10911",
            "FG10851",
            "FG10784",
            "FG10874",
            "FG10904",
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
          courseIds: ["1116302", "1227491"],
        },
        {
          id: "common-bachelor",
          name: "総合科目（学士基礎科目）",
          type: "elective",
          minCredits: 1,
          maxCredits: 3,
          groups: [],
        },
        {
          id: "common-pe",
          name: "体育",
          type: "elective",
          minCredits: 3,
          groups: [
            {
              id: "pe-group",
              minCredits: 0,
              rules: [{ id: "pe", type: "prefix", prefix: "21" }],
            },
          ],
        },
        {
          id: "common-english",
          name: "第1外国語（英語）",
          type: "elective",
          minCredits: 4,
          groups: [
            {
              id: "english-group",
              minCredits: 0,
              rules: [{ id: "english", type: "prefix", prefix: "31" }],
            },
          ],
        },
        {
          id: "common-second",
          name: "第2外国語（初修外国語）",
          type: "elective",
          minCredits: 0,
          maxCredits: 4,
          groups: [
            {
              id: "second-lang-group",
              minCredits: 0,
              rules: [{ id: "second-lang", type: "prefix", prefix: "34" }],
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
          groups: [
            {
              id: "other-dept-group",
              minCredits: 0,
              rules: [
                { id: "gb-prefix", type: "prefix", prefix: "GB" },
                { id: "gc-prefix", type: "prefix", prefix: "GC" },
                { id: "ga-prefix", type: "prefix", prefix: "GA" },
                { id: "ge-prefix", type: "prefix", prefix: "GE" },
                { id: "bc-prefix", type: "prefix", prefix: "BC" },
              ],
            },
          ],
          notes: "情報学群、他学類の科目",
        },
      ],
    },
  ],
};
