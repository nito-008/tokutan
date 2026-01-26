import { Circle, CircleCheck, Pencil, Plus } from "lucide-solid";
import { type Component, createSignal, For, Show } from "solid-js";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { getSubcategoryLabel } from "~/lib/requirements/subcategory";
import type {
  CategoryStatus,
  GraduationRequirements,
  MatchedCourse,
  RequirementCategory,
  RequirementSubcategory,
  SubcategoryStatus,
} from "~/lib/types";
import { SubcategoryEditModal } from "./SubcategoryEditModal";

interface RequirementTreeProps {
  categoryStatuses: CategoryStatus[];
  unmatchedCourses?: MatchedCourse[];
  requirements?: GraduationRequirements;
  onCategoryUpdate?: (categoryId: string | null, updates: Partial<RequirementCategory>) => void;
  onSubcategoryUpdate?: (
    categoryId: string,
    subcategoryId: string | null,
    updates: Partial<RequirementSubcategory>,
  ) => void;
  onSubcategoryDelete?: (categoryId: string, subcategoryId: string) => void;
  editMode?: boolean;
}

export const RequirementTree: Component<RequirementTreeProps> = (props) => {
  const [editingSubcategory, setEditingSubcategory] = createSignal<{
    categoryId: string;
    subcategory: RequirementSubcategory;
  } | null>(null);
  const [addingSubcategoryFor, setAddingSubcategoryFor] = createSignal<string | null>(null);

  const findCategory = (categoryId: string): RequirementCategory | undefined => {
    return props.requirements?.categories.find((c) => c.id === categoryId);
  };

  const findSubcategory = (
    categoryId: string,
    subcategoryId: string,
  ): { categoryId: string; subcategory: RequirementSubcategory } | undefined => {
    const category = findCategory(categoryId);
    const subcategory = category?.subcategories.find((s) => s.id === subcategoryId);
    return subcategory ? { categoryId, subcategory } : undefined;
  };

  const handleSubcategorySave = (
    categoryId: string,
    subcategoryId: string | null,
    updates: Partial<RequirementSubcategory>,
  ) => {
    props.onSubcategoryUpdate?.(categoryId, subcategoryId, updates);
  };

  const currentCategoryName = () => {
    const editing = editingSubcategory();
    if (editing) {
      return findCategory(editing.categoryId)?.name ?? "";
    }
    const adding = addingSubcategoryFor();
    if (adding) {
      return findCategory(adding)?.name ?? "";
    }
    return "";
  };

  return (
    <>
      <Accordion multiple={true} collapsible class="w-full">
        <For each={props.categoryStatuses}>
          {(category) => (
            <>
              <AccordionItem value={category.categoryId}>
                <AccordionTrigger class="hover:no-underline">
                  <div class="flex items-center gap-3 w-full">
                    <StatusIcon isSatisfied={category.isSatisfied} />
                    <span class="font-medium">{category.categoryName}</span>
                    <span class="text-sm text-muted-foreground ml-auto mr-4">
                      {category.earnedCredits}/{category.requiredCredits}単位{" "}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div class="pl-6">
                    <Accordion multiple={true} collapsible class="space-y-2">
                      <For each={category.subcategoryStatuses}>
                        {(subcategory) => (
                          <SubcategoryItem
                            subcategory={subcategory}
                            categoryId={category.categoryId}
                            editable={
                              !!props.editMode &&
                              !!props.requirements &&
                              !!props.onSubcategoryUpdate
                            }
                            onEdit={() => {
                              const sub = findSubcategory(
                                category.categoryId,
                                subcategory.subcategoryId,
                              );
                              if (sub) setEditingSubcategory(sub);
                            }}
                          />
                        )}
                      </For>
                    </Accordion>
                    <Show when={props.editMode && props.requirements && props.onSubcategoryUpdate}>
                      <button
                        type="button"
                        class="flex items-center gap-2 w-full p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded mt-2"
                        onClick={() => setAddingSubcategoryFor(category.categoryId)}
                      >
                        <Plus class="size-4" />
                        サブカテゴリを追加
                      </button>
                    </Show>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </>
          )}
        </For>
        <Show when={props.unmatchedCourses}>
          <AccordionItem value="unmatched-courses">
            <AccordionTrigger class="hover:no-underline">
              <div class="flex items-center gap-3 w-full">
                <Circle class="size-4 text-gray-300" />
                <span class="font-medium">該当しない科目</span>
                <span class="text-sm text-muted-foreground ml-auto mr-4">
                  {(props.unmatchedCourses ?? []).length}件
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div class="pl-6 space-y-1">
                <For each={props.unmatchedCourses}>
                  {(course) => <CourseItem course={course} />}
                </For>
                <Show when={(props.unmatchedCourses ?? []).length === 0}>
                  <p class="text-sm text-muted-foreground">該当しない科目はありません</p>
                </Show>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Show>
      </Accordion>

      <SubcategoryEditModal
        open={!!editingSubcategory() || !!addingSubcategoryFor()}
        subcategory={editingSubcategory()?.subcategory ?? null}
        categoryId={editingSubcategory()?.categoryId ?? addingSubcategoryFor() ?? ""}
        categoryName={currentCategoryName()}
        onClose={() => {
          setEditingSubcategory(null);
          setAddingSubcategoryFor(null);
        }}
        onDelete={props.onSubcategoryDelete}
        onSave={handleSubcategorySave}
      />
    </>
  );
};

