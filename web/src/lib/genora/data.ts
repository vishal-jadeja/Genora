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
  { id: "sonnet", label: "Claude Sonnet 4.5", tag: "BYOK", free: false },
  { id: "opus", label: "Claude Opus 4.1", tag: "BYOK", free: false },
  { id: "gpt5", label: "GPT-5", tag: "BYOK", free: false },
  { id: "gemini", label: "Gemini 2.5 Flash", tag: "BYOK", free: false },
  { id: "groq", label: "GPT-OSS 120B · Groq", tag: "Free", free: true },
];

export const PROVIDERS: ProviderMeta[] = [
  { id: "anthropic", name: "Anthropic", ph: "sk-ant-…" },
  { id: "openai", name: "OpenAI", ph: "sk-…" },
  { id: "gemini", name: "Google Gemini", ph: "AIza…" },
  { id: "groq", name: "Groq", ph: "gsk_…" },
];

// Cycled through by the client-side Slop Guard heuristic's hard-reject
// banner. Only used when the *client* heuristic blocks before ever calling
// the real backend — a real rejection shows the server's actual reason
// instead (see slopRejectReason).
export const REJECTS: string[] = [
  "There's no thought in here yet — just a topic wearing a trench coat.",
  "This is a headline waiting for an opinion. Care to lend it one?",
  "I repurpose thinking, not vibes. Give me something you actually believe.",
  "You wrote a subject line and called it a draft. Bold. Still no.",
];

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
    // folders/posts are placeholders — the real values (useFolders/usePosts)
    // always override them at display time; see useGenoraController's
    // displayState merge.
    folders: [],
    posts: [],
    moveMenu: null,
    dashDraft: "",
    dashFocused: false,
    composePostId: null,
    composeTitle: "",
    draft: "",
    platforms: {
      linkedin: false,
      x: false,
      reddit: false,
      medium: false,
      substack: false,
    },
    model: "gemini" as ModelId,
    modelOpen: false,
    composeFolder: null,
    folderPickerOpen: false,
    softNudge: false,
    softDismissed: false,
    draftSaving: false,
    generating: false,
    slopHard: false,
    slopRejectReason: null,
    blockedCount: 0,
    rejectIdx: 0,
    outTitle: "",
    outPlatforms: [],
    activeTab: "linkedin",
    content: {},
    versions: {},
    outputStatus: {},
    outputError: {},
    historyOpen: null,
    redditSub: "",
    flashMsg: "",
    flashKind: "success",
    freeLeft: 0,
    settingsTab: "keys",
    keys: {
      anthropic: { c: false, v: "" },
      openai: { c: false, v: "" },
      gemini: { c: false, v: "" },
      groq: { c: false, v: "" },
    },
    keyValidating: {},
    keyError: {},
    instrOpen: null,
    instr: { ...INSTR_DEFAULTS },
    instrSaving: {},
    voice: "",
    slopEnabled: true,
    slopStrictness: "balanced",
  };
}
