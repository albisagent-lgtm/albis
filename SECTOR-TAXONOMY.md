# Albis Sector Taxonomy — Source of Truth

**Date:** 2026-04-15
**Purpose:** Single source of truth for the company onboarding taxonomy. Drives the combobox dropdowns in `/onboarding/company` and `/dashboard/profile`.
**Status:** Reference — no code changes yet.

---

## Legend

- **✅** — tag exists in current scan data (relevance engine will score on it)
- **⚠** — tag does not yet exist in scan data; scan prompt needs expansion (or option labelled as "custom")
- **Bundle** — themes/entities/exposures pre-selected when this sector is chosen (the "90% want this" default)
- **Additional** — surfaced below the bundle, labelled "Additional options for your sector", user picks manually

---

## Sector List (25 sectors)

Expanded from the current 16 to cover the major industries. A company should almost always find their sector here.

1. [Logistics / Shipping / Freight](#1-logistics--shipping--freight)
2. [Aviation / Air Transport](#2-aviation--air-transport)
3. [Food / Agriculture / FMCG](#3-food--agriculture--fmcg)
4. [Manufacturing / Industrial](#4-manufacturing--industrial)
5. [Energy / Utilities](#5-energy--utilities)
6. [Mining / Resources / Commodities](#6-mining--resources--commodities)
7. [Banking / Financial Services](#7-banking--financial-services)
8. [Investment / Asset Management](#8-investment--asset-management)
9. [Insurance / Reinsurance](#9-insurance--reinsurance)
10. [Technology / Software](#10-technology--software)
11. [Telecommunications](#11-telecommunications)
12. [Pharmaceuticals / Biotech](#12-pharmaceuticals--biotech)
13. [Healthcare / Medical Services](#13-healthcare--medical-services)
14. [Construction / Infrastructure](#14-construction--infrastructure)
15. [Real Estate / Property](#15-real-estate--property)
16. [Retail / Consumer Goods](#16-retail--consumer-goods)
17. [Hospitality / Tourism / Leisure](#17-hospitality--tourism--leisure)
18. [Media / Publishing / Advertising](#18-media--publishing--advertising)
19. [Government / Public Sector](#19-government--public-sector)
20. [Defence / Aerospace / Security](#20-defence--aerospace--security)
21. [Consulting / Advisory](#21-consulting--advisory)
22. [Legal / Compliance](#22-legal--compliance)
23. [Education / Research / Academia](#23-education--research--academia)
24. [NGO / Humanitarian / Development](#24-ngo--humanitarian--development)
25. [Other / Custom](#25-other--custom)

---

## Risk Priorities (12 — unchanged)

These are shared across all sectors. Each sector recommends 5 as defaults.

```
supply-chain-disruption       commodity-price-volatility
geopolitical-conflict         regulatory-policy
trade-tariff-sanctions        currency-financial
climate-environmental         cyber-technology
reputation-narrative          energy-price
food-water-security           labour-workforce
```

---

# Sectors

## 1. Logistics / Shipping / Freight

**Risk defaults:** supply-chain-disruption, geopolitical-conflict, trade-tariff-sanctions, energy-price, commodity-price-volatility

**Themes — Bundle (pre-selected):**
- Shipping routes → `shipping` ✅ (10)
- Supply chain disruption → `supply-chain` ✅ (18) + `supply-chain-vulnerability` ✅ (4)
- Hormuz / Strait crises → `hormuz` ✅ (17)
- Sanctions & export controls → `sanctions` ✅ (8), `export-controls` ✅ (4)
- Tariffs & trade war → `tariffs` ✅ (25), `trade-war` ✅ (8)
- Oil / fuel prices → `oil-prices` ✅ (6), `oil` ✅ (20), `fuel` ✅ (6)

**Themes — Additional:**
- Geopolitical tension → `geopolitical-tension` ✅
- Infrastructure risk → `infrastructure-risk` ✅ (4), `infrastructure-disruption` ✅ (4)
- Strikes / labour action → `strikes` ✅ (6)
- Logistics operations → `logistics` ✅ (5)
- Airlines / air freight → `airlines` ✅ (5)
- Conflict → `conflict` ✅ (14)
- Sabotage → `sabotage` ✅ (4)
- Red Sea / Suez / Panama Canal ⚠ (propose adding)
- Freight rates / container shortages ⚠

**Watchlist — Bundle:**
- Iran, Russia, China (regional risk trio) ✅
- Hormuz / Red Sea ✅
- US/China trade → `us-china` ✅

**Watchlist — Additional:**
- Turkey, Saudi Arabia, UAE, Yemen, Ukraine, EU, UK, Mexico
- OPEC ⚠, Houthis ⚠, Maersk/MSC/Cosco ⚠

**Supply chain — Bundle:**
- Oil & fuel ✅
- Shipping lanes ✅ (via `shipping`, `hormuz`)
- Supply chain vulnerability ✅

**Supply chain — Additional:**
- Fertilizer ✅, Semiconductors ✅
- Containers ⚠, LNG ⚠, Bunker fuel ⚠, Diesel ⚠, Ports ⚠

**Cascade:** 6 themes + 3 watchlist + 3 supply chain pre-selected. User adds more if needed.

---

## 2. Aviation / Air Transport

**Risk defaults:** supply-chain-disruption, energy-price, regulatory-policy, geopolitical-conflict, labour-workforce

**Themes — Bundle:**
- Airlines → `airlines` ✅ (5)
- Fuel costs → `fuel` ✅ (6), `oil-prices` ✅ (6)
- Geopolitical conflict → `geopolitics` ✅ (31), `conflict` ✅ (14)
- Regulation → `regulation` ✅ (18), `policy` ✅ (15)
- Sanctions → `sanctions` ✅ (8)
- Supply chain → `supply-chain` ✅ (18)

**Themes — Additional:**
- Extreme weather disruption → `extreme-weather` ✅ (29)
- Cybersecurity → `cybersecurity` ✅ (18)
- Tourism demand → `tourism` ✅ (6)
- Hormuz airspace risk → `hormuz` ✅
- Strikes → `strikes` ✅
- Airspace closures ⚠, MRO parts ⚠, Slot controls ⚠, Sustainable aviation fuel ⚠, Iata/icao ⚠

**Watchlist — Bundle:**
- Oil price / OPEC ⚠ (via `oil`) ✅
- Iran / Russia airspace ✅
- US, EU, China ✅

**Watchlist — Additional:**
- Saudi Arabia, UAE, Turkey, India ✅
- Boeing, Airbus ⚠, FAA, EASA ⚠, CAAC ⚠, Emirates/Qatar/Singapore Airlines ⚠

**Supply chain — Bundle:**
- Jet fuel → `fuel` ✅, `oil` ✅
- Semiconductors ✅ (for avionics)
- Supply chain ✅

**Supply chain — Additional:**
- Lithium batteries ⚠, Titanium ⚠, Rare earths ⚠, MRO parts ⚠, Carbon-fiber composites ⚠

---

## 3. Food / Agriculture / FMCG

**Risk defaults:** food-water-security, climate-environmental, commodity-price-volatility, supply-chain-disruption, geopolitical-conflict

**Themes — Bundle:**
- Food security → `food-security` ✅ (12)
- Climate / extreme weather → `climate` ✅ (27), `extreme-weather` ✅ (29)
- Drought / flooding → `drought` ✅ (16), `flooding` ✅ (24)
- Famine / hunger → `famine` ✅ (6), `hunger` ✅ (6)
- Fertilizer → `fertilizer` ✅ (4)
- Agriculture → `agriculture` ✅ (9)

**Themes — Additional:**
- El Niño / La Niña → `el-nino` ✅ (8), `la-nina` ✅ (4)
- Heatwave → `heatwave` ✅ (5)
- Climate policy → `climate-policy` ✅ (8), `climate-impact` ✅ (8)
- Export controls → `export-controls` ✅ (4)
- Tariffs → `tariffs` ✅
- Cyclone / natural-disaster → `cyclone` ✅ (4), `natural-disaster` ✅ (4)
- Biodiversity / ecosystem collapse → `biodiversity` ✅ (5), `ecosystem-collapse` ✅ (4)
- Water crisis → `water-crisis` ✅ (3)
- Wheat / corn / rice / soy / coffee / cocoa / palm-oil ⚠ (propose adding)

**Watchlist — Bundle:**
- India, Brazil, China ✅
- WFP → `wfp` ✅ (4)
- Russia / Ukraine (grain) ✅

**Watchlist — Additional:**
- Sahel → `sahel` ✅ (6), Nigeria, Egypt, Sudan, Bangladesh ✅
- Indonesia, Pakistan ✅
- FAO ⚠, Cargill/ADM/Bunge ⚠, Nestlé/Unilever ⚠

**Supply chain — Bundle:**
- Fertilizer ✅
- Climate / weather exposure → `extreme-weather` ✅
- Hormuz (fertiliser passes through) ✅

**Supply chain — Additional:**
- Hunger / food security ✅
- Wheat ⚠, Corn ⚠, Rice ⚠, Coffee ⚠, Cocoa ⚠, Palm-oil ⚠, Sugar ⚠

---

## 4. Manufacturing / Industrial

**Risk defaults:** supply-chain-disruption, trade-tariff-sanctions, commodity-price-volatility, regulatory-policy, labour-workforce

**Themes — Bundle:**
- Tariffs → `tariffs` ✅ (25)
- Trade war → `trade-war` ✅ (8)
- Supply chain → `supply-chain` ✅ (18)
- Export controls → `export-controls` ✅ (4)
- US-China trade → `us-china` ✅ (4)
- Manufacturing trends → `manufacturing` ✅ (5)

**Themes — Additional:**
- Energy / fuel → `energy` ✅, `fuel` ✅
- Regulation → `regulation` ✅
- Robotics / automation → `robotics` ✅ (6)
- EVs / electric vehicles → `electric-vehicles` ✅ (8), `evs` ✅ (4)
- AI in industry → `ai` ✅, `ai-infrastructure` ✅
- Semiconductors → `semiconductors` ✅ (4)
- Labour / layoffs → `layoffs` ✅ (4), `unemployment` ✅ (4)
- Inflation → `inflation` ✅
- Steel / aluminium / copper / nickel / lithium / rare-earths ⚠

**Watchlist — Bundle:**
- China, US, Germany, Japan ✅
- NVIDIA → `nvidia` ✅ (14)
- EU ✅

**Watchlist — Additional:**
- Mexico, India, South Korea, Vietnam ✅
- TSMC ⚠, Samsung ⚠, Intel ⚠, Foxconn ⚠

**Supply chain — Bundle:**
- Semiconductors ✅
- Supply chain vulnerability ✅ (4)
- Energy ✅

**Supply chain — Additional:**
- Steel ⚠, Aluminium ⚠, Lithium ⚠, Copper ⚠, Nickel ⚠, Rare-earths ⚠
- Chip substrates ⚠, Factory labour ✅ (via labor/strikes)

---

## 5. Energy / Utilities

**Risk defaults:** energy-price, commodity-price-volatility, geopolitical-conflict, climate-environmental, regulatory-policy

**Themes — Bundle:**
- Oil / oil prices → `oil` ✅ (20), `oil-prices` ✅ (6)
- Energy transition → `energy-transition` ✅ (20), `renewable-transition` ✅ (4)
- Renewable energy → `renewable-energy` ✅ (24), `renewable` ✅ (4)
- Hormuz → `hormuz` ✅ (17)
- Energy crisis → `energy-crisis` ✅ (12), `energy-security` ✅ (8)
- Nuclear energy → `nuclear` ✅ (18), `nuclear-energy` ✅ (4)

**Themes — Additional:**
- Solar → `solar` ✅ (22)
- Wind → `wind` ✅ (19)
- Clean energy → `clean-energy` ✅ (6)
- Energy storage / batteries → `energy-storage` ✅ (6), `batteries` ✅ (5), `battery` ✅ (5)
- Electric vehicles → `electric-vehicles` ✅ (8)
- Energy leverage → `energy-leverage` ✅ (4)
- Energy efficiency → `energy-efficiency` ✅ (4)
- Sanctions → `sanctions` ✅
- Climate policy → `climate-policy` ✅

**Watchlist — Bundle:**
- Saudi Arabia ✅
- Iran ✅, Russia ✅
- OPEC ⚠ (via `oil`) ✅
- UAE ✅

**Watchlist — Additional:**
- Qatar ✅, Venezuela ✅, Norway, Nigeria ✅, Australia ✅
- Aramco ⚠, Shell ⚠, BP ⚠, Exxon ⚠, Gazprom ⚠, Chevron ⚠

**Supply chain — Bundle:**
- Oil ✅, Fuel ✅
- Hormuz ✅
- Energy security ✅

**Supply chain — Additional:**
- LNG ⚠, Uranium ⚠, Lithium ⚠ (batteries), Rare-earths ⚠, Pipelines ⚠, Grid ⚠

---

## 6. Mining / Resources / Commodities

**Risk defaults:** commodity-price-volatility, supply-chain-disruption, regulatory-policy, climate-environmental, geopolitical-conflict

**Themes — Bundle:**
- Export controls → `export-controls` ✅ (4)
- Supply chain → `supply-chain` ✅
- Energy → `energy` ✅
- Tariffs → `tariffs` ✅
- Sanctions → `sanctions` ✅
- China trade → `us-china` ✅, `china` ✅

**Themes — Additional:**
- Climate / extreme weather → `climate` ✅, `extreme-weather` ✅
- Regulation → `regulation` ✅
- Infrastructure → `infrastructure` ✅
- Renewable transition → `renewable-transition` ✅
- EV demand → `electric-vehicles` ✅
- Battery metals ⚠, Lithium ⚠, Cobalt ⚠, Nickel ⚠, Copper ⚠, Rare-earths ⚠, Uranium ⚠, Gold ⚠

**Watchlist — Bundle:**
- China ✅, Australia ✅
- DRC Congo ⚠ (propose as watchlist category)
- Indonesia ✅, Chile ⚠, US ✅

**Watchlist — Additional:**
- Canada ✅, Russia ✅, Peru, Brazil ✅, Mongolia, South Africa
- BHP ⚠, Rio Tinto ⚠, Glencore ⚠, Vale ⚠

**Supply chain — Bundle:**
- Export controls ✅
- Energy / power ✅
- Supply chain vulnerability ✅

**Supply chain — Additional:**
- Lithium ⚠, Copper ⚠, Nickel ⚠, Cobalt ⚠, Rare-earths ⚠, Uranium ⚠

---

## 7. Banking / Financial Services

**Risk defaults:** currency-financial, regulatory-policy, geopolitical-conflict, reputation-narrative, cyber-technology

**Themes — Bundle:**
- Inflation → `inflation` ✅ (18)
- Economy → `economy` ✅ (18), `economic-impact` ✅ (8)
- Markets → `markets` ✅ (12), `stock-market` ✅ (8), `stocks` ✅ (6)
- Currency volatility → `currency-volatility` ✅ (4)
- Market volatility → `market-volatility` ✅ (4)
- Regulation → `regulation` ✅ (18)

**Themes — Additional:**
- Sanctions → `sanctions` ✅
- Trade war → `trade-war` ✅
- Political instability → `political-instability` ✅ (4)
- Capital flows → `capital-flows` ✅ (4)
- Cybersecurity → `cybersecurity` ✅ (18)
- Ransomware → `ransomware` ✅ (13)
- Data breach → `data-breach` ✅ (4)
- Cryptocurrency → `cryptocurrency` ✅ (9), `bitcoin` ✅ (9)
- Fraud → `fraud` ✅ (4)
- Earnings → `earnings` ✅ (10)

**Watchlist — Bundle:**
- US ✅, EU ✅, China ✅, UK ✅
- Trump → `trump` ✅ (22)

**Watchlist — Additional:**
- Japan ✅, India ✅, Brazil ✅
- Fed / Federal Reserve ⚠, ECB ⚠, BoJ ⚠, PBoC ⚠
- JPMorgan ⚠, Goldman ⚠, HSBC ⚠, Citi ⚠, BlackRock ⚠

**Supply chain — Bundle:**
- Data systems (cybersecurity) ✅
- Regulatory environment ✅

**Supply chain — Additional:**
- Payment infrastructure ⚠, SWIFT ⚠, Correspondent banking ⚠, Settlement rails ⚠

---

## 8. Investment / Asset Management

**Risk defaults:** currency-financial, geopolitical-conflict, commodity-price-volatility, regulatory-policy, reputation-narrative

**Themes — Bundle:**
- Markets / stock-market → `markets` ✅ (12), `stock-market` ✅ (8)
- Earnings → `earnings` ✅ (10)
- Geopolitics → `geopolitics` ✅ (31)
- Inflation → `inflation` ✅
- Trump → `trump` ✅
- Trade war → `trade-war` ✅, `tariffs` ✅

**Themes — Additional:**
- Venture capital → `venture-capital` ✅ (6)
- Investment trends → `investment` ✅ (11)
- Cryptocurrency / bitcoin ✅
- Currency volatility → `currency-volatility` ✅
- Market volatility → `market-volatility` ✅
- Capital flows → `capital-flows` ✅
- AI → `ai` ✅
- NVIDIA → `nvidia` ✅
- Energy → `energy` ✅
- AI geopolitics → `ai-geopolitics` ✅
- Regulation ✅

**Watchlist — Bundle:**
- US, China, EU ✅
- NVIDIA ✅
- Trump ✅

**Watchlist — Additional:**
- Trump, Xi, Putin (via `putin` ⚠, use `russia` instead) ✅
- Musk → `musk` ✅ (4)
- India, Japan, UK, Brazil ✅
- OpenAI / Anthropic / Google / Microsoft / Meta ⚠
- Apollo / KKR / Blackstone ⚠

**Supply chain — Bundle:** n/a (finance is not supply chain-driven)
Available for funds with specific portfolio exposures — see other sectors.

---

## 9. Insurance / Reinsurance

**Risk defaults:** climate-environmental, reputation-narrative, regulatory-policy, cyber-technology, currency-financial

**Themes — Bundle:**
- Extreme weather → `extreme-weather` ✅ (29)
- Climate → `climate` ✅ (27), `climate-impact` ✅ (8)
- Flooding → `flooding` ✅ (24)
- Natural disaster → `natural-disaster` ✅ (4), `disaster` ✅ (4)
- Storms / cyclone → `cyclone` ✅ (4), `storms` ✅ (4)
- Cybersecurity → `cybersecurity` ✅ (18)

**Themes — Additional:**
- Drought → `drought` ✅
- Heatwave → `heatwave` ✅ (5)
- Earthquake → `earthquake` ✅ (7)
- Volcano → `volcano` ✅ (4)
- Wildfire / California fires → `california` ✅
- Climate variability → `climate-variability` ✅ (4)
- Temperature records → `temperature-records` ✅ (4), `temperature` ✅ (4)
- Ransomware → `ransomware` ✅
- Data breach → `data-breach` ✅, `data breach` ✅
- Regulation ✅
- Reputation / narrative risk → propose linking to `reputation-narrative` risk
- Political instability → `political-instability` ✅

**Watchlist — Bundle:**
- California ✅
- US, EU, UK ✅

**Watchlist — Additional:**
- Australia ✅, Japan ✅, Philippines ✅, Bangladesh ✅
- Lloyds, Munich Re, Swiss Re, Allianz, AIG ⚠

**Supply chain — Bundle:**
- Climate exposure ✅
- Cybersecurity events ✅

**Supply chain — Additional:**
- Reinsurance capacity ⚠, Catastrophe models ⚠, Parametric triggers ⚠

---

## 10. Technology / Software

**Risk defaults:** cyber-technology, regulatory-policy, trade-tariff-sanctions, reputation-narrative, geopolitical-conflict

**Themes — Bundle:**
- AI → `ai` ✅ (43)
- AI governance → `ai-governance` ✅ (13), `ai-safety` ✅ (4)
- AI geopolitics → `ai-geopolitics` ✅ (14), `ai-competition` ✅ (4)
- Cybersecurity → `cybersecurity` ✅ (18)
- Ransomware → `ransomware` ✅ (13)
- Deepfake → `deepfake` ✅ (13), `deepfakes` ✅ (3)

**Themes — Additional:**
- NVIDIA / chip race → `nvidia` ✅ (14)
- AI infrastructure → `ai-infrastructure` ✅ (6)
- Semiconductors → `semiconductors` ✅ (4)
- Export controls → `export-controls` ✅
- US-China tech → `us-china` ✅
- Quantum computing → `quantum-computing` ✅ (5)
- Robotics → `robotics` ✅ (6)
- AI video → `ai-video` ✅ (6)
- Data breach → `data-breach` ✅, `data breach` ✅ (6)
- Regulation → `regulation` ✅
- AI race → `ai-race` ✅ (3)
- AI discovery → `ai-discovery` ✅ (4)
- Jailbreak → `jailbreak` ✅ (5)
- Capability scaling → `capability-scaling` ✅ (4)

**Watchlist — Bundle:**
- NVIDIA ✅
- China, US, Taiwan ✅
- EU regulation (AI Act) → `eu` ✅ + `ai-governance` ✅

**Watchlist — Additional:**
- UK ✅, Israel ✅, South Korea ✅
- Musk → `musk` ✅
- OpenAI, Anthropic, Google, Microsoft, Meta, Apple, Amazon ⚠ (use `amazon` ✅)
- Gemini → `gemini` ✅ (3)
- TSMC, Samsung, Intel, ARM ⚠

**Supply chain — Bundle:**
- Semiconductors ✅
- AI infrastructure ✅
- Data systems (cybersecurity) ✅

**Supply chain — Additional:**
- GPUs ⚠, Memory chips ⚠, Fabrication capacity ⚠, Cloud infrastructure ⚠, Rare earths ⚠

---

## 11. Telecommunications

**Risk defaults:** cyber-technology, regulatory-policy, geopolitical-conflict, trade-tariff-sanctions, labour-workforce

**Themes — Bundle:**
- Cybersecurity → `cybersecurity` ✅
- Ransomware → `ransomware` ✅
- Regulation → `regulation` ✅, `policy` ✅
- Infrastructure risk → `infrastructure-risk` ✅, `infrastructure-disruption` ✅
- Data breach → `data-breach` ✅
- US-China tech → `us-china` ✅

**Themes — Additional:**
- AI → `ai` ✅
- AI infrastructure → `ai-infrastructure` ✅
- Disinformation → `disinformation` ✅ (9)
- Censorship → `censorship` ✅ (6)
- Sanctions / export controls ✅
- Semiconductors ✅
- Sabotage (cable cuts) → `sabotage` ✅
- Space / satellites → `space` ✅ (9), `spacex` ✅ (4)

**Watchlist — Bundle:**
- China, US, EU ✅
- Huawei ⚠

**Watchlist — Additional:**
- India, UK, Russia, South Korea ✅
- ITU, FCC, Ofcom ⚠
- Ericsson / Nokia / Huawei / ZTE ⚠
- SpaceX → `spacex` ✅, Starlink ⚠

**Supply chain — Bundle:**
- Semiconductors ✅
- Infrastructure ✅

**Supply chain — Additional:**
- Undersea cables ⚠, Satellites ⚠, Base stations ⚠, Fibre optics ⚠, Rare earths ⚠

---

## 12. Pharmaceuticals / Biotech

**Risk defaults:** regulatory-policy, supply-chain-disruption, reputation-narrative, cyber-technology, labour-workforce

**Themes — Bundle:**
- Regulation → `regulation` ✅ (18), `policy` ✅
- Medical breakthrough → `medical-breakthrough` ✅ (9), `medical-innovation` ✅ (4)
- Disease treatment → `disease-treatment` ✅ (4)
- Vaccines → `vaccine` ✅ (8), `vaccines` ✅ (3), `vaccination` ✅ (6)
- Antibiotic resistance → `antibiotic-resistance` ✅ (4)
- Supply chain → `supply-chain` ✅

**Themes — Additional:**
- Breakthrough → `breakthrough` ✅ (16)
- Regenerative medicine → `regenerative-medicine` ✅ (4)
- Tissue engineering → `tissue-engineering` ✅ (4)
- CRISPR → `crispr` ✅ (4)
- Public health → `public-health` ✅, `public-health-crisis` ✅
- Outbreak → `outbreak` ✅, `disease-outbreak` ✅
- Funding → `funding` ✅
- Research → `research` ✅
- Respiratory → `respiratory` ✅ (4), `nasal-spray` ✅ (4)
- Mental health → `mental-health` ✅ (6), `mental health` ✅
- AI discovery → `ai-discovery` ✅
- Organic chemistry → `organic-chemistry` ✅ (4)
- WHO → `who` ✅ (8)

**Watchlist — Bundle:**
- US (FDA), EU (EMA) ✅
- WHO ✅
- India, China ✅

**Watchlist — Additional:**
- UK, Japan, Brazil ✅
- FDA, EMA, MHRA ⚠
- Gavi ⚠, MSF ⚠
- Pfizer, Moderna, Merck, GSK, Sanofi, Lilly, Novo Nordisk ⚠

**Supply chain — Bundle:**
- Supply chain ✅
- Research funding ✅

**Supply chain — Additional:**
- Active pharmaceutical ingredients (APIs) ⚠, India-based APIs ⚠, China-based APIs ⚠, Cold chain ⚠

---

## 13. Healthcare / Medical Services

**Risk defaults:** regulatory-policy, labour-workforce, cyber-technology, reputation-narrative, climate-environmental

**Themes — Bundle:**
- Healthcare → `healthcare` ✅ (12)
- Public health → `public-health` ✅ (10), `public-health-crisis` ✅ (4)
- Outbreak → `outbreak` ✅ (12), `disease-outbreak` ✅ (7)
- Measles → `measles` ✅ (13)
- Regulation → `regulation` ✅
- Healthcare access → `healthcare-access` ✅ (4)

**Themes — Additional:**
- Aging → `aging` ✅ (4)
- Mental health → `mental-health` ✅, `depression` ✅ (5), `anxiety` ✅ (5)
- Vaccination decline → `vaccination-decline` ✅ (4)
- Nipah → `nipah` ✅ (5)
- Medical innovation → `medical-innovation` ✅ (4)
- Cybersecurity → `cybersecurity` ✅
- Data breach → `data-breach` ✅
- Respiratory → `respiratory` ✅
- Neuroscience → `neuroscience` ✅ (4)
- Humanitarian crisis → `humanitarian-crisis` ✅ (8)
- WHO ✅

**Watchlist — Bundle:**
- WHO ✅
- US, UK, EU ✅
- Africa (outbreak-prone regions) ✅

**Watchlist — Additional:**
- India, China, Nigeria, DRC Congo ⚠
- FDA, CDC, NHS ⚠

**Supply chain — Bundle:**
- Public health systems ✅
- Supply chain ✅

**Supply chain — Additional:**
- Medical equipment ⚠, PPE ⚠, Oxygen ⚠, Staffing ⚠, Generic drugs ⚠

---

## 14. Construction / Infrastructure

**Risk defaults:** commodity-price-volatility, regulatory-policy, climate-environmental, labour-workforce, supply-chain-disruption

**Themes — Bundle:**
- Infrastructure → `infrastructure` ✅ (8), `infrastructure-risk` ✅, `infrastructure-disruption` ✅
- Extreme weather → `extreme-weather` ✅
- Flooding → `flooding` ✅
- Energy → `energy` ✅
- Supply chain → `supply-chain` ✅
- Regulation → `regulation` ✅

**Themes — Additional:**
- Climate → `climate` ✅
- Manufacturing → `manufacturing` ✅
- Inflation → `inflation` ✅
- Investment → `investment` ✅
- Tariffs → `tariffs` ✅
- Infrastructure fragility → `infrastructure-fragility` ✅ (4)
- Natural disaster → `natural-disaster` ✅
- Earthquake → `earthquake` ✅
- Labour / strikes → `strikes` ✅

**Watchlist — Bundle:**
- US, China, EU ✅
- Saudi Arabia, UAE (Gulf megaprojects) ✅

**Watchlist — Additional:**
- India, Vietnam, Bangladesh ✅
- Major contractors / developers ⚠

**Supply chain — Bundle:**
- Energy ✅
- Supply chain vulnerability ✅

**Supply chain — Additional:**
- Steel ⚠, Cement ⚠, Copper ⚠, Aluminium ⚠, Labour ✅ (via labor/strikes)

---

## 15. Real Estate / Property

**Risk defaults:** currency-financial, regulatory-policy, climate-environmental, commodity-price-volatility, reputation-narrative

**Themes — Bundle:**
- Inflation / interest rates → `inflation` ✅
- Regulation → `regulation` ✅
- Climate → `climate` ✅
- Extreme weather → `extreme-weather` ✅
- Economy → `economy` ✅
- Investment → `investment` ✅

**Themes — Additional:**
- Flooding → `flooding` ✅
- Natural disaster → `natural-disaster` ✅
- Demographics → `demographics` ✅ (5)
- Migration / immigration → `migration` ✅, `immigration` ✅
- Labour / construction costs → `layoffs` ✅, `labour-workforce`
- Capital flows → `capital-flows` ✅
- Markets → `markets` ✅
- Sustainability / green buildings ⚠
- Housing policy ⚠, Mortgage rates ⚠, Housing starts ⚠

**Watchlist — Bundle:**
- US, UK, China, EU ✅

**Watchlist — Additional:**
- India, Australia, Canada ✅
- Fed / ECB / BoE ⚠

**Supply chain — Bundle:**
- Construction materials (via `manufacturing`) ✅
- Energy ✅

**Supply chain — Additional:**
- Cement ⚠, Steel ⚠, Labour ⚠, Timber ⚠

---

## 16. Retail / Consumer Goods

**Risk defaults:** commodity-price-volatility, supply-chain-disruption, currency-financial, cyber-technology, reputation-narrative

**Themes — Bundle:**
- Economy → `economy` ✅, `economic-impact` ✅
- Inflation → `inflation` ✅
- Tariffs → `tariffs` ✅
- Trade → `trade` ✅, `trade-war` ✅
- Supply chain → `supply-chain` ✅
- Cybersecurity / data breach → `cybersecurity` ✅, `data-breach` ✅

**Themes — Additional:**
- AI → `ai` ✅
- Regulation → `regulation` ✅
- Markets → `markets` ✅
- Earnings → `earnings` ✅
- Deepfake → `deepfake` ✅ (brand risk)
- Disinformation → `disinformation` ✅
- Social media → `social-media` ✅ (4)
- Consumer confidence ⚠, E-commerce ⚠, Holiday shopping ⚠, Retail sales ⚠

**Watchlist — Bundle:**
- US, China, EU ✅
- Amazon → `amazon` ✅ (4)

**Watchlist — Additional:**
- India, UK, Japan, Brazil ✅
- Walmart, Costco, Alibaba, Shein, Temu ⚠

**Supply chain — Bundle:**
- Supply chain ✅
- Energy / fuel ✅ (logistics costs)
- Tariffs ✅

**Supply chain — Additional:**
- Port / shipping (via `hormuz` ✅, `shipping` ✅)
- Commodity inputs ⚠ (cotton, palm-oil, cocoa)

---

## 17. Hospitality / Tourism / Leisure

**Risk defaults:** geopolitical-conflict, climate-environmental, reputation-narrative, currency-financial, cyber-technology

**Themes — Bundle:**
- Tourism → `tourism` ✅ (6)
- Extreme weather → `extreme-weather` ✅
- Conflict / war → `conflict` ✅, `war` ✅, `iran-war` ✅
- Airlines → `airlines` ✅
- Fuel costs → `fuel` ✅, `oil-prices` ✅
- Economy / inflation → `economy` ✅, `inflation` ✅

**Themes — Additional:**
- Climate → `climate` ✅
- Heatwave → `heatwave` ✅
- Natural disaster → `natural-disaster` ✅
- Terrorism → `terrorism` ✅ (8)
- Security → `security` ✅
- Entertainment → `entertainment` ✅ (6)
- Culture / cultural milestone → `culture` ✅, `cultural-milestone` ✅ (4)
- Disease outbreak → `disease-outbreak` ✅
- Data breach → `data-breach` ✅
- Migration → `migration` ✅

**Watchlist — Bundle:**
- Middle East (Hormuz, Iran, Israel) ✅
- EU, US, UK ✅

**Watchlist — Additional:**
- Saudi Arabia, UAE, Turkey, Thailand, Japan, Mexico ✅
- IATA ⚠, Major hotel groups / airlines ⚠

**Supply chain — Bundle:**
- Energy / fuel ✅
- Airlines ✅

**Supply chain — Additional:**
- Food supply chain (via `food-security` ✅), Labour ⚠, Immigration ✅

---

## 18. Media / Publishing / Advertising

**Risk defaults:** reputation-narrative, cyber-technology, regulatory-policy, geopolitical-conflict, labour-workforce

**Themes — Bundle:**
- Disinformation → `disinformation` ✅ (9)
- Deepfake → `deepfake` ✅, `deepfakes` ✅
- Censorship → `censorship` ✅ (6)
- AI video → `ai-video` ✅ (6)
- AI → `ai` ✅
- Journalism → `journalism` ✅ (4)

**Themes — Additional:**
- Propaganda → `propaganda` ✅ (4)
- Misinformation → `misinformation` ✅ (4)
- Hybrid warfare → `hybrid-warfare` ✅ (5)
- Information warfare → `information-warfare` ✅ (3)
- Cybersecurity → `cybersecurity` ✅
- Data breach → `data-breach` ✅
- Regulation → `regulation` ✅
- Election → `election` ✅, `midterms` ✅ (3)
- Social media → `social-media` ✅
- Algorithms → `algorithms` ✅ (3)
- Soft power → `soft-power` ✅ (4)
- Entertainment → `entertainment` ✅
- Attribution → `attribution` ✅ (3)

**Watchlist — Bundle:**
- US, EU, China ✅
- Trump → `trump` ✅

**Watchlist — Additional:**
- UK, Russia, India ✅
- X / Twitter ⚠, Meta ⚠, Google ⚠, TikTok ⚠
- Musk → `musk` ✅
- Ofcom ⚠, EU DSA ⚠, FCC ⚠

**Supply chain — Bundle:** n/a

---

## 19. Government / Public Sector

**Risk defaults:** geopolitical-conflict, regulatory-policy, trade-tariff-sanctions, cyber-technology, reputation-narrative

**Themes — Bundle:**
- Diplomacy → `diplomacy` ✅ (43)
- Geopolitics → `geopolitics` ✅ (31), `geopolitical-tension` ✅
- Policy → `policy` ✅ (15)
- Regulation → `regulation` ✅
- Military → `military` ✅ (24)
- Defense → `defense` ✅ (13)

**Themes — Additional:**
- Conflict → `conflict` ✅, `war` ✅
- Sanctions → `sanctions` ✅
- NATO → `nato` ✅ (15)
- Peace talks → `peace-talks` ✅ (5)
- Migration / immigration → `migration` ✅, `immigration` ✅
- Election → `election` ✅, `midterms` ✅
- Humanitarian → `humanitarian` ✅, `humanitarian-crisis` ✅
- Disinformation → `disinformation` ✅
- Hybrid warfare → `hybrid-warfare` ✅
- Governance → `governance` ✅
- Cybersecurity → `cybersecurity` ✅
- Political instability → `political-instability` ✅
- Escalation → `escalation` ✅
- Refugees → `refugees` ✅
- Treaty withdrawal → `treaty-withdrawal` ✅ (4)
- Transatlantic split → `transatlantic-split` ✅ (4)

**Watchlist — Bundle:**
- NATO ✅, EU ✅, G7 ✅
- China, Russia, US, Iran ✅

**Watchlist — Additional:**
- UN ✅, Ukraine, Israel ✅, India ✅
- Trump → `trump` ✅

**Supply chain — Bundle:** n/a (policy-driven)

---

## 20. Defence / Aerospace / Security

**Risk defaults:** geopolitical-conflict, trade-tariff-sanctions, cyber-technology, supply-chain-disruption, regulatory-policy

**Themes — Bundle:**
- Military → `military` ✅ (24), `us-military` ✅ (5)
- Defense → `defense` ✅ (13)
- Military buildup → `military-buildup` ✅ (6)
- Military escalation → `military-escalation` ✅ (6)
- Missiles → `missiles` ✅ (6)
- NATO → `nato` ✅

**Themes — Additional:**
- War → `war` ✅, `iran-war` ✅
- Conflict → `conflict` ✅, `escalation` ✅
- Border defense → `border-defense` ✅ (4)
- Cybersecurity / cyber warfare → `cybersecurity` ✅, `ransomware` ✅
- Hybrid warfare → `hybrid-warfare` ✅
- Sabotage → `sabotage` ✅
- Threat assessment → `threat-assessment` ✅ (3)
- AI governance / autonomous weapons → `ai-governance` ✅, `ai-geopolitics` ✅
- Space / SpaceX → `space` ✅, `spacex` ✅
- Intelligence → `intelligence` ✅ (5)
- Russia threat → `russia-threat` ✅ (4)
- Regional tension → `regional-tension` ✅ (4)
- Security crisis → `security-crisis` ✅ (4)
- Nuclear → `nuclear` ✅
- Natanz (Iran nuclear site) → `natanz` ✅ (4)
- Semiconductors → `semiconductors` ✅

**Watchlist — Bundle:**
- NATO ✅, Russia ✅, China ✅, Iran ✅
- IRGC → `irgc` ✅ (5)

**Watchlist — Additional:**
- US ✅, Ukraine ✅, Israel ✅, North Korea, India, Pakistan ✅
- Hezbollah → `hezbollah` ✅ (3)
- Lockheed, Raytheon, BAE, Northrop, Rafael, L3Harris ⚠

**Supply chain — Bundle:**
- Semiconductors ✅
- Supply chain vulnerability ✅
- Energy ✅

**Supply chain — Additional:**
- Rare earths ⚠, Titanium ⚠, GPS/PNT ⚠, Satellites ⚠

---

## 21. Consulting / Advisory

**Risk defaults:** geopolitical-conflict, trade-tariff-sanctions, regulatory-policy, commodity-price-volatility, cyber-technology

**Themes — Bundle (broad by default):**
- Geopolitics → `geopolitics` ✅
- Trade → `trade` ✅, `tariffs` ✅
- Regulation → `regulation` ✅
- Economy → `economy` ✅
- AI → `ai` ✅
- Supply chain → `supply-chain` ✅

**Themes — Additional:**
- Climate → `climate` ✅
- Energy → `energy` ✅, `energy-transition` ✅
- Sanctions → `sanctions` ✅
- Cybersecurity → `cybersecurity` ✅
- Markets → `markets` ✅
- Healthcare → `healthcare` ✅
- Inflation → `inflation` ✅
- Ransomware → `ransomware` ✅
- Defense → `defense` ✅
- Migration → `migration` ✅

**Watchlist — Bundle:**
- US, China, EU ✅
- Trump → `trump` ✅

**Watchlist — Additional:**
- Russia, Iran, India, Japan, UK ✅
- G7, NATO, UN ✅

**Supply chain — Bundle:**
- Supply chain ✅
- Energy ✅

**Supply chain — Additional:**
- Varies by client — broad list of commodities

**Note:** Consulting firms serve diverse clients. Recommend building a "Broad intelligence" preset that mixes defaults from top 5 sectors.

---

## 22. Legal / Compliance

**Risk defaults:** regulatory-policy, trade-tariff-sanctions, cyber-technology, reputation-narrative, geopolitical-conflict

**Themes — Bundle:**
- Sanctions → `sanctions` ✅
- Regulation → `regulation` ✅
- Policy → `policy` ✅
- Export controls → `export-controls` ✅
- Trade → `trade` ✅, `tariffs` ✅
- Legal → `legal` ✅ (5)

**Themes — Additional:**
- Cybersecurity → `cybersecurity` ✅
- Data breach → `data-breach` ✅
- AI governance → `ai-governance` ✅, `ai-safety` ✅
- Ransomware → `ransomware` ✅
- Regulation → `regulation` ✅
- Political instability → `political-instability` ✅
- Trump → `trump` ✅
- Corruption → `corruption` ✅ (4)
- Fraud → `fraud` ✅
- Supreme Court → `supreme-court` ✅ (4)
- Democracy → `democracy` ✅ (4)

**Watchlist — Bundle:**
- US, EU, UK, China ✅
- Trump → `trump` ✅

**Watchlist — Additional:**
- Russia, Iran ✅
- OFAC ⚠, SEC ⚠, DOJ ⚠, FCA ⚠, ESMA ⚠

**Supply chain — Bundle:** n/a (regulatory/advisory)

---

## 23. Education / Research / Academia

**Risk defaults:** regulatory-policy, geopolitical-conflict, cyber-technology, labour-workforce, reputation-narrative

**Themes — Bundle:**
- Education → `education` ✅ (7)
- Research → `research` ✅ (6)
- AI → `ai` ✅
- AI governance → `ai-governance` ✅
- Funding → `funding` ✅ (10)
- Regulation → `regulation` ✅

**Themes — Additional:**
- Technology → `technology` ✅
- Immigration / student mobility → `immigration` ✅, `migration` ✅
- Censorship → `censorship` ✅
- Discovery → `discovery` ✅
- Breakthrough → `breakthrough` ✅
- Innovation → `innovation` ✅ (7)
- Policy → `policy` ✅
- Academic freedom ⚠
- Public-private research ⚠

**Watchlist — Bundle:**
- US, China, EU, UK ✅

**Watchlist — Additional:**
- India, Japan, Australia ✅
- Trump → `trump` ✅ (funding cuts)
- NSF, NIH, Horizon Europe ⚠

**Supply chain — Bundle:**
- Research funding ✅
- Cybersecurity ✅

---

## 24. NGO / Humanitarian / Development

**Risk defaults:** food-water-security, climate-environmental, geopolitical-conflict, reputation-narrative, regulatory-policy

**Themes — Bundle:**
- Humanitarian → `humanitarian` ✅ (9), `humanitarian-crisis` ✅ (8)
- Food security → `food-security` ✅
- Famine / hunger → `famine` ✅, `hunger` ✅
- Refugees → `refugees` ✅ (6)
- Displacement → `displacement` ✅ (5)
- Migration → `migration` ✅

**Themes — Additional:**
- Climate → `climate` ✅, `climate-impact` ✅
- Extreme weather → `extreme-weather` ✅
- Drought → `drought` ✅
- Flooding → `flooding` ✅
- Public health → `public-health` ✅
- Outbreak → `outbreak` ✅
- War → `war` ✅, `conflict` ✅
- Sahel → `sahel` ✅
- Global south → `global-south` ✅ (9)
- WFP → `wfp` ✅
- WHO → `who` ✅
- Violence → `violence` ✅ (6)
- Casualties → `casualties` ✅
- Inequality → `inequality` ✅ (3)
- Healthcare access → `healthcare-access` ✅

**Watchlist — Bundle:**
- WFP ✅, WHO ✅
- Sahel ✅, Sudan ✅, Gaza ✅

**Watchlist — Additional:**
- Yemen, Afghanistan ✅, Lebanon, Nigeria, Niger ✅
- UN ✅, MSF ⚠, Oxfam ⚠, IFRC ⚠

**Supply chain — Bundle:**
- Food supply chain (via `food-security`) ✅
- Humanitarian corridors ⚠

**Supply chain — Additional:**
- Funding flows ✅ (via `funding`)

---

## 25. Other / Custom

No pre-selected bundle. User has access to all themes, entities, and supply chain options across sectors. Default risk priorities: supply-chain-disruption, commodity-price-volatility, geopolitical-conflict, regulatory-policy, cyber-technology.

Recommend surfacing a "Browse by sector" helper that shows the bundle from any sector they click.

---

# Gap Analysis: What's Missing from Scan Tags

Across all 24 real sectors, these tag categories appear in many bundles but are **not yet emitted by the scan prompt**. These are the highest-value additions for the scan generator:

### Commodities (would strengthen 8 sectors — Food/Ag, Manufacturing, Mining, Energy, Construction, Defence, Retail, Hospitality)
```
wheat, corn, rice, soy, coffee, cocoa, palm-oil, sugar, beef
steel, aluminium, copper, nickel, cobalt, zinc, tin, lithium
rare-earths, uranium, gold, silver, titanium
lng, naphtha, diesel, jet-fuel, coal, hydrogen, bunker-fuel
```

### Trade routes (Logistics, Aviation, Energy, Food/Ag)
```
red-sea, suez, panama-canal, strait-of-malacca, bosphorus
bab-el-mandeb, cape-of-good-hope, dover-strait
pipelines, lng-terminals, undersea-cables
```

### Major companies (Finance, Tech, Logistics, Pharma, Defence, Retail)
```
maersk, msc, cosco, evergreen
aramco, shell, bp, exxon, gazprom, chevron
tsmc, samsung, intel, broadcom, arm, huawei
openai, anthropic, google, microsoft, meta
pfizer, moderna, merck, gsk, sanofi, lilly, novo-nordisk
jpmorgan, goldman, blackrock, apollo, kkr
lockheed, raytheon, bae, northrop
amazon (✅ exists), walmart, alibaba, shein
```

### Regulators / central banks (Banking, Legal, Tech, Pharma)
```
fed, ecb, boj, pboc
sec, fca, cftc, esma
fda, ema, mhra, cdc
ofac, fincen, eu-sanctions
ftc, cma, eu-competition
```

### Sector-specific (Insurance, Real Estate, Retail, Aviation, Telecom)
```
housing-starts, mortgage-rates, building-permits, cement, rebar
consumer-confidence, retail-sales, e-commerce, holiday-shopping
airspace-closures, sustainable-aviation-fuel, mro
undersea-cables, base-stations, fibre-optics
```

Recommend adding these to the scan prompt as "tag these if mentioned" — pure addition, no removal of existing tags.

---

# Taxonomy Structure for Code

When this ships into code (new file `src/lib/onboarding-taxonomy.ts`), the shape should be:

```ts
export interface SectorDefinition {
  id: string;                             // e.g. "logistics-shipping"
  label: string;                          // e.g. "Logistics / Shipping / Freight"
  color: string;                          // Tailwind color key for sector button
  defaultRisks: string[];                 // 5 risk-priority IDs
}

export interface TaxonomyOption {
  value: string;                          // canonical lowercase (matches scan tags)
  label: string;                          // display label
  scanTags: string[];                     // one or more scan tags this option scores against
  category?: string;                      // grouping (e.g. "Commodities", "Routes", "Companies")
}

export interface SectorBundle {
  sectorId: string;
  themes: {
    bundle: string[];                     // option values pre-selected
    additional: string[];                 // option values shown below the bundle
  };
  watchlist: { bundle: string[]; additional: string[]; };
  supplyChain: { bundle: string[]; additional: string[]; };
}

export const SECTORS: SectorDefinition[] = [...];
export const THEME_CATALOG: TaxonomyOption[] = [...];
export const WATCHLIST_CATALOG: TaxonomyOption[] = [...];
export const SUPPLY_CHAIN_CATALOG: TaxonomyOption[] = [...];
export const SECTOR_BUNDLES: Record<string, SectorBundle> = {...};
```

Key principle: each `TaxonomyOption` maps to one or more scan tags so the relevance engine scores correctly. Bundles reference option values; the catalogs are the actual lookup source.

---

# Taxonomy Coverage Summary

| Sector | Theme scan-coverage | Noteworthy gaps |
|---|---|---|
| Government / Public Sector | Excellent — 17/17 match | Minimal |
| Media / Publishing | Excellent — 14/14 match | Platform entities (X, Meta etc) |
| Technology / Software | Excellent — 14/15 match | AI lab entities |
| Energy / Utilities | Excellent — 15/15 match | LNG/uranium commodities |
| Government has strongest tag support; bundle-only option would work today without scan prompt changes |
| Defence / Aerospace | Strong — 15/16 match | Aerospace company entities |
| NGO / Humanitarian | Strong — 15/15 match | Specific NGO names |
| Banking / Financial | Strong — 12/13 match | Central bank names |
| Healthcare / Medical | Strong — 11/11 match | Regulator names |
| Insurance | Strong — 11/12 match | Insurer names |
| Pharma / Biotech | Strong — 13/13 match | API supply chain |
| Education / Research | Moderate — 8/10 match | Academic freedom tags |
| Hospitality / Tourism | Moderate — 10/10 match | Tourism stats |
| Retail / Consumer | Moderate — 9/13 match | Retail-specific metrics, companies |
| Aviation / Transport | Moderate — 9/13 match | Airspace, aviation fuel |
| Legal / Compliance | Moderate — 9/10 match | Regulator names |
| Consulting / Advisory | Moderate — broad by design | Varies |
| Telecommunications | Moderate — 7/10 match | Infrastructure components |
| Investment / Asset Mgmt | Moderate — 11/11 match | AI lab/Fed entities |
| Real Estate | Weak — 6/12 match | Housing metrics absent |
| Food / Agriculture | Weak — 11/15 match | Crop commodity tags absent |
| Logistics / Shipping | Weak — 13/15 match | Route names absent |
| Construction / Infra | Weak — 10/13 match | Material tags absent |
| Manufacturing | Weak — 11/15 match | Industrial metals absent |
| Mining / Resources | Weak — 6/14 match | Mineral tags absent |

**Five sectors have critical gaps** (Real Estate, Food/Ag, Construction, Manufacturing, Mining). These all need the same fix — commodity tag expansion in the scan prompt — so it's a single intervention that unlocks all five.

---

# Design Principles

1. **Every option maps to a real scan tag OR is flagged with ⚠.** Relevance engine is the ground truth.
2. **Bundle is ≤ 7 items** to keep the selected state visually calm on load.
3. **Additional is shown below the bundle**, in a smaller label ("Additional options for your sector"), lightweight click-to-add.
4. **Custom input sits at the bottom** of each dropdown — lowercase-only — marked "Custom (may not score if not in scan data)".
5. **Sector is the anchor choice.** Everything else cascades from it. Editable without redoing the sector.
6. **Case insensitive everywhere.** Scan tags are inconsistent (Iran vs iran). Relevance engine already lowercases; dropdown values must also be lowercase.
7. **No bundle is final.** Users can remove any default and add anything. The bundle is a shortcut, not a constraint.

---

# Open Decisions

1. **Should bundles include ⚠ (gap) options?** Current draft: yes, but labelled so the user knows they're "tracked but may not score yet". Alternative: exclude until scan prompt catches up.
2. **Should sector colour persist on the bundle chips?** Current sector-picker uses coloured buttons; bundles could inherit the sector colour for visual continuity.
3. **Max 25 bundled items per sector** OR tier-aware (Pro 10, Team 15, Company Intelligence 25)? Recommend tier-aware.
4. **Should Consulting/Advisory have a mixed-sector preset?** Consulting firms serve multiple industries. Could offer "Broad intelligence" preset that pulls from top 5 general themes.

---

_Source: live scan tag data pulled 2026-04-15. Top 300 tags reviewed._
_Next step: when building the onboarding redesign, translate this document into `src/lib/onboarding-taxonomy.ts` using the shape above._
