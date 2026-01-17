import { type Component, createEffect, createSignal, For, onCleanup, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Switch, SwitchControl, SwitchLabel } from "~/components/ui/switch";
import { calculateRequirementStatus } from "~/lib/calculator/requirements";
import { importTwinsData } from "~/lib/db/enrollment";
import { getCachedKdb } from "~/lib/db/kdb";
import { getActiveProfile } from "~/lib/db/profiles";
import { saveRequirements } from "~/lib/db/requirements";
import type { ValidationResult } from "~/lib/parsers/twins-csv";
import type {
  EnrollmentData,
  GraduationRequirements,
  RequirementCategory,
  RequirementStatus,
  RequirementSubcategory,
  TwinsCourse,
} from "~/lib/types";
import { CsvUploader } from "./CsvUploader";
import { DonutChart, getCategoryColor } from "./DonutChart";
import { RequirementsSummary } from "./RequirementsSummary";
import { RequirementTree } from "./RequirementTree";

interface GraduationCheckerProps {
  requirements: GraduationRequirements | null;
  enrollment: EnrollmentData | null;
  onEnrollmentUpdate: (enrollment: EnrollmentData) => void;
  onEditRequirements: () => void;
  onRequirementsUpdate?: (requirements: GraduationRequirements) => void;
}

export const GraduationChecker: Component<GraduationCheckerProps> = (props) => {
  const [status, setStatus] = createSignal<RequirementStatus | null>(null);
  const [showUploader, setShowUploader] = createSignal(!props.enrollment);
  const [editMode, setEditMode] = createSignal(false);

  // 要件充足状況を計算
  createEffect(() => {
    const requirements = props.requirements;
    const enrollment = props.enrollment;

    if (!requirements || !enrollment) {
      return;
    }

    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    void (async () => {
      const kdbCourses = await getCachedKdb();
      if (cancelled) return;
      const calculated = calculateRequirementStatus(requirements, enrollment.courses, kdbCourses);
      if (cancelled) return;
      setStatus(calculated);
    })();
  });

  const handleDataLoaded = async (courses: TwinsCourse[], _validation: ValidationResult) => {
    const profile = await getActiveProfile();
    if (!profile) return;

    const enrollment = await importTwinsData(profile.id, courses);
    props.onEnrollmentUpdate(enrollment);
    setShowUploader(false);
  };

  const handleReupload = () => {
    setShowUploader(true);
  };

  const handleCategoryUpdate = async (
    categoryId: string | null,
    updates: Partial<RequirementCategory>,
  ) => {
    const requirements = props.requirements;
    if (!requirements) return;

    let updatedCategories: RequirementCategory[];
    if (categoryId === null) {
      const newCategory: RequirementCategory = {
        id: `cat-${Date.now()}`,
        name: updates.name || "新しいカテゴリ",
        subcategories: [],
        minCredits: updates.minCredits,
        maxCredits: updates.maxCredits,
      };
      updatedCategories = [...requirements.categories, newCategory];
    } else {
      updatedCategories = requirements.categories.map((cat) =>
        cat.id === categoryId ? { ...cat, ...updates } : cat,
      );
    }

    const updatedRequirements: GraduationRequirements = {
      ...requirements,
      categories: updatedCategories,
    };

    await saveRequirements(updatedRequirements);
    props.onRequirementsUpdate?.(updatedRequirements);
  };

  const handleSubcategoryUpdate = async (
    categoryId: string,
    subcategoryId: string | null,
    updates: Partial<RequirementSubcategory>,
  ) => {
    const requirements = props.requirements;
    if (!requirements) return;

    const updatedCategories = requirements.categories.map((cat) => {
      if (cat.id !== categoryId) return cat;

      if (subcategoryId === null) {
        const newSubcategory: RequirementSubcategory = {
          id: `subcat-${Date.now()}`,
          name: updates.name || "新しいサブカテゴリ",
          type: updates.type || "elective",
          minCredits: updates.minCredits ?? 0,
          maxCredits: updates.maxCredits,
          rules: updates.rules || [],
          notes: updates.notes,
        };
        return {
          ...cat,
          subcategories: [...cat.subcategories, newSubcategory],
        };
      }

      return {
        ...cat,
        subcategories: cat.subcategories.map((sub) =>
          sub.id === subcategoryId ? { ...sub, ...updates } : sub,
        ),
      };
    });

    const updatedRequirements: GraduationRequirements = {
      ...requirements,
      categories: updatedCategories,
    };

    await saveRequirements(updatedRequirements);
    props.onRequirementsUpdate?.(updatedRequirements);
  };

  return (
    <div class="space-y-6">
      <Show when={showUploader()}>
        <CsvUploader onDataLoaded={handleDataLoaded} />

        <Show when={props.enrollment}>
          <div class="text-center">
            <Button variant="link" onClick={() => setShowUploader(false)}>
              既存のデータを使用する
            </Button>
          </div>
        </Show>
      </Show>

      <Show when={!showUploader() && status() && props.requirements}>
        <RequirementsSummary
          status={status() as RequirementStatus}
          requirementsName={props.requirements?.name ?? ""}
        />

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card class="lg:col-span-1">
            <CardHeader>
              <CardTitle class="text-lg">進捗状況</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart
                categoryStatuses={status()?.categoryStatuses ?? []}
                totalEarned={status()?.totalEarnedCredits ?? 0}
                totalRequired={status()?.totalRequiredCredits ?? 0}
              />

              {/* 凡例 */}
              <div class="mt-4 space-y-2">
                <For each={status()?.categoryStatuses}>
                  {(cat) => (
                    <div class="flex items-center gap-2 text-sm">
                      <div
                        class="w-3 h-3 rounded"
                        style={{
                          "background-color": getCategoryColor(cat.categoryName),
                        }}
                      />
                      <span>{cat.categoryName}</span>
                      <span class="ml-auto text-muted-foreground">
                        {cat.earnedCredits}/{cat.requiredCredits}
                      </span>
                    </div>
                  )}
                </For>
              </div>
            </CardContent>
          </Card>

          <Card class="lg:col-span-2">
            <CardHeader class="flex flex-row items-center justify-between">
              <CardTitle class="text-lg">卒業要件</CardTitle>
              <div class="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReupload}>
                  データ更新
                </Button>
                <Switch checked={editMode()} onChange={setEditMode} class="flex items-center gap-2">
                  <SwitchLabel>編集モード</SwitchLabel>
                  <SwitchControl />
                </Switch>
              </div>
            </CardHeader>
            <CardContent>
              <RequirementTree
                categoryStatuses={status()?.categoryStatuses ?? []}
                requirements={props.requirements ?? undefined}
                onCategoryUpdate={handleCategoryUpdate}
                onSubcategoryUpdate={handleSubcategoryUpdate}
                editMode={editMode()}
              />
            </CardContent>
          </Card>
        </div>
      </Show>

      <Show when={!showUploader() && !props.requirements}>
        <Card>
          <CardContent class="py-12 text-center">
            <p class="text-muted-foreground mb-4">卒業要件が設定されていません</p>
            <Button onClick={props.onEditRequirements}>卒業要件を設定</Button>
          </CardContent>
        </Card>
      </Show>
    </div>
  );
};
