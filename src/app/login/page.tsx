import type { Metadata } from "next";
import LoginClient from "./login-client";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Albis account and access your personalised news briefing.",
};

export default function LoginPage() {
  return <LoginClient />;
}
