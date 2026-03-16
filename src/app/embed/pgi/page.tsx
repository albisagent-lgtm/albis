import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Embed the PGI | Albis",
  description: "Add the live Perception Gap Index to your website. Free, auto-updating, one line of code.",
};

export default function EmbedPGIPage() {
  const snippet = `<div id="albis-pgi"></div>
<script>
fetch("https://www.albis.news/api/embed/pgi")
  .then(r=>r.json())
  .then(d=>{
    document.getElementById("albis-pgi").innerHTML=
      '<a href="'+d.url+'" target="_blank" style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:12px;border:1px solid '+d.color+'33;font-family:system-ui;text-decoration:none;color:inherit">'
      +'<span style="width:10px;height:10px;border-radius:50%;background:'+d.color+'"></span>'
      +'<span style="font-size:24px;font-weight:700;color:'+d.color+'">'+d.pgi+'</span>'
      +'<span style="font-size:12px;opacity:0.6">Perception Gap Index<br>'+d.tier+'</span>'
      +'</a>';
  });
</script>`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#c8922a]">
        Free Widget
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold md:text-4xl">
        Embed the PGI on your site
      </h1>
      <p className="mt-4 text-zinc-500 dark:text-zinc-400">
        Show today&apos;s Perception Gap Index on your website. Auto-updates 3x daily. One snippet, zero dependencies.
      </p>

      <div className="mt-8 rounded-xl border border-black/[0.07] bg-zinc-50 p-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <p className="text-sm font-semibold mb-3">Copy and paste this into your HTML:</p>
        <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-green-400">
          <code>{snippet}</code>
        </pre>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">API Endpoint</h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          GET <code className="rounded bg-zinc-100 px-2 py-0.5 dark:bg-white/[0.06]">https://www.albis.news/api/embed/pgi</code>
        </p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Returns JSON with today&apos;s PGI score, tier, color, and links. CORS-enabled. Cache: 30 minutes.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">For Researchers</h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Need historical data or bulk access? The PGI is open data for academic use.
          Email <a href="mailto:harry@albis.news" className="text-[#c8922a] hover:underline">harry@albis.news</a> for API access.
        </p>
      </div>
    </main>
  );
}
