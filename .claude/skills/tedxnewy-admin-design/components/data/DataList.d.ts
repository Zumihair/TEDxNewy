import type { ReactNode } from "react";

export interface DataListProps {
  children?: ReactNode;
  style?: React.CSSProperties;
}

/** Card holding hairline-divided rows — the admin's default list/table. */
export declare function DataList(props: DataListProps): JSX.Element;

export interface DataRowProps {
  title: ReactNode;
  /** Badges, dates and RowMeta values under the title. */
  meta?: ReactNode;
  /** Right-aligned actions — icon buttons for anything repeated. */
  actions?: ReactNode;
  href?: string;
  onClick?: () => void;
  /** Section ink the title takes on row hover. */
  hoverColor?: string;
  /** Suppresses the top hairline on the first row. */
  first?: boolean;
}

export declare function DataRow(props: DataRowProps): JSX.Element;

export interface RowMetaProps {
  children?: ReactNode;
}

/** Mono, tabular meta value inside a row (order numbers, ids, counts). */
export declare function RowMeta(props: RowMetaProps): JSX.Element;
