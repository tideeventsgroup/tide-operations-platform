import { redirect } from "next/navigation";

export default function AuditsListRedirect() {
  redirect("/search?type=audits");
}
