import { redirect } from "next/navigation";

export default function PeopleListRedirect() {
  redirect("/search?type=people");
}
