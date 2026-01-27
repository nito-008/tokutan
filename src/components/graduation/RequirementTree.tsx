import { Circle, CircleCheck, Pencil, Plus } from "lucide-solid";
import { type Component, createSignal, For, Show } from "solid-js";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { getSubcategoryLabel } from "~/lib/requirements/subcategory";
import type {
  CategoryStatus,
  GraduationRequirements,
  GroupRule,
  GroupStatus,
  MatchedCourse,
  RequirementCategory,
  RequirementGroup,
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

const formatCreditDisplay = (earned: number, min: number, max?: number): string => {
  const range = max !== undefined ? `${min}~${max}` : `${min}`;
  return `${earned}/${range}単位`;
};

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
                      {formatCreditDisplay(category.earnedCredits, category.requiredCredits)}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div class="pl-6 space-y-4">
                    <For each={category.subcategoryStatuses}>
                      {(subcategory) => {
                        const definition = findSubcategory(
                          category.categoryId,
                          subcategory.subcategoryId,
                        )?.subcategory;

                        return (
                          <SubcategoryPanel
                            subcategory={subcategory}
                            definition={definition}
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
                        );
                      }}
                    </For>
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

interface SubcategoryPanelProps {
  subcategory: SubcategoryStatus;
  definition?: RequirementSubcategory;
  editable: boolean;
  onEdit: () => void;
}

const SubcategoryPanel: Component<SubcategoryPanelProps> = (props) => {
  const groupDefinitions: RequirementGroup[] =
    props.definition && props.definition.type !== "required" ? props.definition.groups : [];

  return (
    <div class="border border-border rounded-xl p-3 space-y-4">
      <div class="flex items-center gap-3">
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
          {formatCreditDisplay(
            props.subcategory.earnedCredits,
            props.subcategory.requiredCredits,
            props.subcategory.maxCredits,
          )}
        </span>
      </div>

      <div class="space-y-4">
        {props.subcategory.subcategoryType === "required" ? (
          <div class="space-y-2">
            <Separator />
            <div class="space-y-1">
              <For each={props.subcategory.matchedCourses}>
                {(course) => <CourseItem course={course} />}
              </For>
              <Show when={props.subcategory.matchedCourses.length === 0}>
                <p class="text-sm text-muted-foreground">該当する科目がありません</p>
              </Show>
            </div>
          </div>
        ) : (
          <div class="space-y-4">
            <For each={props.subcategory.groupStatuses}>
              {(groupStatus) => (
                <ConditionBlock
                  groupStatus={groupStatus}
                  groupDefinition={groupDefinitions.find(
                    (group) => group.id === groupStatus.groupId,
                  )}
                />
              )}
            </For>
          </div>
        )}
      </div>
    </div>
  );
};

interface ConditionBlockProps {
  groupStatus: GroupStatus;
  groupDefinition?: RequirementGroup;
}

const ConditionBlock: Component<ConditionBlockProps> = (props) => {
  const description = formatGroupConditionLabel(props.groupDefinition);

  return (
    <div class="space-y-2">
      <div class="flex items-center gap-3 text-sm">
        <span class="whitespace-pre-line">{description}</span>
        <span class="text-xs text-muted-foreground ml-auto mr-4">
          {formatCreditDisplay(
            props.groupStatus.earnedCredits,
            props.groupStatus.requiredCredits,
            props.groupStatus.maxCredits,
          )}
        </span>
      </div>
      <Separator />
      <div class="space-y-1">
        <For each={props.groupStatus.matchedCourses}>
          {(course) => <CourseItem course={course} />}
        </For>
        <Show when={props.groupStatus.matchedCourses.length === 0}>
          <p class="text-sm text-muted-foreground">該当する科目がありません</p>
        </Show>
      </div>
    </div>
  );
};

const formatGroupConditionLabel = (group?: RequirementGroup): string => {
  if (!group) {
    return "条件情報なし";
  }

  const prefixNames = Array.from(
    new Set(
      group.rules
        .filter(
          (rule): rule is GroupRule & { type: "prefix"; prefix: string } => rule.type === "prefix",
        )
        .map((rule) => rule.prefix?.trim())
        .filter(Boolean),
    ),
  );

  const specificCourseIds = Array.from(
    new Set(
      group.rules
        .filter(
          (rule): rule is GroupRule & { type: "specific"; courseIds: string[] } =>
            rule.type === "specific",
        )
        .flatMap((rule) => rule.courseIds.filter(Boolean)),
    ),
  );

  const excludeCourseIds = Array.from(
    new Set(
      group.rules
        .filter(
          (rule): rule is GroupRule & { type: "exclude"; courseIds: string[] } =>
            rule.type === "exclude",
        )
        .flatMap((rule) => rule.courseIds.filter(Boolean)),
    ),
  );

  const categoryNames = Array.from(
    new Set(
      group.rules
        .filter(
          (
            rule,
          ): rule is GroupRule & {
            type: "category";
            majorCategory?: string;
            middleCategory?: string;
            minorCategory?: string;
          } => rule.type === "category",
        )
        .flatMap((rule) =>
          [rule.majorCategory, rule.middleCategory, rule.minorCategory].filter(Boolean),
        ),
    ),
  );

  const parts: string[] = [];

  if (prefixNames.length) {
    parts.push(`「${prefixNames.join(", ")}」で始まる科目`);
  }

  if (categoryNames.length) {
    const categoryText = categoryNames.join("、");
    parts.push(parts.length ? `\n${categoryText}` : categoryText);
  }

  if (specificCourseIds.length) {
    parts.push(specificCourseIds.join("、"));
  }

  if (excludeCourseIds.length) {
    parts.push(`除外: ${excludeCourseIds.join("、")}`);
  }

  return parts.length > 0 ? parts.join(" ・ ") : `グループ ${group.id}`;
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
      <span class="text-xs text-muted-foreground">{props.course.courseId}</span>
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
