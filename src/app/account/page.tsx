import type { Metadata } from "next";
import AccountClient from "./account-client";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your Albis subscription and account settings.",
};

export default function AccountPage() {
  return <AccountClient />;
}
