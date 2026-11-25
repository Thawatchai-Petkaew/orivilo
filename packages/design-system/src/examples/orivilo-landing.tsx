"use client";

import { type ReactNode, useId, useState } from "react";
import { DesignProfileBoundary } from "../boundary/DesignProfileBoundary";
import { Badge, Button, CanvasBoard, Input, Logo } from "../components/index";
import type { BoardNode, Graph, PortSpec } from "../components/canvas-board/graph";
import { LocaleProvider, useMessages } from "../i18n/LocaleProvider";
import type { Locale } from "../i18n/locale";
import type { Messages } from "../i18n/messages/index";
import { BRAND_PROFILES } from "../profiles/index";
import { BusinessBoardScreen } from "./business-board";
import { ENGLISH_VIEW, THAI_VIEW } from "./business-fixtures";
import { GuidebookScreen } from "./guidebook";
import { done } from "./guidebook-fixtures";
import { TrueHandles } from "./true-handles";

/** Under this width the page takes its narrow form: one column, a narrow board, no app frame. */
const NARROW = 720;
/** The band photograph is the ORV-274 image `direction-making`; no image file is added here. */
const BAND_PHOTO = { src: "/orv-274/direction-making.webp", width: 1448, height: 1086 };

export interface OriviloLandingProps {
  /** The page's language; every string and the sample project follow it. */
  lang?: Locale | undefined;
  /** The width the page is laid out at, in px. Under 720 it takes the narrow form. */
  width?: number | undefined;
  /**
   * Whether the band photograph is there. A file that fails to load counts as missing too: the
   * band then keeps its text at full width and the "made with AI" label goes with the photograph.
   */
  photograph?: boolean | undefined;
}

type Words = Messages["oriviloLanding"]["board"];

/**
 * ORIVILO's own board, from brief to product: six nodes at the wide width, three at the narrow
 * one. The board is a fixed example graph, so it is always there.
 */
export function heroGraph(t: Words, narrow: boolean): Graph {
  const port = (id: string, kind: PortSpec["kind"], label: string): PortSpec => ({
    id,
    kind,
    label,
  });
  const node = (
    id: string,
    x: number,
    y: number,
    title: string,
    kind: BoardNode["data"]["kind"],
    width: number,
    inputs: PortSpec[],
    outputs: PortSpec[],
    pad: "text" | "media" = "text",
  ): BoardNode => ({
    id,
    type: "orivilo",
    position: { x, y },
    width,
    data: { title, kind, size: "custom", pad, inputs, outputs },
  });
  const edge = (i: number, source: string, sourceHandle: string, target: string, handle: string) =>
    ({
      id: `e${i}`,
      type: "orivilo",
      source,
      sourceHandle,
      target,
      targetHandle: handle,
      data: { meaning: "input", label: false },
    }) as const;
  if (narrow) {
    return {
      nodes: [
        node("logo", 0, 0, t.logo, "artifact", 150, [], [port("out", "image", t.image)], "media"),
        node(
          "colour",
          0,
          230,
          t.colour,
          "artifact",
          150,
          [],
          [port("out", "palette", t.palette)],
          "media",
        ),
        node(
          "guide",
          200,
          100,
          t.guidebook,
          "artifact",
          200,
          [port("img", "image", t.image), port("pal", "palette", t.palette)],
          [],
          "media",
        ),
      ],
      edges: [edge(0, "logo", "out", "guide", "img"), edge(1, "colour", "out", "guide", "pal")],
    };
  }
  return {
    nodes: [
      node("brief", 0, 112, t.brief, "knowledge", 240, [], [port("out", "text", t.text)]),
      node(
        "pos",
        300,
        84,
        t.positioning,
        "knowledge",
        280,
        [port("in", "text", t.text)],
        [port("out", "text", t.text)],
      ),
      node(
        "logo",
        640,
        0,
        t.logo,
        "artifact",
        220,
        [port("in", "text", t.text)],
        [port("out", "image", t.image)],
        "media",
      ),
      node(
        "colour",
        640,
        250,
        t.colour,
        "artifact",
        220,
        [port("in", "text", t.text)],
        [port("out", "palette", t.palette)],
        "media",
      ),
      node(
        "guide",
        920,
        84,
        t.guidebook,
        "artifact",
        260,
        [port("img", "image", t.image), port("pal", "palette", t.palette)],
        [port("out", "profile", t.profile)],
        "media",
      ),
      node("product", 1240, 96, t.product, "artifact", 260, [port("in", "profile", t.profile)], []),
    ],
    edges: [
      edge(0, "brief", "out", "pos", "in"),
      edge(1, "pos", "out", "logo", "in"),
      edge(2, "pos", "out", "colour", "in"),
      edge(3, "logo", "out", "guide", "img"),
      edge(4, "colour", "out", "guide", "pal"),
      edge(5, "guide", "out", "product", "in"),
    ],
  };
}

