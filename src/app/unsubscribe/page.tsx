export default function UnsubscribePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="max-w-md text-center px-6">
        <div className="text-4xl mb-4">👋</div>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight text-[#0f0f0f] dark:text-[#f0efec] mb-3 md:text-4xl">
          You&apos;ve been unsubscribed
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          We&apos;re sorry to see you go. You won&apos;t receive any more emails from Albis.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
        >
          Back to Albis
        </a>
        <p className="text-sm text-zinc-400 mt-8">
          Changed your mind? You can always re-subscribe on our homepage.
        </p>
      </div>
    </div>
  );
}
