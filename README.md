# Group Formation Simulator (UGS)

> Visualizing the awkward, fascinating few minutes after a social event ends — when people quietly decide who goes somewhere next, who hesitates, who follows, and who leaves.

**Group Formation Simulator** is an experimental, agent-based social simulation.

It models the informal moment after a party, dinner, meetup, conference session, or drinking event when a new group begins to form. Someone casually suggests going somewhere else. A few people drift closer. Some wait for the group to become clear. Some leave because the uncertainty becomes uncomfortable. Others join only after the group already exists.

This project turns that invisible social process into something you can observe, pause, inspect, and compare.

> In Japanese social life, this is often the *nijikai* moment — the “second round” after the main gathering. But the simulator is not limited to Japan. It is about a more general phenomenon: **how informal groups emerge under ambiguity.**

---

## Live demo

**Demo:** `https://fonfon-ai.github.io/group-formation-simulator/`

No installation is required. The published version runs in the browser, including mobile Safari.

> Replace `https://fonfon-ai.github.io/group-formation-simulator/` with your GitHub Pages URL, for example:  
> `https://fonfon-ai.github.io/group-formation-simulator/`

---

## Demo preview

Add a short GIF here before posting to Reddit or Hacker News.

```md
![Group Formation Simulator demo](./docs/assets/demo.gif)
```

A good GIF should show the full arc in 10–20 seconds:

1. People standing around after the first event.
2. A few agents begin forming a possible group.
3. Some agents approach, hesitate, or leave.
4. A group becomes confirmed.
5. The observer agent either joins late or drops out.

---

## Why this exists

Most social simulations focus on networks, opinions, contagion, or long-term relationships.

This project focuses on a much smaller, stranger, and very human situation:

> **The moment before a group is socially real.**

People do not always decide in isolation. They watch timing, read the room, wait for cues, avoid taking responsibility, follow existing relationships, or leave when the ambiguity becomes too much.

This simulator explores those dynamics through configurable agents, deterministic seeds, event logs, speech events, and Monte Carlo comparisons.

---

## What this is not

This is **not** a personality test.

It does **not** diagnose real people, predict real human behavior, or infer anyone’s true feelings.

The model is a simplified hypothesis about informal group formation. It is meant for exploration, visualization, design thinking, and playful research — not for evaluating individuals.

---

## Core idea

The central question is simple:

> After the main event ends, who joins the next group — and why?

The simulator represents each person as an agent with parameters such as:

- willingness to join the next event
- initiative
- tolerance for ambiguity
- resistance to influencing others
- conformity
- stress
- leave threshold
- existing social ties

Agents move through states such as:

- undecided
- approaching
- forming a group
- joined
- leaving
- left

Groups can begin as loose, unstable clusters and later become confirmed groups once enough agents join.

---

## The observerJoiner

The most important agent type in this project is the `observerJoiner`.

An `observerJoiner` is not someone who simply does not want to join.

They often **do** want to join. The problem is the ambiguous period before the group clearly exists.

```ts
const observerJoiner = {
  willingness: 0.8,          // wants to go to the next place
  initiative: 0.1,           // rarely initiates a group
  ambiguityTolerance: 0.25,  // struggles while the situation is unclear
  influenceAvoidance: 0.9,   // does not want to shape the room directly
  conformity: 0.5,           // can join once a group is visible
  leaveThreshold: 0.4,       // leaves when stress becomes too high
};
```

In the UI, observerJoiners are highlighted with an orange outline.

They are useful because they expose a common social pattern:

> “I wanted to join, but I could not enter while the group was still forming.”

---

## Features

- **Agent-based simulation** of informal group formation
- **Visual group dynamics** using browser-based SVG rendering
- **Deterministic seeds** for reproducible simulation runs
- **Scenario presets** for different social situations
- **observerJoiner inspector** for tracking hesitant-but-willing agents
- **State logs** explaining when and why agents move, join, or leave
- **Inner-voice bubbles** that visualize internal state without affecting the simulation
- **Speech events** for simulated utterances such as invitations, greetings, welcomes, and declines
- **Speech reception and interpretation model** for testing how heard speech affects later behavior
- **Intervention scenarios** for comparing different ways of designing the social situation
- **Monte Carlo runs** to compare outcomes across many seeds
- **Paired ON/OFF comparison** for speech effects
- **PWA support** for launching the app from a mobile home screen
- **GitHub Pages deployment** through GitHub Actions

