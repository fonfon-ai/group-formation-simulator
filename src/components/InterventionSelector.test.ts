import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { InterventionSelector } from "./InterventionSelector";
import { INTERVENTION_SCENARIOS } from "../simulation/interventions";

describe("InterventionSelector", () => {
  it("renders an option for every intervention scenario, including none", () => {
    const html = renderToStaticMarkup(
      createElement(InterventionSelector, {
        interventionId: "none",
        onInterventionChange: () => {},
      }),
    );

    for (const scenario of INTERVENTION_SCENARIOS) {
      expect(html).toContain(scenario.name);
    }
    expect(html).toContain('value="none"');
  });

  it("shows only the description (no expected effect) when none is selected", () => {
    const html = renderToStaticMarkup(
      createElement(InterventionSelector, {
        interventionId: "none",
        onInterventionChange: () => {},
      }),
    );

    expect(html).toContain("No intervention is made to the setting");
    expect(html).not.toContain("Expected effect");
  });

  it("shows the description, expected effect, and likely metrics for a selected scenario", () => {
    const html = renderToStaticMarkup(
      createElement(InterventionSelector, {
        interventionId: "light-observer-invitation",
        onInterventionChange: () => {},
      }),
    );

    expect(html).toContain("A gentle nudge to the observerJoiner");
    expect(html).toContain("Expected effect");
    expect(html).toContain("Metrics it tends to move");
  });
});
