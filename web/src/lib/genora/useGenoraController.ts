"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApiKeys, useDeleteKey, useSaveKey } from "@/hooks/useApiKeys";
import {
  useCreateFolder,
  useDeleteFolder,
  useFolders,
  useRenameFolder,
} from "@/hooks/useFolders";
import {
  usePlatformInstructions,
  useResetAllInstructions,
  useSaveInstructions,
} from "@/hooks/usePlatformInstructions";
import {
  useCreatePost,
  useDeletePost,
  useDuplicatePost,
  useMovePost,
  usePost,
  usePosts,
  useUpdatePost,
} from "@/hooks/usePosts";
import { useQuota } from "@/hooks/useQuota";
import { useGenerationRun } from "@/hooks/useGenerationRun";
import {
  useEditPlatformContent,
  useGenerate,
  usePlatformVersions,
  useRegeneratePlatform,
  useRestoreVersion,
} from "@/hooks/useGeneration";
import { computeOutputs, toMockFolder, toMockPost } from "./adapters";
import { getModelCatalogEntry } from "@/lib/generation/modelCatalog";
import {
  INSTR_DEFAULTS,
  MODELS,
  ORDER,
  PLAT,
  PROVIDERS,
  REJECTS,
  createInitialState,
} from "./data";
import { thresholds, wordCount } from "./logic";
import type {
  GenoraState,
  ModelId,
  ModelMeta,
  PlatformId,
  Post,
  PostStatus,
  ProviderId,
  SettingsTab,
  SlopStrictness,
  ThemeMode,
} from "./types";

