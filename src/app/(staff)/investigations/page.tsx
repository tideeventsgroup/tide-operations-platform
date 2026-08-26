import { redirect } from "next/navigation";

export default function InvestigationsListRedirect() {
  redirect("/search?type=investigations");
}
