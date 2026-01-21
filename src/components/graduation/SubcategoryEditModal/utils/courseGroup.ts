export const parseCourseGroup = (value: string) =>
  value
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id);

export const uniqueCourseIds = (ids: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
};

export const formatCourseGroup = (ids: string[]) => ids.join(", ");

export const normalizeCourseGroup = (value: string) =>
  formatCourseGroup(uniqueCourseIds(parseCourseGroup(value)));

export const extractSuggestionToken = (value: string) => {
  const parts = value.split(",");
  return (parts[parts.length - 1] ?? "").trim();
};

export const dropSearchToken = (value: string) => {
  const parts = value.split(",").map((part) => part.trim());
  const lastToken = parts[parts.length - 1] ?? "";
  if (lastToken) {
    parts.pop();
  }
  return parts.filter((part) => part);
};

export const normalizeCourseIds = (ids: string[]) => {
  const normalized = ids.map((id) => id.trim());
  while (normalized.length > 0 && normalized[normalized.length - 1] === "") {
    normalized.pop();
  }
  normalized.push("");
  return normalized;
};

export const getGroupName = (ids: string[], courseNames: Map<string, string>) => {
  for (const id of ids) {
    const name = courseNames.get(id);
    if (name) return name;
  }
  return undefined;
};

export const formatCourseLabel = (courseId: string, courseNames: Map<string, string>) => {
  const name = courseNames.get(courseId);
  return name ? `${courseId}（${name}）` : courseId;
};

export const formatCourseGroupLabel = (
  value: string,
  courseNames: Map<string, string>,
  isLookupLoading: boolean,
) => {
  const ids = parseCourseGroup(value);
  if (ids.length === 0) return "";
  return ids
    .map((courseId) => {
      const label = formatCourseLabel(courseId, courseNames);
      if (label !== courseId) return label;
      if (isLookupLoading) return courseId;
      return `${courseId}: 科目が見つかりません`;
    })
    .join(", ");
};
