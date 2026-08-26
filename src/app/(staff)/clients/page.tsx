import { redirect } from "next/navigation";

export default function ClientsListRedirect() {
  redirect("/search?type=clients");
}
