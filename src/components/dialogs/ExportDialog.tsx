import { Component, createSignal } from 'solid-js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { exportAndDownload, exportRequirementsAndDownload } from '~/lib/db/export';
import { getAllRequirements } from '~/lib/db/requirements';
import type { GraduationRequirements } from '~/lib/types';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ExportDialog: Component<ExportDialogProps> = (props) => {
  const [isExporting, setIsExporting] = createSignal(false);
  const [requirements, setRequirements] = createSignal<GraduationRequirements[]>([]);

  const loadRequirements = async () => {
    const reqs = await getAllRequirements();
    setRequirements(reqs);
  };

  // ダイアログが開いたときに要件をロード
  const handleOpenChange = (open: boolean) => {
    if (open) {
      loadRequirements();
    } else {
      props.onClose();
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      await exportAndDownload();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportRequirements = async (id: string) => {
    setIsExporting(true);
    try {
      await exportRequirementsAndDownload(id);
    } catch (error) {
      console.error('Export requirements failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>データをエクスポート</DialogTitle>
          <DialogDescription>
            バックアップファイルをダウンロードします
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 mt-4">
          <div class="border rounded-lg p-4">
            <h3 class="font-medium mb-2">全データをエクスポート</h3>
            <p class="text-sm text-muted-foreground mb-3">
              プロファイル、履修データ、卒業要件、履修計画を含むすべてのデータをバックアップします。
            </p>
            <Button onClick={handleExportAll} disabled={isExporting()}>
              {isExporting() ? 'エクスポート中...' : '全データをダウンロード'}
            </Button>
          </div>

          <div class="border rounded-lg p-4">
            <h3 class="font-medium mb-2">卒業要件をエクスポート</h3>
            <p class="text-sm text-muted-foreground mb-3">
              特定の卒業要件のみをエクスポートします。他の人と共有できます。
            </p>
            <div class="space-y-2">
              {requirements().length === 0 ? (
                <p class="text-sm text-muted-foreground">卒業要件がありません</p>
              ) : (
                requirements().map(req => (
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
