import type { Metadata } from "next";
import { SignInPage } from "@/components/landing/SignInPage";
import { signInWithGitHub, signInWithGoogle } from "./actions";

export const metadata: Metadata = {
  title: "Sign in — Genora",
  alternates: { canonical: "/signin" },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error ? "Could not sign in — try again." : null;

  const actions = {
    google: signInWithGoogle,
    github: signInWithGitHub,
  };

  return <SignInPage actions={actions} error={message} />;
}
