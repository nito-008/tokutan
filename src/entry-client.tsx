// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";

// ResizeObserver loop エラーを抑制
// このエラーはアニメーション中に発生する良性のエラーで、機能に影響しない
const resizeObserverError = (e: ErrorEvent) => {
  if (e.message === "ResizeObserver loop completed with undelivered notifications.") {
    e.stopImmediatePropagation();
  }
};
window.addEventListener("error", resizeObserverError);

const app = document.getElementById("app");
if (app) {
  mount(() => <StartClient />, app);
}
