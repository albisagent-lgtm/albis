import CoverageClient from "./coverage-client";

export const metadata = {
  title: "Coverage — Albis",
  description: "What was checked today across your tracked priorities.",
};

export default function CoveragePage() {
  return <CoverageClient />;
}
