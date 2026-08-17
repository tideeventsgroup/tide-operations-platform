import Image from "next/image";
import { cn } from "@/lib/utils";

const ASPECT = {
  dark: 2403 / 748,
  light: 5133 / 1859,
} as const;

export function TideLogo({
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
      src={variant === "dark" ? "/brand/tide-logo-dark-bg.png" : "/brand/tide-logo-light-bg.png"}
      alt="Tide Events Group"
      width={Math.round(height * ASPECT[variant])}
      height={height}
      className={cn("shrink-0", className)}
      priority
    />
  );
}
