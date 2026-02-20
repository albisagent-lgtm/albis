export default function UnsubscribePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md text-center px-6">
        <div className="text-4xl mb-4">👋</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          You&apos;ve been unsubscribed
        </h1>
        <p className="text-gray-600 mb-6">
          We&apos;re sorry to see you go. You won&apos;t receive any more emails from Albis.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
        >
          Back to Albis
        </a>
        <p className="text-sm text-gray-400 mt-8">
          Changed your mind? You can always re-subscribe on our homepage.
        </p>
      </div>
    </div>
  );
}
