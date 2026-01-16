# Phase 4: 仕上げ - 詳細実装ガイド

## 4.1 データエクスポート/インポート機能

### src/lib/db/export.ts

```typescript
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
  enrollments: EnrollmentData[];
  coursePlans: CoursePlan[];
  settings: Record<string, unknown>;
}

// 全データをエクスポート
export async function exportAllData(): Promise<ExportData> {
  const profiles = await db.profiles.toArray();
  const requirements = await db.requirements.toArray();
  const enrollments = await db.enrollment.toArray();
  const coursePlans = await db.coursePlans.toArray();
  const settingsArray = await db.settings.toArray();

  const settings: Record<string, unknown> = {};
  for (const s of settingsArray) {
    settings[s.key] = s.value;
  }

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    profiles,
    requirements,
    enrollments,
    coursePlans,
    settings
  };
}

// JSONファイルとしてダウンロード
export function downloadAsJson(data: ExportData, filename?: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `tokutan-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// エクスポートを実行
export async function performExport(): Promise<void> {
  const data = await exportAllData();
  downloadAsJson(data);
}
```

### src/lib/db/import.ts

```typescript
import { db } from './index';
import type { ExportData } from './export';

export interface ImportResult {
  success: boolean;
  importedAt: string;
  counts: {
    profiles: number;
    requirements: number;
    enrollments: number;
    coursePlans: number;
  };
  errors: string[];
}

// バージョン互換性チェック
function isCompatibleVersion(version: string): boolean {
  const [major] = version.split('.');
  return major === '1';
}

// データのバリデーション
function validateExportData(data: unknown): data is ExportData {
  if (typeof data !== 'object' || data === null) return false;

  const d = data as Record<string, unknown>;

  if (typeof d.version !== 'string') return false;
  if (typeof d.exportedAt !== 'string') return false;
  if (!Array.isArray(d.profiles)) return false;
  if (!Array.isArray(d.requirements)) return false;
  if (!Array.isArray(d.enrollments)) return false;
  if (!Array.isArray(d.coursePlans)) return false;

  return true;
}

