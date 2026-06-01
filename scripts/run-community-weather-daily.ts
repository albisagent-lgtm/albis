#!/usr/bin/env tsx
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env.postiz') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.postiz') });

type CitySeed = { name: string; country: string; region?: string };
type City = CitySeed & { latitude: number; longitude: number; timezone?: string; population?: number | null };
type Article = { title: string; url: string; sourceCountry?: string; source?: string; seenDate?: string; domain?: string };
type CityWeatherReport = {
  city: City;
  observedAt: string;
  current: {
    temperatureC: number | null;
    apparentTemperatureC: number | null;
    precipitationMm: number | null;
    windKph: number | null;
    weatherCode: number | null;
    description: string;
  };
  daily: {
    maxTempC: number | null;
    minTempC: number | null;
    precipitationMm: number | null;
    maxWindKph: number | null;
  };
  riskLevel: 'low' | 'watch' | 'elevated' | 'high';
  riskReasons: string[];
  mediaSignals: Article[];
  communityLearning: string[];
  status: 'routine' | 'media-mentioned' | 'weather-watch' | 'community-watch-needed';
};

type RunOutput = {
  date: string;
  generatedAt: string;
  scope: string;
  methodology: string[];
  reports: CityWeatherReport[];
  socialPost: string;
};

const TOP_100_CITY_SEEDS: CitySeed[] = [
  { name: 'Tokyo', country: 'Japan' }, { name: 'Delhi', country: 'India' }, { name: 'Shanghai', country: 'China' },
  { name: 'Dhaka', country: 'Bangladesh' }, { name: 'Sao Paulo', country: 'Brazil' }, { name: 'Cairo', country: 'Egypt' },
  { name: 'Mexico City', country: 'Mexico' }, { name: 'Beijing', country: 'China' }, { name: 'Mumbai', country: 'India' },
  { name: 'Osaka', country: 'Japan' }, { name: 'Karachi', country: 'Pakistan' }, { name: 'Chongqing', country: 'China' },
  { name: 'Istanbul', country: 'Turkey' }, { name: 'Buenos Aires', country: 'Argentina' }, { name: 'Kolkata', country: 'India' },
  { name: 'Kinshasa', country: 'Democratic Republic of the Congo' }, { name: 'Lagos', country: 'Nigeria' }, { name: 'Manila', country: 'Philippines' },
  { name: 'Tianjin', country: 'China' }, { name: 'Guangzhou', country: 'China' }, { name: 'Rio de Janeiro', country: 'Brazil' },
  { name: 'Lahore', country: 'Pakistan' }, { name: 'Bangalore', country: 'India' }, { name: 'Shenzhen', country: 'China' },
  { name: 'Moscow', country: 'Russia' }, { name: 'Chennai', country: 'India' }, { name: 'Bogota', country: 'Colombia' },
  { name: 'Paris', country: 'France' }, { name: 'Jakarta', country: 'Indonesia' }, { name: 'Lima', country: 'Peru' },
  { name: 'Bangkok', country: 'Thailand' }, { name: 'Hyderabad', country: 'India' }, { name: 'Seoul', country: 'South Korea' },
  { name: 'Nagoya', country: 'Japan' }, { name: 'London', country: 'United Kingdom' }, { name: 'Chengdu', country: 'China' },
  { name: 'Nanjing', country: 'China' }, { name: 'Tehran', country: 'Iran' }, { name: 'Ho Chi Minh City', country: 'Vietnam' },
  { name: 'Luanda', country: 'Angola' }, { name: 'Wuhan', country: 'China' }, { name: 'Xi An', country: 'China' },
  { name: 'Ahmedabad', country: 'India' }, { name: 'Kuala Lumpur', country: 'Malaysia' }, { name: 'New York', country: 'United States' },
  { name: 'Hangzhou', country: 'China' }, { name: 'Surat', country: 'India' }, { name: 'Suzhou', country: 'China' },
  { name: 'Hong Kong', country: 'China' }, { name: 'Riyadh', country: 'Saudi Arabia' }, { name: 'Shenyang', country: 'China' },
  { name: 'Baghdad', country: 'Iraq' }, { name: 'Dongguan', country: 'China' }, { name: 'Foshan', country: 'China' },
  { name: 'Dar es Salaam', country: 'Tanzania' }, { name: 'Pune', country: 'India' }, { name: 'Santiago', country: 'Chile' },
  { name: 'Madrid', country: 'Spain' }, { name: 'Haerbin', country: 'China' }, { name: 'Toronto', country: 'Canada' },
  { name: 'Belo Horizonte', country: 'Brazil' }, { name: 'Singapore', country: 'Singapore' }, { name: 'Khartoum', country: 'Sudan' },
  { name: 'Johannesburg', country: 'South Africa' }, { name: 'Dalian', country: 'China' }, { name: 'Qingdao', country: 'China' },
  { name: 'Zhengzhou', country: 'China' }, { name: 'Ji Nan', country: 'China' }, { name: 'Barcelona', country: 'Spain' },
  { name: 'Saint Petersburg', country: 'Russia' }, { name: 'Yangon', country: 'Myanmar' }, { name: 'Alexandria', country: 'Egypt' },
  { name: 'Fukuoka', country: 'Japan' }, { name: 'Abidjan', country: 'Cote d Ivoire' }, { name: 'Guadalajara', country: 'Mexico' },
  { name: 'Ankara', country: 'Turkey' }, { name: 'Chittagong', country: 'Bangladesh' }, { name: 'Melbourne', country: 'Australia' },
  { name: 'Sydney', country: 'Australia' }, { name: 'Monterrey', country: 'Mexico' }, { name: 'Addis Ababa', country: 'Ethiopia' },
  { name: 'Nairobi', country: 'Kenya' }, { name: 'Cape Town', country: 'South Africa' }, { name: 'Berlin', country: 'Germany' },
  { name: 'Casablanca', country: 'Morocco' }, { name: 'Jeddah', country: 'Saudi Arabia' }, { name: 'Rome', country: 'Italy' },
  { name: 'Kabul', country: 'Afghanistan' }, { name: 'Hanoi', country: 'Vietnam' }, { name: 'Montreal', country: 'Canada' },
  { name: 'Busan', country: 'South Korea' }, { name: 'Kano', country: 'Nigeria' }, { name: 'Dubai', country: 'United Arab Emirates' },
  { name: 'Athens', country: 'Greece' }, { name: 'Lisbon', country: 'Portugal' }, { name: 'Warsaw', country: 'Poland' },
  { name: 'Kyiv', country: 'Ukraine' }, { name: 'Auckland', country: 'New Zealand' }, { name: 'Reykjavik', country: 'Iceland' },
  { name: 'Honolulu', country: 'United States' },
];

