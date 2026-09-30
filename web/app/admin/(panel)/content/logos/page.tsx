import type { Metadata } from "next";
import ClientLogosManager from "@/components/admin/content/ClientLogosManager";

export const metadata: Metadata = { title: "Client logos" };

export default function ClientLogosPage() {
  return <ClientLogosManager />;
}
