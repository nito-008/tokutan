import { Circle, CircleCheck } from "lucide-solid";
import { type Component, For, Show } from "solid-js";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import type { CategoryStatus, MatchedCourse, SubcategoryStatus } from "~/lib/types";

interface RequirementTreeProps {
  categoryStatuses: CategoryStatus[];
}

export const RequirementTree: Component<RequirementTreeProps> = (props) => {
  return (
    <Accordion multiple={true} collapsible class="w-full">
      <For each={props.categoryStatuses}>
        {(category) => (
          <AccordionItem value={category.categoryId}>
            <AccordionTrigger class="hover:no-underline">
              <div class="flex items-center gap-3 w-full">
                <StatusIcon isSatisfied={category.isSatisfied} />
                <span class="font-medium">{category.categoryName}</span>
                <span class="text-sm text-muted-foreground ml-auto mr-4">
                  {category.earnedCredits}/{category.requiredCredits}単位
                  {category.inProgressCredits > 0 && (
                    <span class="text-blue-500"> (+{category.inProgressCredits}履修中)</span>
                  )}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div class="pl-6">
                <Accordion multiple={true} collapsible class="space-y-2">
                  <For each={category.subcategoryStatuses}>
                    {(subcategory) => <SubcategoryItem subcategory={subcategory} />}
                  </For>
                </Accordion>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </For>
    </Accordion>
  );
};

const SubcategoryItem: Component<{ subcategory: SubcategoryStatus }> = (props) => {
  return (
    <AccordionItem value={props.subcategory.subcategoryId}>
      <AccordionTrigger class="hover:no-underline">
        <div class="flex items-center gap-3 w-full">
          <StatusIcon isSatisfied={props.subcategory.isSatisfied} />
          <span class="font-medium text-sm">{props.subcategory.subcategoryName}</span>
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