---

## How to read the simulation

### Visual area

Each circle is an agent.

Typical colors:

| Color | Meaning |
| --- | --- |
| gray | undecided |
| blue | approaching a group |
| green | joined or joining a group |
| red | leaving |
| purple | initiator / group core |
| orange outline | observerJoiner |

Dotted circles represent groups that are still forming. Solid green circles represent confirmed groups.

### Event log

The event log records what happened and why, such as:

- an initiator started forming a core group
- an agent approached a group
- an agent joined
- an agent started leaving
- a speech event occurred
- a speech effect was registered

### Inspector

The observerJoiner inspector shows the internal factors behind the highlighted agents, including:

- current state
- stress
- willingness
- ambiguity tolerance
- influence avoidance
- leave threshold
- nearest group
- attractiveness score
- relevant speech history
- active speech effects

This makes it possible to distinguish between:

- “does not want to join”
- “wants to join, but the group is not attractive yet”
- “wants to join, but ambiguity stress is rising”
- “would join if someone clearly invited them”

---

## Four ways to observe the model

### 1. Single-seed observation

Run one simulation with a fixed seed and watch the process unfold.

Use this when you want to understand *why* a particular outcome happened.

Useful tools:

- animation
- Step 1 tick
- event log
- observerJoiner inspector
- final summary

### 2. Monte Carlo aggregation

Run the same configuration across many seeds.

Use this when you want to know whether a result is a one-off accident or a repeated tendency.

Metrics include:

- observerJoiner participation rate
- observerJoiner leave rate
- group failure rate
- average group confirmation tick
- late-join success rate
- average number of participants
- average number of people who left

### 3. Intervention comparison

Compare the baseline model with intervention scenarios.

This is not about “fixing” the observerJoiner. The model keeps their traits unchanged and asks a different question:

> How does the design of the situation change their chance of joining?

Examples include light invitation, early group formation, and other environment-level changes.

### 4. Speech-effect ON/OFF comparison

Run paired Monte Carlo comparisons with speech effects disabled and enabled.

The same seed sequence is used in both conditions, so the comparison isolates the effect of the speech model as much as possible within this deterministic simulation.

---

## Speech model

The simulator separates three things that are often mixed together:

1. **Inner voice** — a non-interactive visualization of internal state.
2. **Speech event** — an actual simulated utterance by an agent.
3. **Speech effect** — the modeled impact of heard speech on later decisions.

### Inner voice

Inner-voice bubbles are visual explanations for the observer.

They do not affect other agents. They are not heard. They do not consume random numbers. They do not change the result.

### Speech events

Speech events are actual simulated utterances with structured fields such as:

- speaker
- intent
- target or audience
- reason
- tick

Supported intents include:

- `invite`
- `welcome`
- `greet`
- `decline`

### Speech effects

When speech effects are enabled, an utterance can be:

1. received by another agent,
2. interpreted based on the receiver’s state and relationship to the speaker,
3. converted into a temporary active effect,
4. applied to later calculations such as approach probability, attractiveness, stress, or leave threshold.

Effects are deterministic and decay over time.

---

## Reproducibility

The simulation is designed to be reproducible.

With the same seed and the same parameters, the same events should occur in the same order.

Display-only features such as inner-voice visibility or speech-bubble visibility do not change the underlying simulation result.

This makes the simulator suitable for:

- debugging social rules
- comparing parameter sets
- running paired Monte Carlo experiments
- explaining why a specific outcome occurred

---

## Installation

```bash
npm install
npm run dev
```

Open the URL shown by Vite. In a GitHub Pages setup, the local URL may include `/group-formation-simulator/`, for example:

```text
http://localhost:5173/group-formation-simulator/
```

### Scripts

```bash
npm run dev       # start local development server
npm run dev:host  # expose the dev server on the local network
npm run build     # type-check and create production build
npm run test      # run Vitest unit tests
npm run lint      # run oxlint static analysis
```

---

## Testing on an iPhone

