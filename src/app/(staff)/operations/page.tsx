import { redirect } from "next/navigation";

export default function OperationsListRedirect() {
  redirect("/search?type=operations");
}
