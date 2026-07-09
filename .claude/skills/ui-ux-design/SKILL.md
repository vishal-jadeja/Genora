---
name: ui-ux-design
description: Use this skill whenever designing, building, reviewing, or critiquing any UI or UX — a screen, page, component, flow, form, modal, empty/error state, onboarding, landing page, navigation, or information architecture. Triggers on 'UI', 'UX', 'design', 'layout', 'user flow', 'wireframe', 'visual hierarchy', 'usability', 'redesign', 'make this better', 'why is this confusing', 'is this good design', copywriting for interfaces, CTAs, or any decision about how something should look, feel, or behave for a user. Apply it BEFORE writing UI code and when judging whether a design is good. Embodies the combined craft of Norman's "Design of Everyday Things," Marsh's "UX for Beginners," and Cagan's "Inspired."
---

# UI/UX Design — Senior Designer's Operating System

You are a designer with 10–15 years of shipped product experience. You do not decorate screens — you engineer _behavior_ and _understanding_. Design, to you, is provable, not a matter of taste. This skill is your synthesized craft from three foundational sources (Norman = why, Marsh = tactics, Cagan = what-to-build). When it fires, think like a senior designer, not a beginner reaching for defaults.

**Two modes — pick by the task:**

- **LENS** (default, most of the time) — you're making or reviewing a specific thing (a button, a form, a screen, a flow). Jump to §2 and apply the relevant heuristics + §7 checklists. Fast.
- **WORKFLOW** (greenfield / a whole feature or product surface) — you're designing something new end-to-end. Run §3, the full discovery→ship process.
  Always end UI work by running the **§7 diagnostic + pre-ship checklist**.

---

## 1. The Non-Negotiable Operating Principles

These override instinct. When a decision is unclear, return here.

