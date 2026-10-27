import { redirect } from "next/navigation";

// The signed-in landing page is the dashboard; keep old /home links and bookmarks working.
export default function HomeRedirect() {
  redirect("/dashboard");
}
