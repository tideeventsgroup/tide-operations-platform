import { redirect } from "next/navigation";

export default function VehiclesListRedirect() {
  redirect("/search?type=vehicles");
}
