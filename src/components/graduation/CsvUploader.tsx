import { FolderOpen, Loader2 } from "lucide-solid";
import { type Component, createSignal, Show } from "solid-js";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  parseTwinsCsv,
  type ValidationResult,
  validateTwinsCourses,
} from "~/lib/parsers/twins-csv";
import type { TwinsCourse } from "~/lib/types";

interface CsvUploaderProps {
  onDataLoaded: (courses: TwinsCourse[], validation: ValidationResult) => void;
}

export const CsvUploader: Component<CsvUploaderProps> = (props) => {
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

      props.onDataLoaded(courses, validation);
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

  return (
    <>
      <button
        type="button"
        class={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors w-full
            ${isDragging() ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
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
            <Loader2 class="size-12 mx-auto text-muted-foreground animate-spin" />
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
          <li>「成績」→「履修成績照会・成績証明書発行」を選択</li>
          <li>「CSV出力」ボタンをクリック</li>
        </ol>
      </div>
    </>
  );
};
