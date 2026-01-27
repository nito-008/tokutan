import { CircleCheck } from "lucide-solid";
import { type Component, createEffect, createSignal, For, onCleanup, Show } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Switch, SwitchControl, SwitchLabel } from "~/components/ui/switch";
import { calculateRequirementStatus } from "~/lib/calculator/requirements";
import { getCachedKdb } from "~/lib/db/kdb";
import { saveRequirements } from "~/lib/db/requirements";
import type {
  GraduationRequirements,
  RequirementCategory,
  RequirementGroup,
  RequirementStatus,
  RequirementSubcategory,
} from "~/lib/types";
import { useAppState, useAppStateActions } from "~/stores/appState";
import { DonutChart, getCategoryColor } from "./DonutChart";
import { RequirementTree } from "./RequirementTree";

export const GraduationChecker: Component = () => {
  const appState = useAppState();
  const { updateRequirements } = useAppStateActions();
  const [status, setStatus] = createSignal<RequirementStatus>({
    requirementsId: "",
    totalEarnedCredits: 0,
    totalInProgressCredits: 0,
    totalRequiredCredits: 0,
    isGraduationEligible: false,
    categoryStatuses: [],
    calculatedAt: "",
  });
  const [editMode, setEditMode] = createSignal(false);

  // 要件充足状況を計算
  createEffect(() => {
    const state = appState();
    const requirements = state?.requirements;
    const enrollment = state?.enrollment;

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
      const calculated = await calculateRequirementStatus(
        requirements,
        enrollment.courses,
        kdbCourses,
      );
      if (cancelled) return;
      setStatus(calculated);
    })();
  });

  const handleCategoryUpdate = async (
    categoryId: string | null,
    updates: Partial<RequirementCategory>,
  ) => {
    const requirements = appState()?.requirements;
    if (!requirements) return;

    let updatedCategories: RequirementCategory[];
    if (categoryId === null) {
      const newCategory: RequirementCategory = {
        id: `cat-${Date.now()}`,
        name: updates.name || "新しいカテゴリ",
        subcategories: [],
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
    updateRequirements(updatedRequirements);
  };

  const handleSubcategoryUpdate = async (
    categoryId: string,
    subcategoryId: string | null,
    updates: Partial<RequirementSubcategory>,
  ) => {
    const requirements = appState()?.requirements;
    if (!requirements) return;

    const hasCourseIds = Object.hasOwn(updates, "courseIds");
    const hasMinCredits = Object.hasOwn(updates, "minCredits");
    const hasMaxCredits = Object.hasOwn(updates, "maxCredits");
    const hasGroups = Object.hasOwn(updates, "groups");

    const buildSubcategory = (existing?: RequirementSubcategory): RequirementSubcategory => {
      const nextType = updates.type ?? existing?.type ?? "elective";
      const notes = updates.notes ?? existing?.notes;

      if (nextType === "required") {
        type RequiredUpdate = Partial<{
          type: "required";
          courseIds: string[];
          groups: RequirementGroup[];
        }>;
        const courseIds = hasCourseIds
          ? ((updates as RequiredUpdate).courseIds ?? [])
          : existing?.type === "required"
            ? (existing.courseIds ?? [])
            : [];
        const groups = hasGroups
          ? ((updates as RequiredUpdate).groups ?? [])
          : existing?.type === "required"
            ? (existing.groups ?? [])
            : [];
        return {
          id: existing?.id ?? `subcat-${Date.now()}`,
          type: "required",
          courseIds,
          groups,
          notes,
        };
      }

      type ElectiveUpdate = Partial<{
        type: "elective" | "free";
        minCredits: number;
        maxCredits?: number;
        groups: RequirementGroup[];
      }>;
      const minCredits = hasMinCredits
        ? ((updates as ElectiveUpdate).minCredits ?? 0)
        : existing && existing.type !== "required"
          ? existing.minCredits
          : 0;
      const maxCredits = hasMaxCredits
        ? (updates as ElectiveUpdate).maxCredits
        : existing && existing.type !== "required"
          ? existing.maxCredits
          : undefined;
      const groups = hasGroups
        ? ((updates as ElectiveUpdate).groups ?? [])
        : existing && existing.type !== "required"
          ? existing.groups
          : [];

      return {
        id: existing?.id ?? `subcat-${Date.now()}`,
        type: nextType,
        minCredits,
        maxCredits,
        groups,
        notes,
      };
    };

    const updatedCategories = requirements.categories.map((cat) => {
      if (cat.id !== categoryId) return cat;

      if (subcategoryId === null) {
        const newSubcategory = buildSubcategory();
        return {
          ...cat,
          subcategories: [...cat.subcategories, newSubcategory],
        };
      }

      return {
        ...cat,
        subcategories: cat.subcategories.map((sub) =>
          sub.id === subcategoryId ? buildSubcategory(sub) : sub,
        ),
      };
    });

    const updatedRequirements: GraduationRequirements = {
      ...requirements,
      categories: updatedCategories,
    };

    await saveRequirements(updatedRequirements);
    updateRequirements(updatedRequirements);
  };

  const handleSubcategoryDelete = async (categoryId: string, subcategoryId: string) => {
    const requirements = appState()?.requirements;
    if (!requirements) return;

    const updatedCategories = requirements.categories.map((cat) =>
      cat.id === categoryId
        ? {
            ...cat,
            subcategories: cat.subcategories.filter((sub) => sub.id !== subcategoryId),
          }
        : cat,
    );

    const updatedRequirements: GraduationRequirements = {
      ...requirements,
      categories: updatedCategories,
    };

    await saveRequirements(updatedRequirements);
    updateRequirements(updatedRequirements);
  };

  const remaining = () => status().totalRequiredCredits - status().totalEarnedCredits;

  return (
    <div class="space-y-6">
      <Show when={appState()?.requirements}>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card class="lg:col-span-1">
            <CardHeader>
              <CardTitle class="text-2xl flex items-center gap-2">
                <Show
                  when={status().isGraduationEligible}
                  fallback={<span>卒業まであと&nbsp;{remaining()}単位!</span>}
                >
                  <span>卒業!</span>
                </Show>
              </CardTitle>
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
                {/* 未取得の凡例アイテム */}
                <Show
                  when={(status()?.totalRequiredCredits ?? 0) > (status()?.totalEarnedCredits ?? 0)}
                >
                  <div class="flex items-center gap-2 text-sm">
                    <div class="w-3 h-3 rounded" style={{ "background-color": "#e5e7eb" }} />
                    <span>未取得</span>
                    <span class="ml-auto text-muted-foreground">
                      {(status()?.totalRequiredCredits ?? 0) - (status()?.totalEarnedCredits ?? 0)}
                    </span>
                  </div>
                </Show>
              </div>
            </CardContent>
          </Card>

          <Card class="lg:col-span-2">
            <CardHeader class="flex flex-row items-center justify-between">
              <Switch checked={editMode()} onChange={setEditMode} class="flex items-center gap-2">
                <SwitchLabel>編集モード</SwitchLabel>
                <SwitchControl />
              </Switch>
            </CardHeader>
            <CardContent>
              <RequirementTree
                categoryStatuses={status()?.categoryStatuses ?? []}
                unmatchedCourses={status()?.unmatchedCourses ?? []}
                requirements={appState()?.requirements ?? undefined}
                onCategoryUpdate={handleCategoryUpdate}
                onSubcategoryUpdate={handleSubcategoryUpdate}
                onSubcategoryDelete={handleSubcategoryDelete}
                editMode={editMode()}
              />
            </CardContent>
          </Card>
        </div>
      </Show>
    </div>
  );
};
