import type {
  GenoraState,
  ModelId,
  ModelMeta,
  PlatformId,
  PlatformMeta,
  PostStatus,
  ProviderMeta,
  ThemeDef,
} from "./types";

export const ORDER: PlatformId[] = [
  "linkedin",
  "x",
  "reddit",
  "medium",
  "substack",
];

export const PLAT: Record<PlatformId, PlatformMeta> = {
  linkedin: {
    label: "LinkedIn",
    mono: "in",
    share: "copyopen",
    color: "#93a8de",
    bg: "rgba(147,168,222,.14)",
    brand: "#0A66C2",
  },
  x: {
    label: "X",
    mono: "X",
    share: "prefill",
    limit: 280,
    color: "#d8d8dc",
    bg: "rgba(216,216,220,.10)",
    brand: "#000000",
  },
  reddit: {
    label: "Reddit",
    mono: "r/",
    share: "prefill",
    sub: true,
    color: "#e2915f",
    bg: "rgba(226,145,95,.15)",
    brand: "#FF4500",
  },
  medium: {
    label: "Medium",
    mono: "M",
    share: "copyopen",
    color: "#8ec2ac",
    bg: "rgba(142,194,172,.14)",
    brand: "#000000",
  },
  substack: {
    label: "Substack",
    mono: "S",
    share: "copyopen",
    color: "#e8b16e",
    bg: "rgba(232,177,110,.15)",
    brand: "#FF6719",
  },
};

export const STATUS_COLOR: Record<PostStatus, { c: string; bg: string }> = {
  Draft: { c: "#8f8f8f", bg: "rgba(143,143,143,.13)" },
  Generated: { c: "#6cae8e", bg: "rgba(108,174,142,.15)" },
  Edited: { c: "#d4a960", bg: "rgba(212,169,96,.15)" },
  Exported: { c: "#93a8de", bg: "rgba(147,168,222,.16)" },
};

export const STATUS_ICON: Record<PostStatus, string> = {
  Draft: "○",
  Generated: "✦",
  Edited: "✎",
  Exported: "↗",
};

export const DARK_THEME: ThemeDef = {
  name: "Dark",
  t: {
    shell: "#0a0a0a",
    canvas: "#0e0e0e",
    surface: "#141414",
    surfaceHover: "#1c1c1c",
    popover: "#181818",
    tile: "#1e1e1e",
    border: "#202020",
    borderStrong: "#2c2c2c",
    borderHover: "#3a3a3a",
    text: "#ededed",
    text2: "#c4c4c4",
    text3: "#8f8f8f",
    text4: "#6b6b6b",
    text5: "#565656",
    primaryBg: "#f0f0f0",
    primaryText: "#0a0a0a",
    glassBg: "rgba(255,255,255,.05)",
    glassBorder: "rgba(255,255,255,.10)",
  },
};

export const LIGHT_THEME: ThemeDef = {
  name: "Light",
  t: {
    shell: "#f5f5f4",
    canvas: "#ffffff",
    surface: "#ffffff",
    surfaceHover: "#eeeeec",
    popover: "#ffffff",
    tile: "#ececea",
    border: "#e3e3e0",
    borderStrong: "#d3d3cf",
    borderHover: "#b6b6b1",
    text: "#18181a",
    text2: "#47474a",
    text3: "#71716f",
    text4: "#96968f",
    text5: "#b7b7b0",
    primaryBg: "#18181a",
    primaryText: "#f5f5f4",
    glassBg: "rgba(255,255,255,.5)",
    glassBorder: "rgba(255,255,255,.7)",
  },
};

export const MODELS: ModelMeta[] = [
  { id: "sonnet", label: "Claude Sonnet 4.5", tag: "Free", free: true },
  { id: "opus", label: "Claude Opus 4.1", tag: "BYOK", free: false },
  { id: "gpt5", label: "GPT-5", tag: "BYOK", free: false },
  { id: "gemini", label: "Gemini 2.5 Pro", tag: "BYOK", free: false },
  { id: "groq", label: "Llama 3.3 70B · Groq", tag: "BYOK", free: false },
];

export const PROVIDERS: ProviderMeta[] = [
  { id: "anthropic", name: "Anthropic", ph: "sk-ant-…" },
  { id: "openai", name: "OpenAI", ph: "sk-…" },
  { id: "gemini", name: "Google Gemini", ph: "AIza…" },
  { id: "groq", name: "Groq", ph: "gsk_…" },
];

