import type { ReactNode } from "react";

export interface NotSetUpProps {
  title?: string;
  children?: ReactNode;
}

/** Dashed sunken panel for "this needs a database update first", so a page never crashes pre-migration. */
export declare function NotSetUp(props: NotSetUpProps): JSX.Element;

export interface EmptyStateProps {
  children?: ReactNode;
}

/** Dashed sunken panel for an empty list. */
export declare function EmptyState(props: EmptyStateProps): JSX.Element;
