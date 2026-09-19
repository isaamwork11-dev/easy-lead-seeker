import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lead Finder — Find businesses without websites" },
      { name: "description", content: "Search local businesses by keyword and city, filter out the ones with no website, and export your leads." },
      { property: "og:title", content: "Lead Finder — Find businesses without websites" },
      { property: "og:description", content: "Search local businesses by keyword and city, filter out the ones with no website, and export your leads." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      navigate({ to: data.session ? "/search" : "/auth", replace: true });
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Loading Lead Finder…
    </div>
  );
}
