import { redirect } from "next/navigation";
import { listOpenings } from "@/server/openings-store";

export default async function Page() {
  const openings = await listOpenings();
  const first = openings?.[0];

  if (!first?.id) {
    redirect("/new");
  }

  redirect(`/openings/${first.id}`);
}
