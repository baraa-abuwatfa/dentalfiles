import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "DentalFile AI — Dental patient records" }, { name: "description", content: "Secure patient records and visit history for dental clinics." }, { property: "og:title", content: "DentalFile AI — Dental patient records" }, { property: "og:description", content: "Secure patient records and visit history for dental clinics." }] }),
  beforeLoad: () => { throw redirect({ to: "/dashboard" }); },
});
