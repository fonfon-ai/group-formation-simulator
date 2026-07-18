import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SpeechEffectsComparisonPanel } from "./SpeechEffectsComparisonPanel";
import { DEFAULT_PARAMS } from "../simulation/presets";

describe("SpeechEffectsComparisonPanel", () => {
  it("renders the empty state prompt before any comparison has been executed", () => {
    const html = renderToStaticMarkup(
      createElement(SpeechEffectsComparisonPanel, {
        presetId: "natural",
        params: DEFAULT_PARAMS,
        seed: 12345,
        interventionId: "none",
        singleSimRunning: false,
        onBeforeRun: () => {},
      }),
    );

    expect(html).toContain("Compare speech effects OFF/ON");
    expect(html).toContain("identical conditions");
    expect(html).not.toContain("monte-carlo-stale");
  });

  it("works regardless of the selected intervention (unlike InterventionComparisonPanel, 'none' is not disabled)", () => {
    const html = renderToStaticMarkup(
      createElement(SpeechEffectsComparisonPanel, {
        presetId: "natural",
        params: DEFAULT_PARAMS,
        seed: 12345,
        interventionId: "none",
        singleSimRunning: false,
        onBeforeRun: () => {},
      }),
    );

    expect(html).not.toContain("nothing to compare");
  });

  it("shows a note that the single simulation will pause when it is currently running", () => {
    const html = renderToStaticMarkup(
      createElement(SpeechEffectsComparisonPanel, {
        presetId: "natural",
        params: DEFAULT_PARAMS,
        seed: 12345,
        interventionId: "late-join-ok",
        singleSimRunning: true,
        onBeforeRun: () => {},
      }),
    );

    expect(html).toContain("Running this will pause the single simulation");
  });
});
