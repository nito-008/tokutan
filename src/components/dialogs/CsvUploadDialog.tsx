import FilePlusCorner from "lucide-solid/icons/file-plus-corner";
import FolderOpen from "lucide-solid/icons/folder-open";
import Loader from "lucide-solid/icons/loader";
import { type Component, Show, createSignal } from "solid-js";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { importTwinsData } from "~/lib/db/enrollment";
import { getActiveProfile } from "~/lib/db/profiles";
import {
  type ValidationResult,
  parseTwinsCsv,
  validateTwinsCourses,
} from "~/lib/parsers/twins-csv";
import { useAppState, useAppStateActions } from "~/stores/appState";
import type { TwinsCourse } from "~/types";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

export const CsvUploadDialog: Component = () => {
  const appState = useAppState();
  const { updateEnrollment } = useAppStateActions();

  const [isDragging, setIsDragging] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);

  let fileInputRef: HTMLInputElement | undefined;

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("CSVファイルを選択してください");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const content = await file.text();
      const courses = parseTwinsCsv(content);
      const validation = validateTwinsCourses(courses);

      if (courses.length === 0) {
        setError("有効なデータが見つかりませんでした");
        return;
      }

      onDataLoaded(courses, validation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ファイルの読み込みに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer?.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef?.click();
  };

  const handleFileInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) handleFile(file);
  };

  const [isUploaderOpen, setIsUploaderOpen] = createSignal(false);

  const onDataLoaded = async (courses: TwinsCourse[], _validation: ValidationResult) => {
    const profile = await getActiveProfile();
    if (!profile) return;

    const enrollment = await importTwinsData(profile.id, courses);
    updateEnrollment(enrollment);
    setIsUploaderOpen(false);
  };

  const handleReupload = () => {
    setIsUploaderOpen(true);
  };

  const handleUploaderOpenChange = (open: boolean) => {
    if (!open && !appState()?.enrollment) {
      return;
    }

    setIsUploaderOpen(open);
  };

  return (
    <>
      <Button variant="outline" onClick={handleReupload}>
        <FilePlusCorner />
        <span>成績データを選択</span>
      </Button>
      <Dialog open={isUploaderOpen()} onOpenChange={handleUploaderOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>成績データを選択</DialogTitle>
            <DialogDescription>
              <p>TWINSからダウンロードしたCSVファイルをアップロードしてください</p>
              <p>※成績データはサーバーには送信されません。処理は全てローカルで行われます。</p>
            </DialogDescription>
          </DialogHeader>

          <button
            type="button"
            class={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors w-full
            ${
              isDragging()
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }
          `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              class="hidden"
              onChange={handleFileInput}
            />

            <Show
              when={isLoading()}
              fallback={
                <>
                  <div class="mb-4">
                    <FolderOpen class="size-12 mx-auto text-muted-foreground" />
                  </div>
                  <p class="text-lg font-medium mb-2">CSVファイルをドラッグ＆ドロップ</p>
                  <p class="text-sm text-muted-foreground">または クリックしてファイルを選択</p>
                </>
              }
            >
              <div class="mb-4">
                <Loader class="size-12 mx-auto text-muted-foreground animate-spin" />
              </div>
              <p>読み込み中...</p>
            </Show>
          </button>

          <Show when={error()}>
            <Alert variant="destructive" class="mt-4">
              <AlertDescription>{error()}</AlertDescription>
            </Alert>
          </Show>

          <div class="mt-6 text-sm text-muted-foreground">
            <p class="font-medium mb-2">CSVファイルの取得方法:</p>
            <ol class="list-decimal list-inside space-y-1">
              <li>TWINSにログイン</li>
              <li>「成績」→「成績照会」を選択</li>
              <li>一番下にある「ダウンロード」ボタンをクリック</li>
              <li>ファイル形式：CSV, 文字コード：Unicode（UTF-8）, BOM有無：BOMなし</li>
              <li>「出力」ボタンをクリック</li>
            </ol>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
