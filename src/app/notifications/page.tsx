import type { Metadata } from "next";
import { NotificationsTab } from "../components/notifications-tab";

export const metadata: Metadata = {
  title: "Notifications | Albis",
  description: "Replies, follows, and account activity on Albis.",
};

export default function NotificationsPage() {
  return <NotificationsTab />;
}