function getDateArg(): string {
  const dateFlag = process.argv.find((arg) => arg.startsWith('--date='));
  if (dateFlag) return dateFlag.split('=')[1];
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.ALBIS_REPORT_TIMEZONE || 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function numberFlag(name: string, fallback: number): number {
  const flag = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  if (!flag) return fallback;
  const n = Number(flag.split('=')[1]);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function stringFlag(name: string, fallback: string): string {
  const flag = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return flag ? flag.split('=').slice(1).join('=') : fallback;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try { return JSON.parse(await fs.readFile(filePath, 'utf8')) as T; } catch { return null; }
}

async function fetchJson(url: string, timeoutMs = 15000): Promise<any> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'user-agent': 'Albis community weather scanner/0.1' } });
    const text = await res.text();
    if (!res.ok) throw new Error(`${res.status} ${text}`.trim());
    return text ? JSON.parse(text) : {};
  } finally {
    clearTimeout(t);
  }
}

let lastGdeltRequestAt = 0;
async function waitForGdeltSlot() {
  const delayMs = numberFlag('gdelt-delay-ms', 5200);
  const elapsed = Date.now() - lastGdeltRequestAt;
  if (elapsed < delayMs) await new Promise((r) => setTimeout(r, delayMs - elapsed));
  lastGdeltRequestAt = Date.now();
}