const THEME_MODE_KEY = "genora-theme-mode";
const SIDEBAR_COLLAPSED_KEY = "genora-sidebar-collapsed";
const SLOP_ENABLED_KEY = "genora-slop-enabled";
const SLOP_STRICTNESS_KEY = "genora-slop-strictness";

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
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- real backend: BYOK keys, per-platform instructions, quota ---------
  const apiKeysQuery = useApiKeys();
  const saveKeyMutation = useSaveKey();
  const deleteKeyMutation = useDeleteKey();
  const instructionsQuery = usePlatformInstructions();
  const saveInstructionsMutation = useSaveInstructions();
  const resetAllInstructionsMutation = useResetAllInstructions();
  const quotaQuery = useQuota();

  // ---- real backend: folders + posts --------------------------------------
  const foldersQuery = useFolders();
  const createFolderMutation = useCreateFolder();
  const renameFolderMutation = useRenameFolder();
  const deleteFolderMutation = useDeleteFolder();
  const postsQuery = usePosts();
  const createPostMutation = useCreatePost();
  const updatePostMutation = useUpdatePost();
  const movePostMutation = useMovePost();
  const deletePostMutation = useDeletePost();
  const duplicatePostMutation = useDuplicatePost();

  const realFolders = useMemo(
    () => (foldersQuery.data ?? []).map(toMockFolder),
    [foldersQuery.data],
  );
  const realPosts = useMemo(
    () => (postsQuery.data ?? []).map(toMockPost),
    [postsQuery.data],
  );

  // ---- real backend: generation / output ----------------------------------
  const generateMutation = useGenerate();
  const regeneratePlatformMutation = useRegeneratePlatform();
  const editPlatformContentMutation = useEditPlatformContent();
  const restoreVersionMutation = useRestoreVersion();
  // In-memory only — the run id/token per platform from the most recent
  // trigger in *this* browser session. Not persisted anywhere (posts has no
  // run FK — ownership is Trigger.dev tag-based), so a cold revisit to a
  // still-generating post has no token and falls back to whatever's already
  // in the DB; it won't live-update until the user refreshes. Known,
  // disclosed limitation.
  //
  // Tracked per platform (not as one shared run) because a single-platform
  // regenerate fires its own run independent of the original multi-platform
  // generate — if regenerating platform A overwrote a single shared run
  // slot, platforms B/C from the original run would stop being polled while
  // still in flight.
  const [activeRuns, setActiveRuns] = useState<
    Partial<
      Record<PlatformId, { runId: string; publicAccessToken: string | null }>
    >
  >({});
  const setRunForPlatforms = useCallback(
    (
      platforms: PlatformId[],
      run: { runId: string; publicAccessToken: string | null },
    ) => {
      setActiveRuns((prev) => {
        const next = { ...prev };
        platforms.forEach((p) => {
          next[p] = run;
        });
        return next;
      });
    },
    [],
  );
  // Rules of hooks require a fixed number of hook calls — PlatformId is a
  // fixed 5-value union (see ORDER in ./data), so one call per platform here
  // is the entire set, not a dynamic loop.
  const postIdForRuns = state.composePostId ?? "";
  const linkedinRun = useGenerationRun({
    postId: postIdForRuns,
    runId: activeRuns.linkedin?.runId ?? null,
    publicAccessToken: activeRuns.linkedin?.publicAccessToken ?? null,
  });
  const xRun = useGenerationRun({
    postId: postIdForRuns,
    runId: activeRuns.x?.runId ?? null,
    publicAccessToken: activeRuns.x?.publicAccessToken ?? null,
  });
  const redditRun = useGenerationRun({
    postId: postIdForRuns,
    runId: activeRuns.reddit?.runId ?? null,
    publicAccessToken: activeRuns.reddit?.publicAccessToken ?? null,
  });
  const mediumRun = useGenerationRun({
    postId: postIdForRuns,
    runId: activeRuns.medium?.runId ?? null,
    publicAccessToken: activeRuns.medium?.publicAccessToken ?? null,
  });
  const substackRun = useGenerationRun({
    postId: postIdForRuns,
    runId: activeRuns.substack?.runId ?? null,
    publicAccessToken: activeRuns.substack?.publicAccessToken ?? null,
  });
  const shouldPoll =
    linkedinRun.shouldPoll ||
    xRun.shouldPoll ||
    redditRun.shouldPoll ||
    mediumRun.shouldPoll ||
    substackRun.shouldPoll;
  const postDetailQuery = usePost(state.composePostId ?? undefined, {
    refetchInterval: shouldPoll ? 2500 : false,
  });
  const versionsQuery = usePlatformVersions(
    state.composePostId ?? undefined,
    state.historyOpen ?? undefined,
  );

  // Seed outPlatforms (which platforms were requested) from whatever's
  // already on the post the first time it loads cold — e.g. opened from
  // Drafts rather than just-triggered — without clobbering an in-session
  // list a just-fired generate/regenerate call already set.
  // Synchronous re-entrancy guard for runGenerate — state.generating is only
  // read by the button's disabled attribute after React commits, so a second
  // click landing before that commit would otherwise fire a second
  // POST /api/generate and create a duplicate draft.
  const generatingRef = useRef(false);
  const seededOutPlatformsRef = useRef<string | null>(null);
  useEffect(() => {
    if (!postDetailQuery.data) return;
    if (seededOutPlatformsRef.current === postDetailQuery.data.id) return;
    seededOutPlatformsRef.current = postDetailQuery.data.id;
    const fromServer = postDetailQuery.data.platformOutputs.map(
      (o) => o.platform as PlatformId,
    );
    if (fromServer.length === 0) return;
    setState((s) => ({
      ...s,
      outPlatforms: s.outPlatforms.length > 0 ? s.outPlatforms : fromServer,
      activeTab:
        s.outPlatforms.length > 0
          ? s.activeTab
          : (fromServer[0] ?? s.activeTab),
    }));
  }, [postDetailQuery.data]);

  // Content is user-editable, so it's hydrated from the server exactly once
  // per platform (the moment that platform's generation first completes),
  // then locally owned — a background poll/realtime update must never
  // clobber an in-progress edit.
  const hydratedContentRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!postDetailQuery.data) return;
    const postId = postDetailQuery.data.id;
    const toHydrate: Partial<Record<PlatformId, string>> = {};
    let changed = false;
    for (const o of postDetailQuery.data.platformOutputs) {
      if (o.status !== "success" || o.content == null) continue;
      const key = `${postId}:${o.platform}`;
      if (hydratedContentRef.current.has(key)) continue;
      hydratedContentRef.current.add(key);
      toHydrate[o.platform as PlatformId] = o.content;
      changed = true;
    }
    if (changed) {
      setState((s) => ({ ...s, content: { ...s.content, ...toHydrate } }));
    }
  }, [postDetailQuery.data]);

  // The optimistic "generating: true" set by runGenerate/regenerate only
  // covers the brief window before the first real fetch for this post
  // resolves — once it has, outputsGenerating/regeneratingPlatforms (both
  // computed live from server data) are the sole source of truth.
  useEffect(() => {
    if (postDetailQuery.data) {
      setState((s) => (s.generating ? { ...s, generating: false } : s));
    }
  }, [postDetailQuery.data]);

  // Resuming an existing (not-yet-generated) draft: hydrate the full raw
  // text once from the server — the mock Post's `snippet` is truncated to
  // 160 chars for list rendering and isn't enough to resume editing.
  const hydratedDraftRef = useRef<string | null>(null);
  useEffect(() => {
    if (!postDetailQuery.data || postDetailQuery.data.status !== "draft") {
      return;
    }
    if (hydratedDraftRef.current === postDetailQuery.data.id) return;
    hydratedDraftRef.current = postDetailQuery.data.id;
    setState((s) => ({
      ...s,
      draft: postDetailQuery.data!.rawContent,
      composeTitle: postDetailQuery.data!.title ?? s.composeTitle,
      composeFolder: postDetailQuery.data!.folderId,
    }));
  }, [postDetailQuery.data]);

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

  const flash = useCallback(
    (msg: string, kind: "success" | "error" = "success") => {
      patch({ flashMsg: msg, flashKind: kind });
      if (flashTimer.current) clearTimeout(flashTimer.current);
      // Errors stay up longer — they're often read while the user is mid
      // click on something else, not watched for like a copy confirmation.
      flashTimer.current = setTimeout(
        () => patch({ flashMsg: "" }),
        kind === "error" ? 5000 : 3200,
      );
    },
    [patch],
  );

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
      if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
      patch({
        ...NAV_RESET,
        composePostId: null,
        composeTitle: "",
        draft: "",
        composeFolder: folder ?? null,
        softNudge: false,
        softDismissed: false,
        slopHard: false,
        slopRejectReason: null,
        draftSaving: false,
      });
      navigate("/compose");
    },
    [patch, navigate],
  );

  // Sets which post is open and resets transient UI for it — the actual
  // content/output/draft-text hydration happens in the effects above, driven
  // by usePost(composePostId) once it resolves (async, so intentionally not
  // done here synchronously).
  const loadPost = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      composePostId: id,
      outTitle: s.posts.find((p) => p.id === id)?.title ?? s.outTitle,
      slopHard: false,
      slopRejectReason: null,
      generating: false,
      softNudge: false,
      softDismissed: false,
      redditSub: "",
    }));
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
  const moveTo = useCallback(
    (postId: string, folderId: string | null) => {
      movePostMutation.mutate(
        { id: postId, folderId },
        {
          onError: (err) => {
            console.error("Failed to move post", err);
            flash("Couldn't move the post — try again.", "error");
          },
        },
      );
      setState((s) => ({ ...s, moveMenu: null }));
    },
    [movePostMutation, flash],
  );

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
      createFolderMutation.mutate(
        { name },
        {
          onError: (err) => {
            console.error("Failed to create folder", err);
            flash("Couldn't create the folder — try again.", "error");
          },
        },
      );
      return { ...s, creatingFolder: false, newFolderDraft: "" };
    });
  }, [createFolderMutation, flash]);
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
      renameFolderMutation.mutate(
        { id: s.renamingFolderId, name },
        {
          onError: (err) => {
            console.error("Failed to rename folder", err);
            flash("Couldn't rename the folder — try again.", "error");
          },
        },
      );
      return { ...s, renamingFolderId: null, renameFolderValue: "" };
    });
  }, [renameFolderMutation, flash]);
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
        slopRejectReason: null,
      };
    });
    navigate("/compose");
  }, [navigate]);

  // ---- compose --------------------------------------------------------
  // Raw draft content has no dedicated live-typing endpoint, same
  // constraint as onEditContent below — debounce, and coalesce concurrent
  // creates behind a ref flag so a burst of edits before the first create
  // resolves can't fork two post rows for one compose session.
  const draftSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const creatingDraftRef = useRef(false);
  const persistDraft = useCallback(
    (
      rawContent: string,
      title: string,
      folderId: string | null,
      postId: string | null,
    ) => {
      if (!rawContent.trim()) {
        patch({ draftSaving: false });
        return;
      }
      if (postId) {
        updatePostMutation.mutate(
          {
            id: postId,
            input: { rawContent, title: title || undefined, folderId },
          },
          {
            onSettled: () => patch({ draftSaving: false }),
            onError: (err) => {
              console.error("Failed to save draft", err);
              flash("Couldn't save your draft — try again.", "error");
            },
          },
        );
        return;
      }
      if (creatingDraftRef.current) return;
      creatingDraftRef.current = true;
      createPostMutation.mutate(
        {
          rawContent,
          title: title || undefined,
          folderId: folderId ?? undefined,
        },
        {
          onSuccess: (created) => {
            creatingDraftRef.current = false;
            setState((s) =>
              s.composePostId ? s : { ...s, composePostId: created.id },
            );
            patch({ draftSaving: false });
          },
          onError: (err) => {
            creatingDraftRef.current = false;
            console.error("Failed to save draft", err);
            flash("Couldn't save your draft — try again.", "error");
            patch({ draftSaving: false });
          },
        },
      );
    },
    [patch, updatePostMutation, createPostMutation, flash],
  );
  const scheduleDraftSave = useCallback(
    (
      rawContent: string,
      title: string,
      folderId: string | null,
      postId: string | null,
    ) => {
      if (!rawContent.trim()) return;
      patch({ draftSaving: true });
      if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
      draftSaveTimer.current = setTimeout(() => {
        persistDraft(rawContent, title, folderId, postId);
      }, 800);
    },
    [patch, persistDraft],
  );
  const onTitle = useCallback(
    (v: string) => {
      patch({ composeTitle: v });
      scheduleDraftSave(
        state.draft,
        v,
        state.composeFolder,
        state.composePostId,
      );
    },
    [
      patch,
      scheduleDraftSave,
      state.draft,
      state.composeFolder,
      state.composePostId,
    ],
  );
  const onDraft = useCallback(
    (v: string) => {
      patch({ draft: v, softNudge: false });
      scheduleDraftSave(
        v,
        state.composeTitle,
        state.composeFolder,
        state.composePostId,
      );
    },
    [
      patch,
      scheduleDraftSave,
      state.composeTitle,
      state.composeFolder,
      state.composePostId,
    ],
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
    (id: string | null) => {
      patch({ composeFolder: id, folderPickerOpen: false });
      scheduleDraftSave(
        state.draft,
        state.composeTitle,
        id,
        state.composePostId,
      );
    },
    [
      patch,
      scheduleDraftSave,
      state.draft,
      state.composeTitle,
      state.composePostId,
    ],
  );

  // Without a modelId, checks whether *any* provider key is connected (used
  // for copy like "BYOK active" that doesn't depend on which provider). With
  // one, checks the specific provider that model needs — a Groq-only user
  // isn't "unlocked" for an Anthropic-only model just because some key
  // exists.
  const hasKey = useCallback(
    (modelId?: ModelId) => {
      const keys = apiKeysQuery.data ?? [];
      if (!modelId) return keys.some((k) => k.connected);
      const provider = getModelCatalogEntry(modelId)?.provider;
      if (!provider) return false;
      return keys.some((k) => k.connected && k.provider === provider);
    },
    [apiKeysQuery.data],
  );

  const pickModel = useCallback(
    (m: ModelMeta) => {
      setState((s) => {
        if (m.free || hasKey(m.id)) {
          return { ...s, model: m.id, modelOpen: false };
        }
        return s;
      });
    },
    [hasKey],
  );

  // ---- generation -------------------------------------------------------
  // Tracks platforms currently being retried/regenerated so the UI shows
  // "pending" immediately, even though the DB's current row for that
  // platform is still the old (superseded-to-be) one until the real backend
  // finishes — cleared by the query-watching effect below once a genuinely
  // newer version appears.
  const [regeneratingPlatforms, setRegeneratingPlatforms] = useState<
    Set<PlatformId>
  >(new Set());
  const lastSeenVersionRef = useRef<Map<string, number>>(new Map());

  // Single source of truth for "did a platform's result change": content is
  // hydrated from the server exactly once per version (so a background
  // poll/realtime update never clobbers an in-progress edit), and a version
  // bump also clears that platform out of regeneratingPlatforms.
  useEffect(() => {
    if (!postDetailQuery.data) return;
    const postId = postDetailQuery.data.id;
    const contentUpdates: Partial<Record<PlatformId, string>> = {};
    const justChanged: PlatformId[] = [];
    for (const o of postDetailQuery.data.platformOutputs) {
      const pid = o.platform as PlatformId;
      const key = `${postId}:${pid}`;
      const lastVersion = lastSeenVersionRef.current.get(key);
      if (lastVersion !== undefined && o.version <= lastVersion) continue;
      lastSeenVersionRef.current.set(key, o.version);
      justChanged.push(pid);
      if (o.status === "success" && o.content != null) {
        contentUpdates[pid] = o.content;
      }
    }
    if (justChanged.length === 0) return;
    setState((s) => ({ ...s, content: { ...s.content, ...contentUpdates } }));
    setRegeneratingPlatforms((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set(prev);
      justChanged.forEach((pid) => next.delete(pid));
      return next;
    });
  }, [postDetailQuery.data]);

  const regenerateForPlatform = useCallback(
    (id: PlatformId) => {
      const postId = state.composePostId;
      if (!postId) return;
      setRegeneratingPlatforms((prev) => new Set(prev).add(id));
      regeneratePlatformMutation.mutate(
        { postId, platform: id },
        {
          onSuccess: (result) => {
            setRunForPlatforms([id], {
              runId: result.runId,
              publicAccessToken: result.publicAccessToken,
            });
          },
          onError: (err) => {
            console.error("Failed to regenerate platform", err);
            flash(
              `Couldn't regenerate ${PLAT[id].label} — try again.`,
              "error",
            );
            setRegeneratingPlatforms((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          },
        },
      );
    },
    [
      state.composePostId,
      regeneratePlatformMutation,
      setRunForPlatforms,
      flash,
    ],
  );
  const retryPlatform = useCallback(
    (id: PlatformId) => regenerateForPlatform(id),
    [regenerateForPlatform],
  );

  // navMode "replace": /compose was already a committed page the user was
  // looking at (its own earlier tick) — collapse it into /post so Back skips
  // the transient compose step. navMode "push": there was no real /compose
  // visit this tick (e.g. dashboard's quick-generate) — push, so Back still
  // returns to the page the user was actually on (Next.js otherwise collapses
  // a same-tick push+replace pair into a single replace of *that* page).
  const runGenerate = useCallback(
    (navMode: "push" | "replace" = "replace") => {
      if (!hasKey(state.model) && (quotaQuery.data?.remaining ?? 0) <= 0) {
        // No silent redirect — the caller's screen already shows an inline
        // "out of free generations" banner (derived.quotaExhausted) with its
        // own explicit "Add a key" action. Pre-select the right settings tab
        // for whenever the user does navigate there themselves.
        patch({ settingsTab: "keys" });
        return;
      }

      const sel = ORDER.filter((id) => state.platforms[id]);
      if (sel.length === 0) return;
      if (generatingRef.current) return;
      generatingRef.current = true;
      const title = state.composeTitle || "Untitled";

      // Generation is about to persist this exact content itself (insert or
      // update, see below) — a pending debounced autosave firing afterward
      // would still hold the pre-generate composePostId in its closure and
      // could insert a second, now-redundant post.
      if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
      patch({ draftSaving: false });

      lastSeenVersionRef.current.clear();
      seededOutPlatformsRef.current = null;
      setRegeneratingPlatforms(new Set());
      setState((s) => ({
        ...s,
        slopHard: false,
        slopRejectReason: null,
        softNudge: false,
        generating: true,
        activeTab: sel[0],
        outTitle: title,
        outPlatforms: sel,
        content: {},
        outputError: {},
        redditSub: "",
      }));

      generateMutation.mutate(
        {
          // Reuse the post already loaded in the editor (resuming a draft,
          // or re-generating after going back from an already-generated
          // post) instead of forking a new one — see generateService.ts's
          // runGenerate for the update-in-place path this enables.
          postId: state.composePostId ?? undefined,
          rawText: state.draft,
          title: state.composeTitle || undefined,
          folderId: state.composeFolder ?? undefined,
          platforms: sel.map((platform) => ({
            platform,
            modelId: state.model,
          })),
        },
        {
          onSuccess: (outcome) => {
            generatingRef.current = false;
            if (outcome.status === "rejected") {
              setState((s) => ({
                ...s,
                slopHard: true,
                generating: false,
                slopRejectReason: outcome.slopGuard.reason,
              }));
              return;
            }
            setRunForPlatforms(sel, {
              runId: outcome.runId,
              publicAccessToken: outcome.publicAccessToken,
            });
            setState((s) => ({ ...s, composePostId: outcome.postId }));
            (navMode === "replace" ? replace : navigate)(
              `/post/${outcome.postId}`,
            );
          },
          onError: (err) => {
            generatingRef.current = false;
            console.error("Failed to start generation", err);
            flash("Couldn't start generation — try again.", "error");
            setState((s) => ({ ...s, generating: false }));
          },
        },
      );
    },
    [
      hasKey,
      quotaQuery.data,
      state,
      patch,
      navigate,
      replace,
      generateMutation,
      setRunForPlatforms,
      flash,
    ],
  );

  const generate = useCallback(() => {
    const { hard, soft } = thresholds(state.slopStrictness);
    const words = wordCount(state.draft);
    if (state.slopEnabled && (state.draft.trim() === "" || words < hard)) {
      setState((s) => ({
        ...s,
        slopHard: true,
        slopRejectReason: null,
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
        slopRejectReason: null,
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
    patch({ slopHard: false, slopRejectReason: null });
    // Lateral move within the same post's editing session — replace, not
    // push, so bouncing between compose/output doesn't grow the stack.
    replace("/compose");
  }, [patch, replace]);
  const selectTab = useCallback(
    (id: PlatformId) => patch({ activeTab: id, historyOpen: null }),
    [patch],
  );
  const contentSaveTimers = useRef<
    Partial<Record<PlatformId, ReturnType<typeof setTimeout>>>
  >({});
  const onEditContent = useCallback(
    (v: string, id?: PlatformId) => {
      const tab = id ?? state.activeTab;
      const postId = state.composePostId;
      setState((s) => ({ ...s, content: { ...s.content, [tab]: v } }));
      if (!postId) return;
      if (contentSaveTimers.current[tab]) {
        clearTimeout(contentSaveTimers.current[tab]);
      }
      // Debounced — PATCH .../platforms/:platform has no live-typing
      // endpoint, so this must not fire on every keystroke.
      contentSaveTimers.current[tab] = setTimeout(() => {
        editPlatformContentMutation.mutate(
          { postId, platform: tab, content: v },
          {
            onError: (err) => {
              console.error("Failed to save edited content", err);
              flash("Couldn't save your edit — try again.", "error");
            },
          },
        );
      }, 800);
    },
    [state.activeTab, state.composePostId, editPlatformContentMutation, flash],
  );
  const onRedditSub = useCallback(
    (v: string) => patch({ redditSub: v }),
    [patch],
  );
  const regenerate = useCallback(
    (id?: PlatformId) => regenerateForPlatform(id ?? state.activeTab),
    [regenerateForPlatform, state.activeTab],
  );
  const openHistory = useCallback((id?: PlatformId) => {
    setState((s) => {
      const target = id ?? s.activeTab;
      return { ...s, historyOpen: s.historyOpen === target ? null : target };
    });
  }, []);
  const restoreVersion = useCallback(
    (tab: PlatformId, version: number) => {
      const postId = state.composePostId;
      if (!postId) return;
      // Match by version number, not content — two versions (e.g. two
      // failed attempts) can share identical content, and matching by
      // content risked restoring the wrong one.
      const match = (versionsQuery.data ?? []).find(
        (v) => v.version === version,
      );
      if (!match) return;
      restoreVersionMutation.mutate(
        { postId, platform: tab, version },
        {
          // Only update local state once the restore actually lands — an
          // optimistic update here would show "restored" even when the
          // mutation fails or the match was stale, only to have the next
          // refetch silently revert it.
          onSuccess: () => {
            setState((s) => ({
              ...s,
              content: { ...s.content, [tab]: match.content ?? "" },
              historyOpen: null,
            }));
          },
          onError: (err) => {
            console.error("Failed to restore version", err);
            flash("Couldn't restore that version — try again.", "error");
          },
        },
      );
    },
    [state.composePostId, versionsQuery.data, restoreVersionMutation, flash],
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
  // No dedicated duplicate endpoint — composes a read + a create. This
  // intentionally does NOT copy generated per-platform outputs, unlike the
  // prototype's instant clone; the duplicate starts as a fresh draft.
  const duplicatePost = useCallback(
    (postId: string) => {
      duplicatePostMutation.mutate(postId, {
        onError: (err) => {
          console.error("Failed to duplicate post", err);
          flash("Couldn't duplicate the post — try again.", "error");
        },
      });
      setState((s) => ({ ...s, moveMenu: null }));
    },
    [duplicatePostMutation, flash],
  );

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
      updatePostMutation.mutate(
        { id: s.renamingPostId, input: { title } },
        {
          onError: (err) => {
            console.error("Failed to rename post", err);
            flash("Couldn't rename the post — try again.", "error");
          },
        },
      );
      return { ...s, renamingPostId: null, renameDraftValue: "" };
    });
  }, [updatePostMutation, flash]);
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
      await deletePostMutation.mutateAsync(d.postId).catch((err: unknown) => {
        console.error("Failed to delete post", err);
        flash("Couldn't delete the post — try again.", "error");
      });
      setState((s) => ({ ...s, confirmDialog: null }));
      return;
    }
    if (d.kind === "deleteFolder") {
      // Posts filed under the deleted folder move to folderId: null
      // server-side (FK ON DELETE SET NULL) — the posts query invalidation
      // already picks that up, no client-side reassignment needed.
      await deleteFolderMutation
        .mutateAsync(d.folderId)
        .catch((err: unknown) => {
          console.error("Failed to delete folder", err);
          flash("Couldn't delete the folder — try again.", "error");
        });
      setState((s) => ({
        ...s,
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
  }, [
    state.confirmDialog,
    deleteKeyMutation,
    resetAllInstructionsMutation,
    deletePostMutation,
    deleteFolderMutation,
    flash,
  ]);

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
      setState((s) => ({
        ...s,
        instrSaving: { ...s.instrSaving, [id]: true },
      }));
      saveInstructionsMutation.mutate(
        { platform: id, instructions: state.instr[id] },
        {
          onSettled: () => {
            setState((s) => ({
              ...s,
              instrSaving: { ...s.instrSaving, [id]: false },
            }));
          },
        },
      );
    },
    [state.instr, saveInstructionsMutation],
  );
  const onVoice = useCallback((v: string) => patch({ voice: v }), [patch]);
  const toggleSlop = useCallback(() => {
    setState((s) => {
      const next = !s.slopEnabled;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SLOP_ENABLED_KEY, next ? "1" : "0");
      }
      return { ...s, slopEnabled: next };
    });
  }, []);
  const setSlopStrictness = useCallback(
    (v: SlopStrictness) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SLOP_STRICTNESS_KEY, v);
      }
      patch({ slopStrictness: v });
    },
    [patch],
  );

  // The always-visible per-platform version badge needs a real count for
  // every selected platform, but the actual past-version content is only
  // ever rendered for whichever platform's history popover is open — so
  // fetch full content lazily (versionsQuery, scoped to state.historyOpen)
  // and fill in a correctly-sized placeholder array for the others (current
  // row's `.version` is already known from postDetailQuery, no extra fetch).
  const displayVersions = useMemo(() => {
    const result: Partial<Record<PlatformId, string[]>> = {};
    const currentByPlatform = new Map(
      (postDetailQuery.data?.platformOutputs ?? []).map((o) => [
        o.platform as PlatformId,
        o,
      ]),
    );
    state.outPlatforms.forEach((pid) => {
      const count = currentByPlatform.get(pid)?.version ?? 1;
      result[pid] = Array.from({ length: count }, () => "");
    });
    if (state.historyOpen && versionsQuery.data) {
      result[state.historyOpen] = [...versionsQuery.data]
        .sort((a, b) => a.version - b.version)
        .map((v) => v.content ?? "");
    }
    return result;
  }, [
    state.outPlatforms,
    state.historyOpen,
    postDetailQuery.data,
    versionsQuery.data,
  ]);

  // ---- derived (pure data, no styling) ------------------------------------
  const derived = useMemo(() => {
    const S = state;
    const hk = hasKey();
    const freeLeft = quotaQuery.data?.remaining ?? 0;

    const quotaText = hk
      ? "BYOK · unlimited"
      : `${freeLeft} free generation${freeLeft === 1 ? "" : "s"} left this month`;
    const quotaLow = !hk && freeLeft <= 1;
    const quotaExhausted = !hk && freeLeft <= 0;

    const hr = new Date().getHours();
    const greeting =
      hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";

    const counts: Record<string, number> = {};
    realFolders.forEach((f) => (counts[f.id] = 0));
    realPosts.forEach((p) => {
      if (p.folder && counts[p.folder] != null) counts[p.folder]++;
    });
    const folderName = (id: string | null) =>
      realFolders.find((f) => f.id === id)?.name ?? null;

    const dashExpanded = S.dashFocused || S.dashDraft.trim() !== "";
    const dashWords = wordCount(S.dashDraft);
    const dashTok = Math.max(0, Math.round(dashWords * 1.4));
    const anySel = ORDER.some((id) => S.platforms[id]);
    const dashCanGen = S.dashDraft.trim() !== "" && anySel;

    const curModel = MODELS.find((m) => m.id === S.model) || MODELS[0];

    const q = S.search.trim().toLowerCase();
    let rows = realPosts;
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
    const showEmptyAll = realPosts.length === 0;
    const showEmptyFolder =
      !showEmptyAll &&
      rows.length === 0 &&
      (S.activeFolder !== null || S.draftsPlatformFilter !== "all") &&
      !q;
    const hasRows = rows.length > 0;
    const hasContent = realPosts.length > 0;

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
    const vArr = displayVersions[activeTab] || [];
    const versionLabel = "v" + Math.max(1, vArr.length);
    const genCountText = `Repurposing your thought for ${S.outPlatforms.length} platform${S.outPlatforms.length === 1 ? "" : "s"}…`;

    const freeModelNames = MODELS.filter((m) => m.free)
      .map((m) => m.label)
      .join(" or ");
    const tierBanner = hk
      ? "BYOK active — the monthly cap is lifted and full model selection is unlocked."
      : `You're on the free tier: ${freeLeft} generations left this month on ${freeModelNames}. Add any key to remove the cap and choose models.`;
    const voiceStatus = S.voice.trim()
      ? `Calibrated on ${wordCount(S.voice)} words of your writing.`
      : "Not calibrated yet — generations use platform defaults.";
    const modelPageNote = hk
      ? "Your global default. Any folder or post can override it."
      : `Free tier is fixed to ${freeModelNames}. Add a key in API keys to unlock the rest.`;

    // ---- drafts page ----
    const draftsSearchQ = S.draftsSearch.trim().toLowerCase();
    let draftsRows = realPosts;
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
    const draftsEmpty = realPosts.length === 0;
    const draftsNoMatch = !draftsEmpty && draftsRows.length === 0;

    let confirmDialogContent: {
      title: string;
      description: string;
      confirmLabel: string;
    } | null = null;
    const d = S.confirmDialog;
    if (d?.kind === "deletePost") {
      const p = realPosts.find((x) => x.id === d.postId);
      confirmDialogContent = {
        title: "Delete draft?",
        description: `"${p?.title ?? "This draft"}" will be permanently deleted. This can't be undone.`,
        confirmLabel: "Delete",
      };
    } else if (d?.kind === "deleteFolder") {
      const f = realFolders.find((x) => x.id === d.folderId);
      const count = realPosts.filter((p) => p.folder === d.folderId).length;
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
  }, [state, hasKey, quotaQuery.data, realFolders, realPosts, displayVersions]);

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

  useEffect(() => {
    const savedEnabled = window.localStorage.getItem(SLOP_ENABLED_KEY);
    const savedStrictness = window.localStorage.getItem(SLOP_STRICTNESS_KEY);
    const patchValues: Partial<GenoraState> = {};
    if (savedEnabled === "1" || savedEnabled === "0") {
      patchValues.slopEnabled = savedEnabled === "1";
    }
    if (
      savedStrictness === "lenient" ||
      savedStrictness === "balanced" ||
      savedStrictness === "strict"
    ) {
      patchValues.slopStrictness = savedStrictness;
    }
    if (Object.keys(patchValues).length > 0) {
      patch(patchValues);
    }
  }, [patch]);

  // SettingsBody reads state.keys[id].c per provider — .v stays purely local
  // (BYOK keys are never returned by GET /api/keys), .c reflects the real
  // connected/stored status from the server.
  const displayState = useMemo(() => {
    const connected = new Set(
      (apiKeysQuery.data ?? [])
        .filter((k) => k.connected)
        .map((k) => k.provider),
    );
    const keys = { ...state.keys };
    (Object.keys(keys) as ProviderId[]).forEach((id) => {
      keys[id] = { ...keys[id], c: connected.has(id) };
    });

    const {
      outputStatus,
      outputError,
      generating: outputsGenerating,
    } = computeOutputs(
      state.outPlatforms,
      postDetailQuery.data?.platformOutputs,
    );
    regeneratingPlatforms.forEach((pid) => {
      outputStatus[pid] = "pending";
    });

    return {
      ...state,
      keys,
      freeLeft: quotaQuery.data?.remaining ?? state.freeLeft,
      folders: realFolders,
      posts: realPosts,
      versions: displayVersions,
      outputStatus,
      outputError,
      // Initial full-run only — a solo per-platform regenerate/retry must
      // NOT flip this, since it gates the full-page overlay in OutputView
      // that would otherwise hide already-successful sibling platforms.
      generating: outputsGenerating || state.generating,
      regeneratingPlatforms,
    };
  }, [
    state,
    apiKeysQuery.data,
    quotaQuery.data,
    realFolders,
    realPosts,
    displayVersions,
    postDetailQuery.data,
    regeneratingPlatforms,
  ]);

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
      hasKey,
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
      hasKey,
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
export type GenoraDisplayState = ReturnType<
  typeof useGenoraController
>["state"];
