import type { Component } from "solid-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  graduationContent: any;
  courseContent: any;
}

export const TabNavigation: Component<TabNavigationProps> = (props) => {
  return (
    <Tabs value={props.activeTab} onChange={props.onTabChange} class="w-full">
      <TabsList class="grid w-full grid-cols-2 max-w-md mx-auto mb-6">
        <TabsTrigger value="graduation">卒業要件チェック</TabsTrigger>
        <TabsTrigger value="course">履修管理</TabsTrigger>
      </TabsList>

      <TabsContent value="graduation">{props.graduationContent}</TabsContent>

      <TabsContent value="course">{props.courseContent}</TabsContent>
    </Tabs>
  );
};
