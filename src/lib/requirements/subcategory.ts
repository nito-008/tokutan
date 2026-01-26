import type { SubcategoryType } from "~/lib/types";

export type SubcategoryTypeOption = { value: SubcategoryType; label: string };

const subcategoryTypeLabels: Record<SubcategoryType, string> = {
  required: "必修科目",
  elective: "選択科目",
  free: "自由科目",
};

export const subcategoryTypeOptions: SubcategoryTypeOption[] = [
  { value: "required", label: subcategoryTypeLabels.required },
  { value: "elective", label: subcategoryTypeLabels.elective },
  { value: "free", label: subcategoryTypeLabels.free },
];

export const getSubcategoryLabel = (type: SubcategoryType): string => {
  return subcategoryTypeLabels[type];
};