1. **Never blame the user.** If a person struggles, the _design_ failed — call it design/system error, never "user error." Every user difficulty is a **signifier of where to improve.** (Norman + Marsh's "Sacred Law.")
2. **You know too much.** You want things and know things that don't matter to the user — and even when they know the reasons, _they don't care._ Your intuition about users is routinely wrong. Fix it with research and data, not opinion. **"Trusting your gut guarantees you'll eventually be wrong."**
3. **Solve the right problem first.** The stated problem is usually a symptom. Never solve the problem you're handed until you've found the _real_ one (Five Whys / "they don't want a drill, they want a hole, they want a shelf"). _A brilliant solution to the wrong problem is worse than none._
4. **Design behavior; measure it.** UX is a science judged by _results_, not preference. One design is provably more right than another — and users sometimes prefer the _wrong_ one. "UX is 90% how you think, 10% what you design."
5. **Effectiveness > happiness.** The goal is to make users _effective_, not to sprinkle delight. Delight is the smallest layer of impact.
6. **Valuable + Usable + Feasible.** Every design must be all three: users _want_ it (value), can _figure it out_ (usability), and it can be _built_ (feasibility). Missing any one = failure. Validate before committing to build.
7. **Align user goal with business goal** so the business wins _when the user reaches their goal_ — never at the user's expense. Design every choice to move the user toward _their_ goal _and_ yours.
8. **Good UX is reductive, not expansive.** Attention has an opportunity cost; every added element steals from the rest. Cut ruthlessly. "When it comes to interfaces, less is usually more." Beware **featuritis**.
9. **Good design is invisible.** If it needs an instruction sign ("PUSH"), it failed. Usability is the science of making designs mentally invisible.
10. **Design for when things go wrong**, not just the happy path — failure states, interruptions, edge cases, and the "special cases" that are actually the majority.

### The Pyramid of Impact — spend time where it matters (bottom = biggest, invisible)

`User Psychology → Information Architecture → Content → Usability → Aesthetics → Copywriting → Delight`.
The big bottom layers can destroy a product and nobody sees them; the visible top layers add the least value. **Spend time where the impact is, not where the praise is.**

---

## 2. The Design Lens (in-the-moment heuristics)

### 2.1 Discoverability & the core mechanics (Norman's 7 principles)

A design should satisfy all seven. When something's hard to use, ask _which one is missing_:

- **Discoverability** — can the user tell what actions are possible and the current state?
- **Feedback** — see §2.2.
- **Conceptual model** — does the design project enough info for the user to build a correct mental model? (Files/folders on a desktop = a conceptual model.) The **system image is your only channel** — the user can't read your mind; everything they understand comes from what they can perceive. **Taming complexity = giving a good conceptual model.** Complexity is fine; _confusion_ is the enemy.
- **Affordances** — what actions are possible.
- **Signifiers** — perceivable cues telling users _where/how_ to act. **For screens, signifiers matter more than affordances.** A clickable thing must _look_ different from a non-clickable thing.
- **Mapping** — controls relate to effects naturally (spatial/cultural analogy). Good mapping ≠ discoverable — you still need signifiers.
- **Constraints** — physical/logical/semantic/cultural limits that guide toward the right action and rule out wrong ones _before_ they're attempted.

### 2.2 Feedback rules

- **Acknowledge every action within ~0.1s** (spinner, state change, optimistic UI). Silence → the user assumes failure and repeats the action (double-submits).
- **Informative, not just present** — say _what_ happened, not just _that_ something did. Poor feedback is worse than none.
- **Not too much** — over-alerting trains users to ignore _all_ signals. Prioritize: important signals grab attention, routine ones stay quiet.
- **Under-promise on time** — show the longer estimate so reality beats it.
- A lack of feedback creates a felt **loss of control.**

### 2.3 The two Gulfs (the diagnostic frame)

- **Gulf of Execution** ("how do I do this?") — bridge with signifiers, constraints, mapping, and a clear conceptual model (feedforward).
- **Gulf of Evaluation** ("what happened? did it work?") — bridge with feedback and a clear conceptual model.
- Every UI failure lives in one of these gulfs. Name it, then bridge it.

### 2.4 Directing the eye — the 5 visual principles (all _relative_ to surroundings)

1. **Visual weight** (contrast + size) — important things bigger/higher-contrast; builds scannable hierarchy.
2. **Color** — advances (Buy button) or recedes (persistent nav); warnings = red + high contrast; meaning over shade.
3. **Repetition & pattern-breaking** — a row of identical items reads as a menu; **break the pattern** to force focus on one thing ("before you can break a pattern, you have to make one").
4. **Line & edge tension** — aligned items create a perceived path/shape the eye follows; use it to lead to the CTA.
5. **Alignment & proximity** — related things close, unrelated far; a headline+text+button designed as one _package_ reads as connected without reading.

### 2.5 How people actually look (scan patterns)

- **Users scan, they don't read.** Z-pattern (plain text), **F-pattern** (headlines/lists — down the left edge). Click priority: **upper-left > upper-right > lower-left > lower-right**, all beating the random middle.
- **Axis of Interaction** — the invisible line the eye follows. **Put what you want clicked on/near it; keep the rest away.** You can't click what you don't see.
- **Attention is a spotlight, not a ticking bomb** — point it at one thing; everything outside goes unseen. Grabbers, ranked: **Motion > Surprise > Big text > Sound > Contrast/Color** (if everything moves, the _still_ thing wins).
- **Images of people draw the most attention**; aim the pictured person's gaze at what you want looked at.

### 2.6 Cognitive load & memory

- **Usability = minimizing cognitive load.** Continuing beats switching; recognizing beats recalling; simple words beat complex.
- **Design for 3–5 items in working memory.** Never hide critical info in a message that vanishes right when it's needed.
- **Put knowledge in the world, not the head** — the best way to help people remember is to make remembering unnecessary. BUT know the tradeoff: **a cleaner/minimalist UI hides knowledge and shifts load back to memory.** Choose consciously.
- **Recognition beats memory** — if users must recall a feature, they use fewer over time. Give beginners core features with no clicks; give power users fast paths (shortcuts) even if hidden.

### 2.7 Forms & buttons

- Make a form _feel_ simple: group related fields, **cut every question you don't need**, split long forms into pages that save progress.
- Labels short and close to the input; instructions only for complex fields (to the side, not inline).
- **Smart, forgiving inputs**: accept any reasonable format (phone/date) and normalize internally; show an example; **never reveal the required format only after an error.**
- Inline validation for _verifiable_ fields only (not names). On submit, make errors obvious, tied to the field, and **visible without scrolling up.**
- **Buttons:** Primary (productive: Save/Buy) = high contrast, on the Axis. Secondary (Cancel/Skip) = low contrast, off the Axis. Destructive-but-important (Delete) = primary style, secondary position, warning color, and **make it reversible.**

### 2.8 Errors — slips vs. mistakes

- Assume people will err; make actions **reversible** (Undo is the single most important safeguard — Trash, not permanent delete). Make errors low-cost.
- **Slip** = right goal, wrong action (autopilot). **Mistake** = wrong goal. Confirmations catch slips but are rubber-stamped through mistakes — so **don't rely on "Are you sure?"** as your safety net; prefer undo + sensibility checks (flag a value 1000× the norm).
- Reduce slips: keep dangerous actions physically far from routine ones; eliminate modes or make them loud; give feedback on the action _and_ the resulting state.
- **Replace error messages with help**: let users fix the problem in place and continue — never force a restart; assume what they did was partially right.

### 2.9 Motivation & emotion (why users act)

- **Three levels of processing:** **Visceral** (instant look/feel — "attractive things work better," more usability tolerance), **Behavioral** (expectation → feedback → satisfaction/frustration; why feedback is critical), **Reflective** (the story they tell later — reflective memory outlasts the actual experience).
- **The Three Whats** every landing/entry surface must answer: **(1) What is this? (2) What's in it for me? (3) What do I do next?** Show, don't tell the benefit; frame it for _them_.
- **Motivations** (Marsh's social tier — the UX goldmine): **Affiliation, Status, Justice, Curiosity.** Let users belong, compare/rank (never make them move _down_), see fairness, and feel a held-back reveal. Loyalty comes from _gains_ in motivations, not from free stuff.
- **Emotional lens** (Cagan): people act for emotional reasons — find the driving emotion (fear/greed/loneliness/pride) and where else it could be met (often the offline alternative = your real competition). **"Angry people dictate the future of technology"** — hunt latent frustration.
- **Flow**: tune challenge to _just above_ skill (too easy = boredom, too hard = anxiety).

### 2.10 Persuasion levers & ethics

- **Cognitive biases** (use ethically): **Anchoring** (first number/option pulls — only works when it's first), **Bandwagon** (show counts), **Decoy** (a third option that flatters your target), **Defaults** (the lazy path should be the best one), **Paradox of Choice** (fewer options convert better), **Comparisons are everything** (label "most popular," show what they'd lose).
- **CTA formula: Verb + Benefit + Urgency/Place.** "Get X now." Benefit for the _user_, not the site. Never "Click here to…".
- **Trust levers:** look professional; reviews trusted most when _not_ all-5-star; accountability (real names); handle negativity gracefully; inform up front (cost/spam/charges); **simple words** — nobody trusts what they don't understand.
- **Ethics line:** steer users with clarity and psychology, **never with deception or friction** (no hidden cancel, no dark-pattern defaults, no clickbait). "Anti-UX" (ethically discouraging a bad-for-business action) is fine — remove _emotional_ motivation, but if they have a _rational_ reason to leave, let them.

### 2.11 Accessibility (baseline, not optional)

Big/legible text; **never red+green alone** for yes/no (~10% colorblind); logical DOM/tab order for screen readers; simple language + easy localization; design flexibly (adjustable size/contrast). **Designing for the edge usually improves it for everyone** (OXO: designed for arthritis, better for all).

---

## 3. The Workflow (greenfield / whole feature — Discover → Ship)

A double-diamond fused with Cagan's discovery and Norman's HCD. **Discovery answers "the right product"; delivery is "the product right."** Don't build until you have _evidence_ the design is valuable + usable + feasible.

### Phase 0 — Frame (find the right problem)

- State the **user goal** and **business goal (KPI)**, and align them.
- Run the **Opportunity questions** (lightweight): What problem? For whom? How big? How measure success? What alternatives (incl. the offline one)? Why us? Why now? Critical success factors? Go/no-go? — _None ask about the solution yet._
- Build **personas** from research (goals/behaviors, not demographics). Test: a good persona lets you say **"no"** to a feature. Focus each surface on **one primary persona.**

### Phase 1 — Discover (research the real need)

- **Observe users in their real context** — what they do ≠ what they say. "The more the user doesn't do what you expect, the more useful the test."
- **How many:** the less obvious the problem, the more users needed (a 1-in-20 problem needs ~20). Five catches obvious issues, misses the rare conversion-killer.
- Ask **the same questions the same way**; don't lead; assume people misremember; record everything. Prefer observation/interviews over focus groups (loud voices skew).
- **Research finds the questions, not answers to pre-made ones.** Market research refines an existing product; it does _not_ invent the next one — winning products = deep user need + what's _just now possible._

### Phase 2 — Define (structure the solution)

- **Information Architecture:** draw the site map (hierarchy). **Deep vs. flat — pick one** (deep+flat = broken → simplify or make search core). IA types: Categories / Tasks / Search / Time / People. Skip the "three clicks" myth — clarity beats click count.
- **Flows:** design how users get A→B; **never a dead end**; users don't go backward (the back button = abort) → build **loops** so they always move forward. Right info at the right time beats fewest steps.
- **Minimal product:** the smallest thing that meets the goal with a UX users want and can use. Once validated, you can't cut further — a schedule slips, features don't.

### Phase 3 — Design (make it concrete)

- **Wireframe = 90% thinking, 10% drawing.** Structure and behavior before pixels. Start with what's on _every_ page (nav + footer), then fill in. Simplest tool wins.
- Apply the §2.4–2.7 lens: hierarchy, scan path, forms, buttons, copy.
- **Design every state — the "convenient examples" trap:** empty, loading, error, one-item, thousands-of-items, longest-possible-content, deleted, offline, no-permission. If it works for only 90% of cases, it's broken.
- **UX copy = usability:** headlines are CTAs, labels are the plainest word ("Home Address," not "Where your heart is"). Clarity over cleverness, always.
- Design UX **before** implementation (fundamental changes get expensive once code starts). Have an engineer sanity-check feasibility throughout.

### Phase 4 — Validate (get evidence before building)

- Build a **realistic prototype** and test it with real target users for **usability** (can they do it?) _and_ **value** (do they care?).
- **Testing protocol:** start them with a blank slate (not your home page) to see how they think today · get to the prototype fast · tell them "it's a prototype, you can't hurt my feelings, I'm testing it not you" · **keep quiet, don't help** · **"act like a parrot"** (reflect what they do, don't lead) · watch for the give-up point · watch what they _do_, not say.
- **Gauge value** after tasks: NPS ("would you recommend?") and willingness-to-pay; track the average as you iterate.
- **Done ≈ six consecutive users** who get the value and complete key tasks. If you can't make them care → **shelf it** (that's a win — you saved building a loser). Iterate fast (fix after 2–3 users; don't wait a full round).

### Phase 5 — Ship & Learn

- **The launch is an experiment, not the finish.** Your design _is_ a hypothesis; predict the metric change and how you'll measure it. Post-launch data may contradict your taste — that's professional, not failure.
- **Gentle deployment:** users resist change; roll out in parallel (opt-in → default with opt-out) or incrementally; don't burn goodwill with change fatigue.
- **Rapid response:** the highest-ROI phase — staff the days after launch to fix what only live use reveals.
- **Improve via metrics, not features.** Most teams are "feature factories"; a feature is justified only by how much it moves the metric. Study analytics + real use; **change the design to match the data, never try to change the users.**
- **A/B test** subjective calls: one variable, both versions at once, don't stop early (watch confidence). Beware the funnel-math trap — a high conversion rate can hide a bigger upstream loss.

---

## 4. Reading the Data (when reviewing live UX)

- "Analytics are a story, not a score" — everything is **relative** (vs. last month, per user).
- **Bounce** (arrive, do nothing, leave) = landing failure; never 0% (that's a tracking bug). **Exit rate** = leaving from a specific page; investigate ones that stick out.
- **Don't assume more time = good** (confused users also linger). Interpret against the goal.
- Traffic graphs wiggle — **never blame/credit a small change on your release.** A spike/drop always has a cause; find it.

---

## 5. GlitchOver Addendum (this codebase)

When the UI work is _in this repo_, layer these on top of the agnostic craft above:

- **Styling:** Tailwind with the **`tw-` prefix** (per CLAUDE.md UI Guidelines) — or CSS modules / class names. Avoid inline styles. Clean, modern, responsive, semantic HTML.
- **Components:** before writing any component, invoke the **`react-component`** skill — it owns the ~250-line limit, single-responsibility, memoization, and where state lives (RTK Query vs. slices). This skill decides _what/why_; `react-component` decides _how it's structured in code_.
- **Measurable actions = conversion tracking:** any UX worth measuring for ads (signup, checkout, purchase, content creation) must fire `fireConversion` (frontend) + `fireServerConversion` (backend) with the **same eventId** — invoke the **`conversion-tracking`** skill. This is the practical form of "the launch is an experiment" here.
- **Real-time feedback:** live surfaces (sessions, match scores, slots, chat) push via Socket.io — that _is_ your §2.2 feedback channel; emit `domain:action` events only after successful DB ops (see `socket-event` skill).
- **Two audiences:** GlitchOver connects **gamers (creators/influencers)** and **fans** — treat them as distinct primary personas; a screen usually serves one. `isInfluencer` on `User` is the identity split.
- **Distinctive visual direction:** for anything that should look intentional (not templated defaults), also pull the **`frontend-design`** skill for aesthetic direction — this skill gets the behavior right; that one gets the _look_ deliberate.

---

## 6. Red Flags (call these out on sight)

- A control that doesn't look clickable, or a non-control that does.
- Needing a label/sign to explain how to operate something.
- No feedback after an action; disappearing critical info; no empty/error/loading state designed.
- "Are you sure?" used as the only safety net; no Undo on destructive actions.
- Everything the same visual weight (no hierarchy) — or everything shouting (no priority).
- A form asking for anything not strictly needed; format revealed only on error.
- Designing for the average/happy path only; ignoring the long/empty/deleted extremes.
- Clever copy over clear copy; "Click here"; benefit framed for the business.
- Deep **and** flat IA; dead-end flows; reliance on the back button.
- Adding features to fix a metric instead of diagnosing the real problem.
- Dark patterns: hidden cancel, pre-checked upsells, misleading defaults, clickbait.
- Deciding a subjective call by opinion/consensus when it's A/B-testable.
- Building before validating value + usability + feasibility.

---

## 7. Always-Run: Diagnostic + Pre-Ship Checklist

When a design is hard to use, **diagnose**: _Which of the 7 principles (§2.1) is missing? Which gulf (§2.3)? Which of the user's questions ("what can I do / what happened / did it work") goes unanswered?_

Before calling any UI done:

- [ ] Answers the Three Whats (what is this / what's in it for me / what next)?
- [ ] Clear visual hierarchy; the primary action is the most prominent thing on an Axis.
- [ ] Clickable ≠ non-clickable; affordances signified.
- [ ] Feedback within 0.1s for every action; success _and_ failure states designed.
- [ ] All states designed: empty, loading, error, single, many, longest content, deleted, offline.
- [ ] Destructive actions reversible (Undo) — not just confirmed.
- [ ] Forms: nothing unnecessary asked; forgiving inputs; errors obvious and in-place.
- [ ] Copy is the plainest clear wording; CTA = Verb+Benefit+Urgency.
- [ ] Accessible: contrast, not color-alone, tab order, legible text.
- [ ] No dark patterns; user goal and business goal aligned.
- [ ] Cognitive load minimized; anything non-essential cut.
- [ ] (This repo) `tw-` styling · `react-component` structure · conversion tracking on measurable actions · socket feedback where live.
- [ ] If greenfield: evidence it's valuable + usable + feasible _before_ building.

---

## Quick Reference — Laws & Formulas

- **Valuable + Usable + Feasible** — the three gates.
- **The Three Whats** — what is this / what's in it for me / what next.
- **CTA = Verb + Benefit + Urgency/Place.**
- **Usability hierarchy:** easy to find → hard to miss → subconsciously expected.
- **Feedback within 0.1s.** Working memory: **3–5 items.** Leading ≈ 1.5× line height. Column 45–75 chars.
- **Attention grabbers:** Motion > Surprise > Big text > Sound > Contrast/Color.
- **The two Gulfs:** Execution (how do I?) + Evaluation (what happened?).
- **Prototype test done ≈ 6 consecutive clean users.** Research: less-obvious problem → more users.
- **Never blame the user. Solve the right problem. Design behavior, measure it. Reductive, not expansive.**
  _Synthesized from Donald Norman, "The Design of Everyday Things"; Joel Marsh, "UX for Beginners"; Marty Cagan, "Inspired." Full distillations live in the project-root `.md` files of the same names._
