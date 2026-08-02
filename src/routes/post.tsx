import { createFileRoute, Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { ListingForm } from "@/components/ListingForm";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/post")({
  head: () => ({
    meta: [
      { title: "Post an Item — Ndauka Rabbits Farm Marketplace" },
      {
        name: "description",
        content:
          "List your breeding rabbits, poultry, cages, feeds or equipment with photos, stock, price in TZS and location.",
      },
      { property: "og:title", content: "Post an Item — Ndauka Rabbits Farm Marketplace" },
      {
        property: "og:description",
        content: "List your rabbits, poultry, cages, feeds or equipment for buyers across Tanzania.",
      },
    ],
  }),
  component: PostPage,
});

function PostPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <MobileShell title="Post Item">
        <div className="px-4 pt-6" />
      </MobileShell>
    );
  }

  if (!user) {
    return (
      <MobileShell title="Post Item">
        <EmptyState
          icon={LogIn}
          title="Sign in to post an item"
          description="Ingia au fungua akaunti ya Seller / Breeder ili kuweka bidhaa."
          action={
            <Button asChild size="lg" className="rounded-xl">
              <Link to="/auth">Log in / Sign up</Link>
            </Button>
          }
        />
      </MobileShell>
    );
  }

  return (
    <MobileShell title="Post Item" subtitle="Weka bidhaa yako sokoni">
      <ErrorBoundary label="post-item">
        <ListingForm />
      </ErrorBoundary>
    </MobileShell>
  );
}
