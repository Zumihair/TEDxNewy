export interface SkeletonBarProps {
  width?: string | number;
  height?: number;
  radius?: string;
}

export declare function SkeletonBar(props: SkeletonBarProps): JSX.Element;

/** Route-level loading skeleton: header shape plus card rows. */
export interface PageSkeletonProps {
  rows?: number;
}

export declare function PageSkeleton(props: PageSkeletonProps): JSX.Element;
