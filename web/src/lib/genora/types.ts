export type PlatformId = "linkedin" | "x" | "reddit" | "medium" | "substack";

export type ModelId = "sonnet" | "opus" | "gpt5" | "gemini" | "groq";

export type ProviderId = "anthropic" | "openai" | "gemini" | "groq";

export type PostStatus = "Draft" | "Generated" | "Edited" | "Exported";

export type ThemeMode = "system" | "light" | "dark";

export type SettingsTab =
  "usage" | "keys" | "instructions" | "voice" | "slop" | "model";

export type SlopStrictness = "lenient" | "balanced" | "strict";

export type DraftsSort = "recent" | "oldest" | "title";

export type ConfirmDialogState =
  | { kind: "deletePost"; postId: string }
  | { kind: "deleteFolder"; folderId: string }
  | { kind: "removeKey"; providerId: ProviderId }
  | { kind: "resetInstructions" };

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
  brand: string;
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
    text: string;
    text2: string;
    text3: string;
    text4: string;
    text5: string;
    primaryBg: string;
    primaryText: string;
    glassBg: string;
    glassBorder: string;
  };
}

export interface KeyState {
  c: boolean;
  v: string;
}

export type PlatformOutputStatus = "pending" | "success" | "failed";

export interface GenoraState {
  themeMode: ThemeMode;
  sidebarCollapsed: boolean;
  profileMenuOpen: boolean;
  activeFolder: string | null;
  search: string;
  folders: Folder[];
  posts: Post[];
  moveMenu: string | null;

  // folder management
  folderMenu: string | null;
  creatingFolder: boolean;
  newFolderDraft: string;
  renamingFolderId: string | null;
  renameFolderValue: string;

  // post/draft management
  renamingPostId: string | null;
  renameDraftValue: string;
  confirmDialog: ConfirmDialogState | null;

  // drafts page filters
  draftsSearch: string;
  draftsFolderFilter: "all" | "none" | string;
  draftsStatusFilter: PostStatus | "all";
  draftsPlatformFilter: PlatformId | "all";
  draftsSort: DraftsSort;

  // dashboard composer
  dashDraft: string;
  dashFocused: boolean;

  // compose
  composePostId: string | null;
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
  outputStatus: Partial<Record<PlatformId, PlatformOutputStatus>>;
  outputError: Partial<Record<PlatformId, string>>;
  historyOpen: PlatformId | null;
  redditSub: string;
  flashMsg: string;

  // quota
  freeLeft: number;

  // settings
  settingsTab: SettingsTab;
  keys: Record<ProviderId, KeyState>;
  keyValidating: Partial<Record<ProviderId, boolean>>;
  keyError: Partial<Record<ProviderId, string>>;
  instrOpen: PlatformId | null;
  instr: Record<PlatformId, string>;
  voice: string;
  slopEnabled: boolean;
  slopStrictness: SlopStrictness;
}
