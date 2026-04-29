import BriefingsArchiveClient from "./briefings-archive-client";

export const metadata = {
  title: "Daily Scan Archive — Albis",
  description: "Browse your past company daily scans.",
};

export default function BriefingsArchivePage() {
  return <BriefingsArchiveClient />;
}
