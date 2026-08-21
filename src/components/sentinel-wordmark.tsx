import Image from "next/image";
import { cn } from "@/lib/utils";

const ASPECT = 1978 / 351;

export function SentinelWordmark({
  variant,
  height,
  className,
}: {
  variant: "dark" | "light";
  height: number;
  className?: string;
}) {
  return (
    <Image
      src={variant === "dark" ? "/brand/sentinel-wordmark-white.png" : "/brand/sentinel-wordmark-navy.png"}
      alt="SENTINEL"
      width={Math.round(height * ASPECT)}
      height={height}
      className={cn("shrink-0", className)}
      priority
    />
  );
}
