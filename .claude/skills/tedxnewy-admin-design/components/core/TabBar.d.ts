export interface Tab {
  key: string;
  label: string;
  /** Optional row count shown after the label. */
  count?: number;
}

/**
 * The single underline-style tab row used across the admin.
 * @startingPoint section="Core" subtitle="Underline tab row, red active underline" viewport="700x120"
 */
export interface TabBarProps {
  tabs: Tab[];
  active: string;
  /** Href per tab — the real admin points these at `?tab=<key>` so it needs no client JS. */
  hrefFor?: (key: string) => string;
  /** Client-side alternative to hrefFor. */
  onSelect?: (key: string) => void;
}

export declare function TabBar(props: TabBarProps): JSX.Element;
