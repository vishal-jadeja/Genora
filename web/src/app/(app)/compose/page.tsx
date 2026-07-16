"use client";

import { useGenora } from "@/components/GenoraProvider";
import { ComposeView } from "@/components/ComposeView";

export default function ComposePage() {
  const { state, derived, loading, actions } = useGenora();
  return (
    <ComposeView
      state={state}
      derived={derived}
      loading={loading}
      actions={actions}
    />
  );
}
