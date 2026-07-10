import type { Metadata } from "next";
import { SignInPage } from "@/components/landing/SignInPage";
import { signInWithGitHub, signInWithGoogle } from "./actions";

export const metadata: Metadata = {
  title: "Sign in — Genora",
  alternates: { canonical: "/signin" },
};

// The raw searchParam is user-controlled — only forward same-origin
// relative paths to next-auth's redirectTo, otherwise callbackUrl becomes
// an open-redirect vector (e.g. ?callbackUrl=https://evil.example).
function safeCallbackUrl(raw: string | undefined): string | undefined {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return undefined;
  return raw;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;
  const message = error ? "Could not sign in — try again." : null;
  const target = safeCallbackUrl(callbackUrl);

  const actions = {
    google: signInWithGoogle.bind(null, target),
    github: signInWithGitHub.bind(null, target),
  };

  return <SignInPage actions={actions} error={message} />;
}
