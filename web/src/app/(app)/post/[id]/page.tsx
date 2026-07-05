"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGenora } from "@/components/GenoraProvider";
import { OutputView } from "@/components/OutputView";

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, derived, actions } = useGenora();

  useEffect(() => {
    if (state.composePostId === id) return;
    const post = state.posts.find((p) => p.id === id);
    if (!post) {
      router.replace("/drafts");
      return;
    }
    actions.loadPost(id);
  }, [id, state.composePostId, state.posts, actions, router]);

  return <OutputView state={state} derived={derived} actions={actions} />;
}
