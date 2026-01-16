import { CircleCheck } from "lucide-solid";
import { type Component, Show } from "solid-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { RequirementStatus } from "~/lib/types";

interface RequirementsSummaryProps {
  status: RequirementStatus;
  requirementsName: string;
}

export const RequirementsSummary: Component<RequirementsSummaryProps> = (props) => {
  const remaining = () => props.status.totalRequiredCredits - props.status.totalEarnedCredits;
  const potentialTotal = () =>
    props.status.totalEarnedCredits + props.status.totalInProgressCredits;

  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-2xl flex items-center gap-2">
            <Show
              when={props.status.isGraduationEligible}
              fallback={<span>卒業まであと&nbsp;{remaining()}単位</span>}
            >
              <CircleCheck class="size-6 text-green-500" />
              <span>卒業可能</span>
            </Show>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">{props.requirementsName}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardDescription>取得単位数</CardDescription>
          <CardTitle class="text-2xl">
            {props.status.totalEarnedCredits} / {props.status.totalRequiredCredits}
            <span class="text-base text-muted-foreground ml-2">単位</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex items-center gap-2">
            <div class="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                class="h-full bg-primary transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (props.status.totalEarnedCredits / props.status.totalRequiredCredits) * 100,
                  )}%`,
                }}
              />
            </div>
            <span class="text-sm font-medium">
              {Math.round(
                (props.status.totalEarnedCredits / props.status.totalRequiredCredits) * 100,
              )}
              %
            </span>
          </div>
          <Show when={props.status.totalInProgressCredits > 0}>
            <p class="text-sm text-blue-500 mt-1">
              履修中の単位を含めると&nbsp;{potentialTotal()}/{props.status.totalRequiredCredits}
              &nbsp;単位
            </p>
          </Show>
        </CardContent>
      </Card>
    </div>
  );
};
