"use client";

import { useGenora } from "@/components/GenoraProvider";
import { SettingsModal } from "@/components/SettingsModal";

export default function InterceptedSettingsPage() {
  const { state, derived, loading, actions } = useGenora();
  return (
    <SettingsModal
      state={state}
      derived={derived}
      loading={loading}
      actions={actions}
    />
  );
}