`localhost` points to the Mac or PC itself, so it cannot be opened directly from an iPhone.

To test the development build on an iPhone:

1. Connect the computer and iPhone to the same Wi-Fi network.
2. Start the dev server in host mode.

```bash
npm run dev:host
```

3. Find the computer’s local IP address.
4. Open the network URL from iPhone Safari, for example:

```text
http://192.168.1.23:5173/group-formation-simulator/
```

Some corporate or public Wi-Fi networks block device-to-device communication. If the page does not open, try a private network or check firewall settings.

---

## PWA support

The published build can be added to the iPhone home screen.

1. Open the demo URL in Safari.
2. Tap the Share button.
3. Choose “Add to Home Screen.”
4. Launch it from the new icon.

The app runs as the same web application, but opens in a standalone full-screen view. Static assets are cached through a service worker, so repeat launches are more stable. The simulation itself runs in the browser and does not require server communication after loading.

Push notifications and App Store distribution are not supported.

---

## Suggested use cases

This project may be interesting for people working on:

- agent-based modeling
- social simulation
- group dynamics
- UX research
- game AI
- interactive visualization
- social psychology education
- event design
- community design
- narrative systems

It can also be used simply as a playful visualization of a familiar social phenomenon.

---

## Model limitations

The model is intentionally simplified.

Important limitations:

- It does not represent real psychological diagnosis.
- It does not infer anyone’s real intention.
- It does not claim statistical validity for real-world intervention effects.
- Monte Carlo differences are descriptive, not formal significance tests.
- Speech effects are model hypotheses, not measured human behavior.
- Trust is derived from existing relationships in the model and does not learn over time.
- Inner voice and actual speech can diverge only in future roadmap work.

Use the model as a sandbox for thinking, not as a tool for judging people.

---

## Architecture overview

Main areas of the codebase include:

| Area | Files |
| --- | --- |
| Simulation engine | `src/simulation/engine.ts` |
| Simulation types | `src/simulation/types.ts` |
| Speech events | `src/simulation/speech.ts` |
| Speech templates | `src/simulation/speechTemplates.ts` |
| Speech effects | `src/simulation/speechEffects.ts` |
| Interventions | `src/simulation/interventions.ts` |
| Observer inspection | `src/simulation/inspection.ts` |
| Monte Carlo logic | `src/simulation/monteCarlo.ts` |
| Speech-effect comparison | `src/simulation/speechEffectsMonteCarlo.ts` |
| Summary metrics | `src/simulation/summary.ts` |
| Main canvas | `src/components/SimulationCanvas.tsx` |
| Observer inspector UI | `src/components/ObserverJoinerInspector.tsx` |
| Event log UI | `src/components/EventLog.tsx` |
| Speech bubbles | `src/components/SpeechBubble.tsx` |
| Display settings | `src/components/ExpressionDisplaySettings.tsx`, `src/components/SpeechBubbleDisplaySettings.tsx` |

---

## Roadmap

Implemented:

- Phase A: observerJoiner inspection and event-log filtering
- Phase B: final summary and Monte Carlo aggregation
- Phase C: intervention scenarios and intervention comparison
- Phase 1: non-interactive inner voice
- Phase 2: speech events and speech bubbles
- Phase 3: speech reception, interpretation, active effects, and paired comparison

Possible future work:

- Phase 4: divergence between inner voice, spoken words, and behavior
- richer relationship networks
- more scenario presets
- exportable run data
- better visual replay controls
- shareable simulation configurations
- additional cultural/event contexts beyond after-party formation

---

## Contributing

Feedback is welcome, especially on:

- clearer visual explanations
- better scenario presets
- model assumptions
- documentation
- examples of group-formation situations in different cultures
- accessibility and mobile usability

If you open an issue, please include:

- the scenario preset
- seed
- parameter changes
- what you expected
- what happened instead

---

## Credits

This English-facing fork is based on the original project and focuses on international documentation, packaging, and outreach.

The original idea and implementation explore a subtle but common social moment: how people form informal groups when the situation is still ambiguous.

---

## License

See `LICENSE`.

If no license has been added yet, choose one before promoting the repository publicly. MIT is a common default for small open-source web tools, but the final choice should match the author’s intent.