/** The bodies of the hero board's nodes, drawn from catalog parts and tokens. */
export function heroBody(t: Words, narrow: boolean) {
  return (node: BoardNode): ReactNode => {
    switch (node.id) {
      case "brief":
        return (
          <div className="flex flex-col gap-1">
            <p className="m-0 text-heading-sm">{t.briefText}</p>
            <p className="m-0 text-body-xs text-text-secondary">{t.briefMeta}</p>
          </div>
        );
      case "pos":
        return (
          <div className="flex flex-col gap-2">
            <p className="m-0 text-body-sm">{t.positioningText}</p>
            <p className="m-0 text-body-xs text-text-secondary">{t.agreed}</p>
          </div>
        );
      case "logo":
        return (
          <div className="ds-node__media flex h-[132px] items-center justify-center bg-surface-sunken">
            <Logo kind="mark" height={72} decorative />
          </div>
        );
      case "colour":
        return (
          <div className="ds-node__media flex h-[100px] overflow-hidden">
            <div className="h-full bg-brand-signature" style={{ flexGrow: 3 }} />
            <div className="h-full bg-surface-sunken" style={{ flexGrow: 3 }} />
            <div className="h-full bg-text-primary" style={{ flexGrow: 2 }} />
            <div
              className="h-full bg-action-intent"
              data-design-profile="neutral"
              data-mode="light"
              style={{ flexGrow: 1 }}
            />
          </div>
        );
      case "guide":
        return (
          <div
            className="ds-node__media relative h-[150px] overflow-hidden bg-brand-signature"
            data-mode="dark"
            data-design-profile="neutral"
          >
            <div className="absolute left-4 top-4">
              <Logo kind="horizontal" height={16} tone="one-colour" decorative />
            </div>
            <p
              className={`absolute bottom-4 left-4 z-10 m-0 text-heading-sm text-brand-ink ${narrow ? "max-w-[85%]" : "max-w-[56%]"}`}
            >
              {t.guideTitle}
            </p>
            {narrow ? null : (
              <div className="absolute -bottom-12 -right-12">
                <Logo kind="mark" height={128} tone="one-colour" decorative />
              </div>
            )}
          </div>
        );
      case "product":
        return (
          <div className="flex flex-col gap-3">
            <Input size="sm" defaultValue={t.nameValue} aria-label={t.nameLabel} />
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" tabIndex={-1}>
                {t.start}
              </Button>
              <Badge variant="brand" size="sm">
                {t.nameValue}
              </Badge>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
}

function HeroBoard({ narrow }: { narrow: boolean }) {
  const t = useMessages().oriviloLanding.board;
  return (
    <div style={{ height: narrow ? 400 : 440 }} className="relative">
      <CanvasBoard
        label={t.label}
        graph={heroGraph(t, narrow)}
        variant="present"
        chrome={false}
        minimap={false}
        renderBody={heroBody(t, narrow)}
      >
        <TrueHandles />
      </CanvasBoard>
    </div>
  );
}

/**
 * A live tree laid out at its design width and scaled into a fixed box. A transform does not change
 * layout, so the page keeps its design-width layout; `inert` and `aria-hidden` take it out of the
 * tab order and the accessibility tree. `fade` lays a token-only overlay over the cropped bottom
 * edge, from nothing to the page's own canvas colour.
 */
function Frame({
  width,
  height,
  design,
  fade = false,
  children,
}: {
  width: number;
  height: number;
  design: number;
  fade?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-container border border-border-subtle">
      <div
        className="relative overflow-hidden"
        data-live-frame=""
        style={{ width, height }}
        inert
        aria-hidden="true"
      >
        <div
          className="absolute left-0 top-0 bg-surface-canvas font-body text-text-primary"
          style={{ width: design, transform: `scale(${width / design})`, transformOrigin: "0 0" }}
        >
          {children}
        </div>
      </div>
      {fade ? (
        <div
          aria-hidden="true"
          data-crop-fade=""
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12"
          style={{
            background: "linear-gradient(to bottom, transparent, var(--ds-surface-canvas))",
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * The one lime button of the page. The Studio-scoped intent tokens resolve to lime only outside a
 * profile boundary, so the button sits in a neutral light scope (spec ORV-309 `intent-once-1`).
 */
function IntentButton({ children }: { children: ReactNode }) {
  return (
    <span data-design-profile="neutral" data-mode="light" className="contents">
      <Button variant="intent" size="lg">
        {children}
      </Button>
    </span>
  );
}

function Page({ lang, width, photograph }: { lang: Locale; width: number; photograph: boolean }) {
  const t = useMessages().oriviloLanding;
  const ids = useId();
  const [failed, setFailed] = useState(false);
  const narrow = width < NARROW;
  const frameWidth = narrow ? width - 48 : 760;
  const showPhoto = photograph && !failed;
  const wrap = "mx-auto w-full max-w-[1184px] px-6 @[720px]:px-0";
  const points = [t.point.node, t.point.draft, t.point.rules];
  return (
    <div
      className="@container overflow-x-clip bg-surface-canvas font-body text-text-primary"
      lang={lang}
      style={{ width }}
    >
      <header className={`${wrap} flex items-center justify-between gap-4 py-5`}>
        <Logo kind="horizontal" height={24} decorative />
        <nav aria-label={t.navLabel} className="hidden items-center gap-8 @[720px]:flex">
          <a href={`#${ids}-work`} className="text-label-md text-text-secondary no-underline">
            {t.nav.product}
          </a>
          <a href={`#${ids}-board`} className="text-label-md text-text-secondary no-underline">
            {t.nav.how}
          </a>
          <a href={`#${ids}-guide`} className="text-label-md text-text-secondary no-underline">
            {t.nav.guidebook}
          </a>
        </nav>
        <Button variant="ghost" size="sm">
          {t.signIn}
        </Button>
      </header>

      <section
        className={`${wrap} grid gap-6 pt-12 @[960px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @[960px]:gap-16 @[960px]:pt-14`}
      >
        <h1
          className={`m-0 font-display text-balance ${narrow ? "text-display-md" : "text-display-lg"}`}
        >
          {t.title}
        </h1>
        <div className="flex flex-col gap-8">
          <p className="m-0 text-body-lg text-text-secondary">{t.lede}</p>
          <div className="flex flex-wrap gap-3">
            <IntentButton>{t.start}</IntentButton>
            <Button variant="secondary" size="lg">
              {t.see}
            </Button>
          </div>
        </div>
      </section>

      <section id={`${ids}-board`} className={`${wrap} pt-12`}>
        <HeroBoard narrow={narrow} />
        <p className="m-0 mt-3 text-body-sm text-text-secondary">{t.boardNote}</p>
      </section>

      <section
        id={`${ids}-work`}
        className={`${wrap} grid gap-10 pt-28 @[960px]:grid-cols-[1fr_360px] @[960px]:gap-16`}
      >
        {narrow ? null : (
          <div className="min-w-0">
            <Frame width={frameWidth} height={500} design={1280}>
              <BusinessBoardScreen
                access="ready"
                view={lang === "en" ? ENGLISH_VIEW : THAI_VIEW}
                signInHref="#"
                listHref="#"
                guidebookHref="#"
              />
            </Frame>
            <p className="m-0 mt-3 text-body-sm text-text-secondary">{t.appNote}</p>
          </div>
        )}
        <div className="flex flex-col">
          <h2 className="m-0 pb-6 font-display text-display-md text-balance">{t.workTitle}</h2>
          {points.map((point) => (
            <div key={point.title} className="border-t border-border-subtle py-5">
              <h3 className="m-0 text-heading-sm">{point.title}</h3>
              <p className="m-0 mt-2 text-body-md text-text-secondary">{point.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        data-band=""
        data-mode="light"
        data-design-profile="neutral"
        className={`mt-28 grid bg-brand-signature ${showPhoto ? "@[960px]:grid-cols-2" : ""}`}
      >
        <div
          className={`flex flex-col justify-end gap-6 py-16 @[960px]:py-24 ${showPhoto ? "px-6 @[720px]:px-12" : "mx-auto w-full max-w-[1184px] px-6 @[720px]:px-0"}`}
        >
          <h2 data-band-title="" className="m-0 font-display text-display-lg text-brand-ink">
            {t.bandTitle}
          </h2>
          <p className="m-0 max-w-[440px] text-body-lg text-brand-ink">{t.bandText}</p>
          {showPhoto ? (
            <p data-ai-label="" className="m-0 text-body-xs text-brand-ink">
              {t.aiPhoto}
            </p>
          ) : null}
        </div>
        {showPhoto ? (
          <img
            src={BAND_PHOTO.src}
            alt={t.bandAlt}
            width={BAND_PHOTO.width}
            height={BAND_PHOTO.height}
            className="block h-full min-h-[360px] w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : null}
      </section>

      <section
        id={`${ids}-guide`}
        className={`${wrap} grid gap-10 pt-28 @[960px]:grid-cols-[360px_1fr] @[960px]:gap-16`}
      >
        <div className="flex flex-col gap-4 @[960px]:pt-10">
          <h2 className="m-0 font-display text-display-md">{t.guideTitle}</h2>
          <p className="m-0 text-body-lg text-text-secondary">{t.guideText}</p>
        </div>
        <div className="min-w-0">
          <Frame width={frameWidth} height={narrow ? 480 : 460} design={narrow ? 390 : 760} fade>
            <GuidebookScreen access="ready" guidebook={done(lang)} boardHref="#" signInHref="#" />
          </Frame>
        </div>
      </section>

      <section className={`${wrap} flex flex-col items-start gap-8 py-28`}>
        <h2 className="m-0 max-w-[760px] font-display text-display-md text-balance">
          {t.closeTitle}
        </h2>
        <Button variant="primary" size="lg">
          {t.start}
        </Button>
      </section>

      <footer
        className={`${wrap} flex flex-wrap items-center justify-between gap-4 border-t border-border-subtle py-8`}
      >
        <div className="flex items-center gap-4">
          <Logo kind="horizontal" height={20} decorative />
          <span className="text-body-sm text-text-secondary">{t.tagline}</span>
        </div>
        <span className="text-body-sm text-text-secondary">{t.concept}</span>
      </footer>
    </div>
  );
}

/**
 * ORIVILO's own landing page (spec ORV-309): dark, English by default and Thai complete, made from
 * the catalog's parts only. The main picture is ORIVILO's own board, drawn live by `CanvasBoard`;
 * the work and guidebook sections show the real `BusinessBoardScreen` and `GuidebookScreen` on their
 * sample projects. It is a concept page and its footer says so. One lime intent button, one violet
 * plane, no glow, nothing that moves at rest. It always renders on the dark ORIVILO profile.
 */
export function OriviloLanding({
  lang = "en",
  width = 1280,
  photograph = true,
}: OriviloLandingProps) {
  return (
    <LocaleProvider locale={lang}>
      <DesignProfileBoundary profile={BRAND_PROFILES[0]} mode="dark">
        <Page lang={lang} width={width} photograph={photograph} />
      </DesignProfileBoundary>
    </LocaleProvider>
  );
}
