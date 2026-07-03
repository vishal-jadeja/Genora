export type PlatformId = "linkedin" | "x" | "reddit" | "medium" | "substack";

export type ModelId = "sonnet" | "opus" | "gpt5" | "gemini" | "groq";

export type ProviderId = "anthropic" | "openai" | "gemini" | "groq";

export type PostStatus = "Draft" | "Generated" | "Edited" | "Exported";

export type ViewName = "dashboard" | "compose" | "output" | "settings";

export type SettingsTab =
  | "keys"
  | "instructions"
  | "voice"
  | "slop"
  | "model";

export type SlopStrictness = "lenient" | "balanced" | "strict";

export interface Folder {
  id: string;
  name: string;
}

export interface Post {
  id: string;
  title: string;
  snippet: string;
  folder: string | null;
  status: PostStatus;
  platforms: PlatformId[];
  edited: string;
}

export interface PlatformMeta {
  label: string;
  mono: string;
  share: "copyopen" | "prefill";
  color: string;
  bg: string;
  limit?: number;
  sub?: boolean;
}

export interface ModelMeta {
  id: ModelId;
  label: string;
  tag: string;
  free: boolean;
}

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  ph: string;
}

export interface ThemeDef {
  name: string;
  swatch: [string, string, string, string];
  t: {
    shell: string;
    canvas: string;
    surface: string;
    surfaceHover: string;
    popover: string;
    tile: string;
    border: string;
    borderStrong: string;
    borderHover: string;
  };
}

export interface KeyState {
  c: boolean;
  v: string;
}

export interface FacetState {
  view: ViewName;
  activeFolder: string | null;
  search: string;
  folders: Folder[];
  posts: Post[];
  moveMenu: string | null;

  // dashboard composer
  dashDraft: string;
  dashFocused: boolean;

  // compose
  composeTitle: string;
  draft: string;
  platforms: Record<PlatformId, boolean>;
  model: ModelId;
  modelOpen: boolean;
  composeFolder: string | null;
  folderPickerOpen: boolean;
  softNudge: boolean;
  softDismissed: boolean;

  // generation
  generating: boolean;
  slopHard: boolean;
  blockedCount: number;
  rejectIdx: number;

  // output
  outTitle: string;
  outPlatforms: PlatformId[];
  activeTab: PlatformId;
  content: Partial<Record<PlatformId, string>>;
  versions: Partial<Record<PlatformId, string[]>>;
  historyOpen: boolean;
  redditSub: string;
  flashMsg: string;

  // quota
  freeLeft: number;

  // settings
  settingsTab: SettingsTab;
  keys: Record<ProviderId, KeyState>;
  instrOpen: PlatformId | null;
  instr: Record<PlatformId, string>;
  voice: string;
  slopEnabled: boolean;
  slopStrictness: SlopStrictness;
}
