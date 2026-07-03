"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ALTS,
  INSTR_DEFAULTS,
  MODELS,
  ORDER,
  PLAT,
  REJECTS,
  SAMPLES,
  createInitialState,
} from "./data";
import { thresholds, wordCount } from "./logic";
import type {
  FacetState,
  ModelMeta,
  PlatformId,
  Post,
  ProviderId,
  SettingsTab,
  SlopStrictness,
  ViewName,
} from "./types";

export function useFacetController() {
  const [state, setState] = useState<FacetState>(createInitialState);
  const genTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const patch = useCallback((p: Partial<FacetState>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);

  // ---- navigation -------------------------------------------------------
  const setView = useCallback((v: ViewName) => {
    setState((s) => ({
      ...s,
      view: v,
      moveMenu: null,
      modelOpen: false,
      folderPickerOpen: false,
      historyOpen: false,
    }));
  }, []);
  const goDash = useCallback(() => setView("dashboard"), [setView]);
  const goSettings = useCallback(
    (tab?: SettingsTab) => {
      setState((s) => ({ ...s, view: "settings", settingsTab: tab ?? "keys" }));
    },
    []
  );
  const homeClick = useCallback(() => patch({ activeFolder: null, search: "" }), [patch]);

  const newPost = useCallback(
    (folder?: string | null) => {
      patch({
        view: "compose",
        composeTitle: "",
        draft: "",
        composeFolder: folder ?? null,
        softNudge: false,
        softDismissed: false,
        slopHard: false,
      });
    },
    [patch]
  );

  const openPost = useCallback((post: Post) => {
    if (["Generated", "Edited", "Exported"].includes(post.status)) {
      const sel = post.platforms.length ? post.platforms : (["linkedin"] as PlatformId[]);
      const content: Partial<Record<PlatformId, string>> = {};
      const versions: Partial<Record<PlatformId, string[]>> = {};
      sel.forEach((id) => {
        const t = SAMPLES[id] || SAMPLES.linkedin;
        content[id] = t;
        versions[id] = [t];
      });
      setState((s) => ({
        ...s,
        view: "output",
        outTitle: post.title,
        outPlatforms: sel,
        content,
        versions,
        activeTab: sel[0],
        slopHard: false,
        generating: false,
      }));
    } else {
      setState((s) => ({
        ...s,
        view: "compose",
        composeTitle: post.title,
        draft: post.snippet || "",
        composeFolder: post.folder,
        softNudge: false,
        softDismissed: false,
      }));
    }
  }, []);

  const onSearch = useCallback((v: string) => patch({ search: v }), [patch]);
  const selectFolder = useCallback(
    (id: string | null) => patch({ activeFolder: id, search: "" }),
    [patch]
  );
  const toggleMove = useCallback((id: string) => {
    setState((s) => ({ ...s, moveMenu: s.moveMenu === id ? null : id }));
  }, []);
  const moveTo = useCallback((postId: string, folderId: string | null) => {
    setState((s) => ({
      ...s,
      posts: s.posts.map((p) => (p.id === postId ? { ...p, folder: folderId } : p)),
      moveMenu: null,
    }));
  }, []);

  // ---- dashboard composer -------------------------------------------------
  const onDashDraft = useCallback(
    (v: string) => patch({ dashDraft: v, dashFocused: true }),
    [patch]
  );
  const dashFocus = useCallback(() => patch({ dashFocused: true }), [patch]);
  const openEditorFromDash = useCallback(() => {
    setState((s) => {
      const title = s.dashDraft.trim().split(/\s+/).slice(0, 6).join(" ");
      return {
        ...s,
        view: "compose",
        draft: s.dashDraft,
        composeTitle: title,
        softNudge: false,
        softDismissed: false,
        slopHard: false,
      };
    });
  }, []);

  // ---- compose --------------------------------------------------------
  const onTitle = useCallback((v: string) => patch({ composeTitle: v }), [patch]);
  const onDraft = useCallback((v: string) => patch({ draft: v, softNudge: false }), [patch]);
  const togglePlatform = useCallback((id: PlatformId) => {
    setState((s) => ({ ...s, platforms: { ...s.platforms, [id]: !s.platforms[id] } }));
  }, []);
  const openModel = useCallback(() => {
    setState((s) => ({ ...s, modelOpen: !s.modelOpen }));
  }, []);
  const openFolderPicker = useCallback(() => {
    setState((s) => ({ ...s, folderPickerOpen: !s.folderPickerOpen }));
  }, []);
  const pickComposeFolder = useCallback(
    (id: string | null) => patch({ composeFolder: id, folderPickerOpen: false }),
    [patch]
  );

  const hasKey = useCallback(
    (s: FacetState = state) => Object.values(s.keys).some((k) => k.c),
    [state]
  );

  const pickModel = useCallback(
    (m: ModelMeta) => {
      setState((s) => {
        if (m.free || hasKey(s)) return { ...s, model: m.id, modelOpen: false };
        return s;
      });
    },
    [hasKey]
  );

  // ---- generation -------------------------------------------------------
  const runGenerate = useCallback(() => {
    setState((s) => {
      if (!hasKey(s) && s.freeLeft <= 0) {
        return { ...s, view: "settings", settingsTab: "keys" };
      }
      const sel = ORDER.filter((id) => s.platforms[id]);
      const first = sel[0] || "linkedin";
      return {
        ...s,
        view: "output",
        slopHard: false,
        softNudge: false,
        generating: true,
        activeTab: first,
        outTitle: s.composeTitle || "Untitled",
        outPlatforms: sel,
        content: {},
        versions: {},
        redditSub: "",
      };
    });

    if (genTimer.current) clearTimeout(genTimer.current);
    genTimer.current = setTimeout(() => {
      setState((s) => {
        const sel = s.outPlatforms;
        const content: Partial<Record<PlatformId, string>> = {};
        const versions: Partial<Record<PlatformId, string[]>> = {};
        sel.forEach((id) => {
          content[id] = SAMPLES[id];
          versions[id] = [SAMPLES[id]];
        });
        return {
          ...s,
          generating: false,
          content,
          versions,
          freeLeft: hasKey(s) ? s.freeLeft : Math.max(0, s.freeLeft - 1),
        };
      });
    }, 1800);
  }, [hasKey]);

  const generate = useCallback(() => {
    const { hard, soft } = thresholds(state.slopStrictness);
    const words = wordCount(state.draft);
    if (state.slopEnabled && (state.draft.trim() === "" || words < hard)) {
      setState((s) => ({
        ...s,
        view: "output",
        slopHard: true,
        generating: false,
        blockedCount: s.blockedCount + 1,
        rejectIdx: (s.rejectIdx + 1) % REJECTS.length,
      }));
      return;
    }
    if (state.slopEnabled && words < soft && !state.softDismissed) {
      patch({ view: "compose", softNudge: true });
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
    patch({ draft: t, composeTitle: title, view: "compose", softNudge: false, softDismissed: false });

    const { hard, soft } = thresholds(state.slopStrictness);
    const words = wordCount(t);
    if (state.slopEnabled && (t.trim() === "" || words < hard)) {
      setState((s) => ({
        ...s,
        view: "output",
        slopHard: true,
        generating: false,
        blockedCount: s.blockedCount + 1,
        rejectIdx: (s.rejectIdx + 1) % REJECTS.length,
      }));
      return;
    }
    if (state.slopEnabled && words < soft && !state.softDismissed) {
      patch({ view: "compose", softNudge: true });
      return;
    }
    runGenerate();
  }, [state, patch, runGenerate]);

  const addDetail = useCallback(() => patch({ softNudge: false }), [patch]);
  const generateAnyway = useCallback(() => {
    patch({ softDismissed: true, softNudge: false });
    runGenerate();
  }, [patch, runGenerate]);

  // ---- output -----------------------------------------------------------
  const backToCompose = useCallback(() => patch({ view: "compose", slopHard: false }), [patch]);
  const selectTab = useCallback(
    (id: PlatformId) => patch({ activeTab: id, historyOpen: false }),
    [patch]
  );
  const onEditContent = useCallback((v: string) => {
    setState((s) => ({ ...s, content: { ...s.content, [s.activeTab]: v } }));
  }, []);
  const onRedditSub = useCallback((v: string) => patch({ redditSub: v }), [patch]);
  const regenerate = useCallback(() => {
    setState((s) => {
      const tab = s.activeTab;
      const cur = s.content[tab];
      const alt = cur === SAMPLES[tab] ? ALTS[tab] : SAMPLES[tab];
      return {
        ...s,
        content: { ...s.content, [tab]: alt },
        versions: { ...s.versions, [tab]: [...(s.versions[tab] || []), alt] },
      };
    });
  }, []);
  const openHistory = useCallback(() => {
    setState((s) => ({ ...s, historyOpen: !s.historyOpen }));
  }, []);
  const restoreVersion = useCallback((tab: PlatformId, text: string) => {
    setState((s) => ({ ...s, content: { ...s.content, [tab]: text }, historyOpen: false }));
  }, []);
  const flash = useCallback((msg: string) => {
    patch({ flashMsg: msg });
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => patch({ flashMsg: "" }), 3200);
  }, [patch]);
  const copyText = useCallback(() => {
    const t = state.content[state.activeTab] || "";
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(t).catch(() => {});
    }
    flash("Copied to clipboard");
  }, [state, flash]);
  const doShare = useCallback(() => {
    const tab = state.activeTab;
    const m = PLAT[tab];
    if (m.share === "prefill") {
      if (m.sub) {
        if (!state.redditSub.trim()) return;
        flash("Opening r/" + state.redditSub.trim() + " with your draft prefilled…");
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
  }, [state, flash]);

  // ---- settings -----------------------------------------------------------
  const setSettingsTab = useCallback((t: SettingsTab) => patch({ settingsTab: t }), [patch]);
  const onKeyInput = useCallback((id: ProviderId, v: string) => {
    setState((s) => ({ ...s, keys: { ...s.keys, [id]: { ...s.keys[id], v } } }));
  }, []);
  const validateKey = useCallback((id: ProviderId) => {
    setState((s) => ({ ...s, keys: { ...s.keys, [id]: { ...s.keys[id], c: true } } }));
  }, []);
  const removeKey = useCallback((id: ProviderId) => {
    setState((s) => ({ ...s, keys: { ...s.keys, [id]: { c: false, v: "" } } }));
  }, []);
  const toggleInstr = useCallback((id: PlatformId) => {
    setState((s) => ({ ...s, instrOpen: s.instrOpen === id ? null : id }));
  }, []);
  const onInstr = useCallback((id: PlatformId, v: string) => {
    setState((s) => ({ ...s, instr: { ...s.instr, [id]: v } }));
  }, []);
  const onVoice = useCallback((v: string) => patch({ voice: v }), [patch]);
  const toggleSlop = useCallback(() => {
    setState((s) => ({ ...s, slopEnabled: !s.slopEnabled }));
  }, []);
  const setSlopStrictness = useCallback(
    (v: SlopStrictness) => patch({ slopStrictness: v }),
    [patch]
  );
  const resetInstrDefaults = useCallback(() => patch({ instr: { ...INSTR_DEFAULTS } }), [patch]);

  // ---- derived (pure data, no styling) ------------------------------------
  const derived = useMemo(() => {
    const S = state;
    const hk = Object.values(S.keys).some((k) => k.c);

    const quotaText = hk
      ? "BYOK · unlimited"
      : `${S.freeLeft} free generation${S.freeLeft === 1 ? "" : "s"} left today`;
    const quotaLow = !hk && S.freeLeft <= 1;

    const hr = new Date().getHours();
    const greeting = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";

    const counts: Record<string, number> = {};
    S.folders.forEach((f) => (counts[f.id] = 0));
    S.posts.forEach((p) => {
      if (p.folder && counts[p.folder] != null) counts[p.folder]++;
    });
    const folderName = (id: string | null) => S.folders.find((f) => f.id === id)?.name ?? null;

    const dashExpanded = S.dashFocused || S.dashDraft.trim() !== "";
    const dashWords = wordCount(S.dashDraft);
    const dashTok = Math.max(0, Math.round(dashWords * 1.4));
    const anySel = ORDER.some((id) => S.platforms[id]);
    const dashCanGen = S.dashDraft.trim() !== "" && anySel;

    const curModel = MODELS.find((m) => m.id === S.model) || MODELS[0];

    const q = S.search.trim().toLowerCase();
    let rows = S.posts;
    if (S.activeFolder) rows = rows.filter((p) => p.folder === S.activeFolder);
    if (q) rows = rows.filter((p) => (p.title + " " + p.snippet).toLowerCase().includes(q));
    const showEmptyAll = S.posts.length === 0;
    const showEmptyFolder = !showEmptyAll && rows.length === 0 && S.activeFolder !== null && !q;
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
      : `You're on the free tier: ${S.freeLeft} generations left today on Claude Sonnet 4.5. Add any key to remove the cap and choose models.`;
    const voiceStatus = S.voice.trim()
      ? `Calibrated on ${wordCount(S.voice)} words of your writing.`
      : "Not calibrated yet — generations use platform defaults.";
    const modelPageNote = hk
      ? "Your global default. Any folder or post can override it."
      : "Free tier is fixed to Claude Sonnet 4.5. Add a key in API keys to unlock the rest.";

    return {
      hasKey: hk,
      quotaText,
      quotaLow,
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
    };
  }, [state]);

  const actions = useMemo(
    () => ({
      goDash,
      goSettings,
      homeClick,
      newPost,
      openPost,
      onSearch,
      selectFolder,
      toggleMove,
      moveTo,
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
      openHistory,
      restoreVersion,
      copyText,
      doShare,
      setSettingsTab,
      onKeyInput,
      validateKey,
      removeKey,
      toggleInstr,
      onInstr,
      onVoice,
      toggleSlop,
      setSlopStrictness,
      resetInstrDefaults,
    }),
    [
      goDash,
      goSettings,
      homeClick,
      newPost,
      openPost,
      onSearch,
      selectFolder,
      toggleMove,
      moveTo,
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
      openHistory,
      restoreVersion,
      copyText,
      doShare,
      setSettingsTab,
      onKeyInput,
      validateKey,
      removeKey,
      toggleInstr,
      onInstr,
      onVoice,
      toggleSlop,
      setSlopStrictness,
      resetInstrDefaults,
    ]
  );

  return { state, derived, actions };
}

export type FacetActions = ReturnType<typeof useFacetController>["actions"];
export type FacetDerived = ReturnType<typeof useFacetController>["derived"];