export const REJECTS: string[] = [
  "There's no thought in here yet — just a topic wearing a trench coat.",
  "This is a headline waiting for an opinion. Care to lend it one?",
  "I repurpose thinking, not vibes. Give me something you actually believe.",
  "You wrote a subject line and called it a draft. Bold. Still no.",
];

export const SAMPLES: Record<PlatformId, string> = {
  linkedin: `I spent two years letting my analytics dashboard decide what to write.

Here's what it quietly cost me:

Every post that "did numbers" pulled me toward the same three safe takes. The dashboard rewarded certainty, so I stopped publishing anything I was still thinking through — which was, of course, the only writing worth doing.

Last month I hid the stats for 30 days and wrote only what I actually wanted to say.

Reach dropped about 30%. But the replies changed completely: longer, more specific, from people I'd genuinely want to talk to.

"What performs" and "what's worth writing" had been drifting apart the whole time. I just couldn't see it with the numbers in the way.`,
  x: `I hid my analytics for 30 days and wrote only what I actually wanted to say.

Reach dropped ~30%. Replies got 3x more thoughtful.

Turns out "what performs" and "what's worth writing" had quietly drifted apart — and the dashboard was the last place I'd notice.`,
  reddit: `After two years of writing for the algorithm, I turned off my analytics for 30 days. Some honest notes.

The dashboard rewarded certainty, so I slowly stopped posting anything I was still working out — which was the only stuff worth posting. With the stats hidden, reach fell ~30% but the replies got dramatically better: longer, more specific, actual conversations.

Curious if anyone else here has done a stats detox. Did your writing change, or just your anxiety about it?`,
  medium: `## The quiet cost of writing for the dashboard

There's a specific kind of self-betrayal that doesn't feel like one while it's happening.

For two years, I let an analytics dashboard choose my topics. Not consciously — I'd just notice which posts "worked," and drift toward more of those. The dashboard rewarded certainty, so I stopped publishing the half-formed things. The tentative things. Which, it turns out, were the only things worth writing.

So I ran an experiment: 30 days, stats hidden.

Reach dropped about 30%. And it barely mattered — because the replies, the actual humans on the other end, got better in every way I care about.`,
  substack: `Hey — quick one this week.

I turned off my stats for a month. No opens, no reach, no little dopamine graph.

Here's the honest report: my numbers dropped maybe 30%, and I've never enjoyed writing this newsletter more. The dashboard had been quietly steering me toward my safest takes, and I hadn't noticed until I took it away.

More soon,
— J`,
};

export const ALTS: Record<PlatformId, string> = {
  linkedin: `Unpopular opinion: your analytics dashboard is a worse editor than you are.

For two years I let mine pick my topics. It rewarded certainty, so I quietly stopped publishing anything I was still figuring out.

I hid the stats for 30 days. Reach fell ~30%. The replies got sharper, longer, and from people I actually wanted to hear from.

"What performs" and "what's worth writing" had drifted apart — I only saw it once the numbers were gone.`,
  x: `Your analytics dashboard is a worse editor than you are.

Proof: 30 days, stats hidden. Reach ~30% down, replies way up.

The numbers had been steering me toward my safest takes the whole time.`,
  reddit: `Did a 30-day "analytics detox" and it kind of rewired how I write (in a good way).

Short version: hiding my stats dropped reach ~30% but made my replies genuinely thoughtful for the first time in years. The dashboard had me writing safe without me noticing.

Anyone else tried this? What happened to your writing?`,
  medium: `## I fired my analytics dashboard as an editor

It was never supposed to have the job. It just quietly took it.

Thirty days with the stats hidden taught me that "what performs" and "what's worth writing" had been drifting apart for years — and reach dropping 30% mattered far less than I feared.`,
  substack: `Hey —

Experiment report: I killed my stats for 30 days.

Numbers down ~30%, enjoyment up 100%. The dashboard had been nudging me toward my safest self, and I only noticed in its absence.

— J`,
};

export const INSTR_DEFAULTS: Record<PlatformId, string> = {
  linkedin:
    "Professional but human. Open with a hook line, then short paragraphs with breathing room. No hashtag walls — 0 to 2 max. End on a reflective note, not a sales CTA.",
  x: "One tight idea. Under 280 characters. No hashtags. Punchy first line. It's fine to imply a thread with the framing.",
  reddit:
    "Conversational, zero marketing voice. Give real context, invite discussion, end with a genuine question. Respect the target subreddit's norms.",
  medium:
    "Essayistic and long-form. Use a title (##) and let paragraphs breathe. First person, specific, unhurried.",
  substack:
    "Warm, direct-address newsletter voice. Keep it short. Sign off personally.",
};

