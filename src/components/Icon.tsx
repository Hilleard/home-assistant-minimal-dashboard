interface IconProps {
  path: string;
  size?: string; // any CSS length, e.g. "2.4vh"
  className?: string;
}

export function Icon({ path, size = "1em", className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
      <path d={path} />
    </svg>
  );
}
