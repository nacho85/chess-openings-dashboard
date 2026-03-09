import { redirect } from "next/navigation";
import { listOpeningsCached } from "@/server/openings-store";

export default async function Page() {
  const openings = await listOpeningsCached();
  const first = openings?.[0];

  if (!first?.id) {
    redirect("/new");
  }

  redirect(`/openings/${first.id}`);
}
