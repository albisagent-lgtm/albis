import type { Metadata } from "next";
import ResetConfirmClient from "./reset-confirm-client";

export const metadata: Metadata = {
  title: "Set New Password",
  description: "Set a new password for your Albis account.",
};

export default function ResetConfirmPage() {
  return <ResetConfirmClient />;
}