async function resolveCities(seeds: CitySeed[]): Promise<City[]> {
  const cachePath = path.resolve(process.cwd(), 'data/community-weather/city-cache.json');
  await ensureDir(path.dirname(cachePath));
  const cache = (await readJson<Record<string, City>>(cachePath)) || {};
  const resolved: City[] = [];

  for (const seed of seeds) {
    const key = `${seed.name}|${seed.country}`.toLowerCase();
    if (cache[key]) { resolved.push(cache[key]); continue; }
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(seed.name)}&count=10&language=en&format=json`;
    const data = await fetchJson(url);
    const match = (data.results || []).find((r: any) => String(r.country || '').toLowerCase() === seed.country.toLowerCase()) || data.results?.[0];
    if (!match) continue;
    const city: City = {
      name: seed.name,
      country: seed.country,
      region: match.admin1 || seed.region,
      latitude: Number(match.latitude),
      longitude: Number(match.longitude),
      timezone: match.timezone,
      population: match.population ?? null,
    };
    cache[key] = city;
    resolved.push(city);
    await new Promise((r) => setTimeout(r, 120));
  }

  await fs.writeFile(cachePath, JSON.stringify(cache, null, 2));
  return resolved;
}

function weatherDescription(code: number | null): string {
  if (code == null) return 'unknown';
  const map: Record<number, string> = {
    0: 'clear', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast', 45: 'fog', 48: 'depositing rime fog',
    51: 'light drizzle', 53: 'drizzle', 55: 'dense drizzle', 61: 'slight rain', 63: 'rain', 65: 'heavy rain',
    71: 'slight snow', 73: 'snow', 75: 'heavy snow', 80: 'rain showers', 81: 'rain showers', 82: 'violent rain showers',
    95: 'thunderstorm', 96: 'thunderstorm with hail', 99: 'severe thunderstorm with hail',
  };
  return map[code] || `weather code ${code}`;
}

function classifyRisk(current: CityWeatherReport['current'], daily: CityWeatherReport['daily']) {
  const reasons: string[] = [];
  let score = 0;
  if ((daily.precipitationMm || 0) >= 30) { score += 3; reasons.push(`heavy daily rain forecast (${daily.precipitationMm}mm)`); }
  else if ((daily.precipitationMm || 0) >= 15) { score += 2; reasons.push(`notable rain forecast (${daily.precipitationMm}mm)`); }
  if ((daily.maxWindKph || 0) >= 70) { score += 3; reasons.push(`damaging wind risk (${daily.maxWindKph}km/h gusts/wind)`); }
  else if ((daily.maxWindKph || 0) >= 45) { score += 2; reasons.push(`strong wind risk (${daily.maxWindKph}km/h)`); }
  if ((daily.maxTempC || 0) >= 40 || (current.apparentTemperatureC || 0) >= 40) { score += 3; reasons.push('extreme heat signal'); }
  else if ((daily.maxTempC || 0) >= 35 || (current.apparentTemperatureC || 0) >= 35) { score += 2; reasons.push('heat watch signal'); }
  if ((daily.minTempC ?? 99) <= -10) { score += 2; reasons.push('severe cold signal'); }
  if ([95, 96, 99, 82].includes(current.weatherCode || -1)) { score += 2; reasons.push(`active ${current.description}`); }
  if (score >= 5) return { level: 'high' as const, reasons };
  if (score >= 3) return { level: 'elevated' as const, reasons };
  if (score >= 1) return { level: 'watch' as const, reasons };
  return { level: 'low' as const, reasons: ['no major automated weather threshold triggered'] };
}

async function fetchWeather(city: City): Promise<Pick<CityWeatherReport, 'current' | 'daily' | 'observedAt' | 'riskLevel' | 'riskReasons'>> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(city.latitude));
  url.searchParams.set('longitude', String(city.longitude));
  url.searchParams.set('current', 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m');
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '1');
  let data: any;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      data = await fetchJson(url.toString());
      break;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (attempt < 3 && message.includes('429')) {
        await new Promise((r) => setTimeout(r, 2500 * attempt));
        continue;
      }
      throw err;
    }
  }
  const current = {
    temperatureC: data.current?.temperature_2m ?? null,
    apparentTemperatureC: data.current?.apparent_temperature ?? null,
    precipitationMm: data.current?.precipitation ?? null,
    windKph: data.current?.wind_speed_10m ?? null,
    weatherCode: data.current?.weather_code ?? null,
    description: weatherDescription(data.current?.weather_code ?? null),
  };
  const daily = {
    maxTempC: data.daily?.temperature_2m_max?.[0] ?? null,
    minTempC: data.daily?.temperature_2m_min?.[0] ?? null,
    precipitationMm: data.daily?.precipitation_sum?.[0] ?? null,
    maxWindKph: data.daily?.wind_speed_10m_max?.[0] ?? null,
  };
  const risk = classifyRisk(current, daily);
  return { current, daily, observedAt: data.current?.time || new Date().toISOString(), riskLevel: risk.level, riskReasons: risk.reasons };
}

async function fetchMediaSignals(city: City, maxRecords: number): Promise<Article[]> {
  if (maxRecords <= 0) return [];
  const query = `"${city.name}" weather OR "${city.name}" storm OR "${city.name}" flood OR "${city.name}" heatwave OR "${city.name}" rain`;
  const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
  url.searchParams.set('query', query);
  url.searchParams.set('mode', 'artlist');
  url.searchParams.set('maxrecords', String(maxRecords));
  url.searchParams.set('format', 'json');
  url.searchParams.set('sort', 'hybridrel');
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await waitForGdeltSlot();
      const data = await fetchJson(url.toString(), 20000);
      return (data.articles || []).slice(0, maxRecords).map((a: any) => ({
        title: a.title || '', url: a.url || '', sourceCountry: a.sourceCountry, source: a.sourceCollection || a.domain, seenDate: a.seendate, domain: a.domain,
      })).filter((a: Article) => a.title && a.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (attempt === 1 && message.includes('limit requests')) {
        await new Promise((r) => setTimeout(r, 6500));
        continue;
      }
      return [];
    }
  }
  return [];
}

function buildCommunityLearning(city: City, weather: Pick<CityWeatherReport, 'current' | 'daily' | 'riskLevel' | 'riskReasons'>, media: Article[]): string[] {
  const lines = [`Traditional-media and public-weather scan found ${weather.riskLevel} automated weather risk in ${city.name}.`];
  if (media.length) lines.push(`${media.length} recent media signal(s) mention local weather/disruption themes.`);
  if (weather.riskLevel !== 'low') lines.push(`Community prompt: ask locals what conditions look like street-by-street, especially transport, power, flooding, heat stress, and vulnerable areas.`);
  else lines.push('Community prompt: keep this city in routine watch; invite local corrections if official/media picture misses lived conditions.');
  return lines;
}

function reportStatus(riskLevel: CityWeatherReport['riskLevel'], media: Article[]): CityWeatherReport['status'] {
  if (riskLevel === 'high' || riskLevel === 'elevated') return media.length ? 'weather-watch' : 'community-watch-needed';
  if (media.length) return 'media-mentioned';
  return 'routine';
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

async function buildReports(limit: number, mediaPerCity: number): Promise<CityWeatherReport[]> {
  const cities = (await resolveCities(TOP_100_CITY_SEEDS)).slice(0, limit);
  const weatherPackets = await mapWithConcurrency(cities, numberFlag('weather-concurrency', 2), async (city) => {
    const weather = await fetchWeather(city);
    console.log(`• ${city.name}: ${weather.riskLevel} weather signal`);
    return { city, weather };
  });

  const reports: CityWeatherReport[] = [];
  const mediaScope = stringFlag('media-scope', 'active');
  for (const { city, weather } of weatherPackets) {
    const shouldFetchMedia = mediaPerCity > 0 && (mediaScope === 'all' || weather.riskLevel !== 'low');
    const media = shouldFetchMedia ? await fetchMediaSignals(city, mediaPerCity) : [];
    reports.push({
      city,
      ...weather,
      mediaSignals: media,
      communityLearning: buildCommunityLearning(city, weather, media),
      status: reportStatus(weather.riskLevel, media),
    });
    if (mediaPerCity > 0) console.log(`  media ${city.name}: ${media.length} signal(s)`);
  }
  return reports;
}

function buildMarkdown(output: RunOutput): string {
  const active = output.reports.filter((r) => r.status !== 'routine');
  return `# Albis Community Weather Learning Report — ${output.date}\n\n${output.methodology.map((m) => `- ${m}`).join('\n')}\n\n## What we are learning from the community layer\n\nThis is the first automated form of the Albis community-media idea: start from traditional media and public weather data, then identify where human, on-the-ground context is needed.\n\n## Cities needing attention today\n\n${active.length ? active.map((r) => `### ${r.city.name}, ${r.city.country}\n- Status: ${r.status}\n- Weather: ${r.current.description}, ${r.current.temperatureC}°C feels ${r.current.apparentTemperatureC}°C; daily rain ${r.daily.precipitationMm}mm; wind ${r.daily.maxWindKph}km/h.\n- Why it matters: ${r.riskReasons.join('; ')}\n- Community learning: ${r.communityLearning.join(' ')}\n${r.mediaSignals.length ? `- Media signals:\n${r.mediaSignals.map((a) => `  - ${a.title} (${a.domain || a.source || 'source'})`).join('\n')}` : '- Media signals: none found in this automated pass.'}`).join('\n\n') : 'No non-routine city signals in this automated pass.'}\n\n## Full city scan\n\n${output.reports.map((r) => `- ${r.city.name}, ${r.city.country}: ${r.status}; ${r.current.description}; ${r.current.temperatureC}°C; rain ${r.daily.precipitationMm}mm; wind ${r.daily.maxWindKph}km/h; media ${r.mediaSignals.length}`).join('\n')}\n`;
}

