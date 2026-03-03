import type { Metadata } from "next";
import { PGIClient } from "./pgi-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Perception Gap Index — Albis",
  description: "How differently does the world understand the same events? The PGI measures narrative distance across regions — updated 3× daily.",
};

export default function PerceptionGapPage() {
  return <PGIClient />;
}
