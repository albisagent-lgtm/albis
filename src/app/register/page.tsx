import type { Metadata } from "next";
import RegisterClient from "./register-client";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your Albis account to access personalised intelligence briefings.",
};

export default function RegisterPage() {
  return <RegisterClient />;
}
