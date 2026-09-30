import Image from "next/image";
import { SITE_NAME } from "@/lib/site";

// The brain mark from the brand logo (cut out onto a transparent background, see
// public/brand) with the name as live text: the logo's own thin navy wordmark would
// disappear on the dark theme. The mark is decorative; the text carries the name.
export default function Logo({
  className = "",
  wordmarkClassName = "",
  markClassName = "h-8 w-auto",
}: {
  className?: string;
  wordmarkClassName?: string;
  markClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold tracking-tight ${className}`}>
      <Image src="/brand/logo-mark.png" alt="" width={338} height={305} priority className={`shrink-0 ${markClassName}`} />
      <span className={wordmarkClassName}>{SITE_NAME}</span>
    </span>
  );
}
