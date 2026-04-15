# Onboarding Redesign Research — Structured Dropdowns

**Date:** 2026-04-13
**Status:** Reference document — no code or product changes
**Purpose:** Foundation for redesigning `/onboarding/company` from free-text inputs to structured dropdown selections.

---

## TL;DR

1. **Use searchable multi-select dropdowns (combobox pattern)** for themes, watchlist, and supply chain — not free text, not plain selects. This pattern is the W3C-recommended UX for 6+ options and is what LinkedIn Sales Navigator uses.

2. **Cascade sector → suggested themes/entities/risks.** When the user picks a sector, pre-select a sensible default set but let them override. This removes cognitive load without locking them in.

3. **Every dropdown option must map to at least one real scan tag.** The relevance engine only matches against tags that appear in scan output. I pulled 200 tags from the actual scan_items + scans.items data — the top 60 covers most of the scan signal. Dropdown taxonomy must be anchored in this.

4. **Critical finding: scan tags have inconsistent casing** (e.g. `iran` 54× vs `Iran` 12×, `ai` 32× vs `AI` 11×). Dropdown values must be lowercase to match canonical form. The relevance engine already lowercases both sides, so this works — but dropdown → scan-tag mapping must use lowercase throughout.

5. **Gaps exist.** Several "obvious" sector themes (e.g. "freight rates", "port disruption", "fertiliser prices") are NOT in current scan tags. Either we expand the scan prompt to emit these, or the dropdowns only offer themes we can actually match.

---

# PART 1 — UX Research

## 1A. Why free text is wrong for this product

The current onboarding uses free-text tag inputs (press Enter to add). This is the right pattern for Gmail recipients but wrong for structured taxonomy because:

- **Ambiguity:** users type `shipping`, `shipping routes`, `maritime shipping`, `sea shipping` — the relevance engine treats all four as separate tokens and fuzzy-matches only approximately.
- **Discovery failure:** users don't know what's in the scan data, so they type themes the scan never tags. Their briefing then scores poorly and they churn.
- **Lack of expert input:** a user who doesn't know a sector well can't construct a good tracker. A logistics ops manager probably knows to track "hormuz" and "red sea", but a marketing director at the same company doesn't.
- **HubSpot's own warning:** free-text in one system mapped to dropdown in another produces "errors, failed syncs, or values that make no sense to users on either side" ([HubSpot community](https://community.hubspot.com/t5/Lead-Capture-Tools/Field-Mapping-amp-SalesForce/m-p/904822)).

## 1B. The correct pattern — searchable multi-select combobox

W3C's ARIA Authoring Practices Guide recommends the **combobox** pattern for any list over 6 options. Key rules:

