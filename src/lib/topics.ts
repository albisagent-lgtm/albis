export interface Topic {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  keywords: string[]; // used to match against scan tags/categories
}

export const TOPICS: Topic[] = [
  { slug: "ukraine", name: "Ukraine", emoji: "", description: "The war in Ukraine and its global ripple effects", keywords: ["ukraine", "kyiv", "zelensky", "donbas", "crimea"] },
  { slug: "russia", name: "Russia", emoji: "", description: "Russian politics, sanctions, and global influence", keywords: ["russia", "moscow", "putin", "kremlin"] },
  { slug: "climate", name: "Climate", emoji: "", description: "Climate change, extreme weather, and environmental policy", keywords: ["climate", "warming", "emissions", "carbon", "weather-climate", "climate-energy"] },
  { slug: "ai", name: "Artificial Intelligence", emoji: "", description: "AI breakthroughs, regulation, and societal impact", keywords: ["ai", "artificial intelligence", "machine learning", "chatgpt", "tech-ai"] },
  { slug: "trade", name: "Trade", emoji: "", description: "Global trade wars, tariffs, and supply chains", keywords: ["trade", "tariff", "sanctions", "export", "import", "economic-flows"] },
  { slug: "energy", name: "Energy", emoji: "", description: "Oil, gas, renewables, and energy security", keywords: ["energy", "oil", "gas", "renewable", "solar", "nuclear power", "climate-energy"] },
  { slug: "health", name: "Health", emoji: "", description: "Global health, pandemics, and medical breakthroughs", keywords: ["health", "pandemic", "vaccine", "disease", "WHO"] },
  { slug: "china", name: "China", emoji: "", description: "China's economy, geopolitics, and global role", keywords: ["china", "beijing", "xi jinping", "taiwan strait"] },
  { slug: "middle-east", name: "Middle East", emoji: "", description: "Conflicts, diplomacy, and transformation in the Middle East", keywords: ["middle east", "gaza", "israel", "iran", "saudi", "syria"] },
  { slug: "africa", name: "Africa", emoji: "", description: "African politics, development, and underreported stories", keywords: ["africa", "african", "sahel", "sub-saharan"] },
  { slug: "economics", name: "Economics", emoji: "", description: "Global economy, inflation, markets, and financial policy", keywords: ["economy", "inflation", "gdp", "recession", "interest rate", "economic-flows"] },
  { slug: "technology", name: "Technology", emoji: "", description: "Tech industry, innovation, and digital transformation", keywords: ["technology", "tech", "startup", "silicon valley", "tech-ai"] },
  { slug: "space", name: "Space", emoji: "", description: "Space exploration, satellites, and the new space race", keywords: ["space", "nasa", "spacex", "satellite", "mars", "moon"] },
  { slug: "oceans", name: "Oceans", emoji: "", description: "Ocean health, marine policy, and maritime disputes", keywords: ["ocean", "sea", "marine", "fishing", "coral", "natural-world"] },
  { slug: "democracy", name: "Democracy", emoji: "", description: "Elections, democratic backsliding, and governance", keywords: ["democracy", "election", "vote", "authoritarian", "protest", "grassroots"] },
  { slug: "migration", name: "Migration", emoji: "", description: "Refugee crises, immigration policy, and displacement", keywords: ["migration", "refugee", "asylum", "border", "immigrant"] },
  { slug: "food-security", name: "Food Security", emoji: "", description: "Global hunger, agriculture, and food supply chains", keywords: ["food", "hunger", "famine", "agriculture", "crop", "grain"] },
  { slug: "cybersecurity", name: "Cybersecurity", emoji: "", description: "Cyber attacks, digital defense, and information warfare", keywords: ["cyber", "hack", "ransomware", "data breach", "cybersecurity"] },
  { slug: "nuclear", name: "Nuclear", emoji: "", description: "Nuclear weapons, energy, and proliferation", keywords: ["nuclear", "atomic", "uranium", "nonproliferation", "warhead"] },
  { slug: "diplomacy", name: "Diplomacy", emoji: "", description: "International relations, treaties, and global cooperation", keywords: ["diplomacy", "treaty", "summit", "UN", "bilateral", "multilateral"] },
  { slug: "media", name: "Media", emoji: "", description: "Press freedom, misinformation, and media landscape", keywords: ["media", "press", "journalism", "misinformation", "censorship", "psychology-persuasion"] },
  { slug: "education", name: "Education", emoji: "", description: "Global education trends, policy, and access", keywords: ["education", "school", "university", "literacy", "student"] },
  { slug: "cryptocurrency", name: "Cryptocurrency", emoji: "", description: "Crypto markets, blockchain, and digital finance regulation", keywords: ["crypto", "bitcoin", "blockchain", "ethereum", "defi"] },
  { slug: "water", name: "Water", emoji: "", description: "Water scarcity, infrastructure, and transboundary disputes", keywords: ["water", "drought", "dam", "freshwater", "desalination"] },
  { slug: "biodiversity", name: "Biodiversity", emoji: "", description: "Species loss, conservation, and ecosystem protection", keywords: ["biodiversity", "species", "extinction", "conservation", "wildlife", "natural-world"] },
  { slug: "information-warfare", name: "Information Warfare", emoji: "", description: "How information is weaponised — deepfakes, censorship, propaganda, platform manipulation, and the mechanisms that shape what we see and believe.", keywords: ["information-warfare", "deepfake", "censorship", "propaganda", "disinformation", "surveillance", "info-ops", "platform-manipulation", "information warfare"] },
  { slug: "womens-rights", name: "Women's Rights & Equality", emoji: "", description: "How women's rights, gender equality, and equal receivership are covered, framed, and experienced differently across the world.", keywords: ["womens-rights", "gender-equality", "femicide", "forced-marriage", "reproductive-rights", "gender-pay-gap", "women-in-conflict", "women's rights", "gender equality", "domestic violence", "abortion law", "workplace equality"] },
];

export function getTopicBySlug(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}

export function matchTopicToScanItem(topic: Topic, tags: string[], category: string): boolean {
  const lowerTags = tags.map((t) => t.toLowerCase());
  const lowerCategory = category.toLowerCase();
  return topic.keywords.some(
    (kw) =>
      lowerTags.some((t) => t.includes(kw)) ||
      lowerCategory.includes(kw)
  );
}
