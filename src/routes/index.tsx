import { Loader2 } from "lucide-solid";
import { type Component, createSignal, onMount, Show } from "solid-js";
import { SettingsDialog } from "~/components/dialogs/SettingsDialog";
import { GraduationChecker } from "~/components/graduation/GraduationChecker";
import { RequirementsSelector } from "~/components/graduation/RequirementsSelector";
import { Header } from "~/components/layout/Header";
import { getRequirements } from "~/lib/db/requirements";
import { type AppState, initializeApp } from "~/lib/init";
import type { EnrollmentData, GraduationRequirements } from "~/lib/types";

const Home: Component = () => {
  const [isLoading, setIsLoading] = createSignal(true);
  const [appState, setAppState] = createSignal<AppState | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = createSignal(false);
  const [_showRequirementEditor, setShowRequirementEditor] = createSignal(false);

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

  const handleEnrollmentUpdate = async (enrollment: EnrollmentData) => {
    const current = appState();
    if (current) {
      setAppState({ ...current, enrollment });
    }
  };

  const handleRequirementsChange = async (requirementsId: string) => {
    const current = appState();
    if (current) {
      const newRequirements = await getRequirements(requirementsId);
      if (newRequirements) {
        setAppState({ ...current, requirements: newRequirements });
      }
    }
  };

  const handleImportComplete = async () => {
    // 再初期化
    const state = await initializeApp();
    setAppState(state);
  };

  const handleEditRequirements = () => {
    setShowRequirementEditor(true);
  };

  const handleRequirementsUpdate = (requirements: GraduationRequirements) => {
    const current = appState();
    if (current) {
      setAppState({ ...current, requirements });
    }
  };

  return (
    <div class="min-h-screen bg-background">
      <Header onSettings={() => setShowSettingsDialog(true)} />

      <main class="container mx-auto px-4 py-6">
        <Show
          when={!isLoading()}
          fallback={
            <div class="flex items-center justify-center py-12">
              <div class="text-center">
                <div class="mb-4">
                  <Loader2 class="size-12 mx-auto text-muted-foreground animate-spin" />
                </div>
                <p class="text-muted-foreground">読み込み中...</p>
              </div>
            </div>
          }
        >
          <Show when={appState()}>
            {(state) => (
              <>
                <div class="flex justify-center mb-6">
                  <RequirementsSelector
                    profileId={state().profile.id}
                    selectedRequirementsId={state().profile.selectedRequirementsId}
                    onRequirementsChange={handleRequirementsChange}
                  />
                </div>
                <GraduationChecker
                  requirements={state().requirements}
                  enrollment={state().enrollment}
                  onEnrollmentUpdate={handleEnrollmentUpdate}
                  onEditRequirements={handleEditRequirements}
                  onRequirementsUpdate={handleRequirementsUpdate}
                />
              </>
            )}
          </Show>
        </Show>
      </main>

      <SettingsDialog
        open={showSettingsDialog()}
        onClose={() => setShowSettingsDialog(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

export default Home;
