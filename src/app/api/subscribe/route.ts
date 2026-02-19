import { NextResponse } from "next/server";
import * as fs from "fs";

const SUBSCRIBERS_FILE = "/tmp/albis-subscribers.json";

function readSubscribers(): string[] {
  try {
    const data = fs.readFileSync(SUBSCRIBERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeSubscribers(subscribers: string[]) {
  fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email?.trim()?.toLowerCase();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const subscribers = readSubscribers();

    if (subscribers.includes(email)) {
      return NextResponse.json({
        success: true,
        message: "You're already on the list!",
      });
    }

    subscribers.push(email);
    writeSubscribers(subscribers);

    return NextResponse.json({
      success: true,
      message: "You're on the list!",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
