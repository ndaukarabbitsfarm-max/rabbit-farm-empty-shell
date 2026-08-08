import { Heart, MessageCircle } from "lucide-react";
import { compactCount } from "@/lib/social";
import { cn } from "@/lib/utils";

/** "❤️ 128 · 💬 12" line shown under the price on product cards. */
export function SocialCounts({
  likes,
  comments,
  className,
}: {
  likes: number;
  comments: number;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground",
        className,
      )}
    >
      <Heart className="h-3 w-3 text-destructive" aria-hidden />
      {compactCount(likes)}
      <span aria-hidden>·</span>
      <MessageCircle className="h-3 w-3" aria-hidden />
      {compactCount(comments)}
    </p>
  );
}
