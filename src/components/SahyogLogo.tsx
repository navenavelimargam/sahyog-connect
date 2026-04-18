import { Leaf } from "lucide-react";

export function SahyogLogo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center justify-center rounded-full gradient-hero shadow-orange"
        style={{ width: size, height: size }}
      >
        <Leaf className="text-white" style={{ width: size * 0.55, height: size * 0.55 }} />
      </div>
      <div className="leading-none">
        <div className="font-display text-xl font-bold text-primary">Sahyog</div>
        <div className="text-[10px] tracking-wider text-muted-foreground">सहयोग</div>
      </div>
    </div>
  );
}
