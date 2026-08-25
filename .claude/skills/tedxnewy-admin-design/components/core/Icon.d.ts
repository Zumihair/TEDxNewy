export interface IconProps {
  /** Lucide icon name, exactly as the codebase imports it: "Pencil", "Trash2", "CalendarDays". */
  name: string;
  /** Pixel size. The admin uses 14 in row buttons, 15 in the sidebar, 16–18 elsewhere. */
  size?: number;
  /** 2 for nav/body icons, 2.25 for small action icons. */
  strokeWidth?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

/** Lucide icon, read from the lucide UMD global. Intentional addition: a name-based wrapper so cards and kits can use the same icon names as the codebase. */
export declare function Icon(props: IconProps): JSX.Element;
