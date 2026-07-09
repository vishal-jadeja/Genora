"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApiKeys, useDeleteKey, useSaveKey } from "@/hooks/useApiKeys";
import {
  usePlatformInstructions,
  useResetAllInstructions,
  useSaveInstructions,
} from "@/hooks/usePlatformInstructions";
import { useQuota } from "@/hooks/useQuota";
import {
  ALTS,
  GEN_ERROR_REASONS,
  INSTR_DEFAULTS,
  MODELS,
  ORDER,
  PLAT,
  PROVIDERS,
  REJECTS,
  SAMPLES,
  createInitialState,
} from "./data";
import { thresholds, wordCount } from "./logic";
import type {
  GenoraState,
  Folder,
  ModelMeta,
  PlatformId,
  PlatformOutputStatus,
  Post,
  PostStatus,
  ProviderId,
  SettingsTab,
  SlopStrictness,
  ThemeMode,
} from "./types";

// Prototype-only: simulates the real backend's partial-failure behavior
// (see backend-plan.md — "one platform failing doesn't fail the run") so
// this UI has somewhere to render success/failure per platform instead of
// treating every generation as instant and infallible.
const SIMULATED_FAILURE_CHANCE = 0.18;

const THEME_MODE_KEY = "genora-theme-mode";
const SIDEBAR_COLLAPSED_KEY = "genora-sidebar-collapsed";

// Cleared on every route change so a stale popover/menu from one page never
// bleeds into the next (previously handled by `setView`).
const NAV_RESET: Partial<GenoraState> = {
  moveMenu: null,
  modelOpen: false,
  folderPickerOpen: false,
  historyOpen: null,
  folderMenu: null,
  profileMenuOpen: false,
  creatingFolder: false,
  renamingFolderId: null,
  renamingPostId: null,
};

