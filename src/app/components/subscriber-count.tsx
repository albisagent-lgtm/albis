"use client";

import { useState, useEffect } from "react";

export function SubscriberCount() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subscriber-count")
      .then((r) => r.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Join our growing community"));
  }, []);

  if (!message) return null;

  return (
    <span
      className="inline-block text-xs text-zinc-400 dark:text-zinc-500 animate-fade-in"
      style={{ animation: "fadeIn 0.5s ease-in" }}
    >
      {message}
    </span>
  );
}
