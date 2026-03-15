import { redirect } from "next/navigation";
import { PILLARS, type PillarSlug } from "@/lib/pillars";

interface PillarPageProps {
  params: { pillar: string };
}

export async function generateStaticParams() {
  return Object.keys(PILLARS).map((pillar) => ({
    pillar,
  }));
}

export default function PillarPage({ params }: PillarPageProps) {
  // Redirect to The Lens with pillar filter
  if (Object.keys(PILLARS).includes(params.pillar)) {
    redirect(`/lens?pillar=${params.pillar}`);
  }
  
  // If invalid pillar, redirect to The Lens home
  redirect("/lens");
}