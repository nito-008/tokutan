import { type Component, createEffect, createSignal, Show } from "solid-js";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { clearRequirements } from "~/lib/db/cleanup";
import { exportRequirementsAndDownload } from "~/lib/db/export";
import { importRequirements } from "~/lib/db/import";
import { clearKdbCache } from "~/lib/db/kdb";
import { getAllRequirements } from "~/lib/db/requirements";
import { getRequirementLabel } from "~/lib/requirements/label";
import type { GraduationRequirements } from "~/types";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const SettingsDialog: Component<SettingsDialogProps> = (props) => {
  const [isImporting, setIsImporting] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [isExporting, setIsExporting] = createSignal(false);
  const [requirements, setRequirements] = createSignal<GraduationRequirements[]>([]);
  const [isDeletingRequirements, setIsDeletingRequirements] = createSignal(false);
  const [isDeletingKdbCache, setIsDeletingKdbCache] = createSignal(false);

  let fileInputRef: HTMLInputElement | undefined;

  const loadRequirements = async () => {
    const reqs = await getAllRequirements();
    setRequirements(reqs);
  };

  createEffect(() => {
    if (!props.open) return;
    setError(null);
    void loadRequirements();
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      props.onClose();
    }
  };

  const handleFileSelect = () => {
    fileInputRef?.click();
  };

  const handleFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);

    try {
      await importRequirements(file);
      await loadRequirements();
      props.onImportComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "インポートに失敗しました");
    } finally {
      setIsImporting(false);
      if (fileInputRef) {
        fileInputRef.value = "";
      }
    }
  };

  const handleExportRequirements = async (id: string) => {
    setIsExporting(true);
    try {
      await exportRequirementsAndDownload(id);
    } catch (error) {
      console.error("Export requirements failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteRequirements = async () => {
    const confirmed = window.confirm("卒業要件データを再取得します。よろしいですか？");
    if (!confirmed) return;

    setIsDeletingRequirements(true);
    try {
      await clearRequirements();
      await loadRequirements();
      await props.onImportComplete();
    } catch (error) {
      console.error("Delete requirements failed:", error);
    } finally {
      setIsDeletingRequirements(false);
    }
  };

  const handleDeleteKdbCache = async () => {
    const confirmed = window.confirm("KDBキャッシュを削除します。よろしいですか？");
    if (!confirmed) return;

    setIsDeletingKdbCache(true);
    try {
      await clearKdbCache();
      await props.onImportComplete();
    } catch (error) {
      console.error("Delete KDB cache failed:", error);
    } finally {
      setIsDeletingKdbCache(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent class="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
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

          <div class="border rounded-lg p-4">
            <h4 class="font-medium mb-2">卒業要件をインポート</h4>
            <p class="text-sm text-muted-foreground mb-3">
              卒業要件ファイルをインポートします。他のデータには影響しません。
            </p>
            <Button variant="outline" onClick={handleFileSelect} disabled={isImporting()}>
              {isImporting() ? "インポート中..." : "要件ファイルを選択"}
            </Button>
          </div>

          <div class="border rounded-lg p-4">
            <h4 class="font-medium mb-2">卒業要件をエクスポート</h4>
            <p class="text-sm text-muted-foreground mb-3">
              特定の卒業要件のみをエクスポートします。他の人と共有できます。
            </p>
            <div class="space-y-2">
              {requirements().length === 0 ? (
                <p class="text-sm text-muted-foreground">卒業要件がありません</p>
              ) : (
                requirements().map((req) => (
                  <div class="flex items-center justify-between p-2 bg-muted rounded">
                    <span class="text-sm">{getRequirementLabel(req)}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportRequirements(req.id)}
                      disabled={isExporting()}
                    >
                      エクスポート
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div class="border rounded-lg p-4">
            <h4 class="font-medium mb-2">卒業要件データを再取得</h4>
            <p class="text-sm text-muted-foreground mb-3">
              卒業要件データをサーバーから再取得します。ローカルの編集データは削除されます。
            </p>

            <Button
              variant="destructive"
              onClick={handleDeleteRequirements}
              disabled={isDeletingRequirements()}
            >
              {isDeletingRequirements() ? "再取得中..." : "卒業要件データを再取得"}
            </Button>
          </div>

          <div class="border rounded-lg p-4">
            <h4 class="font-medium mb-2">KDBキャッシュを削除</h4>
            <p class="text-sm text-muted-foreground mb-3">KDBデータのキャッシュを削除します。</p>
            <Button
              variant="outline"
              onClick={handleDeleteKdbCache}
              disabled={isDeletingKdbCache()}
            >
              {isDeletingKdbCache() ? "削除中..." : "KDBキャッシュを削除"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
