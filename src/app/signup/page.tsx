import type { Metadata } from "next";
import SignupClient from "./signup-client";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create your free Albis account. Choose your topics and regions to get a personalised daily news briefing.",
};

export default function SignupPage() {
  return <SignupClient />;
}
