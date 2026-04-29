import type { Metadata } from "next";
import RegisterClient from "./register-client";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create your Albis account to access your company daily scan and dashboard.",
};

export default function RegisterPage() {
  return <RegisterClient />;
}
