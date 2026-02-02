// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";
import { Title } from "chart.js";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_TITLE, TWITTER_ACCOUNT } from "./const";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
          {assets}

          <title>{SITE_TITLE}</title>
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/site.webmanifest" />
          <meta name="theme-color" content="#1CB7FF" />

          <meta property="og:site_name" content={SITE_TITLE} />
          <meta property="og:url" content="https://tokutan.nito008.com" />
          <meta property="og:title" content={SITE_TITLE} />
          <meta property="og:description" content={SITE_DESCRIPTION} />
          <meta property="og:image" content={OG_IMAGE} />
          <meta property="og:type" content="website" />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={SITE_TITLE} />
          <meta name="twitter:description" content={SITE_DESCRIPTION} />
          <meta name="twitter:image" content={OG_IMAGE} />
          <meta name="twitter:site" content={TWITTER_ACCOUNT} />
          <meta name="twitter:creator" content={TWITTER_ACCOUNT} />
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
