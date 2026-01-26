import type { GraduationRequirements } from "~/lib/types";

export const defaultRequirements: GraduationRequirements = {
  id: "esys-2024",
  name: "2024年入学 工学システム学類",
  year: 2024,
  department: "工学システム学類",
  totalCredits: 125,
  version: "1.0.0",
  isDefault: true,
  createdAt: "2026-01-26T19:29:51.029Z",
  updatedAt: "2026-01-26T21:15:50.470Z",
  categories: [
    {
      id: "specialized",
      name: "専門科目",
      subcategories: [
        {
          id: "specialized-required",
          type: "required",
          courseIds: ["FG20204", "FG20214", "FG19103", "FG19113", "FG18112", "FG20222"],
        },
        {
          id: "specialized-elective",
          type: "elective",
          minCredits: 40,
          maxCredits: 49,
          groups: [
            {
              id: "fg-ff-gb-group",
              minCredits: 6,
              rules: [
                {
                  id: "fg-prefix",
                  type: "prefix",
                  prefix: "FG11",
                },
                {
                  id: "ff-prefix",
                  type: "prefix",
                  prefix: "FG21",
                },
              ],
            },
            {
              id: "group-1769460882009",
              minCredits: 1,
              rules: [
                {
                  id: "rule-1769460893189",
                  type: "prefix",
                  prefix: "FG12",
                },
                {
                  id: "rule-1769460893869",
                  type: "prefix",
                  prefix: "FG22",
                },
              ],
            },
            {
              id: "group-1769460901959",
              minCredits: 1,
              rules: [
                {
                  id: "rule-1769460906269",
                  type: "prefix",
                  prefix: "FG13",
                },
                {
                  id: "rule-1769460910639",
                  type: "prefix",
                  prefix: "FG23",
                },
              ],
            },
            {
              id: "group-1769460916548",
              minCredits: 16,
              rules: [
                {
                  id: "rule-1769460922138",
                  type: "prefix",
                  prefix: "FG17",
                },
                {
                  id: "rule-1769460925348",
                  type: "prefix",
                  prefix: "FG24",
                },
                {
                  id: "rule-1769460928658",
                  type: "prefix",
                  prefix: "FG25",
                },
              ],
            },
            {
              id: "group-1769460932698",
              minCredits: 0,
              rules: [
                {
                  id: "rule-1769460953608",
                  type: "prefix",
                  prefix: "FG",
                },
                {
                  id: "rule-1769460957198",
                  type: "prefix",
                  prefix: "FF2",
                },
                {
                  id: "rule-1769460960898",
                  type: "prefix",
                  prefix: "FF3",
                },
                {
                  id: "rule-1769460964588",
                  type: "prefix",
                  prefix: "FF4",
                },
                {
                  id: "rule-1769460968548",
                  type: "prefix",
                  prefix: "FF5",
                },
                {
                  id: "rule-1769460971497",
                  type: "prefix",
                  prefix: "GB2",
                },
                {
                  id: "rule-1769460980217",
                  type: "prefix",
                  prefix: "GB3",
                },
                {
                  id: "rule-1769460984007",
                  type: "prefix",
                  prefix: "GB4",
                },
                {
                  id: "rule-1769460987887",
                  type: "prefix",
                  prefix: "FA00",
                },
                {
                  id: "rule-1769460999999",
                  type: "exclude",
                  courseIds: [],
                },
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
        {
          id: "subcat-1769461527016",
          type: "elective",
          minCredits: 0,
          groups: [],
        },
      ],
    },
    {
      id: "common",
      name: "基礎科目共通科目",
      subcategories: [
        {
          id: "subcat-1769461547235",
          type: "required",
          courseIds: [],
        },
        {
          id: "subcat-1769461553835",
          type: "elective",
          minCredits: 0,
          groups: [],
        },
      ],
    },
    {
      id: "basic",
      name: "基礎科目関連科目",
      subcategories: [
        {
          id: "subcat-1769461564785",
          type: "required",
          courseIds: [],
        },
        {
          id: "subcat-1769461571505",
          type: "elective",
          minCredits: 0,
          groups: [],
        },
      ],
    },
  ],
};
