"use server";

import { signIn } from "@/auth";

export async function signInWithGoogle(callbackUrl?: string) {
  await signIn("google", { redirectTo: callbackUrl || "/dashboard" });
}

export async function signInWithGitHub(callbackUrl?: string) {
  await signIn("github", { redirectTo: callbackUrl || "/dashboard" });
}
