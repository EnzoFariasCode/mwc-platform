"use client";

import { useState } from "react";
import Image from "next/image";

type ProfileInitialsAvatarProps = {
  name?: string | null;
  src?: string | null;
  hasImage?: boolean;
  alt?: string;
  className: string;
  textClassName?: string;
};

function getInitials(name?: string | null) {
  const initials = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "MW";
}

export function ProfileInitialsAvatar({
  name,
  src,
  hasImage,
  alt,
  className,
  textClassName = "text-sm",
}: ProfileInitialsAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const shouldShowImage =
    Boolean(src) && hasImage !== false && failedSrc !== src;

  return (
    <div className={className}>
      {shouldShowImage ? (
        <Image
          src={src as string}
          alt={alt ?? name ?? "Perfil"}
          fill
          className="object-cover"
          unoptimized
          onError={() => setFailedSrc(src as string)}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center bg-[#d73cbe]/15 font-bold uppercase text-[#d73cbe] ${textClassName}`}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}
