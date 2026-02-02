import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { Toaster } from "solid-sonner";
import "./app.css";
import { Link, Meta, MetaProvider, Title } from "@solidjs/meta";

const SITE_TITLE = "とくたん！ - 筑波大学卒業要件チェッカー";
const SITE_DESCRIPTION = "筑波大学生向け卒業要件チェッカー";
const OG_IMAGE = "https://tokutan.nito008.com/ogp.png";
const TWITTER_ACCOUNT = "@nito_008";

export default function App() {
  return (
    <MetaProvider>
      <Title>{SITE_TITLE}</Title>
      <Link rel="icon" href="/favicon.ico" sizes="any" />
      <Link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <Link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <Link rel="manifest" href="/site.webmanifest" />
      <Meta name="theme-color" content="#1CB7FF" />

      <Meta property="og:site_name" content={SITE_TITLE} />
      <Meta property="og:url" content="https://tokutan.nito008.com" />
      <Meta property="og:title" content={SITE_TITLE} />
      <Meta property="og:description" content={SITE_DESCRIPTION} />
      <Meta property="og:image" content={OG_IMAGE} />
      <Meta property="og:type" content="website" />

      <Meta name="twitter:card" content="summary_large_image" />
      <Meta name="twitter:title" content={SITE_TITLE} />
      <Meta name="twitter:description" content={SITE_DESCRIPTION} />
      <Meta name="twitter:image" content={OG_IMAGE} />
      <Meta name="twitter:site" content={TWITTER_ACCOUNT} />
      <Meta name="twitter:creator" content={TWITTER_ACCOUNT} />
      <Router
        root={(props) => (
          <>
            <Suspense>{props.children}</Suspense>
            <Toaster />
          </>
        )}
      >
        <FileRoutes />
      </Router>
    </MetaProvider>
  );
}
