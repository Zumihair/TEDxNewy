import { redirect } from "next/navigation";

/** The page moved to /admin/access. */
export default function Moved() {
  redirect("/admin/access");
}