export function useGenoraController(nav: {
  push: (path: string) => void;
  replace: (path: string) => void;
}) {
  const navigate = nav.push;
  const replace = nav.replace;
  const [state, setState] = useState<GenoraState>(createInitialState);
  const platformTimers = useRef<
    Partial<Record<PlatformId, ReturnType<typeof setTimeout>>>
  >({});
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- real backend: BYOK keys, per-platform instructions, quota ---------
  const apiKeysQuery = useApiKeys();
  const saveKeyMutation = useSaveKey();
  const deleteKeyMutation = useDeleteKey();
  const instructionsQuery = usePlatformInstructions();
  const saveInstructionsMutation = useSaveInstructions();
  const resetAllInstructionsMutation = useResetAllInstructions();
  const quotaQuery = useQuota();

  // instr is user-edited free text with no explicit save-per-keystroke UX
  // (see SettingsBody's Save button) — hydrate it from the server exactly
  // once when the query first resolves, then it's locally owned until the
  // user saves or resets, so typing doesn't fight a background refetch.
  const instrHydrated = useRef(false);
  useEffect(() => {
    if (instrHydrated.current || !instructionsQuery.data) return;
    instrHydrated.current = true;
    const fromServer: Partial<Record<PlatformId, string>> = {};
    for (const row of instructionsQuery.data) {
      fromServer[row.platform as PlatformId] = row.instructions;
    }
    setState((s) => ({ ...s, instr: { ...s.instr, ...fromServer } }));
  }, [instructionsQuery.data]);

  const patch = useCallback((p: Partial<GenoraState>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);

  // ---- theme --------------------------------------------------------------
  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(THEME_MODE_KEY, mode);
      }
      patch({ themeMode: mode });
    },
    [patch],
  );

  // ---- sidebar ------------------------------------------------------------
  const toggleSidebarCollapsed = useCallback(() => {
    setState((s) => {
      const next = !s.sidebarCollapsed;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      }
      return {
        ...s,
        sidebarCollapsed: next,
        renamingFolderId: next ? null : s.renamingFolderId,
        folderMenu: next ? null : s.folderMenu,
      };
    });
  }, []);

  const toggleProfileMenu = useCallback(() => {
    setState((s) => ({ ...s, profileMenuOpen: !s.profileMenuOpen }));
  }, []);

  // ---- navigation -------------------------------------------------------
  const goDash = useCallback(() => {
    patch(NAV_RESET);
    navigate("/dashboard");
  }, [patch, navigate]);
  const goDrafts = useCallback(() => {
    patch(NAV_RESET);
    navigate("/drafts");
  }, [patch, navigate]);
  const goSettings = useCallback(
    (tab?: SettingsTab) => {
      patch({ ...NAV_RESET, settingsTab: tab ?? "keys" });
      navigate("/settings");
    },
    [patch, navigate],
  );
  const homeClick = useCallback(() => {
    patch({ ...NAV_RESET, activeFolder: null, search: "" });
    navigate("/dashboard");
  }, [patch, navigate]);

  const newPost = useCallback(
    (folder?: string | null) => {
      patch({
        ...NAV_RESET,
        composePostId: null,
        composeTitle: "",
        draft: "",
        composeFolder: folder ?? null,
        softNudge: false,
        softDismissed: false,
        slopHard: false,
      });
      navigate("/compose");
    },
    [patch, navigate],
  );

  // Pure state hydration from an existing post — no navigation. Used both by
  // openPost (which also navigates) and by /post/[id]'s mount effect (which
  // must NOT re-trigger navigation on browser back/forward).
  const loadPost = useCallback((id: string) => {
    setState((s) => {
      const post = s.posts.find((p) => p.id === id);
      if (!post) return s;
      if (["Generated", "Edited", "Exported"].includes(post.status)) {
        const sel = post.platforms.length
          ? post.platforms
          : (["linkedin"] as PlatformId[]);
        const content: Partial<Record<PlatformId, string>> = {};
        const versions: Partial<Record<PlatformId, string[]>> = {};
        const outputStatus: Partial<Record<PlatformId, PlatformOutputStatus>> =
          {};
        sel.forEach((pid) => {
          const t = SAMPLES[pid] || SAMPLES.linkedin;
          content[pid] = t;
          versions[pid] = [t];
          outputStatus[pid] = "success";
        });
        return {
          ...s,
          composePostId: post.id,
          outTitle: post.title,
          outPlatforms: sel,
          content,
          versions,
          outputStatus,
          outputError: {},
          activeTab: sel[0],
          slopHard: false,
          generating: false,
        };
      }
      return {
        ...s,
        composePostId: post.id,
        composeTitle: post.title,
        draft: post.snippet || "",
        composeFolder: post.folder,
        softNudge: false,
        softDismissed: false,
      };
    });
  }, []);

  const openPost = useCallback(
    (post: Post) => {
      patch(NAV_RESET);
      loadPost(post.id);
      if (["Generated", "Edited", "Exported"].includes(post.status)) {
        navigate(`/post/${post.id}`);
      } else {
        navigate("/compose");
      }
    },
    [patch, loadPost, navigate],
  );

  const onSearch = useCallback((v: string) => patch({ search: v }), [patch]);
  const selectFolder = useCallback(
    (id: string | null) => patch({ activeFolder: id, search: "" }),
    [patch],
  );
  const toggleMove = useCallback((id: string) => {
    setState((s) => ({ ...s, moveMenu: s.moveMenu === id ? null : id }));
  }, []);
  const moveTo = useCallback((postId: string, folderId: string | null) => {
    setState((s) => ({
      ...s,
      posts: s.posts.map((p) =>
        p.id === postId ? { ...p, folder: folderId } : p,
      ),
      moveMenu: null,
    }));
  }, []);

  // ---- folder management --------------------------------------------------
  const startNewFolder = useCallback(() => {
    setState((s) => ({ ...s, creatingFolder: true, newFolderDraft: "" }));
  }, []);
  const onNewFolderInput = useCallback(
    (v: string) => patch({ newFolderDraft: v }),
    [patch],
  );
  const commitNewFolder = useCallback(() => {
    setState((s) => {
      const name = s.newFolderDraft.trim();
      if (!name) return { ...s, creatingFolder: false, newFolderDraft: "" };
      const folder: Folder = { id: crypto.randomUUID(), name };
      return {
        ...s,
        folders: [...s.folders, folder],
        creatingFolder: false,
        newFolderDraft: "",
      };
    });
  }, []);
  const cancelNewFolder = useCallback(
    () => patch({ creatingFolder: false, newFolderDraft: "" }),
    [patch],
  );

  const toggleFolderMenu = useCallback((id: string | null) => {
    setState((s) => ({ ...s, folderMenu: s.folderMenu === id ? null : id }));
  }, []);

  const startRenameFolder = useCallback((folderId: string) => {
    setState((s) => {
      const f = s.folders.find((x) => x.id === folderId);
      return {
        ...s,
        renamingFolderId: folderId,
        renameFolderValue: f?.name ?? "",
        folderMenu: null,
      };
    });
  }, []);
  const onRenameFolderInput = useCallback(
    (v: string) => patch({ renameFolderValue: v }),
    [patch],
  );
  const commitRenameFolder = useCallback(() => {
    setState((s) => {
      const name = s.renameFolderValue.trim();
      if (!s.renamingFolderId || !name) {
        return { ...s, renamingFolderId: null, renameFolderValue: "" };
      }
      return {
        ...s,
        folders: s.folders.map((f) =>
          f.id === s.renamingFolderId ? { ...f, name } : f,
        ),
        renamingFolderId: null,
        renameFolderValue: "",
      };
    });
  }, []);
  const cancelRenameFolder = useCallback(
    () => patch({ renamingFolderId: null, renameFolderValue: "" }),
    [patch],
  );

  // ---- dashboard composer -------------------------------------------------
  const onDashDraft = useCallback(
    (v: string) => patch({ dashDraft: v, dashFocused: true }),
    [patch],
  );
  const dashFocus = useCallback(() => patch({ dashFocused: true }), [patch]);
  const openEditorFromDash = useCallback(() => {
    setState((s) => {
      const title = s.dashDraft.trim().split(/\s+/).slice(0, 6).join(" ");
      return {
        ...s,
        composePostId: null,
        draft: s.dashDraft,
        composeTitle: title,
        softNudge: false,
        softDismissed: false,
        slopHard: false,
      };
    });
    navigate("/compose");
  }, [navigate]);

  // ---- compose --------------------------------------------------------
  const onTitle = useCallback(
    (v: string) => patch({ composeTitle: v }),
    [patch],
  );
  const onDraft = useCallback(
    (v: string) => patch({ draft: v, softNudge: false }),
    [patch],
  );
  const togglePlatform = useCallback((id: PlatformId) => {
    setState((s) => ({
      ...s,
      platforms: { ...s.platforms, [id]: !s.platforms[id] },
    }));
  }, []);
  const openModel = useCallback(() => {
    setState((s) => ({ ...s, modelOpen: !s.modelOpen }));
  }, []);
  const openFolderPicker = useCallback(() => {
    setState((s) => ({ ...s, folderPickerOpen: !s.folderPickerOpen }));
  }, []);
  const pickComposeFolder = useCallback(
    (id: string | null) =>
      patch({ composeFolder: id, folderPickerOpen: false }),
    [patch],
  );

  const hasKey = useCallback(
    () => (apiKeysQuery.data ?? []).some((k) => k.connected),
    [apiKeysQuery.data],
  );

  const pickModel = useCallback(
    (m: ModelMeta) => {
      setState((s) => {
        if (m.free || hasKey()) return { ...s, model: m.id, modelOpen: false };
        return s;
      });
    },
    [hasKey],
  );

  // ---- generation -------------------------------------------------------
  // Resolves one platform's generation independently of the others — mirrors
  // the real backend's per-platform fan-out (generatePost.ts), where one
  // platform failing never blocks or fails the rest. Guards on
  // s.composePostId !== postId so a stale timer from an abandoned post can't
  // clobber state after the user has moved on to a new one.
  const settlePlatform = useCallback(
    (postId: string, id: PlatformId) => {
      setState((s) => {
        if (s.composePostId !== postId) return s;
        const failed = Math.random() < SIMULATED_FAILURE_CHANCE;
        const content = { ...s.content };
        const versions = { ...s.versions };
        const outputError = { ...s.outputError };
        const outputStatus: GenoraState["outputStatus"] = {
          ...s.outputStatus,
          [id]: failed ? "failed" : "success",
        };
        if (failed) {
          outputError[id] =
            GEN_ERROR_REASONS[
              Math.floor(Math.random() * GEN_ERROR_REASONS.length)
            ];
          delete content[id];
        } else {
          delete outputError[id];
          content[id] = SAMPLES[id];
          versions[id] = [SAMPLES[id]];
        }
        const stillPending = s.outPlatforms.some(
          (pid) => outputStatus[pid] === "pending" || outputStatus[pid] == null,
        );
        const anySuccess = s.outPlatforms.some(
          (pid) => outputStatus[pid] === "success",
        );
        const posts =
          stillPending || !anySuccess
            ? s.posts
            : s.posts.map((p) =>
                p.id === postId
                  ? {
                      ...p,
                      status: "Generated" as PostStatus,
                      edited: "just now",
                    }
                  : p,
              );
        return {
          ...s,
          content,
          versions,
          outputStatus,
          outputError,
          posts,
          generating: stillPending,
          freeLeft: stillPending
            ? s.freeLeft
            : hasKey()
              ? s.freeLeft
              : Math.max(0, s.freeLeft - 1),
        };
      });
    },
    [hasKey],
  );

  const schedulePlatform = useCallback(
    (postId: string, id: PlatformId, index: number) => {
      if (platformTimers.current[id]) clearTimeout(platformTimers.current[id]);
      // Staggered, slightly randomized delay per platform — so the loading
      // screen shows genuinely independent progress instead of every row
      // finishing in lockstep.
      const delay = 900 + index * 250 + Math.round(Math.random() * 500);
      platformTimers.current[id] = setTimeout(
        () => settlePlatform(postId, id),
        delay,
      );
    },
    [settlePlatform],
  );

  const retryPlatform = useCallback(
    (id: PlatformId) => {
      const postId = state.composePostId;
      if (!postId) return;
      setState((s) => ({
        ...s,
        outputStatus: { ...s.outputStatus, [id]: "pending" },
        outputError: (() => {
          const e = { ...s.outputError };
          delete e[id];
          return e;
        })(),
        generating: true,
      }));
      schedulePlatform(postId, id, 0);
    },
    [state.composePostId, schedulePlatform],
  );

  // navMode "replace": /compose was already a committed page the user was
  // looking at (its own earlier tick) — collapse it into /post so Back skips
  // the transient compose step. navMode "push": there was no real /compose
  // visit this tick (e.g. dashboard's quick-generate) — push, so Back still
  // returns to the page the user was actually on (Next.js otherwise collapses
  // a same-tick push+replace pair into a single replace of *that* page).
  const runGenerate = useCallback(
    (navMode: "push" | "replace" = "replace") => {
      if (!hasKey() && (quotaQuery.data?.remaining ?? 0) <= 0) {
        // No silent redirect — the caller's screen already shows an inline
        // "out of free generations" banner (derived.quotaExhausted) with its
        // own explicit "Add a key" action. Pre-select the right settings tab
        // for whenever the user does navigate there themselves.
        patch({ settingsTab: "keys" });
        return;
      }

      const postId = state.composePostId ?? crypto.randomUUID();
      const sel = ORDER.filter((id) => state.platforms[id]);
      const first = sel[0] || "linkedin";
      const title = state.composeTitle || "Untitled";

      setState((s) => {
        const exists = s.posts.some((p) => p.id === postId);
        const draftPost: Post = {
          id: postId,
          title,
          snippet: s.draft.slice(0, 160),
          folder: s.composeFolder,
          status: "Draft",
          platforms: sel,
          edited: "just now",
        };
        const posts = exists
          ? s.posts.map((p) => (p.id === postId ? { ...p, ...draftPost } : p))
          : [draftPost, ...s.posts];
        const outputStatus: GenoraState["outputStatus"] = {};
        sel.forEach((id) => (outputStatus[id] = "pending"));
        return {
          ...s,
          posts,
          composePostId: postId,
          slopHard: false,
          softNudge: false,
          generating: true,
          activeTab: first,
          outTitle: title,
          outPlatforms: sel,
          content: {},
          versions: {},
          outputStatus,
          outputError: {},
          redditSub: "",
        };
      });
      (navMode === "replace" ? replace : navigate)(`/post/${postId}`);

      Object.values(platformTimers.current).forEach(
        (t) => t && clearTimeout(t),
      );
      platformTimers.current = {};
      sel.forEach((id, index) => schedulePlatform(postId, id, index));
    },
    [hasKey, quotaQuery.data, state, patch, navigate, replace, schedulePlatform],
  );

  const generate = useCallback(() => {
    const { hard, soft } = thresholds(state.slopStrictness);
    const words = wordCount(state.draft);
    if (state.slopEnabled && (state.draft.trim() === "" || words < hard)) {
      setState((s) => ({
        ...s,
        slopHard: true,
        generating: false,
        blockedCount: s.blockedCount + 1,
        rejectIdx: (s.rejectIdx + 1) % REJECTS.length,
      }));
      return;
    }
    if (state.slopEnabled && words < soft && !state.softDismissed) {
      patch({ softNudge: true });
      return;
    }
    runGenerate();
  }, [state, patch, runGenerate]);

  const dashGenerate = useCallback(() => {
    const t = state.dashDraft;
    if (!t.trim()) {
      patch({ dashFocused: true });
      return;
    }
    const title = t.trim().split(/\s+/).slice(0, 6).join(" ") || "Untitled";
    patch({
      composePostId: null,
      draft: t,
      composeTitle: title,
      softNudge: false,
      softDismissed: false,
    });

    const { hard, soft } = thresholds(state.slopStrictness);
    const words = wordCount(t);
    if (state.slopEnabled && (t.trim() === "" || words < hard)) {
      // Slop Guard is blocking generation — land on /compose for real, since
      // the user now has to address the nudge there.
      navigate("/compose");
      setState((s) => ({
        ...s,
        slopHard: true,
        generating: false,
        blockedCount: s.blockedCount + 1,
        rejectIdx: (s.rejectIdx + 1) % REJECTS.length,
      }));
      return;
    }
    if (state.slopEnabled && words < soft && !state.softDismissed) {
      navigate("/compose");
      patch({ softNudge: true });
      return;
    }
    // Straight through, no compose page ever shown this tick — push directly
    // from /dashboard to /post so Back returns to /dashboard, not about:blank.
    // (Next.js collapses a same-tick push+replace pair into one operation on
    // whatever page was current, so pushing /compose here and replacing with
    // /post right after would clobber the /dashboard history entry instead.)
    runGenerate("push");
  }, [state, patch, navigate, runGenerate]);

  const addDetail = useCallback(() => patch({ softNudge: false }), [patch]);
  const generateAnyway = useCallback(() => {
    patch({ softDismissed: true, softNudge: false });
    runGenerate();
  }, [patch, runGenerate]);

  // ---- output -----------------------------------------------------------
  const backToCompose = useCallback(() => {
    patch({ slopHard: false });
    // Lateral move within the same post's editing session — replace, not
    // push, so bouncing between compose/output doesn't grow the stack.
    replace("/compose");
  }, [patch, replace]);
  const selectTab = useCallback(
    (id: PlatformId) => patch({ activeTab: id, historyOpen: null }),
    [patch],
  );
  const onEditContent = useCallback((v: string, id?: PlatformId) => {
    setState((s) => ({
      ...s,
      content: { ...s.content, [id ?? s.activeTab]: v },
    }));
  }, []);
  const onRedditSub = useCallback(
    (v: string) => patch({ redditSub: v }),
    [patch],
  );
  const regenerate = useCallback((id?: PlatformId) => {
    setState((s) => {
      const tab = id ?? s.activeTab;
      const cur = s.content[tab];
      const alt = cur === SAMPLES[tab] ? ALTS[tab] : SAMPLES[tab];
      return {
        ...s,
        content: { ...s.content, [tab]: alt },
        versions: { ...s.versions, [tab]: [...(s.versions[tab] || []), alt] },
      };
    });
  }, []);
  const openHistory = useCallback((id?: PlatformId) => {
    setState((s) => {
      const target = id ?? s.activeTab;
      return { ...s, historyOpen: s.historyOpen === target ? null : target };
    });
  }, []);
  const restoreVersion = useCallback((tab: PlatformId, text: string) => {
    setState((s) => ({
      ...s,
      content: { ...s.content, [tab]: text },
      historyOpen: null,
    }));
  }, []);
  const flash = useCallback(
    (msg: string) => {
      patch({ flashMsg: msg });
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => patch({ flashMsg: "" }), 3200);
    },
    [patch],
  );
  const copyText = useCallback(
    (id?: PlatformId) => {
      const tab = id ?? state.activeTab;
      const t = state.content[tab] || "";
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(t).catch(() => {});
      }
      flash("Copied to clipboard");
    },
    [state, flash],
  );
  const doShare = useCallback(
    (id?: PlatformId) => {
      const tab = id ?? state.activeTab;
      const m = PLAT[tab];
      if (m.share === "prefill") {
        if (m.sub) {
          if (!state.redditSub.trim()) return;
          flash(
            "Opening r/" +
              state.redditSub.trim() +
              " with your draft prefilled…",
          );
        } else {
          flash("Opening the X composer with your text already in place…");
        }
      } else {
        const t = state.content[tab] || "";
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          navigator.clipboard.writeText(t).catch(() => {});
        }
        flash("Copied — opening " + m.label + " in a new tab. Paste to post.");
      }
    },
    [state, flash],
  );

  // ---- drafts page: post management ---------------------------------------
  const duplicatePost = useCallback((postId: string) => {
    setState((s) => {
      const idx = s.posts.findIndex((p) => p.id === postId);
      if (idx === -1) return s;
      const source = s.posts[idx];
      const copy: Post = {
        ...source,
        id: crypto.randomUUID(),
        title: source.title + " (copy)",
        edited: "just now",
      };
      const posts = [...s.posts];
      posts.splice(idx + 1, 0, copy);
      return { ...s, posts, moveMenu: null };
    });
  }, []);

  const startRenamePost = useCallback((postId: string) => {
    setState((s) => {
      const p = s.posts.find((x) => x.id === postId);
      return {
        ...s,
        renamingPostId: postId,
        renameDraftValue: p?.title ?? "",
        moveMenu: null,
      };
    });
  }, []);
  const onRenameDraftInput = useCallback(
    (v: string) => patch({ renameDraftValue: v }),
    [patch],
  );
  const commitRenamePost = useCallback(() => {
    setState((s) => {
      const title = s.renameDraftValue.trim();
      if (!s.renamingPostId || !title) {
        return { ...s, renamingPostId: null, renameDraftValue: "" };
      }
      return {
        ...s,
        posts: s.posts.map((p) =>
          p.id === s.renamingPostId ? { ...p, title } : p,
        ),
        renamingPostId: null,
        renameDraftValue: "",
      };
    });
  }, []);
  const cancelRenamePost = useCallback(
    () => patch({ renamingPostId: null, renameDraftValue: "" }),
    [patch],
  );

  // ---- confirm dialog: single funnel for all destructive actions ---------
  const openConfirmDialog = useCallback(
    (payload: NonNullable<GenoraState["confirmDialog"]>) => {
      patch({ confirmDialog: payload });
    },
    [patch],
  );
  const closeConfirmDialog = useCallback(
    () => patch({ confirmDialog: null }),
    [patch],
  );
  const confirmDialogAction = useCallback(async () => {
    const d = state.confirmDialog;
    if (!d) return;

    if (d.kind === "deletePost") {
      setState((s) => ({
        ...s,
        posts: s.posts.filter((p) => p.id !== d.postId),
        confirmDialog: null,
      }));
      return;
    }
    if (d.kind === "deleteFolder") {
      setState((s) => ({
        ...s,
        folders: s.folders.filter((f) => f.id !== d.folderId),
        posts: s.posts.map((p) =>
          p.folder === d.folderId ? { ...p, folder: null } : p,
        ),
        activeFolder: s.activeFolder === d.folderId ? null : s.activeFolder,
        confirmDialog: null,
      }));
      return;
    }
    if (d.kind === "removeKey") {
      await deleteKeyMutation.mutateAsync(d.providerId);
      setState((s) => ({
        ...s,
        keys: { ...s.keys, [d.providerId]: { c: false, v: "" } },
        confirmDialog: null,
      }));
      return;
    }
    if (d.kind === "resetInstructions") {
      await resetAllInstructionsMutation.mutateAsync();
      setState((s) => ({
        ...s,
        instr: { ...INSTR_DEFAULTS },
        confirmDialog: null,
      }));
      return;
    }
    setState((s) => ({ ...s, confirmDialog: null }));
  }, [state.confirmDialog, deleteKeyMutation, resetAllInstructionsMutation]);

  // ---- drafts page: filters/sort ------------------------------------------
  const setDraftsSearch = useCallback(
    (v: string) => patch({ draftsSearch: v }),
    [patch],
  );
  const setDraftsFolderFilter = useCallback(
    (v: "all" | "none" | string) => patch({ draftsFolderFilter: v }),
    [patch],
  );
  const setDraftsStatusFilter = useCallback(
    (v: PostStatus | "all") => patch({ draftsStatusFilter: v }),
    [patch],
  );
  const setDraftsPlatformFilter = useCallback(
    (v: PlatformId | "all") => patch({ draftsPlatformFilter: v }),
    [patch],
  );
  const setDraftsSort = useCallback(
    (v: GenoraState["draftsSort"]) => patch({ draftsSort: v }),
    [patch],
  );

  // ---- settings -----------------------------------------------------------
  const setSettingsTab = useCallback(
    (t: SettingsTab) => patch({ settingsTab: t }),
    [patch],
  );
  const onKeyInput = useCallback((id: ProviderId, v: string) => {
    setState((s) => ({
      ...s,
      keys: { ...s.keys, [id]: { ...s.keys[id], v } },
    }));
  }, []);
  // Save-and-trust: POST /api/keys just encrypts and stores — there's no
  // live provider validation call. A bad key surfaces later as a classified
  // 401 when a generation actually runs with it, not here.
  const validateKey = useCallback(
    async (id: ProviderId) => {
      const value = state.keys[id]?.v ?? "";
      if (!value.trim()) return;
      setState((s) => ({
        ...s,
        keyValidating: { ...s.keyValidating, [id]: true },
      }));
      try {
        await saveKeyMutation.mutateAsync({ provider: id, key: value });
        setState((s) => ({
          ...s,
          keys: { ...s.keys, [id]: { c: true, v: "" } },
          keyValidating: { ...s.keyValidating, [id]: false },
          keyError: (() => {
            const e = { ...s.keyError };
            delete e[id];
            return e;
          })(),
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          keyValidating: { ...s.keyValidating, [id]: false },
          keyError: {
            ...s.keyError,
            [id]: err instanceof Error ? err.message : "Could not save key",
          },
        }));
      }
    },
    [state.keys, saveKeyMutation],
  );
  const toggleInstr = useCallback((id: PlatformId) => {
    setState((s) => ({ ...s, instrOpen: s.instrOpen === id ? null : id }));
  }, []);
  const onInstr = useCallback((id: PlatformId, v: string) => {
    setState((s) => ({ ...s, instr: { ...s.instr, [id]: v } }));
  }, []);
  const saveInstr = useCallback(
    (id: PlatformId) => {
      saveInstructionsMutation.mutate({ platform: id, instructions: state.instr[id] });
    },
    [state.instr, saveInstructionsMutation],
  );
  const onVoice = useCallback((v: string) => patch({ voice: v }), [patch]);
  const toggleSlop = useCallback(() => {
    setState((s) => ({ ...s, slopEnabled: !s.slopEnabled }));
  }, []);
  const setSlopStrictness = useCallback(
    (v: SlopStrictness) => patch({ slopStrictness: v }),
    [patch],
  );

  // ---- derived (pure data, no styling) ------------------------------------
  const derived = useMemo(() => {
    const S = state;
    const hk = hasKey();
    const freeLeft = quotaQuery.data?.remaining ?? 0;

    const quotaText = hk
      ? "BYOK · unlimited"
      : `${freeLeft} free generation${freeLeft === 1 ? "" : "s"} left today`;
    const quotaLow = !hk && freeLeft <= 1;
    const quotaExhausted = !hk && freeLeft <= 0;

    const hr = new Date().getHours();
    const greeting =
      hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";

    const counts: Record<string, number> = {};
    S.folders.forEach((f) => (counts[f.id] = 0));
    S.posts.forEach((p) => {
      if (p.folder && counts[p.folder] != null) counts[p.folder]++;
    });
    const folderName = (id: string | null) =>
      S.folders.find((f) => f.id === id)?.name ?? null;

    const dashExpanded = S.dashFocused || S.dashDraft.trim() !== "";
    const dashWords = wordCount(S.dashDraft);
    const dashTok = Math.max(0, Math.round(dashWords * 1.4));
    const anySel = ORDER.some((id) => S.platforms[id]);
    const dashCanGen = S.dashDraft.trim() !== "" && anySel;

    const curModel = MODELS.find((m) => m.id === S.model) || MODELS[0];

    const q = S.search.trim().toLowerCase();
    let rows = S.posts;
    if (S.activeFolder) rows = rows.filter((p) => p.folder === S.activeFolder);
    if (S.draftsPlatformFilter !== "all") {
      rows = rows.filter((p) =>
        p.platforms.includes(S.draftsPlatformFilter as PlatformId),
      );
    }
    if (q)
      rows = rows.filter((p) =>
        (p.title + " " + p.snippet).toLowerCase().includes(q),
      );
    const showEmptyAll = S.posts.length === 0;
    const showEmptyFolder =
      !showEmptyAll &&
      rows.length === 0 &&
      (S.activeFolder !== null || S.draftsPlatformFilter !== "all") &&
      !q;
    const hasRows = rows.length > 0;
    const hasContent = S.posts.length > 0;

    const words = wordCount(S.draft);
    const { hard, soft } = thresholds(S.slopStrictness);
    const readMin = Math.max(1, Math.round(words / 200));
    const substancePct = Math.min(100, Math.round((words / soft) * 100));
    let substanceTier: "low" | "mid" | "high" = "low";
    if (words >= soft) substanceTier = "high";
    else if (words >= hard) substanceTier = "mid";
    const tokenEst = Math.max(1, Math.round(words * 1.4));
    const selPlats = ORDER.filter((id) => S.platforms[id]);
    const canGen = selPlats.length > 0 && S.draft.trim() !== "";

    const activeTab = S.activeTab;
    const activeMeta = PLAT[activeTab];
    const activeContent = S.content[activeTab] || "";
    const alen = activeContent.length;
    const isReddit = activeMeta.share === "prefill" && !!activeMeta.sub;
    const shareReady = !(isReddit && !S.redditSub.trim());
    const vArr = S.versions[activeTab] || [];
    const versionLabel = "v" + Math.max(1, vArr.length);
    const genCountText = `Repurposing your thought for ${S.outPlatforms.length} platform${S.outPlatforms.length === 1 ? "" : "s"}…`;

    const tierBanner = hk
      ? "BYOK active — the daily cap is lifted and full model selection is unlocked."
      : `You're on the free tier: ${freeLeft} generations left today on Claude Sonnet 4.5. Add any key to remove the cap and choose models.`;
    const voiceStatus = S.voice.trim()
      ? `Calibrated on ${wordCount(S.voice)} words of your writing.`
      : "Not calibrated yet — generations use platform defaults.";
    const modelPageNote = hk
      ? "Your global default. Any folder or post can override it."
      : "Free tier is fixed to Claude Sonnet 4.5. Add a key in API keys to unlock the rest.";

    // ---- drafts page ----
    const draftsSearchQ = S.draftsSearch.trim().toLowerCase();
    let draftsRows = S.posts;
    if (S.draftsFolderFilter === "none") {
      draftsRows = draftsRows.filter((p) => p.folder === null);
    } else if (S.draftsFolderFilter !== "all") {
      draftsRows = draftsRows.filter((p) => p.folder === S.draftsFolderFilter);
    }
    if (S.draftsStatusFilter !== "all") {
      draftsRows = draftsRows.filter((p) => p.status === S.draftsStatusFilter);
    }
    if (S.draftsPlatformFilter !== "all") {
      draftsRows = draftsRows.filter((p) =>
        p.platforms.includes(S.draftsPlatformFilter as PlatformId),
      );
    }
    if (draftsSearchQ) {
      draftsRows = draftsRows.filter((p) =>
        (p.title + " " + p.snippet).toLowerCase().includes(draftsSearchQ),
      );
    }
    draftsRows = [...draftsRows].sort((a, b) => {
      if (S.draftsSort === "title") return a.title.localeCompare(b.title);
      return 0;
    });
    if (S.draftsSort === "oldest") draftsRows = [...draftsRows].reverse();
    const draftsEmpty = S.posts.length === 0;
    const draftsNoMatch = !draftsEmpty && draftsRows.length === 0;

    let confirmDialogContent: {
      title: string;
      description: string;
      confirmLabel: string;
    } | null = null;
    const d = S.confirmDialog;
    if (d?.kind === "deletePost") {
      const p = S.posts.find((x) => x.id === d.postId);
      confirmDialogContent = {
        title: "Delete draft?",
        description: `"${p?.title ?? "This draft"}" will be permanently deleted. This can't be undone.`,
        confirmLabel: "Delete",
      };
    } else if (d?.kind === "deleteFolder") {
      const f = S.folders.find((x) => x.id === d.folderId);
      const count = S.posts.filter((p) => p.folder === d.folderId).length;
      confirmDialogContent = {
        title: "Delete folder?",
        description: `"${f?.name ?? "This folder"}" will be deleted. ${count} post${count === 1 ? "" : "s"} inside will move to No folder.`,
        confirmLabel: "Delete",
      };
    } else if (d?.kind === "removeKey") {
      const pr = PROVIDERS.find((x) => x.id === d.providerId);
      confirmDialogContent = {
        title: "Remove API key?",
        description: `Your saved ${pr?.name ?? "provider"} key will be removed. You can add it again anytime.`,
        confirmLabel: "Remove",
      };
    } else if (d?.kind === "resetInstructions") {
      confirmDialogContent = {
        title: "Reset all instructions?",
        description:
          "Every platform's instructions will revert to Genora's defaults, overwriting your custom edits.",
        confirmLabel: "Reset",
      };
    }

    return {
      hasKey: hk,
      quotaText,
      quotaLow,
      quotaExhausted,
      greeting,
      counts,
      folderName,
      dashExpanded,
      dashWords,
      dashTok,
      anySel,
      dashCanGen,
      curModel,
      rows,
      showEmptyAll,
      showEmptyFolder,
      hasRows,
      hasContent,
      words,
      hard,
      soft,
      readMin,
      substancePct,
      substanceTier,
      tokenEst,
      selPlats,
      canGen,
      activeMeta,
      activeContent,
      alen,
      isReddit,
      shareReady,
      vArr,
      versionLabel,
      genCountText,
      tierBanner,
      voiceStatus,
      modelPageNote,
      draftsRows,
      draftsEmpty,
      draftsNoMatch,
      confirmDialogContent,
    };
  }, [state, hasKey, quotaQuery.data]);

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_MODE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") {
      // Restore the persisted override post-mount, same reasoning as
      // GenoraProvider's system-preference read: keeps SSR/first-paint in sync.
      patch({ themeMode: saved });
    }
  }, [patch]);

  useEffect(() => {
    const saved = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (saved === "1" || saved === "0") {
      patch({ sidebarCollapsed: saved === "1" });
    }
  }, [patch]);

  // SettingsBody reads state.keys[id].c per provider — .v stays purely local
  // (BYOK keys are never returned by GET /api/keys), .c reflects the real
  // connected/stored status from the server.
  const displayState = useMemo(() => {
    const connected = new Set(
      (apiKeysQuery.data ?? []).filter((k) => k.connected).map((k) => k.provider),
    );
    const keys = { ...state.keys };
    (Object.keys(keys) as ProviderId[]).forEach((id) => {
      keys[id] = { ...keys[id], c: connected.has(id) };
    });
    return { ...state, keys, freeLeft: quotaQuery.data?.remaining ?? state.freeLeft };
  }, [state, apiKeysQuery.data, quotaQuery.data]);

  const actions = useMemo(
    () => ({
      setThemeMode,
      toggleSidebarCollapsed,
      toggleProfileMenu,
      goDash,
      goDrafts,
      goSettings,
      homeClick,
      newPost,
      loadPost,
      openPost,
      onSearch,
      selectFolder,
      toggleMove,
      moveTo,
      startNewFolder,
      onNewFolderInput,
      commitNewFolder,
      cancelNewFolder,
      toggleFolderMenu,
      startRenameFolder,
      onRenameFolderInput,
      commitRenameFolder,
      cancelRenameFolder,
      onDashDraft,
      dashFocus,
      openEditorFromDash,
      dashGenerate,
      onTitle,
      onDraft,
      togglePlatform,
      openModel,
      pickModel,
      openFolderPicker,
      pickComposeFolder,
      generate,
      addDetail,
      generateAnyway,
      backToCompose,
      selectTab,
      onEditContent,
      onRedditSub,
      regenerate,
      retryPlatform,
      openHistory,
      restoreVersion,
      copyText,
      doShare,
      duplicatePost,
      startRenamePost,
      onRenameDraftInput,
      commitRenamePost,
      cancelRenamePost,
      openConfirmDialog,
      closeConfirmDialog,
      confirmDialogAction,
      setDraftsSearch,
      setDraftsFolderFilter,
      setDraftsStatusFilter,
      setDraftsPlatformFilter,
      setDraftsSort,
      setSettingsTab,
      onKeyInput,
      validateKey,
      toggleInstr,
      onInstr,
      saveInstr,
      onVoice,
      toggleSlop,
      setSlopStrictness,
    }),
    [
      setThemeMode,
      toggleSidebarCollapsed,
      toggleProfileMenu,
      goDash,
      goDrafts,
      goSettings,
      homeClick,
      newPost,
      loadPost,
      openPost,
      onSearch,
      selectFolder,
      toggleMove,
      moveTo,
      startNewFolder,
      onNewFolderInput,
      commitNewFolder,
      cancelNewFolder,
      toggleFolderMenu,
      startRenameFolder,
      onRenameFolderInput,
      commitRenameFolder,
      cancelRenameFolder,
      onDashDraft,
      dashFocus,
      openEditorFromDash,
      dashGenerate,
      onTitle,
      onDraft,
      togglePlatform,
      openModel,
      pickModel,
      openFolderPicker,
      pickComposeFolder,
      generate,
      addDetail,
      generateAnyway,
      backToCompose,
      selectTab,
      onEditContent,
      onRedditSub,
      regenerate,
      retryPlatform,
      openHistory,
      restoreVersion,
      copyText,
      doShare,
      duplicatePost,
      startRenamePost,
      onRenameDraftInput,
      commitRenamePost,
      cancelRenamePost,
      openConfirmDialog,
      closeConfirmDialog,
      confirmDialogAction,
      setDraftsSearch,
      setDraftsFolderFilter,
      setDraftsStatusFilter,
      setDraftsPlatformFilter,
      setDraftsSort,
      setSettingsTab,
      onKeyInput,
      validateKey,
      toggleInstr,
      onInstr,
      saveInstr,
      onVoice,
      toggleSlop,
      setSlopStrictness,
    ],
  );

  return { state: displayState, derived, actions };
}

export type GenoraActions = ReturnType<typeof useGenoraController>["actions"];
export type GenoraDerived = ReturnType<typeof useGenoraController>["derived"];
