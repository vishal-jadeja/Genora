"use client";

import { useGenora } from "@/components/GenoraProvider";
import { SettingsModal } from "@/components/SettingsModal";

export default function SettingsPage() {
  const { state, derived, actions } = useGenora();
  return <SettingsModal state={state} derived={derived} actions={actions} />;
}
