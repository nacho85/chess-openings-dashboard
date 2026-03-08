import { redirect } from "next/navigation";
import { openings } from "@/lib/openings";

export default function Page() {
  const first = openings?.[0];
  if (!first?.id) redirect("/new");
  redirect(`/openings/${first.id}`);
}