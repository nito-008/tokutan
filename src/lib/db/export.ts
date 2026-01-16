import { db } from './index';
import type {
  GraduationRequirements,
  EnrollmentData,
  UserProfile,
  CoursePlan
} from '../types';

export interface ExportData {
  version: string;
  exportedAt: string;
  profiles: UserProfile[];
  requirements: GraduationRequirements[];
  enrollment: EnrollmentData[];
  coursePlans: CoursePlan[];
}

// 全データをエクスポート
export async function exportAllData(): Promise<ExportData> {
  const [profiles, requirements, enrollment, coursePlans] = await Promise.all([
    db.profiles.toArray(),
    db.requirements.toArray(),
    db.enrollment.toArray(),
    db.coursePlans.toArray()
  ]);

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    profiles,
    requirements,
    enrollment,
    coursePlans
  };
}

// JSONファイルとしてダウンロード
export function downloadJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 全データをエクスポートしてダウンロード
export async function exportAndDownload(): Promise<void> {
  const data = await exportAllData();
  const filename = `tokutan-backup-${new Date().toISOString().split('T')[0]}.json`;
  downloadJson(data, filename);
}

// 要件のみエクスポート
export async function exportRequirements(id: string): Promise<GraduationRequirements | undefined> {
  return db.requirements.get(id);
}

// 要件をダウンロード
export async function exportRequirementsAndDownload(id: string): Promise<void> {
  const req = await exportRequirements(id);
  if (!req) {
    throw new Error('Requirements not found');
  }

  const filename = `tokutan-requirements-${req.name.replace(/\s+/g, '-')}.json`;
  downloadJson(req, filename);
}
