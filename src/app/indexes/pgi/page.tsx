import type { Metadata } from "next";
import { PGIClient } from "../../perception-gap/pgi-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Perception Gap Index | Albis",
  description: "How differently does the world understand the same events? The PGI measures narrative distance across regions — updated 3x daily.",
};

export default function PGIPage() {
  return <PGIClient />;
}