- Clear persistent label even when closed
- Type-to-filter search
- Show all options on click (don't hide until the user types)
- Support keyboard navigation (↑/↓, Enter to select, Esc to close)
- Display selected items as removable pills/chips below or inside the input
- For 7+ options, include "Select all" / "Clear all" controls

For large lists (200+ items), combobox is faster than plain select because filtering narrows the cognitive surface.

Source: [W3C Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/), [Smashing Magazine — Combobox vs Multiselect](https://www.smashingmagazine.com/2026/02/combobox-vs-multiselect-vs-listbox/), [USWDS Combo Box](https://designsystem.digital.gov/components/combo-box/).

## 1C. Cascading selection — how LinkedIn and Salesforce do it

LinkedIn Sales Navigator uses a **hierarchical taxonomy with 20 sectors → 152 industries → 137 specialties**. When a user picks the sector, Sales Navigator narrows the subsequent dropdowns to that sector's subcategories. Key design choices:

- **Hierarchy is visible.** Users see their path (Sector > Industry > Specialty).
- **Multi-select at every level.** A fintech-and-logistics company can pick both parents.
- **No hard limits on multi-select.** Users pick "each relevant sub-industry individually rather than just the top-level sector".
- **Browse OR search.** Users can click-expand the tree OR type to search across all levels.

Source: [LinkedIn Industries List 2026](https://evaboot.com/blog/linkedin-sales-navigator-industries-list), [LinkedIn Sales Navigator Industries (Powerin)](https://www.powerin.io/blog/linkedin-sales-navigator-industries-list).

**Application to Albis:** The cascade is `sector → themes + watchlist + supply_chain + risks`. When a user picks "Energy / Utilities", the theme dropdown opens with sector-relevant themes pre-surfaced at the top ("oil prices", "opec", "renewable energy", "grid stability"), but the user can still scroll or search to add anything else.

## 1D. Multi-step form best practices

Multi-step forms out-convert single-page forms for onboarding. Key mechanics ([Venture Harbour — Form Design 2026](https://ventureharbour.com/form-design-best-practices/), [Formbricks](https://formbricks.com/blog/user-onboarding-best-practices)):

- **Sunk cost fallacy:** users are more likely to finish later steps once they've invested in earlier ones.
- **Endowed progress effect:** a progress bar that shows "2 of 6" converts better than one with no indicator.
- **Start easy, end sensitive.** Put low-friction fields (company name, sector) first. Email delivery preferences last.
- **Save state per step.** If they bail at step 4, they return to step 4, not step 1.

Our current 6-step wizard already follows these. The redesign keeps the steps and upgrades the inputs.

## 1E. Dropdown UX specifics

From [Eleken — Dropdown UI](https://www.eleken.co/blog-posts/dropdown-menu-ui), [USWDS Combo Box](https://designsystem.digital.gov/components/combo-box/):

- **Dropdown above select when option count > 6.** Below that, radio buttons/checkboxes are faster.
- **Show open/closed/filled states visually** with caret direction and border styling.
- **Never use a dropdown for 2-3 options.** Use toggle buttons or radio buttons.
- **Mobile: tap targets ≥ 44px** (already our convention).

For Albis specifically:

| Field | Option count | Recommended UI |
|---|---|---|
| Sector | 16 | Grid of coloured toggle buttons (current) — keep it |
| Sub-sector | Free text, optional | Keep as text input |
| Regions | 11 | Pill toggle buttons (current) — keep |
| Countries | 215 | **Searchable combobox multi-select** (current country search is good, but make it a proper combobox) |
| Tracked themes | Needs to become ~150 sector-filtered | **Searchable combobox multi-select with sector-cascade suggestions** |
| Watchlist entities | ~300 (countries + orgs + people) | **Searchable combobox multi-select with category grouping** |
| Supply chain exposure | ~100 | **Searchable combobox multi-select** |
| Risk priorities | 12 | Toggle buttons (current) — keep, but pre-select sector defaults |
| Briefing depth | 3 | Radio cards (current) — keep |
| Delivery time | 11 | Select (current) — keep |
| Timezone | 600+ | Keep as select (native browser timezone list is fine) |

## 1F. The core UX recommendation

Keep the 6-step wizard structure. Replace three fields with smart combobox multi-selects:

1. **Tracked themes** → combobox with sector-cascaded suggestions, searchable against full catalogue
2. **Watchlist entities** → combobox grouped by category (Countries, Organisations, People, Companies), searchable
3. **Supply chain exposure** → combobox grouped by category (Routes, Commodities, Inputs, Ports), searchable

Keep sector as the coloured-button grid (it reads as a landing/anchor choice, not a dropdown). When sector is picked, pre-populate the themes/watchlist/supply chain/risks with sensible defaults the user can then edit.

---

# PART 2 — Sector Taxonomies

Each sector has four components:
- **Themes** — topics the user wants their briefing to prioritise
- **Watchlist entities** — specific competitors/orgs/people/places to monitor
- **Supply chain exposure** — commodities, routes, inputs, dependencies
- **Risk priority defaults** — which of the 12 risk categories to pre-select

The scan-tag-match column indicates whether the theme appears in our top 200 scan tags (pulled from live data on 2026-04-13):
- **✅** = exact match present (relevance engine will score on it)
- **~** = partial/fuzzy match present (relevance engine will score approximately)
- **❌** = no match — scan data doesn't currently produce this tag

---

## 2.1 Logistics / Shipping / Freight

**Themes (top 15)**
| Theme | Scan match |
|---|---|
| shipping | ✅ shipping (10) |
| supply-chain | ✅ supply-chain (18) |
| hormuz | ✅ hormuz (17) |
| sanctions | ✅ sanctions (8) |
| tariffs | ✅ tariffs (25) |
| trade-war | ✅ trade-war (8) |
| export-controls | ✅ export-controls (4) |
| oil-prices | ✅ oil-prices (6) |
| fuel | ✅ fuel (6) |
| infrastructure | ✅ infrastructure (8) |
| strikes | ✅ strikes (6) |
| logistics | ✅ logistics (5) |
| airlines | ✅ airlines (5) |
| red-sea | ❌ (no tag) — propose adding to scan prompt |
| freight-rates | ❌ (no tag) — propose adding |

**Watchlist entities**
- Countries (14): iran, russia, ukraine, china, us, uk, eu, hormuz, saudi-arabia, uae, turkey, yemen, houthi-area, panama
- Organisations: opec, imo (maritime org), wto, ilo
- Companies: maersk, msc, evergreen, cosco — ❌ not currently in scan tags
- Key people: trump, putin

**Supply chain exposure**
- Routes: hormuz (✅), suez (❌), panama-canal (❌), red-sea (❌), strait-of-malacca (❌)
- Commodities: oil (✅), fuel (✅), containers (❌), bunker-fuel (❌)
- Inputs: diesel (❌), crew/labour (✅ via labor-workforce)
- Ports: (❌ — no specific port tags in current scan)

**Risk priority defaults (pre-select top 5)**
- supply-chain-disruption, commodity-price-volatility, geopolitical-conflict, trade-tariff-sanctions, energy-price

**Gap note:** The industry-standard logistics vocabulary (freight rates, port disruption, bunker fuel, suez/panama/malacca, container shortages) is largely missing from scan tags. Either expand the scan prompt to emit these when relevant, or restrict the logistics theme dropdown to the 13 matchable themes. Recommend expanding the scan prompt.

Source: [Aon — Top Risks Facing Transportation and Logistics](https://www.aon.com/en/insights/reports/global-risk-management-survey/industry-insights/top-risks-facing-transportation-and-logistics-organizations), [Xeneta — Biggest Supply Chain Risks](https://www.xeneta.com/blog/the-biggest-global-supply-chain-risks-of-2025).

---

## 2.2 Food / Agriculture / FMCG

**Themes (top 15)**
| Theme | Scan match |
|---|---|
| food-security | ✅ food-security (12) |
| famine | ✅ famine (6) |
| hunger | ✅ hunger (6) |
| agriculture | ✅ agriculture (9) |
| drought | ✅ drought (16) |
| flooding | ✅ flooding (24) |
| extreme-weather | ✅ extreme-weather (29) |
| climate | ✅ climate (27) |
| fertilizer | ✅ fertilizer (4) |
| wfp | ✅ wfp (4) |
| el-nino | ✅ el-nino (8) |
| heatwave | ✅ heatwave (5) |
| sanctions | ✅ sanctions (8) |
| trade | ✅ trade (29) |
| export-controls | ✅ export-controls (4) |

**Watchlist entities**
- Countries: india, brazil, us, china, russia, ukraine, sahel countries, egypt, nigeria, bangladesh
- Organisations: wfp (World Food Programme), fao, usda
- Commodities as entities: wheat, rice, corn, soy, palm-oil, cocoa, coffee, sugar (❌ most not currently tagged)

**Supply chain exposure**
- Commodities: wheat (❌), corn (❌), rice (❌), fertilizer (✅), coffee (❌), cocoa (❌)
- Inputs: fertilizer (✅), water, seeds, pesticides (❌)
- Weather dependencies: drought (✅), flooding (✅), heatwave (✅), el-nino (✅)
- Trade routes: black-sea (❌), hormuz (✅, fertiliser passes through)

**Risk priority defaults**
- food-water-security, climate-environmental, commodity-price-volatility, supply-chain-disruption, geopolitical-conflict

**Gap note:** Specific crop commodities (wheat, corn, rice, cocoa, coffee) are business-critical for this sector but not in current scan tags. Recommend expanding scan prompt to include commodity tags when stories mention them.

Source: [BCG — Agrifood Supply Chain Resilience](https://www.bcg.com/publications/2025/building-resilience-in-agrifood-supply-chains), [USDA Agri-Food Supply Chain Assessment](https://www.ams.usda.gov/sites/default/files/media/USDAAgriFoodSupplyChainReport.pdf).

---

## 2.3 Manufacturing / Industrial

**Themes (top 15)**
| Theme | Scan match |
|---|---|
| supply-chain | ✅ (18) |
| tariffs | ✅ (25) |
| trade-war | ✅ (8) |
| trade | ✅ (29) |
| export-controls | ✅ (4) |
| energy | ✅ (26) |
| manufacturing | ✅ (5) |
| automation | ~ robotics (6) |
| robotics | ✅ (6) |
| inflation | ✅ (18) |
| regulation | ✅ (18) |
| china | ✅ (29) |
| us-china | ✅ (4) |
| nvidia | ✅ (14) |
| semiconductors | ❌ — propose adding |

**Watchlist entities**
- Countries: china, us, mexico, vietnam, germany, japan
- Organisations: wto, g7
- Commodities: steel, aluminium, rare-earths, lithium (❌ mostly)
- Companies: tsmc, samsung, intel (❌)

**Supply chain exposure**
- Inputs: rare-earths (❌), lithium (❌), steel (❌), aluminium (❌), semiconductors (❌)
- Routes: supply-chain (✅ generic), china-trade (~)
- Energy: energy (✅), fuel (✅)

**Risk priority defaults**
- supply-chain-disruption, trade-tariff-sanctions, commodity-price-volatility, regulatory-policy, labour-workforce

**Gap note:** Industrial commodity tags (steel, aluminium, lithium, rare-earths, semiconductors) are heavily used in business context but underrepresented in scan tags. These are in the same category as food commodities — should be expanded in scan prompt.

---

## 2.4 Energy / Utilities

**Themes (top 15) — this sector has the best scan coverage**
| Theme | Scan match |
|---|---|
| energy | ✅ (26) |
| energy-transition | ✅ (20) |
| renewable-energy | ✅ (24) |
| solar | ✅ (22) |
| wind | ✅ (19) |
| nuclear | ✅ (18) |
| oil | ✅ (20) |
| oil-prices | ✅ (6) |
| fuel | ✅ (6) |
| energy-crisis | ✅ (12) |
| energy-storage | ✅ (6) |
| energy-security | ✅ (8) |
| clean-energy | ✅ (6) |
| batteries | ✅ (5) |
| hormuz | ✅ (17) |

**Watchlist entities**
- Countries: saudi-arabia, iran, russia, uae, venezuela, norway, qatar
- Organisations: opec, iea, iaea
- Commodities: crude oil, natural gas, lng, lithium, uranium (mostly ❌)
- Companies: aramco, shell, bp, exxon, gazprom (❌)

**Supply chain exposure**
- Routes: hormuz (✅), red-sea (❌), pipelines (❌), lng-terminals (❌)
- Commodities: oil (✅), fuel (✅), lng (❌), uranium (❌), lithium (❌)
- Infrastructure: grid (❌), pipelines (❌), refineries (❌)

**Risk priority defaults**
- energy-price, commodity-price-volatility, geopolitical-conflict, climate-environmental, regulatory-policy

**Note:** Energy is the best-supported sector in current scan tags. Minimal gap.

---

## 2.5 Mining / Resources

**Themes (top 10)**
| Theme | Scan match |
|---|---|
| energy | ✅ |
| export-controls | ✅ |
| sanctions | ✅ |
| china | ✅ |
| supply-chain | ✅ |
| tariffs | ✅ |
| regulation | ✅ |
| extreme-weather | ✅ |
| lithium | ❌ |
| rare-earths | ❌ |

**Gap note:** Specific mineral tags (lithium, copper, rare-earths, cobalt, nickel, gold, uranium) are mostly absent. Biggest gap for this sector — recommend adding to scan prompt.

**Watchlist:** chile, australia, drc, indonesia, china, us, canada

**Risk priority defaults:**
- commodity-price-volatility, supply-chain-disruption, regulatory-policy, geopolitical-conflict, climate-environmental

---

## 2.6 Investment / Finance / Macro

**Themes (top 15)**
| Theme | Scan match |
|---|---|
| inflation | ✅ (18) |
| economy | ✅ (18) |
| markets | ✅ (12) |
| stock-market | ✅ (8) |
| stocks | ✅ (6) |
| investment | ✅ (11) |
| venture-capital | ✅ (6) |
| earnings | ✅ (10) |
| cryptocurrency | ✅ (9) |
| bitcoin | ✅ (7) |
| trade-war | ✅ (8) |
| tariffs | ✅ (25) |
| geopolitics | ✅ (31) |
| trump | ✅ (18) |
| sanctions | ✅ (8) |

**Watchlist entities**
- Countries: us, china, eu, japan, uk, india
- Organisations: federal-reserve, ecb, imf, world-bank (❌ — propose adding)
- People: trump, xi, putin, central-bank-chairs
- Companies: nvidia (✅), goldman, jpmorgan, apollo (❌)

**Supply chain exposure:** n/a — finance is not supply chain driven

**Risk priority defaults:**
- currency-financial, geopolitical-conflict, trade-tariff-sanctions, regulatory-policy, reputation-narrative

**Gap note:** Central bank names and major financial institutions aren't tagged. Would benefit from scan prompt expansion.

---

## 2.7 Technology / Software

**Themes (top 15)**
| Theme | Scan match |
|---|---|
| ai | ✅ (32) |
| ai-geopolitics | ✅ (14) |
| ai-governance | ✅ (13) |
| ai-infrastructure | ✅ (6) |
| nvidia | ✅ (14) |
| cybersecurity | ✅ (18) |
| ransomware | ✅ (13) |
| deepfake | ✅ (13) |
| regulation | ✅ (18) |
| us-china | ✅ (4) |
| tech | ✅ (5) |
| technology | ✅ (11) |
| robotics | ✅ (6) |
| quantum-computing | ✅ (5) |
| data-breach | ✅ (6) |

**Watchlist entities**
- Companies: nvidia (✅), anthropic (❌), openai (❌), google, microsoft, meta, tsmc
- Countries: us, china, taiwan, eu, uk, israel
- Organisations: nist, fcc, ftc, eu-ai-act

**Supply chain exposure**
- Inputs: semiconductors (❌), gpus (❌), rare-earths (❌)
- Dependencies: ai-infrastructure (✅), cloud, power

**Risk priority defaults:**
- cyber-technology, regulatory-policy, trade-tariff-sanctions, reputation-narrative, geopolitical-conflict

**Note:** Tech is the second-best-supported sector after Energy. AI/cyber coverage is strong.

---

## 2.8 Pharmaceuticals / Healthcare

**Themes (top 15)**
| Theme | Scan match |
|---|---|
| healthcare | ✅ (12) |
| public-health | ✅ (10) |
| vaccine | ✅ (8) |
| vaccination | ✅ (6) |
| measles | ✅ (13) |
| outbreak | ✅ (12) |
| disease-outbreak | ✅ (7) |
| medical-breakthrough | ✅ (9) |
| who | ✅ (8) |
| nipah | ✅ (5) |
| respiratory | ✅ (4) |
| mental-health | ✅ (6) |
| research | ✅ (6) |
| regulation | ✅ (18) |
| global-south | ✅ (9) |

**Watchlist entities**
- Organisations: who, fda, ema, gavi
- Diseases: measles (✅), nipah (✅), h5n1 (❌), covid-variants (❌)
- Countries: us, india, china, drc, nigeria (outbreak-prone)
- Companies: pfizer, moderna, merck, glaxo (❌)

**Supply chain exposure**
- Inputs: api (active pharmaceutical ingredients, ❌), india-api (❌), china-api (❌)
- Regulations: fda (❌)

**Risk priority defaults:**
- regulatory-policy, reputation-narrative, supply-chain-disruption, cyber-technology, geopolitical-conflict

---

## 2.9 Construction / Infrastructure

**Themes (top 10)**
| Theme | Scan match |
|---|---|
| infrastructure | ✅ (8) |
| energy | ✅ |
| supply-chain | ✅ |
| extreme-weather | ✅ |
| climate | ✅ |
| flooding | ✅ |
| regulation | ✅ |
| investment | ✅ |
| tariffs | ✅ |
| manufacturing | ✅ |

**Gap note:** Specific construction inputs (steel, cement, labour-costs, housing) mostly absent from tags.

**Watchlist:** us, china, eu, gcc-states

**Risk priority defaults:**
- commodity-price-volatility, regulatory-policy, labour-workforce, climate-environmental, supply-chain-disruption

---

## 2.10 Retail / Consumer

**Themes (top 10)**
| Theme | Scan match |
|---|---|
| economy | ✅ |
| inflation | ✅ |
| consumer (~economy) | ~ |
| tariffs | ✅ |
| trade | ✅ |
| supply-chain | ✅ |
| cybersecurity | ✅ |
| data-breach | ✅ |
| ai | ✅ |
| regulation | ✅ |

**Gap note:** Retail-specific tags (consumer-confidence, e-commerce, retail-sales, holiday-shopping) absent.

**Watchlist:** us, china, eu, amazon (❌), walmart (❌)

**Risk priority defaults:**
- commodity-price-volatility, supply-chain-disruption, currency-financial, cyber-technology, regulatory-policy

---

## 2.11 Media / Communications / PR

**Themes (top 15)**
| Theme | Scan match |
|---|---|
| disinformation | ✅ (9) |
| deepfake | ✅ (13) |
| censorship | ✅ (6) |
| journalism | ✅ (4) |
| propaganda | ✅ (4) |
| hybrid-warfare | ✅ (5) |
| ai-video | ✅ (6) |
| ai | ✅ |
| regulation | ✅ |
| protests | ✅ |
| cybersecurity | ✅ |
| data-breach | ✅ |
| ai-governance | ✅ |
| election | ✅ (6) |
| politics | ✅ (8) |

**Watchlist:** tiktok, x, meta, google, eu-dsa, ofcom (❌)

**Supply chain exposure:** n/a / minimal

**Risk priority defaults:**
- reputation-narrative, cyber-technology, regulatory-policy, geopolitical-conflict, labour-workforce

**Note:** This sector is very well-supported by scan tags — disinformation, deepfake, hybrid-warfare, censorship all explicitly tracked.

---

## 2.12 Government / Public Sector

**Themes (top 15)**
| Theme | Scan match |
|---|---|
| policy | ✅ (15) |
| regulation | ✅ (18) |
| governance | ✅ (8) |
| geopolitics | ✅ (31) |
| diplomacy | ✅ (43) |
| sanctions | ✅ (8) |
| election | ✅ (6) |
| security | ✅ (11) |
| immigration | ✅ (8) |
| migration | ✅ (11) |
| nato | ✅ (15) |
| military | ✅ (24) |
| defense | ✅ (13) |
| conflict | ✅ (14) |
| humanitarian | ✅ (9) |

**Watchlist:** nato, un, g7, eu, nuclear-states

**Risk priority defaults:**
- geopolitical-conflict, regulatory-policy, trade-tariff-sanctions, cyber-technology, reputation-narrative

---

## 2.13 Consulting / Advisory

**Themes (top 10)**
| Theme | Scan match |
|---|---|
| geopolitics | ✅ |
| trade | ✅ |
| tariffs | ✅ |
| regulation | ✅ |
| economy | ✅ |
| ai | ✅ |
| sanctions | ✅ |
| energy | ✅ |
| supply-chain | ✅ |
| climate | ✅ |

**Risk priority defaults:** (varies by client — pre-select all 5 top-level)
- geopolitical-conflict, trade-tariff-sanctions, regulatory-policy, commodity-price-volatility, cyber-technology

**Note:** Consulting firms want breadth. Recommend letting them opt into a "general intelligence" default with fewer restrictions.

---

## 2.14 Legal / Compliance

**Themes (top 10)**
| Theme | Scan match |
|---|---|
| sanctions | ✅ (8) |
| regulation | ✅ (18) |
| policy | ✅ (15) |
| legal | ✅ (5) |
| export-controls | ✅ (4) |
| trade | ✅ (29) |
| tariffs | ✅ (25) |
| cybersecurity | ✅ (18) |
| data-breach | ✅ (6) |
| ai-governance | ✅ (13) |

**Watchlist:** ofac, eu-commission, sec, fca, us-doj (❌)

**Risk priority defaults:**
- regulatory-policy, trade-tariff-sanctions, cyber-technology, reputation-narrative, geopolitical-conflict

---

## 2.15 Education / Research

**Themes (top 10)**
| Theme | Scan match |
|---|---|
| education | ✅ (7) |
| research | ✅ (6) |
| ai | ✅ (32) |
| ai-governance | ✅ (13) |
| funding | ✅ (10) |
| policy | ✅ (15) |
| technology | ✅ (11) |
| censorship | ✅ (6) |
| immigration | ✅ (8) |
| regulation | ✅ (18) |

**Risk priority defaults:**
- regulatory-policy, geopolitical-conflict, cyber-technology, reputation-narrative, labour-workforce

---

## 2.16 Other

Treated as "general intelligence" — user picks any themes/entities/supply chain. Risk priorities default to the most common cross-sector: supply-chain-disruption, commodity-price-volatility, geopolitical-conflict, regulatory-policy, cyber-technology.

---

# PART 3 — Scan Tag Mapping & Gaps

## 3A. Actual scan tag data

I pulled tag frequencies from `scan_items` + `scans.items` JSONB on 2026-04-13. Full list in Appendix A. Key stats:

- **1,456 unique tags** across all scan data
- **Top 60 tags account for ~55%** of all tag usage
- **Heavy concentration** in geopolitics (iran, diplomacy, russia, china), energy (energy, solar, oil), climate (extreme-weather, flooding, drought), AI/tech (ai, nvidia, cybersecurity)
- **Case inconsistency**: `iran` (54) vs `Iran` (12), `china` (29) vs `China` (7), `ai` (32) vs `AI` (11) — the relevance engine lowercases both sides so matches work, but dropdown values must be lowercase canonical form

## 3B. Coverage heatmap — which sectors are well-served by current scan

| Sector | Theme coverage | Gap severity |
|---|---|---|
| Energy / Utilities | Excellent (15/15) | Minimal |
| Technology / Software | Excellent (14/15) | Low |
| Media / Comms | Excellent (14/15) | Low |
| Government / Public | Excellent (15/15) | Minimal |
| Finance / Macro | Strong (13/15) | Low — missing central bank names |
| Healthcare / Pharma | Strong (13/15) | Medium — specific diseases vary |
| Food / Agriculture | Moderate (11/15) | **High — commodity-specific tags missing** |
| Legal / Compliance | Moderate (10/10) | Low |
| Logistics / Shipping | Moderate (13/15) | **High — port/route/freight tags missing** |
| Manufacturing | Moderate (11/15) | **High — material tags missing** |
| Education / Research | Adequate (10/10) | Low |
| Consulting | Broad coverage | n/a |
| Retail / Consumer | Weak | **High — retail-specific tags missing** |
| Construction | Weak | **High — materials + housing tags missing** |
| Mining / Resources | Weak | **Critical — mineral tags largely absent** |
| Other | Varies | n/a |

**Five sectors have critical gaps** where current scan data doesn't produce the tags a business user would expect. Fixing these requires expanding the scan prompt to emit more granular tags when relevant stories appear.

## 3C. Recommended scan prompt additions

Scan prompt should be updated to emit additional tags for these story types. Each addition is a simple instruction to the scan generator to include the relevant tag when mentioned.

### Commodity tags (for Food/Ag, Mining, Manufacturing, Energy)
```
wheat, corn, rice, soy, coffee, cocoa, sugar, palm-oil, beef, fish
steel, aluminium, copper, nickel, zinc, tin, lithium, cobalt
rare-earths, uranium, gold, silver, platinum, palladium
lng, naphtha, diesel, jet-fuel, coal, hydrogen
semiconductors, gpus, memory-chips, packaging-substrates
```

### Trade route tags (for Logistics, Energy, Food/Ag)
```
hormuz (already tagged), red-sea, suez, panama-canal, strait-of-malacca
bosphorus, bab-el-mandeb, dover-strait, cape-of-good-hope
pipelines, lng-terminals, black-sea, baltic-sea
```

### Major-company tags (for Finance, Tech, Logistics, Pharma)
```
maersk, msc, cosco, evergreen — shipping
aramco, shell, bp, exxon, gazprom, petrobras, chevron — energy
tsmc, samsung, intel, nvidia (tagged), broadcom, arm — tech
anthropic, openai, google, microsoft, meta — ai
pfizer, moderna, merck, glaxo, sanofi, lilly — pharma
goldman, jpmorgan, blackrock, apollo, kkr — finance
```

### Regulator / institution tags
```
fed (federal reserve), ecb, boj, pboc — central banks
sec, fca, cftc, esma — financial regulators
fda, ema, mhra, who, gavi — health
ofac, fincen, eu-sanctions, ukoftsi — sanctions
ftc, cma, eu-competition — competition
```

### Retail/consumer tags
```
consumer-confidence, retail-sales, e-commerce, holiday-shopping
amazon, walmart, costco, shein, temu, alibaba
```

### Construction/materials tags
```
cement, rebar, housing-starts, building-permits, mortgage-rates
```

## 3D. Decision point — when to add vs. when to restrict

Two viable paths:

### Path A — Restrict dropdowns to current scan tags
- Only offer themes/entities that already exist in scan data
- Pro: guarantees the relevance engine works today
- Con: several sectors get a weak onboarding experience
- Con: users ask for themes we don't offer and leave

### Path B — Expand scan prompt + offer richer dropdowns
- Add commodity/route/company tags to scan prompt
- Pro: sectors get a complete onboarding
- Pro: relevance engine improves for these sectors
- Con: requires coordinating a scan prompt change with OpenClaw
- Con: historical scans don't retroactively get the new tags (existing briefings won't score on them)

### Recommendation — hybrid

1. Launch the dropdown redesign with **what's tagged today** (Path A)
2. In parallel, expand scan prompt to include the new commodity/route/company tags (Path B)
3. As new tags flow in, progressively unlock richer dropdown options per sector
4. For already-live users, new tag options appear as "Available to add" in their profile editor

This ships faster, avoids blocking on scan prompt changes, and improves over time without breaking anything.

---

# PART 4 — Implementation Notes

## 4A. Data structure for dropdown taxonomy

Recommend a new file: `src/lib/onboarding-taxonomy.ts` with:

```ts
export interface TaxonomyOption {
  value: string;              // canonical lowercase scan-tag form
  label: string;              // display label (e.g. "Shipping routes")
  scanTags: string[];         // one or more tags this option matches
  sectors: string[];          // sector IDs where this appears as a default
  category?: string;          // for grouping (e.g. "Commodities", "Routes")
}

export const THEME_TAXONOMY: TaxonomyOption[] = [
  { value: "shipping", label: "Shipping", scanTags: ["shipping"], sectors: ["logistics-shipping"], category: "Trade" },
  { value: "oil-prices", label: "Oil prices", scanTags: ["oil-prices", "oil"], sectors: ["energy-utilities","logistics-shipping"], category: "Commodities" },
  // ...
];

export const WATCHLIST_TAXONOMY: TaxonomyOption[] = [ ... ];
export const SUPPLY_CHAIN_TAXONOMY: TaxonomyOption[] = [ ... ];
```

Each dropdown option stores the **canonical value** + the **scan tags it maps to**. The relevance engine scores against `scanTags`, not `value`, so an option like "OPEC" can match both the tag `opec` and `oil`.

## 4B. Cascade logic

When `sector` changes in the onboarding flow:

1. Filter `THEME_TAXONOMY` where `sectors.includes(newSector)` → these are the sector defaults
2. Pre-populate the selected themes with the top 5-8 from that filtered list
3. Show all taxonomy in the dropdown (search/browse), just with sector-relevant items pinned to top
4. Same pattern for watchlist and supply chain
5. Risk priorities pre-select the 5 defaults for that sector

User can always override, add, or remove. Cascade only affects the initial state.

## 4C. Component architecture

New component: `src/app/components/taxonomy-combobox.tsx`
- Props: `options: TaxonomyOption[]`, `value: string[]`, `onChange`, `category grouping`, `sectorDefaults`
- Behaviour: W3C combobox with type-to-filter, keyboard nav, chip display, Select All / Clear All
- Reusable across theme / watchlist / supply chain dropdowns

## 4D. Migration path for existing users

Any existing company profiles with free-text values need to be mapped to the new taxonomy:

1. For each existing `tracked_theme` string, find the closest `TaxonomyOption.value` match (exact first, fuzzy fallback)
2. If no match found, keep the string as "custom" — show it in the UI with a warning badge "custom theme, may not score against scans"
3. Encourage users to swap custom themes for canonical taxonomy entries
4. No database migration needed — the taxonomy values ARE strings, same shape

## 4E. Out of scope for MVP

- **Semantic/LLM-based matching** — if a user picks "freight rates" and the scan tags "shipping", smart matching would connect them. This is a Phase 7 relevance-tuning concern, not onboarding UX.
- **Auto-suggestion from first briefing** — after the first briefing, suggest new taxonomy items the user's scored-high stories contained but they hadn't picked. Future enhancement.
- **Industry-specific taxonomy variants** — different themes surface for the same tag in different sectors. Current design uses one flat taxonomy + sector filtering. If we need sector-specific taxonomies, that's a later refactor.

---

# Appendix A — Top 100 scan tags by frequency

From combined `scan_items` + `scans.items` JSONB, 2026-04-13:

```
iran              54    extreme-weather   29    ai               32
diplomacy         43    supply-chain      18    geopolitics      31
iran-war          38    solar             22    russia           31
india             34    oil               20    china            29
ai                32    energy-transition 20    trade            29
climate           27    wind              19    tariffs          25
energy            26    nuclear           18    military         24
flooding          24    trump             18    renewable-energy 24
ukraine           23    regulation        18    hormuz           17
pakistan          17    economy           18    oil-prices        6
drought           16    inflation         18    brazil           16
breakthrough      16    cybersecurity     18    israel           15
nato              15    policy            15    australia        15
uk                15    nvidia            14    ai-geopolitics   14
conflict          14    war               13    deepfake         13
ai-governance     13    measles           13    escalation       13
defense           13    ransomware        13    food-security    12
markets           12    outbreak          12    discovery        12
weather           12    japan             12    geopolitical-tension 12
bangladesh        12    healthcare        12    energy-crisis    12
forecast          11    investment        11    europe           11
migration         11    technology        11    security         11
shipping          10    eu                10    public-health    10
funding           10    earnings          10    protests          9
disinformation     9    usa                9    global-south      9
agriculture        9    medical-breakthrough 9  cryptocurrency    9
humanitarian       9    space              9    sanctions         8
trade-war          8    climate-change     8    humanitarian-crisis 8
vaccine            8    climate-policy     8    protest-movement  8
climate-impact     8    energy-security    8    infrastructure    8
immigration        8    governance         8    politics          8
electric-vehicles  8    stock-market       8    who               8
el-nino            8    terrorism          8    economic-impact   8
cybersecurity      (already above)   bitcoin    7    france        7
innovation         7    disease-outbreak  7    africa            7
education          7    casualties         7    sports            7
protest            7    venezuela         7    nigeria           7
saudi-arabia       7    hunger             6    strikes           6
famine             6    censorship         6    election          6
clean-energy       6    sahel              6    refugees          6
turkey             6    ai-video           6    vaccination       6
research           6    ai-infrastructure  6    energy-storage    6
entertainment      6    fuel               6    stocks            6
military-buildup   6    military-escalation 6   robotics          6
mental-health      6    tourism            6    missiles          6
uae                6    jwst               6    california        6
venture-capital    6    data breach        6    violence          6
```

Full list of 1,456 tags available via Supabase query — see data pull script in `scripts/` if needed for future reference.

---

# Sources

## UX research
- [W3C ARIA Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [W3C ARIA Select-Only Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/)
- [Smashing Magazine — Combobox vs Multiselect vs Listbox](https://www.smashingmagazine.com/2026/02/combobox-vs-multiselect-vs-listbox/)
- [USWDS Combo Box](https://designsystem.digital.gov/components/combo-box/)
- [Venture Harbour — 58 Form Design Best Practices 2026](https://ventureharbour.com/form-design-best-practices/)
- [Eleken — Dropdown Menu UI](https://www.eleken.co/blog-posts/dropdown-menu-ui)
- [Formbricks — User Onboarding Best Practices 2026](https://formbricks.com/blog/user-onboarding-best-practices)
- [Code Theorem — SaaS Onboarding UX](https://codetheorem.co/blogs/saas-onboarding-ux/)
- [Adrian Roselli — Under-Engineered Multi-Selects](https://adrianroselli.com/2022/05/under-engineered-multi-selects.html)

## Platform patterns
- [LinkedIn Sales Navigator Industries List 2026 (Evaboot)](https://evaboot.com/blog/linkedin-sales-navigator-industries-list)
- [LinkedIn Sales Navigator 400+ Categories (Powerin)](https://www.powerin.io/blog/linkedin-sales-navigator-industries-list)
- [HubSpot — Salesforce Field Mapping Community Thread](https://community.hubspot.com/t5/Lead-Capture-Tools/Field-Mapping-amp-SalesForce/m-p/904822)
- [HubSpot — Company Industry Taxonomy Discussion](https://community.hubspot.com/t5/CRM/Company-Industry-Taxonomy/m-p/1046527)
- [MarCloud — HubSpot Salesforce Field Mapping Best Practices](https://marcloudconsulting.com/development/hubspot-salesforce-field-mapping/)

## Sector risk research
- [Aon — Top Risks Facing Transportation and Logistics](https://www.aon.com/en/insights/reports/global-risk-management-survey/industry-insights/top-risks-facing-transportation-and-logistics-organizations)
- [Xeneta — Biggest Global Supply Chain Risks](https://www.xeneta.com/blog/the-biggest-global-supply-chain-risks-of-2025)
- [NetSuite — Top 10 Supply Chain Risks of 2025](https://www.netsuite.com/portal/resource/articles/inventory-management/supply-chain-risks.shtml)
- [Aon — Food, Agribusiness and Beverage Risks](https://www.aon.com/en/insights/reports/global-risk-management-survey/industry-insights/top-risks-facing-food-agribusiness-and-beverage-organizations)
- [BCG — Building Resilience in Agrifood Supply Chains](https://www.bcg.com/publications/2025/building-resilience-in-agrifood-supply-chains)
- [WTW — Food, Beverage and Agriculture Supply Chain Risk Report](https://www.wtwco.com/en-us/insights/2023/03/2023-food-beverage-and-agriculture-supply-chain-risk-report)
- [USDA — Agri-Food Supply Chain Assessment](https://www.ams.usda.gov/sites/default/files/media/USDAAgriFoodSupplyChainReport.pdf)
- [Frontiers — Supply Chain Risks in Agri-Food Systems](https://www.frontiersin.org/journals/sustainable-food-systems/articles/10.3389/fsufs.2025.1649834/full)

## Data sources
- Albis `scan_items` table (Supabase)
- Albis `scans.items` JSONB column (Supabase)
- Pulled via service role query on 2026-04-13
