"use client";

import { GRADIENTS } from "@/lib/tokens";
import { getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  index: number;
  size?: number;
}

export default function Avatar({ name, index, size = 36 }: AvatarProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: GRADIENTS[index % GRADIENTS.length],
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.32,
        fontWeight: 600,
        flexShrink: 0,
        letterSpacing: "-0.02em",
      }}
    >
      {getInitials(name)}
    </div>
  );
}
