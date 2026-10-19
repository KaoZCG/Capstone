import React from "react";
import { UserRound } from "lucide-react";

interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: "sm" | "md" | "lg";
}

export function Avatar({ className = "", size = "md", src, alt = "Avatar", ...props }: AvatarProps) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-20 w-20",
  };

  return (
    <div className={`relative overflow-hidden rounded-full bg-surface-container-high shrink-0 ${sizes[size]} ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" {...props} />
      ) : (
        <span role="img" aria-label={alt} className="flex h-full w-full items-center justify-center bg-gray-400 text-white">
          <UserRound size="58%" strokeWidth={1.5} aria-hidden="true" />
        </span>
      )}
    </div>
  );
}