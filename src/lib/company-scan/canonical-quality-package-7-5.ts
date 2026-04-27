// ---------------------------------------------------------------------------
// Package 7.5 — Canonical Quality data pack.
//
// This is intentionally curated rather than creative. It encodes known
// synonyms, official names, common shorthand, translations, and routing fixes
// so Package 8 starts from a balanced signal pool instead of alias luck.
// ---------------------------------------------------------------------------

import type { CanonicalTopicType } from "../canonical-resolver";

export type CanonicalAliasType =
  | "synonym"
  | "translation"
  | "abbreviation"
  | "related_entity";

export interface CanonicalAliasSpec {
  alias: string;
  language?: string | null;
  type?: CanonicalAliasType;
  confidence?: number;
}

export interface CanonicalUpsertSpec {
  canonical_label: string;
  topic_type: CanonicalTopicType;
  short_description?: string;
  priority_tier?: 1 | 2 | 3;
  /** Optional broader context. Customer-requested terms keep direct scan identity; parent_id adds context. */
  parent_label?: string;
  parent_type?: CanonicalTopicType;
  aliases: CanonicalAliasSpec[];
}

export interface CanonicalFoldSpec {
  from_label: string;
  from_type?: CanonicalTopicType;
  to_label: string;
  to_type: CanonicalTopicType;
  alias_language?: string | null;
  alias_type?: CanonicalAliasType;
  confidence?: number;
  reason: string;
}

