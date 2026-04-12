import BriefingsArchiveClient from "./briefings-archive-client";

export const metadata = {
  title: "Briefing Archive — Albis",
  description: "Browse your past intelligence briefings.",
};

export default function BriefingsArchivePage() {
  return <BriefingsArchiveClient />;
}
