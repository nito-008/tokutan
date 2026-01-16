import { type Component, createSignal, onMount, Show } from "solid-js";
import { CourseManager } from "~/components/course/CourseManager";
import { ExportDialog } from "~/components/dialogs/ExportDialog";
import { ImportDialog } from "~/components/dialogs/ImportDialog";
import { GraduationChecker } from "~/components/graduation/GraduationChecker";
import { RequirementsSelector } from "~/components/graduation/RequirementsSelector";
import { Header } from "~/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { getRequirements } from "~/lib/db/requirements";
import { type AppState, initializeApp } from "~/lib/init";
import type { EnrollmentData } from "~/lib/types";

const Home: Component = () => {
  const [activeTab, setActiveTab] = createSignal<string>("graduation");
  const [isLoading, setIsLoading] = createSignal(true);
  const [appState, setAppState] = createSignal<AppState | null>(null);
  const [showExportDialog, setShowExportDialog] = createSignal(false);
  const [showImportDialog, setShowImportDialog] = createSignal(false);
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

  const handleSyncTwins = () => {
    // CSVアップローダーを表示するためにタブを切り替え
    setActiveTab("graduation");
  };

  const handleEditRequirements = () => {
    setShowRequirementEditor(true);
  };

  return (
    <div class="min-h-screen bg-background">
      <Header
        onExport={() => setShowExportDialog(true)}
        onImport={() => setShowImportDialog(true)}
      />

      <main class="container mx-auto px-4 py-6">
        <Show
          when={!isLoading()}
          fallback={
            <div class="flex items-center justify-center py-12">
              <div class="text-center">
                <div class="text-4xl mb-4 animate-pulse">⏳</div>
                <p class="text-muted-foreground">読み込み中...</p>
              </div>
            </div>
          }
        >
          <Show when={appState()}>
            {(state) => (
              <Tabs value={activeTab()} onChange={setActiveTab} class="w-full">
                <TabsList class="grid w-full grid-cols-2 max-w-md mx-auto mb-9">
                  <TabsTrigger value="graduation">卒業要件チェック</TabsTrigger>
                  <TabsTrigger value="course">履修管理</TabsTrigger>
                </TabsList>

                <TabsContent value="graduation">
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
                  />
                </TabsContent>

                <TabsContent value="course">
                  <CourseManager
                    profileId={state().profile.id}
                    enrollmentYear={state().profile.enrollmentYear}
                    enrollment={state().enrollment}
                    onSyncTwins={handleSyncTwins}
                  />
                </TabsContent>
              </Tabs>
            )}
          </Show>
        </Show>
      </main>

      <ExportDialog open={showExportDialog()} onClose={() => setShowExportDialog(false)} />

      <ImportDialog
        open={showImportDialog()}
        onClose={() => setShowImportDialog(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

export default Home;
