import { Component, Show, createSignal } from 'solid-js';
import { Button } from '~/components/ui/button';

interface HeaderProps {
  onExport: () => void;
  onImport: () => void;
  onSettings?: () => void;
}

export const Header: Component<HeaderProps> = (props) => {
  return (
    <header class="border-b bg-background">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h1 class="text-xl font-bold text-primary">tokutan</h1>
          <span class="text-sm text-muted-foreground">卒業要件チェッカー</span>
        </div>

        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={props.onImport}>
            インポート
          </Button>
          <Button variant="outline" size="sm" onClick={props.onExport}>
            エクスポート
          </Button>
          <Show when={props.onSettings}>
            <Button variant="ghost" size="sm" onClick={props.onSettings}>
              設定
            </Button>
          </Show>
        </div>
      </div>
    </header>
  );
};
