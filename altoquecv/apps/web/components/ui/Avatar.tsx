import React from "react";

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
        <span className="flex h-full w-full items-center justify-center text-label-md text-on-surface-variant">
          {alt.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}