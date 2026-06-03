import { getSession } from "@/lib/auth/session";
import { HomeContent } from "@/components/home/home-content";

export default async function HomePage() {
  const session = await getSession();

  return <HomeContent isAuthenticated={!!session} />;
}