// データをインポート
export async function importAllData(
  data: unknown,
  options: { clearExisting?: boolean } = {}
): Promise<ImportResult> {
  const errors: string[] = [];

  // バリデーション
  if (!validateExportData(data)) {
    return {
      success: false,
      importedAt: new Date().toISOString(),
      counts: { profiles: 0, requirements: 0, enrollments: 0, coursePlans: 0 },
      errors: ['Invalid export data format']
    };
  }

  // バージョンチェック
  if (!isCompatibleVersion(data.version)) {
    return {
      success: false,
      importedAt: new Date().toISOString(),
      counts: { profiles: 0, requirements: 0, enrollments: 0, coursePlans: 0 },
      errors: [`Incompatible version: ${data.version}`]
    };
  }

  try {
    await db.transaction('rw',
      [db.profiles, db.requirements, db.enrollment, db.coursePlans, db.settings],
      async () => {
        // 既存データをクリア（オプション）
        if (options.clearExisting) {
          await db.profiles.clear();
          await db.requirements.clear();
          await db.enrollment.clear();
          await db.coursePlans.clear();
          await db.settings.clear();
        }

        // インポート
        if (data.profiles.length > 0) {
          await db.profiles.bulkPut(data.profiles);
        }
        if (data.requirements.length > 0) {
          await db.requirements.bulkPut(data.requirements);
        }
        if (data.enrollments.length > 0) {
          await db.enrollment.bulkPut(data.enrollments);
        }
        if (data.coursePlans.length > 0) {
          await db.coursePlans.bulkPut(data.coursePlans);
        }

        // 設定をインポート
        if (data.settings && typeof data.settings === 'object') {
          for (const [key, value] of Object.entries(data.settings)) {
            await db.settings.put({
              key,
              value,
              updatedAt: new Date().toISOString()
            });
          }
        }
      }
    );

    return {
      success: true,
      importedAt: new Date().toISOString(),
      counts: {
        profiles: data.profiles.length,
        requirements: data.requirements.length,
        enrollments: data.enrollments.length,
        coursePlans: data.coursePlans.length
      },
      errors: []
    };
  } catch (error) {
    return {
      success: false,
      importedAt: new Date().toISOString(),
      counts: { profiles: 0, requirements: 0, enrollments: 0, coursePlans: 0 },
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

// ファイルからインポート
export async function importFromFile(file: File): Promise<ImportResult> {
  try {
    const content = await file.text();
    const data = JSON.parse(content);
    return importAllData(data);
  } catch (error) {
    return {
      success: false,
      importedAt: new Date().toISOString(),
      counts: { profiles: 0, requirements: 0, enrollments: 0, coursePlans: 0 },
      errors: ['Failed to parse JSON file']
    };
  }
}
```

## 4.2 要件共有機能

### src/lib/db/requirements-share.ts

```typescript
import { db } from './index';
import type { GraduationRequirements } from '../types';

export interface ShareableRequirements extends GraduationRequirements {
  sharedAt: string;
  shareVersion: string;
}

// 要件をエクスポート用に変換
export async function exportRequirements(id: string): Promise<string> {
  const req = await db.requirements.get(id);
  if (!req) {
    throw new Error('Requirements not found');
  }

  const shareData: ShareableRequirements = {
    ...req,
    sharedAt: new Date().toISOString(),
    shareVersion: '1.0.0'
  };

  return JSON.stringify(shareData, null, 2);
}

// 要件JSONをダウンロード
export async function downloadRequirements(id: string): Promise<void> {
  const json = await exportRequirements(id);
  const req = await db.requirements.get(id);

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `requirements-${req?.name || id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 要件をバリデーション
function validateRequirements(data: unknown): data is GraduationRequirements {
  if (typeof data !== 'object' || data === null) return false;

  const d = data as Record<string, unknown>;

  if (typeof d.name !== 'string') return false;
  if (typeof d.year !== 'number') return false;
  if (typeof d.department !== 'string') return false;
  if (typeof d.totalCredits !== 'number') return false;
  if (!Array.isArray(d.categories)) return false;

  return true;
}

// 要件をインポート
export async function importRequirements(json: string): Promise<string> {
  let data: unknown;

  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON format');
  }

  if (!validateRequirements(data)) {
    throw new Error('Invalid requirements format');
  }

  // 新しいIDを生成（重複防止）
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();

  const imported: GraduationRequirements = {
    ...data,
    id: newId,
    isDefault: false,
    createdAt: now,
    updatedAt: now
  };

  await db.requirements.add(imported);
  return newId;
}

// ファイルから要件をインポート
export async function importRequirementsFromFile(file: File): Promise<string> {
  const content = await file.text();
  return importRequirements(content);
}
```

## 4.3 インポート/エクスポートダイアログ

### src/components/dialogs/ExportDialog.tsx

```typescript
import { Component, createSignal } from 'solid-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Checkbox } from '~/components/ui/checkbox';
import { performExport } from '~/lib/db/export';
import { toast } from 'sonner';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ExportDialog: Component<ExportDialogProps> = (props) => {
  const [isExporting, setIsExporting] = createSignal(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await performExport();
      toast.success('エクスポートが完了しました');
      props.onClose();
    } catch (error) {
      toast.error('エクスポートに失敗しました');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>データをエクスポート</DialogTitle>
          <DialogDescription>
            全ての設定と履修データをJSONファイルとしてダウンロードします。
            このファイルは後でインポートして復元できます。
          </DialogDescription>
        </DialogHeader>

        <div class="py-4">
          <p class="text-sm text-muted-foreground">
            エクスポートされるデータ:
          </p>
          <ul class="list-disc list-inside text-sm mt-2 space-y-1">
            <li>ユーザープロファイル</li>
            <li>卒業要件設定</li>
            <li>履修データ（TWINSからインポートしたもの）</li>
            <li>履修計画</li>
            <li>アプリ設定</li>
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            キャンセル
          </Button>
          <Button onClick={handleExport} disabled={isExporting()}>
            {isExporting() ? 'エクスポート中...' : 'エクスポート'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

### src/components/dialogs/ImportDialog.tsx

```typescript
import { Component, createSignal, Show } from 'solid-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Label } from '~/components/ui/label';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { importFromFile, type ImportResult } from '~/lib/db/import';
import { toast } from 'sonner';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportDialog: Component<ImportDialogProps> = (props) => {
  const [selectedFile, setSelectedFile] = createSignal<File | null>(null);
  const [clearExisting, setClearExisting] = createSignal(false);
  const [isImporting, setIsImporting] = createSignal(false);
  const [result, setResult] = createSignal<ImportResult | null>(null);

  let fileInputRef: HTMLInputElement | undefined;

  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleImport = async () => {
    const file = selectedFile();
    if (!file) return;

    setIsImporting(true);
    try {
      const importResult = await importFromFile(file);
      setResult(importResult);

      if (importResult.success) {
        toast.success('インポートが完了しました');
        props.onImportComplete();
      } else {
        toast.error('インポートに失敗しました');
      }
    } catch (error) {
      toast.error('インポートに失敗しました');
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setResult(null);
    setClearExisting(false);
    props.onClose();
  };

  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>データをインポート</DialogTitle>
          <DialogDescription>
            エクスポートしたJSONファイルからデータを復元します。
          </DialogDescription>
        </DialogHeader>

        <div class="py-4 space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              class="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              class="w-full"
              onClick={() => fileInputRef?.click()}
            >
              {selectedFile() ? selectedFile()!.name : 'ファイルを選択'}
            </Button>
          </div>

          <div class="flex items-center space-x-2">
            <Checkbox
              id="clear-existing"
              checked={clearExisting()}
              onChange={(checked) => setClearExisting(checked)}
            />
            <Label for="clear-existing" class="text-sm">
              既存のデータを削除してからインポート
            </Label>
          </div>

          <Show when={clearExisting()}>
            <Alert variant="destructive">
              <AlertDescription>
                警告: 既存の全データが削除されます。この操作は取り消せません。
              </AlertDescription>
            </Alert>
          </Show>

          <Show when={result()}>
            <Alert variant={result()!.success ? 'default' : 'destructive'}>
              <AlertDescription>
                <Show when={result()!.success}>
                  <p>インポート完了:</p>
                  <ul class="list-disc list-inside text-sm mt-1">
                    <li>プロファイル: {result()!.counts.profiles}件</li>
                    <li>卒業要件: {result()!.counts.requirements}件</li>
                    <li>履修データ: {result()!.counts.enrollments}件</li>
                    <li>履修計画: {result()!.counts.coursePlans}件</li>
                  </ul>
                </Show>
                <Show when={!result()!.success}>
                  <p>エラー: {result()!.errors.join(', ')}</p>
                </Show>
              </AlertDescription>
            </Alert>
          </Show>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            閉じる
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile() || isImporting()}
          >
            {isImporting() ? 'インポート中...' : 'インポート'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

## 4.4 要件エディターの実装

### src/components/graduation/RequirementEditor.tsx

```typescript
import { Component, createSignal, For, Show } from 'solid-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion';
import type {
  GraduationRequirements,
  RequirementCategory,
  RequirementSubcategory,
  RequirementRule
} from '~/lib/types';
import { saveRequirements, getAllRequirements } from '~/lib/db/requirements';
import {
  downloadRequirements,
  importRequirementsFromFile
} from '~/lib/db/requirements-share';
import { toast } from 'sonner';

interface RequirementEditorProps {
  requirements: GraduationRequirements;
  onSave: (requirements: GraduationRequirements) => void;
  onCancel: () => void;
}

export const RequirementEditor: Component<RequirementEditorProps> = (props) => {
  const [requirements, setRequirements] = createSignal<GraduationRequirements>(
    JSON.parse(JSON.stringify(props.requirements))
  );
  const [editingCategory, setEditingCategory] = createSignal<string | null>(null);
  const [editingSubcategory, setEditingSubcategory] = createSignal<string | null>(null);

  // 基本情報の更新
  const updateBasicInfo = (field: keyof GraduationRequirements, value: unknown) => {
    setRequirements(prev => ({ ...prev, [field]: value }));
  };

  // カテゴリの追加
  const addCategory = () => {
    const newCategory: RequirementCategory = {
      id: crypto.randomUUID(),
      name: '新しいカテゴリ',
      minCredits: 0,
      subcategories: []
    };

    setRequirements(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
  };

  // カテゴリの削除
  const removeCategory = (categoryId: string) => {
    setRequirements(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== categoryId)
    }));
  };

  // カテゴリの更新
  const updateCategory = (categoryId: string, updates: Partial<RequirementCategory>) => {
    setRequirements(prev => ({
      ...prev,
      categories: prev.categories.map(c =>
        c.id === categoryId ? { ...c, ...updates } : c
      )
    }));
  };

  // サブカテゴリの追加
  const addSubcategory = (categoryId: string) => {
    const newSubcategory: RequirementSubcategory = {
      id: crypto.randomUUID(),
      name: '新しいサブカテゴリ',
      type: 'elective',
      minCredits: 0,
      rules: []
    };

    setRequirements(prev => ({
      ...prev,
      categories: prev.categories.map(c =>
        c.id === categoryId
          ? { ...c, subcategories: [...c.subcategories, newSubcategory] }
          : c
      )
    }));
  };

  // サブカテゴリの削除
  const removeSubcategory = (categoryId: string, subcategoryId: string) => {
    setRequirements(prev => ({
      ...prev,
      categories: prev.categories.map(c =>
        c.id === categoryId
          ? { ...c, subcategories: c.subcategories.filter(s => s.id !== subcategoryId) }
          : c
      )
    }));
  };

  // ルールの追加
  const addRule = (categoryId: string, subcategoryId: string) => {
    const newRule: RequirementRule = {
      id: crypto.randomUUID(),
      type: 'specific',
      description: '新しいルール',
      courseIds: []
    };

    setRequirements(prev => ({
      ...prev,
      categories: prev.categories.map(c =>
        c.id === categoryId
          ? {
              ...c,
              subcategories: c.subcategories.map(s =>
                s.id === subcategoryId
                  ? { ...s, rules: [...s.rules, newRule] }
                  : s
              )
            }
          : c
      )
    }));
  };

  // 保存
  const handleSave = async () => {
    try {
      const updated = {
        ...requirements(),
        updatedAt: new Date().toISOString()
      };
      await saveRequirements(updated);
      props.onSave(updated);
      toast.success('卒業要件を保存しました');
    } catch (error) {
      toast.error('保存に失敗しました');
      console.error('Save error:', error);
    }
  };

  // エクスポート
  const handleExport = async () => {
    try {
      await downloadRequirements(requirements().id);
      toast.success('要件をエクスポートしました');
    } catch (error) {
      toast.error('エクスポートに失敗しました');
    }
  };

  // インポート
  let importInputRef: HTMLInputElement | undefined;

  const handleImportClick = () => {
    importInputRef?.click();
  };

  const handleImportFile = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const data = JSON.parse(content);

      // 現在の要件を更新（新しいIDは使わない）
      setRequirements(prev => ({
        ...data,
        id: prev.id,  // IDは維持
        isDefault: prev.isDefault,
        createdAt: prev.createdAt,
        updatedAt: new Date().toISOString()
      }));

      toast.success('要件をインポートしました');
    } catch (error) {
      toast.error('インポートに失敗しました');
    }
  };

  return (
    <div class="space-y-6">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label>要件名</Label>
              <Input
                value={requirements().name}
                onInput={(e) => updateBasicInfo('name', e.currentTarget.value)}
              />
            </div>
            <div>
              <Label>入学年度</Label>
              <Input
                type="number"
                value={requirements().year}
                onInput={(e) => updateBasicInfo('year', parseInt(e.currentTarget.value))}
              />
            </div>
            <div>
              <Label>学類</Label>
              <Input
                value={requirements().department}
                onInput={(e) => updateBasicInfo('department', e.currentTarget.value)}
              />
            </div>
            <div>
              <Label>卒業必要単位数</Label>
              <Input
                type="number"
                value={requirements().totalCredits}
                onInput={(e) => updateBasicInfo('totalCredits', parseInt(e.currentTarget.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* カテゴリ一覧 */}
      <Card>
        <CardHeader class="flex flex-row items-center justify-between">
          <CardTitle class="text-lg">カテゴリ</CardTitle>
          <Button size="sm" onClick={addCategory}>
            + カテゴリを追加
          </Button>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" class="space-y-2">
            <For each={requirements().categories}>
              {(category) => (
                <AccordionItem value={category.id} class="border rounded-lg">
                  <AccordionTrigger class="px-4 hover:no-underline">
                    <div class="flex items-center gap-4">
                      <span class="font-medium">{category.name}</span>
                      <span class="text-sm text-muted-foreground">
                        ({category.minCredits}単位)
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent class="px-4 pb-4">
                    <div class="space-y-4">
                      <div class="grid grid-cols-2 gap-2">
                        <div>
                          <Label class="text-xs">カテゴリ名</Label>
                          <Input
                            value={category.name}
                            onInput={(e) => updateCategory(category.id, { name: e.currentTarget.value })}
                          />
                        </div>
                        <div>
                          <Label class="text-xs">必要単位数</Label>
                          <Input
                            type="number"
                            value={category.minCredits || 0}
                            onInput={(e) => updateCategory(category.id, {
                              minCredits: parseInt(e.currentTarget.value)
                            })}
                          />
                        </div>
                      </div>

                      {/* サブカテゴリ */}
                      <div class="border-t pt-4">
                        <div class="flex items-center justify-between mb-2">
                          <Label>サブカテゴリ</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addSubcategory(category.id)}
                          >
                            + 追加
                          </Button>
                        </div>

                        <For each={category.subcategories}>
                          {(subcategory) => (
                            <div class="border rounded p-3 mt-2">
                              <div class="flex items-center justify-between">
                                <span class="font-medium text-sm">{subcategory.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSubcategory(category.id, subcategory.id)}
                                >
                                  削除
                                </Button>
                              </div>
                              <div class="text-xs text-muted-foreground mt-1">
                                {subcategory.type === 'required' ? '必修' :
                                 subcategory.type === 'elective' ? '選択' : '自由'} /
                                {subcategory.minCredits}単位
                                {subcategory.maxCredits && `〜${subcategory.maxCredits}単位`}
                              </div>
                              <div class="text-xs text-muted-foreground mt-1">
                                ルール: {subcategory.rules.length}件
                              </div>
                            </div>
                          )}
                        </For>
                      </div>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeCategory(category.id)}
                      >
                        カテゴリを削除
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </For>
          </Accordion>
        </CardContent>
      </Card>

      {/* アクションボタン */}
      <div class="flex justify-between">
        <div class="flex gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            class="hidden"
            onChange={handleImportFile}
          />
          <Button variant="outline" onClick={handleImportClick}>
            JSONをインポート
          </Button>
          <Button variant="outline" onClick={handleExport}>
            JSONをエクスポート
          </Button>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" onClick={props.onCancel}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>
            保存
          </Button>
        </div>
      </div>
    </div>
  );
};
```

## 4.5 初期化処理の更新

### src/lib/init.ts

```typescript
import { db } from './db';
import { getSetting, setSetting } from './db/settings';
import { createDefaultProfile, getCurrentProfile } from './db/profiles';
import { getDefaultRequirements, saveRequirements } from './db/requirements';
import { refreshKdbCache, getKdbCacheAge } from './db/kdb';
import { defaultRequirements } from '~/data/default-requirements';

export async function initializeApp(): Promise<void> {
  // 1. DB接続確認
  await db.open();

  // 2. デフォルト要件がなければ追加
  const existingDefault = await getDefaultRequirements();
  if (!existingDefault) {
    await saveRequirements({
      ...defaultRequirements,
      isDefault: true
    });
    console.log('Default requirements loaded');
  }

  // 3. プロファイルがなければ作成
  const currentProfile = await getCurrentProfile();
  if (!currentProfile) {
    await createDefaultProfile();
    console.log('Default profile created');
  }

  // 4. kdbキャッシュの更新確認（24時間以上経過していれば更新）
  const cacheAge = await getKdbCacheAge();
  if (cacheAge > 24 * 60 * 60 * 1000) {
    // バックグラウンドで更新（エラーは無視）
    refreshKdbCache().catch(err => {
      console.warn('Failed to refresh kdb cache:', err);
    });
  }
}
```

## 4.6 メインページの最終更新

### src/routes/index.tsx（最終版）

```typescript
import { Component, createSignal, onMount, Show } from 'solid-js';
import { Header } from '~/components/layout/Header';
import { TabNavigation } from '~/components/layout/TabNavigation';
import { GraduationChecker } from '~/components/graduation/GraduationChecker';
import { CourseManager } from '~/components/course/CourseManager';
import { RequirementEditor } from '~/components/graduation/RequirementEditor';
import { ExportDialog } from '~/components/dialogs/ExportDialog';
import { ImportDialog } from '~/components/dialogs/ImportDialog';
import { initializeApp } from '~/lib/init';
import { getCurrentProfile } from '~/lib/db/profiles';
import { getDefaultRequirements } from '~/lib/db/requirements';
import { getEnrollment } from '~/lib/db/enrollment';
import type {
  UserProfile,
  GraduationRequirements,
  EnrollmentData
} from '~/lib/types';

const Home: Component = () => {
  const [activeTab, setActiveTab] = createSignal<'graduation' | 'course'>('graduation');
  const [isLoading, setIsLoading] = createSignal(true);
  const [showExport, setShowExport] = createSignal(false);
  const [showImport, setShowImport] = createSignal(false);
  const [showEditor, setShowEditor] = createSignal(false);

  // アプリ状態
  const [profile, setProfile] = createSignal<UserProfile | null>(null);
  const [requirements, setRequirements] = createSignal<GraduationRequirements | null>(null);
  const [enrollment, setEnrollment] = createSignal<EnrollmentData | null>(null);

  // 初期化
  onMount(async () => {
    try {
      await initializeApp();
      await loadData();
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  });

  // データ読み込み
  const loadData = async () => {
    const currentProfile = await getCurrentProfile();
    setProfile(currentProfile || null);

    const defaultReq = await getDefaultRequirements();
    setRequirements(defaultReq || null);

    if (currentProfile) {
      const enrollmentData = await getEnrollment(currentProfile.id);
      setEnrollment(enrollmentData || null);
    }
  };

  // 履修データ更新時
  const handleEnrollmentUpdate = (data: EnrollmentData) => {
    setEnrollment(data);
  };

  // 要件保存時
  const handleRequirementsSave = (req: GraduationRequirements) => {
    setRequirements(req);
    setShowEditor(false);
  };

  // インポート完了時
  const handleImportComplete = async () => {
    await loadData();
    setShowImport(false);
  };

  return (
    <div class="min-h-screen bg-background">
      <Header
        onExport={() => setShowExport(true)}
        onImport={() => setShowImport(true)}
      />
      <TabNavigation activeTab={activeTab()} onTabChange={setActiveTab} />

      <main class="container mx-auto px-4 py-6">
        <Show when={!isLoading()} fallback={
          <div class="text-center py-12">読み込み中...</div>
        }>
          {/* 卒業要件チェックタブ */}
          <Show when={activeTab() === 'graduation'}>
            <Show
              when={!showEditor()}
              fallback={
                requirements() && (
                  <RequirementEditor
                    requirements={requirements()!}
                    onSave={handleRequirementsSave}
                    onCancel={() => setShowEditor(false)}
                  />
                )
              }
            >
              <GraduationChecker
                requirements={requirements()}
                enrollment={enrollment()}
                onEnrollmentUpdate={handleEnrollmentUpdate}
                onEditRequirements={() => setShowEditor(true)}
              />
            </Show>
          </Show>

          {/* 履修管理タブ */}
          <Show when={activeTab() === 'course' && profile()}>
            <CourseManager
              profileId={profile()!.id}
              enrollmentYear={profile()!.enrollmentYear}
              enrollment={enrollment()}
              onSyncTwins={() => setActiveTab('graduation')}
            />
          </Show>
        </Show>
      </main>

      {/* ダイアログ */}
      <ExportDialog
        open={showExport()}
        onClose={() => setShowExport(false)}
      />
      <ImportDialog
        open={showImport()}
        onClose={() => setShowImport(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

export default Home;
```

## Phase 4 完了チェックリスト

- [ ] 4.1 データエクスポート/インポート
  - [ ] exportAllData関数
  - [ ] downloadAsJson関数
  - [ ] importAllData関数
  - [ ] importFromFile関数
- [ ] 4.2 要件共有機能
  - [ ] exportRequirements関数
  - [ ] importRequirements関数
  - [ ] downloadRequirements関数
- [ ] 4.3 ExportDialogコンポーネント
- [ ] 4.4 ImportDialogコンポーネント
- [ ] 4.5 RequirementEditorコンポーネント
- [ ] 4.6 初期化処理（init.ts）
- [ ] 4.7 メインページの統合
- [ ] 4.8 動作確認
- [ ] 4.9 UIの微調整
