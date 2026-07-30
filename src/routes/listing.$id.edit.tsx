import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { ListingForm } from "@/components/ListingForm";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/listing/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit Listing — Ndauka Rabbits Farm Marketplace" },
      {
        name: "description",
        content: "Update photos, stock quantity, price in TZS and details of your listing.",
      },
      { property: "og:title", content: "Edit Listing — Ndauka Rabbits Farm Marketplace" },
      { property: "og:description", content: "Update your listing details, stock and price." },
    ],
  }),
  component: EditListingPage,
});

function EditListingPage() {
  const { id } = useParams({ from: "/listing/$id/edit" });
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <MobileShell title="Edit Listing">
        <div className="px-4 pt-6" />
      </MobileShell>
    );
  }

  if (!user) {
    return (
      <MobileShell title="Edit Listing">
        <EmptyState
          icon={LogIn}
          title="Sign in to edit your listing"
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
    <MobileShell title="Edit Listing" subtitle="Hariri bidhaa yako">
      <ListingForm productId={id} />
    </MobileShell>
  );
}