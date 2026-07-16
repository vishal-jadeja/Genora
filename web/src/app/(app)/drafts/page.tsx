"use client";

import { useGenora } from "@/components/GenoraProvider";
import { DraftsView } from "@/components/DraftsView";

export default function DraftsPage() {
  const { state, derived, loading, actions } = useGenora();
  return (
    <DraftsView
      state={state}
      derived={derived}
      loading={loading}
      actions={actions}
    />
  );
}
