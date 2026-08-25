export interface SidebarItem {
  href: string;
  label: string;
  /** Lucide icon name, as in nav-config's iconName. */
  iconName: string;
  /** Which section hue the active state uses. */
  section?: "yellow" | "coast" | "red" | "green" | "grey";
}

export interface SidebarGroup {
  heading: string;
  items: SidebarItem[];
  /** Heading becomes a toggle. */
  collapsible?: boolean;
}

/** The near-black admin sidebar. */
export interface SidebarNavProps {
  /** Groups in order: Overview, Content, Management, Community, Settings. */
  groups: SidebarGroup[];
  /** href of the current page. */
  active?: string;
  /** Path to a reversed lockup PNG/SVG. Falls back to the wordmark in type. */
  logoSrc?: string;
  email?: string;
  onNavigate?: (href: string) => void;
}

export declare function SidebarNav(props: SidebarNavProps): JSX.Element;
