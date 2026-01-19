import { type Component, createSignal, Show } from "solid-js";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { clearUserData } from "~/lib/db/cleanup";
import { exportAndDownload, exportRequirementsAndDownload } from "~/lib/db/export";
import {
  type ImportResult,
  importAllData,
  importAllDataWithOverwrite,
  importRequirements,
} from "~/lib/db/import";
import { clearKdbCache } from "~/lib/db/kdb";
import { getAllRequirements } from "~/lib/db/requirements";
import type { GraduationRequirements } from "~/lib/types";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const SettingsDialog: Component<SettingsDialogProps> = (props) => {
  const [isImporting, setIsImporting] = createSignal(false);
  const [result, setResult] = createSignal<ImportResult | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [importType, setImportType] = createSignal<"all" | "requirements" | "overwrite">("all");
  const [isExporting, setIsExporting] = createSignal(false);
  const [requirements, setRequirements] = createSignal<GraduationRequirements[]>([]);
  const [isDeletingUserData, setIsDeletingUserData] = createSignal(false);
  const [isDeletingKdbCache, setIsDeletingKdbCache] = createSignal(false);

  let fileInputRef: HTMLInputElement | undefined;

  const loadRequirements = async () => {
    const reqs = await getAllRequirements();
    setRequirements(reqs);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      loadRequirements();
      setError(null);
      setResult(null);
      setImportType("all");
    } else {
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
    setResult(null);

    try {
      let importResult: ImportResult;

      switch (importType()) {
        case "requirements":
          await importRequirements(file);
          importResult = {
            success: true,
            message: "卒業要件をインポートしました",
            imported: { profiles: 0, requirements: 1, enrollment: 0, coursePlans: 0 },
          };
          break;
        case "overwrite":
          importResult = await importAllDataWithOverwrite(file);
          break;
        default:
          importResult = await importAllData(file);
      }

      setResult(importResult);
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

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      await exportAndDownload();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
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

  const handleDeleteUserData = async () => {
    const confirmed = window.confirm(
      "ユーザーデータを削除します。設定は残ります。よろしいですか？",
    );
    if (!confirmed) return;

    setIsDeletingUserData(true);
    try {
      await clearUserData();
      await props.onImportComplete();
    } catch (error) {
      console.error("Delete user data failed:", error);
    } finally {
      setIsDeletingUserData(false);
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

        <div class="space-y-6 mt-4">
          <section class="space-y-4">
            <h3 class="text-base font-semibold">インポート</h3>

            <Show when={error()}>
              <Alert variant="destructive">
                <AlertDescription>{error()}</AlertDescription>
              </Alert>
            </Show>

            <Show when={result()}>
              <Alert>
                <AlertDescription>
                  {result()?.message}
                  <br />
                  <span class="text-sm text-muted-foreground">
                    プロファイル: {result()?.imported.profiles}件, 要件:{" "}
                    {result()?.imported.requirements}件, 履修データ: {result()?.imported.enrollment}
                    件, 履修計画: {result()?.imported.coursePlans}件
                  </span>
                </AlertDescription>
              </Alert>
            </Show>

            <div class="border rounded-lg p-4">
              <h4 class="font-medium mb-2">全データをインポート</h4>
              <p class="text-sm text-muted-foreground mb-3">
                バックアップファイルからすべてのデータを復元します。既存のデータは保持されます。
              </p>
              <Button
                onClick={() => {
                  setImportType("all");
                  handleFileSelect();
                }}
                disabled={isImporting()}
              >
                {isImporting() && importType() === "all" ? "インポート中..." : "ファイルを選択"}
              </Button>
            </div>

            <div class="border rounded-lg p-4">
              <h4 class="font-medium mb-2">全データを上書きインポート</h4>
              <p class="text-sm text-muted-foreground mb-3 text-red-500">
                警告: 既存のすべてのデータが削除されます。
              </p>
              <Button
                variant="destructive"
                onClick={() => {
                  setImportType("overwrite");
                  handleFileSelect();
                }}
                disabled={isImporting()}
              >
                {isImporting() && importType() === "overwrite"
                  ? "インポート中..."
                  : "上書きインポート"}
              </Button>
            </div>

            <div class="border rounded-lg p-4">
              <h4 class="font-medium mb-2">卒業要件のみインポート</h4>
              <p class="text-sm text-muted-foreground mb-3">
                卒業要件ファイルをインポートします。他のデータには影響しません。
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setImportType("requirements");
                  handleFileSelect();
                }}
                disabled={isImporting()}
              >
                {isImporting() && importType() === "requirements"
                  ? "インポート中..."
                  : "要件ファイルを選択"}
              </Button>
            </div>
          </section>

          <section class="space-y-4">
            <h3 class="text-base font-semibold">エクスポート</h3>

            <div class="border rounded-lg p-4">
              <h4 class="font-medium mb-2">全データをエクスポート</h4>
              <p class="text-sm text-muted-foreground mb-3">
                プロファイル、履修データ、卒業要件、履修計画を含むすべてのデータをバックアップします。
              </p>
              <Button onClick={handleExportAll} disabled={isExporting()}>
                {isExporting() ? "エクスポート中..." : "全データをダウンロード"}
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
                      <span class="text-sm">{req.name}</span>
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
          </section>

          <section class="space-y-4">
            <h3 class="text-base font-semibold">ローカルデータ削除</h3>

            <div class="border rounded-lg p-4">
              <h4 class="font-medium mb-2">ユーザーデータを削除</h4>
              <p class="text-sm text-muted-foreground mb-3 text-red-500">
                プロファイル、履修データ、卒業要件、履修計画が削除されます。
              </p>
              <Button
                variant="destructive"
                onClick={handleDeleteUserData}
                disabled={isDeletingUserData()}
              >
                {isDeletingUserData() ? "削除中..." : "ユーザーデータを削除"}
              </Button>
            </div>

            <div class="border rounded-lg p-4">
              <h4 class="font-medium mb-2">KDBキャッシュを削除</h4>
              <p class="text-sm text-muted-foreground mb-3">
                科目検索のキャッシュを削除します。再検索時に再取得されます。
              </p>
              <Button
                variant="outline"
                onClick={handleDeleteKdbCache}
                disabled={isDeletingKdbCache()}
              >
                {isDeletingKdbCache() ? "削除中..." : "KDBキャッシュを削除"}
              </Button>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