export function createInitialState(): GenoraState {
  return {
    themeMode: "system",
    sidebarCollapsed: false,
    isAuthed: false,
    profileMenuOpen: false,
    activeFolder: null,
    search: "",
    folderMenu: null,
    creatingFolder: false,
    newFolderDraft: "",
    renamingFolderId: null,
    renameFolderValue: "",
    renamingPostId: null,
    renameDraftValue: "",
    confirmDialog: null,
    draftsSearch: "",
    draftsFolderFilter: "all",
    draftsStatusFilter: "all",
    draftsPlatformFilter: "all",
    draftsSort: "recent",
    folders: [
      { id: "essays", name: "Essays" },
      { id: "threads", name: "Thread ideas" },
      { id: "work", name: "Work notes" },
      { id: "personal", name: "Personal" },
    ],
    posts: [
      {
        id: "p1",
        title: "Writing for the dashboard",
        snippet:
          "I spent two years letting analytics pick my topics, and here is what it quietly cost me.",
        folder: "essays",
        status: "Generated",
        platforms: ["linkedin", "x", "substack"],
        edited: "2h",
      },
      {
        id: "p2",
        title: "The case for boring tools",
        snippet:
          "Every productivity app promises transformation. The ones I keep are the dull, dependable ones.",
        folder: "essays",
        status: "Edited",
        platforms: ["linkedin", "medium"],
        edited: "1d",
      },
      {
        id: "p3",
        title: "Why I quit my morning routine",
        snippet:
          "Six months of 5am wake-ups taught me exactly one uncomfortable thing about discipline.",
        folder: "personal",
        status: "Draft",
        platforms: [],
        edited: "3d",
      },
      {
        id: "p4",
        title: "Ship smaller",
        snippet:
          "A thread on why my team stopped doing two-week sprints and got faster.",
        folder: "threads",
        status: "Exported",
        platforms: ["x", "reddit"],
        edited: "4d",
      },
      {
        id: "p5",
        title: "Notes on hiring for taste",
        snippet:
          "You can teach skill. Taste is harder, and I have some strong opinions about it.",
        folder: "work",
        status: "Generated",
        platforms: ["linkedin"],
        edited: "1w",
      },
      {
        id: "p6",
        title: "The tyranny of the blank page",
        snippet: "",
        folder: "personal",
        status: "Draft",
        platforms: [],
        edited: "1w",
      },
    ],
    moveMenu: null,
    dashDraft: "",
    dashFocused: false,
    composePostId: null,
    composeTitle: "Writing for the dashboard",
    draft:
      "I spent two years letting my analytics dashboard decide what I wrote about. Every time a post did well, I'd drift toward more of that — and the dashboard rewarded certainty, so I slowly stopped publishing anything I was still thinking through. Last month I hid the stats for 30 days and wrote only what I actually wanted to say. Reach dropped about 30%, but the replies got so much better: longer, more specific, from people I'd actually want to talk to. \"What performs\" and \"what's worth writing\" had quietly drifted apart, and I couldn't see it with the numbers in the way.",
    platforms: {
      linkedin: true,
      x: true,
      reddit: false,
      medium: false,
      substack: true,
    },
    model: "sonnet" as ModelId,
    modelOpen: false,
    composeFolder: "essays",
    folderPickerOpen: false,
    softNudge: false,
    softDismissed: false,
    generating: false,
    slopHard: false,
    blockedCount: 12,
    rejectIdx: 0,
    outTitle: "Writing for the dashboard",
    outPlatforms: ["linkedin", "x", "substack"],
    activeTab: "linkedin",
    content: {},
    versions: {},
    historyOpen: null,
    redditSub: "",
    flashMsg: "",
    freeLeft: 3,
    settingsTab: "keys",
    keys: {
      anthropic: { c: false, v: "" },
      openai: { c: false, v: "" },
      gemini: { c: false, v: "" },
      groq: { c: false, v: "" },
    },
    instrOpen: "linkedin",
    instr: { ...INSTR_DEFAULTS },
    voice: "",
    slopEnabled: true,
    slopStrictness: "balanced",
  };
}
