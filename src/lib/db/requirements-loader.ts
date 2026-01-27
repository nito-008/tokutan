import type { GraduationRequirements } from "../types";

const REQUIREMENTS_BASE_URL = "/data/requirements";

interface RequirementsManifest {
  requirements: Array<{
    id: string;
    file: string;
    isDefault: boolean;
  }>;
}

export async function loadAllRequirements(): Promise<GraduationRequirements[]> {
  const response = await fetch(`${REQUIREMENTS_BASE_URL}/index.json`);
  const manifest: RequirementsManifest = await response.json();

  const requirements: GraduationRequirements[] = [];
  for (const item of manifest.requirements) {
    const res = await fetch(`${REQUIREMENTS_BASE_URL}/${item.file}`);
    requirements.push(await res.json());
  }

  return requirements;
}