function buildSocialPost(date: string, reports: CityWeatherReport[]): string {
  const active = reports.filter((r) => r.status !== 'routine').slice(0, 2);
  if (!active.length) {
    return `Albis Community Weather — ${date}\n\nMajor world-city scan: no major automated alerts today. Official data first; local human context next.\n\nNews intelligence, not noise.`;
  }
  return `Albis Community Weather — ${date}\n\nWatchlist: ${active.map((r) => `${r.city.name}: ${r.riskReasons[0] || r.current.description}`).join('; ')}.\n\nLocal updates complete the picture.\n\nNews intelligence, not noise.`;
}

async function postToPostiz(text: string) {
  const apiKey = process.env.POSTIZ_API_KEY;
  const integrationId = process.env.POSTIZ_X_INTEGRATION_ID || 'cmlqafa9n0027qp0yn7gcelab';
  if (!apiKey) throw new Error('POSTIZ_API_KEY missing');
  const body = {
    type: 'now',
    date: new Date().toISOString(),
    shortLink: false,
    tags: [],
    posts: [{ integration: { id: integrationId }, value: [{ content: text, image: [] }], settings: { who_can_reply_post: 'everyone' } }],
  };
  const res = await fetch('https://api.postiz.com/public/v1/posts', { method: 'POST', headers: { Authorization: apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Postiz failed ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  const date = getDateArg();
  const limit = numberFlag('limit', 100);
  const mediaPerCity = numberFlag('media-per-city', 3);
  const reports = await buildReports(limit, mediaPerCity);
  const socialPost = buildSocialPost(date, reports);
  const output: RunOutput = {
    date,
    generatedAt: new Date().toISOString(),
    scope: `Top ${limit} major world cities weather/community-media scan`,
    methodology: [
      'Weather data: Open-Meteo public forecast/current conditions.',
      'Traditional media layer: GDELT article search for city-level weather/disruption mentions.',
      'Community layer v0: identifies where lived, on-the-ground human updates are needed; no private/social scraping yet.',
    ],
    reports,
    socialPost,
  };

  const dataDir = path.resolve(process.cwd(), 'data/community-weather');
  const publicDir = path.resolve(process.cwd(), 'public/community-weather');
  const reportDir = path.resolve(process.cwd(), 'reports/community-weather');
  await Promise.all([ensureDir(dataDir), ensureDir(publicDir), ensureDir(reportDir)]);
  await fs.writeFile(path.join(dataDir, `${date}.json`), JSON.stringify(output, null, 2));
  await fs.writeFile(path.join(publicDir, `${date}.json`), JSON.stringify(output, null, 2));
  await fs.writeFile(path.join(publicDir, 'latest.json'), JSON.stringify(output, null, 2));
  await fs.writeFile(path.join(reportDir, `${date}.md`), buildMarkdown(output));
  await fs.writeFile(path.join(reportDir, `${date}-social.txt`), socialPost);

  console.log(`\n✅ Wrote community weather report for ${date}`);
  console.log(`Active/non-routine cities: ${reports.filter((r) => r.status !== 'routine').length}/${reports.length}`);
  console.log(`Social copy: reports/community-weather/${date}-social.txt`);

  if (hasFlag('post')) {
    try {
      const result = await postToPostiz(socialPost);
      console.log(`✅ Posted via Postiz: ${JSON.stringify(result).slice(0, 500)}`);
    } catch (err) {
      console.warn('⚠️ Postiz publishing failed after data files were written; continuing so weather data can still be committed.');
      console.warn(err);
    }
  } else {
    console.log('Dry run only. Add --post to publish via Postiz.');
  }
}

main().catch((err) => {
  console.error('❌ Community weather run failed:', err);
  process.exit(1);
});
