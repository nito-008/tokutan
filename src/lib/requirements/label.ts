import type { GraduationRequirements } from "~/lib/types";

const formatProgramLabel = (department: string, major?: string) => {
  if (!major) {
    return department;
  }
  return `${department} ${major}`;
};

export const getRequirementLabel = (requirements: GraduationRequirements | null | undefined) => {
  if (!requirements) return "";
  const programLabel = formatProgramLabel(requirements.department, requirements.major);
  return `${requirements.year}年入学 ${programLabel}`;
};