const SubcategoryItem: Component<{
  subcategory: SubcategoryStatus;
  categoryId: string;
  editable: boolean;
  onEdit: () => void;
}> = (props) => {
  return (
    <AccordionItem value={props.subcategory.subcategoryId}>
      <AccordionTrigger class="hover:no-underline">
        <div class="flex items-center gap-3 w-full">
          <StatusIcon isSatisfied={props.subcategory.isSatisfied} />
          <span class="font-medium text-sm">
            {getSubcategoryLabel(props.subcategory.subcategoryType)}
          </span>
          <Show when={props.editable}>
            <button
              type="button"
              class="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                props.onEdit();
              }}
            >
              <Pencil class="size-4" />
            </button>
          </Show>
          <span class="text-xs text-muted-foreground ml-auto mr-4">
            {props.subcategory.earnedCredits}/{props.subcategory.requiredCredits}単位
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div class="pl-6 space-y-1">
          <For each={props.subcategory.matchedCourses}>
            {(course) => <CourseItem course={course} />}
          </For>
          <Show when={props.subcategory.matchedCourses.length === 0}>
            <p class="text-sm text-muted-foreground">該当する科目がありません</p>
          </Show>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

const CourseItem: Component<{ course: MatchedCourse }> = (props) => {
  return (
    <div class="flex items-center gap-2 text-sm py-1">
      <StatusIcon
        isSatisfied={props.course.isPassed}
        isInProgress={props.course.isInProgress}
        isUnregistered={props.course.isUnregistered}
      />
      <span class={props.course.isUnregistered ? "text-muted-foreground" : ""}>
        {props.course.courseName}
      </span>
      <span class="text-muted-foreground">({props.course.credits}単位)</span>
      <GradeBadge grade={props.course.grade} />
    </div>
  );
};

const StatusIcon: Component<{
  isSatisfied: boolean;
  isInProgress?: boolean;
  isUnregistered?: boolean;
}> = (props) => {
  if (props.isUnregistered) {
    return <Circle class="size-4 text-gray-300" />;
  }
  if (props.isInProgress) {
    return <Circle class="size-4 text-blue-500 fill-blue-500" />;
  }
  return props.isSatisfied ? (
    <CircleCheck class="size-4 text-green-500" />
  ) : (
    <Circle class="size-4 text-yellow-500 fill-yellow-500" />
  );
};

const GradeBadge: Component<{ grade: string }> = (props) => {
  const variants: Record<string, string> = {
    "A+": "bg-green-500",
    A: "bg-lime-500",
    B: "bg-yellow-500",
    C: "bg-orange-500",
    D: "bg-red-500",
    P: "bg-purple-500",
    認: "bg-purple-500",
    履修中: "bg-blue-500",
    未履修: "bg-gray-400",
  };

  return (
    <Badge class={`${variants[props.grade] || "bg-gray-500"} text-white text-xs`}>
      {props.grade}
    </Badge>
  );
};
