import Loader from "lucide-solid/icons/loader";
import { type Component, Show, createSignal, onMount } from "solid-js";
import { CsvUploadDialog } from "~/components/dialogs/CsvUploadDialog";
import { SettingsDialog } from "~/components/dialogs/SettingsDialog";
import { GraduationChecker } from "~/components/graduation/GraduationChecker";
import { RequirementsSelector } from "~/components/graduation/RequirementsSelector";
import { Header } from "~/components/layout/Header";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { type AppState, initializeApp } from "~/lib/init";
import { AppStateProvider } from "~/stores/appState";

const Home: Component = () => {
  const [isLoading, setIsLoading] = createSignal(true);
  const [appState, setAppState] = createSignal<AppState | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = createSignal(false);

  onMount(async () => {
    try {
      const state = await initializeApp();
      setAppState(state);
    } catch (error) {
      console.error("Failed to initialize app:", error);
    } finally {
      setIsLoading(false);
    }
  });

  const handleImportComplete = async () => {
    // Reload app state after import.
    const state = await initializeApp();
    setAppState(state);
  };

  return (
    <AppStateProvider state={appState} setState={setAppState}>
      <div class="min-h-screen bg-background">
        <Header onSettings={() => setShowSettingsDialog(true)} />

        <main class="container mx-auto px-4 py-6 space-y-6">
          <Alert variant="destructive" class="text-sm leading-relaxed bg-destructive-foreground">
            <AlertDescription>
              判定結果が正しいかどうかは必ず最新の履修要覧や支援室などで確認するようにしましょう。このツールを利用したことにより卒業に失敗したとしても、開発者は責任を負いません。
            </AlertDescription>
          </Alert>
          <Show
            when={!isLoading()}
            fallback={
              <div class="flex items-center justify-center py-12">
                <div class="text-center">
                  <div class="mb-4">
                    <Loader class="size-12 mx-auto text-muted-foreground animate-spin" />
                  </div>
                  <p class="text-muted-foreground">読み込み中...</p>
                </div>
              </div>
            }
          >
            <Show when={appState()}>
              <div class="flex justify-center items-center gap-4 mb-6">
                <RequirementsSelector />
                <CsvUploadDialog />
              </div>
              <GraduationChecker />
            </Show>
          </Show>
        </main>

        <SettingsDialog
          open={showSettingsDialog()}
          onClose={() => setShowSettingsDialog(false)}
          onImportComplete={handleImportComplete}
        />
      </div>
    </AppStateProvider>
  );
};

export default Home;
