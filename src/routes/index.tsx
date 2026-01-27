import { Loader } from "lucide-solid";
import { type Component, createSignal, onMount, Show } from "solid-js";
import { SettingsDialog } from "~/components/dialogs/SettingsDialog";
import { GraduationChecker } from "~/components/graduation/GraduationChecker";
import { RequirementsSelector } from "~/components/graduation/RequirementsSelector";
import { Header } from "~/components/layout/Header";
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

        <main class="container mx-auto px-4 py-6">
          <Show
            when={!isLoading()}
            fallback={
              <div class="flex items-center justify-center py-12">
                <div class="text-center">
                  <div class="mb-4">
                    <Loader class="size-12 mx-auto text-muted-foreground animate-spin" />
                  </div>
                  <p class="text-muted-foreground">Loading application data...</p>
                </div>
              </div>
            }
          >
            <Show when={appState()}>
              <>
                <div class="flex justify-center mb-6">
                  <RequirementsSelector />
                </div>
                <GraduationChecker />
              </>
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