export const PACKAGE_7_5_CANONICAL_UPSERTS: CanonicalUpsertSpec[] = [
  {
    canonical_label: "India",
    topic_type: "entity",
    short_description: "Republic of India — government, policy, economy, and regional influence.",
    priority_tier: 1,
    aliases: [
      { alias: "Bharat", language: "en", type: "synonym" },
      { alias: "Republic of India", language: "en", type: "synonym" },
      { alias: "New Delhi", language: "en", type: "related_entity", confidence: 0.82 },
      { alias: "Modi", language: "en", type: "related_entity", confidence: 0.72 },
      { alias: "Narendra Modi", language: "en", type: "related_entity", confidence: 0.78 },
      { alias: "भारत", language: "hi", type: "translation" },
      { alias: "इंडिया", language: "hi", type: "translation" },
      { alias: "Inde", language: "fr", type: "translation" },
      { alias: "印度", language: "zh", type: "translation" },
      { alias: "インド", language: "ja", type: "translation" },
      { alias: "الهند", language: "ar", type: "translation" },
    ],
  },
  {
    canonical_label: "Saudi Arabia",
    topic_type: "entity",
    short_description: "Kingdom of Saudi Arabia — government, energy policy, investment, and regional role.",
    priority_tier: 1,
    aliases: [
      { alias: "KSA", language: "en", type: "abbreviation" },
      { alias: "Saudi", language: "en", type: "synonym" },
      { alias: "Kingdom of Saudi Arabia", language: "en", type: "synonym" },
      { alias: "Riyadh", language: "en", type: "related_entity", confidence: 0.82 },
      { alias: "MBS", language: "en", type: "related_entity", confidence: 0.76 },
      { alias: "Mohammed bin Salman", language: "en", type: "related_entity", confidence: 0.78 },
      { alias: "السعودية", language: "ar", type: "translation" },
      { alias: "المملكة العربية السعودية", language: "ar", type: "translation" },
      { alias: "沙特阿拉伯", language: "zh", type: "translation" },
      { alias: "Arabie saoudite", language: "fr", type: "translation" },
    ],
  },
  {
    canonical_label: "Strait of Hormuz",
    topic_type: "route",
    short_description: "Critical maritime chokepoint between the Persian Gulf and the Gulf of Oman.",
    priority_tier: 1,
    aliases: [
      { alias: "Hormuz Strait", language: "en", type: "synonym" },
      { alias: "Hormuz", language: "en", type: "synonym" },
      { alias: "Persian Gulf chokepoint", language: "en", type: "synonym" },
      { alias: "Gulf chokepoint", language: "en", type: "synonym" },
      { alias: "تنگه هرمز", language: "fa", type: "translation" },
      { alias: "مضيق هرمز", language: "ar", type: "translation" },
      { alias: "霍尔木兹海峡", language: "zh", type: "translation" },
    ],
  },
  {
    canonical_label: "Suez Canal",
    topic_type: "route",
    short_description: "Egyptian maritime canal linking the Mediterranean and Red Sea; core global shipping route.",
    priority_tier: 1,
    aliases: [
      { alias: "Suez", language: "en", type: "synonym" },
      { alias: "Suez Canal Authority", language: "en", type: "related_entity" },
      { alias: "SCA", language: "en", type: "abbreviation" },
      { alias: "قناة السويس", language: "ar", type: "translation" },
      { alias: "คลองสุเอซ", language: "th", type: "translation" },
      { alias: "苏伊士运河", language: "zh", type: "translation" },
    ],
  },
  {
    canonical_label: "Red Sea",
    topic_type: "route",
    short_description: "Red Sea and Bab el-Mandeb shipping corridor, including security and rerouting risk.",
    priority_tier: 1,
    aliases: [
      { alias: "Red Sea routes", language: "en", type: "synonym" },
      { alias: "Red Sea shipping", language: "en", type: "synonym" },
      { alias: "Red Sea attacks", language: "en", type: "synonym" },
      { alias: "Bab el-Mandeb", language: "en", type: "related_entity" },
      { alias: "Bab-el-Mandeb", language: "en", type: "related_entity" },
      { alias: "البحر الأحمر", language: "ar", type: "translation" },
      { alias: "باب المندب", language: "ar", type: "translation" },
      { alias: "红海", language: "zh", type: "translation" },
    ],
  },
  {
    canonical_label: "Shipping disruption",
    topic_type: "theme",
    short_description: "Disruptions to maritime, port, freight, or container logistics.",
    priority_tier: 1,
    aliases: [
      { alias: "port disruption", language: "en", type: "synonym" },
      { alias: "freight disruption", language: "en", type: "synonym" },
      { alias: "supply chain disruption", language: "en", type: "synonym" },
      { alias: "container shortage", language: "en", type: "synonym" },
      { alias: "container shortages", language: "en", type: "synonym" },
      { alias: "container imbalance", language: "en", type: "synonym" },
      { alias: "container repositioning", language: "en", type: "synonym" },
      { alias: "box shortage", language: "en", type: "synonym" },
      { alias: "TEU shortage", language: "en", type: "synonym" },
      { alias: "port congestion", language: "en", type: "synonym" },
      { alias: "shipping blockages", language: "en", type: "synonym" },
      { alias: "blockages", language: "en", type: "synonym", confidence: 0.7 },
      { alias: "航运中断", language: "zh", type: "translation" },
      { alias: "اضطراب الشحن", language: "ar", type: "translation" },
      { alias: "perturbation du transport maritime", language: "fr", type: "translation" },
    ],
  },
  {
    canonical_label: "Press freedom",
    topic_type: "theme",
    short_description: "Media freedom, journalist safety, censorship, and legal pressure on reporting.",
    priority_tier: 2,
    aliases: [
      { alias: "media freedom", language: "en", type: "synonym" },
      { alias: "freedom of the press", language: "en", type: "synonym" },
      { alias: "journalist safety", language: "en", type: "synonym" },
      { alias: "press restrictions", language: "en", type: "synonym" },
      { alias: "censorship", language: "en", type: "synonym" },
      { alias: "RSF", language: "en", type: "related_entity" },
      { alias: "Reporters Without Borders", language: "en", type: "related_entity" },
      { alias: "CPJ", language: "en", type: "related_entity" },
      { alias: "Committee to Protect Journalists", language: "en", type: "related_entity" },
      { alias: "liberté de la presse", language: "fr", type: "translation" },
      { alias: "حرية الصحافة", language: "ar", type: "translation" },
      { alias: "新闻自由", language: "zh", type: "translation" },
    ],
  },
  {
    canonical_label: "Media regulation",
    topic_type: "theme",
    short_description: "Rules governing media, platforms, broadcasting, online safety, and information distribution.",
    priority_tier: 2,
    aliases: [
      { alias: "media policy", language: "en", type: "synonym" },
      { alias: "broadcasting regulation", language: "en", type: "synonym" },
      { alias: "platform regulation", language: "en", type: "synonym" },
      { alias: "internet regulation", language: "en", type: "synonym" },
      { alias: "Online Safety Act", language: "en", type: "related_entity" },
      { alias: "Ofcom", language: "en", type: "related_entity" },
      { alias: "digital services regulation", language: "en", type: "synonym" },
      { alias: "régulation des médias", language: "fr", type: "translation" },
      { alias: "تنظيم الإعلام", language: "ar", type: "translation" },
      { alias: "媒体监管", language: "zh", type: "translation" },
    ],
  },
  {
    canonical_label: "Geopolitics",
    topic_type: "theme",
    priority_tier: 2,
    aliases: [
      { alias: "geopolitical tensions", language: "en", type: "synonym" },
      { alias: "international relations", language: "en", type: "synonym" },
      { alias: "global affairs", language: "en", type: "synonym" },
      { alias: "foreign policy", language: "en", type: "synonym" },
    ],
  },
  {
    canonical_label: "Iran",
    topic_type: "entity",
    priority_tier: 1,
    aliases: [
      { alias: "Tehran", language: "en", type: "related_entity", confidence: 0.82 },
      { alias: "Islamic Republic of Iran", language: "en", type: "synonym" },
      { alias: "Iranian regime", language: "en", type: "synonym" },
      { alias: "IRGC", language: "en", type: "related_entity" },
      { alias: "Revolutionary Guards", language: "en", type: "related_entity" },
      { alias: "Khamenei", language: "en", type: "related_entity", confidence: 0.74 },
      { alias: "Masoud Pezeshkian", language: "en", type: "related_entity", confidence: 0.7 },
      { alias: "ایران", language: "fa", type: "translation" },
      { alias: "إيران", language: "ar", type: "translation" },
      { alias: "伊朗", language: "zh", type: "translation" },
    ],
  },
  {
    canonical_label: "European Union",
    topic_type: "institution",
    priority_tier: 1,
    aliases: [
      { alias: "EU", language: "en", type: "abbreviation" },
      { alias: "Brussels", language: "en", type: "related_entity", confidence: 0.78 },
      { alias: "European Commission", language: "en", type: "related_entity" },
      { alias: "European Council", language: "en", type: "related_entity" },
      { alias: "EU institutions", language: "en", type: "synonym" },
      { alias: "Union européenne", language: "fr", type: "translation" },
      { alias: "Europäische Union", language: "de", type: "translation" },
      { alias: "Unión Europea", language: "es", type: "translation" },
      { alias: "الاتحاد الأوروبي", language: "ar", type: "translation" },
      { alias: "欧盟", language: "zh", type: "translation" },
    ],
  },
  {
    canonical_label: "Media / Publishing / Advertising",
    topic_type: "sector",
    short_description: "Media, publishing, communications, advertising, journalism, and information businesses.",
    priority_tier: 2,
    aliases: [
      { alias: "media-publishing", language: "en", type: "synonym" },
      { alias: "media-comms", language: "en", type: "synonym" },
      { alias: "media communications", language: "en", type: "synonym" },
      { alias: "publishing", language: "en", type: "synonym" },
      { alias: "advertising", language: "en", type: "synonym" },
    ],
  },

  {
    canonical_label: "Wang Yi",
    topic_type: "entity",
    short_description: "Chinese foreign-policy official tracked as a direct entity, with China as parent context.",
    priority_tier: 2,
    parent_label: "China",
    parent_type: "entity",
    aliases: [
      { alias: "Wang Yi", language: "en", type: "synonym" },
      { alias: "王毅", language: "zh", type: "translation" },
      { alias: "Chinese foreign minister", language: "en", type: "related_entity", confidence: 0.76 },
      { alias: "Foreign Minister Wang", language: "en", type: "related_entity", confidence: 0.76 },
    ],
  },
  {
    canonical_label: "Kim Il Sung",
    topic_type: "entity",
    short_description: "North Korean leadership/historical figure preserved as a direct tracked entity with North Korea parent context.",
    priority_tier: 3,
    parent_label: "North Korea",
    parent_type: "entity",
    aliases: [
      { alias: "Kim Il Sung", language: "en", type: "synonym" },
      { alias: "김일성", language: "ko", type: "translation" },
      { alias: "金日成", language: "zh", type: "translation" },
    ],
  },
  {
    canonical_label: "Kim Jong Il",
    topic_type: "entity",
    short_description: "North Korean leadership/historical figure preserved as a direct tracked entity with North Korea parent context.",
    priority_tier: 3,
    parent_label: "North Korea",
    parent_type: "entity",
    aliases: [
      { alias: "Kim Jong Il", language: "en", type: "synonym" },
      { alias: "김정일", language: "ko", type: "translation" },
      { alias: "金正日", language: "zh", type: "translation" },
    ],
  },
  {
    canonical_label: "Kim Yo Jong",
    topic_type: "entity",
    short_description: "North Korean political figure preserved as a direct tracked entity with North Korea parent context.",
    priority_tier: 2,
    parent_label: "North Korea",
    parent_type: "entity",
    aliases: [
      { alias: "Kim Yo Jong", language: "en", type: "synonym" },
      { alias: "김여정", language: "ko", type: "translation" },
      { alias: "金与正", language: "zh", type: "translation" },
    ],
  },
  {
    canonical_label: "Kim Yong Nam",
    topic_type: "entity",
    short_description: "North Korean political figure preserved as a direct tracked entity with North Korea parent context.",
    priority_tier: 3,
    parent_label: "North Korea",
    parent_type: "entity",
    aliases: [
      { alias: "Kim Yong Nam", language: "en", type: "synonym" },
      { alias: "김영남", language: "ko", type: "translation" },
    ],
  },
  {
    canonical_label: "Container shortages",
    topic_type: "theme",
    short_description: "Container availability, imbalance, repositioning, TEU shortages, and box shortage signals preserved as direct customer intent.",
    priority_tier: 2,
    parent_label: "Shipping disruption",
    parent_type: "theme",
    aliases: [
      { alias: "container shortages", language: "en", type: "synonym" },
      { alias: "container shortage", language: "en", type: "synonym" },
      { alias: "container imbalance", language: "en", type: "synonym" },
      { alias: "container repositioning", language: "en", type: "synonym" },
      { alias: "box shortage", language: "en", type: "synonym" },
      { alias: "TEU shortage", language: "en", type: "synonym" },
    ],
  },
  {
    canonical_label: "Blockages",
    topic_type: "theme",
    short_description: "Operational blockages preserved as direct customer shorthand, with Shipping disruption as parent context.",
    priority_tier: 3,
    parent_label: "Shipping disruption",
    parent_type: "theme",
    aliases: [
      { alias: "blockages", language: "en", type: "synonym" },
      { alias: "shipping blockages", language: "en", type: "synonym", confidence: 0.82 },
      { alias: "logistics blockages", language: "en", type: "synonym", confidence: 0.78 },
    ],
  },

  {
    canonical_label: "China",
    topic_type: "entity",
    priority_tier: 1,
    aliases: [
      { alias: "Wang Yi", language: "en", type: "related_entity", confidence: 0.72 },
      { alias: "Li Qiang", language: "en", type: "related_entity", confidence: 0.72 },
      { alias: "Han Zheng", language: "en", type: "related_entity", confidence: 0.7 },
      { alias: "Beijing", language: "en", type: "related_entity", confidence: 0.82 },
      { alias: "中国", language: "zh", type: "translation" },
      { alias: "中國", language: "zh", type: "translation" },
    ],
  },
  {
    canonical_label: "North Korea",
    topic_type: "entity",
    priority_tier: 1,
    aliases: [
      { alias: "DPRK", language: "en", type: "abbreviation" },
      { alias: "Pyongyang", language: "en", type: "related_entity" },
      { alias: "Kim Il Sung", language: "en", type: "related_entity", confidence: 0.74 },
      { alias: "Kim Jong Il", language: "en", type: "related_entity", confidence: 0.74 },
      { alias: "Kim Yo Jong", language: "en", type: "related_entity", confidence: 0.76 },
      { alias: "Kim Yong Nam", language: "en", type: "related_entity", confidence: 0.7 },
      { alias: "Kim Jong Un", language: "en", type: "related_entity" },
      { alias: "DPRK leadership", language: "en", type: "synonym" },
      { alias: "North Korean regime", language: "en", type: "synonym" },
      { alias: "조선민주주의인민공화국", language: "ko", type: "translation" },
      { alias: "북한", language: "ko", type: "translation" },
      { alias: "北朝鮮", language: "ja", type: "translation" },
      { alias: "朝鲜民主主义人民共和国", language: "zh", type: "translation" },
    ],
  },
];

export const PACKAGE_7_5_CANONICAL_FOLDS: CanonicalFoldSpec[] = [
  // Intentionally empty after the direct-intent revision.
  // Customer-requested terms keep their own active canonical rows and gain
  // parent context via parent_id instead of being folded/deactivated.
];

export const PACKAGE_7_5_PROFILE_DEDUPES = [
  {
    company_name: "Test Company",
    array_fields: ["tracked_themes"] as const,
    reason: "Remove duplicate freeform/slug values such as freight rates/freight-rates before remapping canonicals.",
  },
];
