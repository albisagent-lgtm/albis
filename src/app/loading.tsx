export default function Loading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#c8922a]/20 border-t-[#c8922a]" />
        <p className="font-[family-name:var(--font-playfair)] text-sm italic text-zinc-400 dark:text-zinc-500">
          Loading&hellip;
        </p>
      </div>
    </main>
  );
}
