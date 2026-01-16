import { Component, createSignal, Show } from 'solid-js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { importAllData, importRequirements, importAllDataWithOverwrite, type ImportResult } from '~/lib/db/import';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportDialog: Component<ImportDialogProps> = (props) => {
  const [isImporting, setIsImporting] = createSignal(false);
  const [result, setResult] = createSignal<ImportResult | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [importType, setImportType] = createSignal<'all' | 'requirements' | 'overwrite'>('all');

  let fileInputRef: HTMLInputElement | undefined;

  const handleFileSelect = () => {
    fileInputRef?.click();
  };

  const handleFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      let importResult: ImportResult;

      switch (importType()) {
        case 'requirements':
          await importRequirements(file);
          importResult = {
            success: true,
            message: '卒業要件をインポートしました',
            imported: { profiles: 0, requirements: 1, enrollment: 0, coursePlans: 0 }
          };
          break;
        case 'overwrite':
          importResult = await importAllDataWithOverwrite(file);
          break;
        default:
          importResult = await importAllData(file);
      }

      setResult(importResult);
      props.onImportComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'インポートに失敗しました');
    } finally {
      setIsImporting(false);
      // ファイル入力をリセット
      if (fileInputRef) {
        fileInputRef.value = '';
      }
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>データをインポート</DialogTitle>
          <DialogDescription>
            バックアップファイルからデータを復元します
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          class="hidden"
          onChange={handleFileChange}
        />

        <div class="space-y-4 mt-4">
          <Show when={error()}>
            <Alert variant="destructive">
              <AlertDescription>{error()}</AlertDescription>
            </Alert>
          </Show>

          <Show when={result()}>
            <Alert>
              <AlertDescription>
                {result()!.message}
                <br />
                <span class="text-sm text-muted-foreground">
                  プロファイル: {result()!.imported.profiles}件,
                  要件: {result()!.imported.requirements}件,
                  履修データ: {result()!.imported.enrollment}件,
                  履修計画: {result()!.imported.coursePlans}件
                </span>
              </AlertDescription>
            </Alert>
          </Show>

          <div class="border rounded-lg p-4">
            <h3 class="font-medium mb-2">全データをインポート</h3>
            <p class="text-sm text-muted-foreground mb-3">
              バックアップファイルからすべてのデータを復元します。既存のデータは保持されます。
            </p>
            <Button
              onClick={() => {
                setImportType('all');
                handleFileSelect();
              }}
              disabled={isImporting()}
            >
              {isImporting() && importType() === 'all' ? 'インポート中...' : 'ファイルを選択'}
            </Button>
          </div>

          <div class="border rounded-lg p-4">
            <h3 class="font-medium mb-2">全データを上書きインポート</h3>
            <p class="text-sm text-muted-foreground mb-3 text-red-500">
              警告: 既存のすべてのデータが削除されます。
            </p>
            <Button
              variant="destructive"
              onClick={() => {
                setImportType('overwrite');
                handleFileSelect();
              }}
              disabled={isImporting()}
            >
              {isImporting() && importType() === 'overwrite' ? 'インポート中...' : '上書きインポート'}
            </Button>
          </div>

          <div class="border rounded-lg p-4">
            <h3 class="font-medium mb-2">卒業要件のみインポート</h3>
            <p class="text-sm text-muted-foreground mb-3">
              卒業要件ファイルをインポートします。他のデータには影響しません。
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setImportType('requirements');
                handleFileSelect();
              }}
              disabled={isImporting()}
            >
              {isImporting() && importType() === 'requirements' ? 'インポート中...' : '要件ファイルを選択'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
