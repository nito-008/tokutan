import { type Component, createEffect, createSignal, For, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { calculateRequirementStatus } from "~/lib/calculator/requirements";
import { importTwinsData } from "~/lib/db/enrollment";
import { getActiveProfile } from "~/lib/db/profiles";
import type { ValidationResult } from "~/lib/parsers/twins-csv";
import type {
  EnrollmentData,
  GraduationRequirements,
  RequirementStatus,
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
}

export const GraduationChecker: Component<GraduationCheckerProps> = (props) => {
  const [status, setStatus] = createSignal<RequirementStatus | null>(null);
  const [showUploader, setShowUploader] = createSignal(!props.enrollment);

  // 要件充足状況を計算
  createEffect(() => {
    if (props.requirements && props.enrollment) {
      const calculated = calculateRequirementStatus(props.requirements, props.enrollment.courses);
      setStatus(calculated);
    }
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
                <Button variant="outline" size="sm" onClick={props.onEditRequirements}>
                  要件編集
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <RequirementTree categoryStatuses={status()?.categoryStatuses ?? []} />
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
