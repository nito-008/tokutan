import type { Component } from "solid-js";

export const Footer: Component = () => {
  return (
    <footer class="border-t bg-background">
      <div class="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground flex gap-3 justify-center">
        <p>
          Source:{" "}
          <a
            href="https://github.com/nito-008/tokutan"
            target="_blank"
            rel="noopener noreferrer"
            class="underline hover:text-foreground"
          >
            https://github.com/nito-008/tokutan
          </a>
        </p>
        <p>
          Thanks to{" "}
          <a
            href="https://github.com/Make-IT-TSUKUBA/alternative-tsukuba-kdb"
            target="_blank"
            rel="noopener noreferrer"
            class="underline hover:text-foreground"
          >
            alternative-tsukuba-kdb
          </a>
          {" / "}
          <a
            href="https://github.com/s7tya/kdb-crawler"
            target="_blank"
            rel="noopener noreferrer"
            class="underline hover:text-foreground"
          >
            kdb-crawler
          </a>
        </p>
        <p>
          Developed by{" "}
          <a
            href="https://github.com/nito-008"
            target="_blank"
            rel="noopener noreferrer"
            class="underline hover:text-foreground"
          >
            @nito-008
          </a>
        </p>
      </div>
    </footer>
  );
};
