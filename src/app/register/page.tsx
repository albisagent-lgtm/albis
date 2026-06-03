import type { Metadata } from "next";
import RegisterClient from "./register-client";

export const metadata: Metadata = {
  title: "Create your Albis account",
  description:
    "Create a free Albis account for the public feed, conversations, saved stories, and context sharing.",
};

export default function RegisterPage() {
  return <RegisterClient />;
}
