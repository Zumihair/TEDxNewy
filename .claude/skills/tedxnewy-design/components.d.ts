/* TEDxNewy components: window.TEDxNewy. Wrap public-site UI in .voice-brand; product UI (admin, email, docs) is the default voice. */
import type * as React from "react";
type Tone = "neutral" | "success" | "warning" | "info" | "danger";
type Kids = { children?: React.ReactNode };
type Opt = string | { value: string; label: string; icon?: string; count?: number };

export interface IconProps { name: string; size?: number; strokeWidth?: number; label?: string; className?: string; style?: React.CSSProperties }
export interface ButtonProps extends Kids, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: "accent" | "primary" | "secondary" | "danger"; size?: "sm" | "md" | "lg";
  icon?: string; iconPosition?: "start" | "end"; loading?: boolean; onDark?: boolean; block?: boolean; href?: string;
}
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { icon: string; label: string; tone?: "neutral" | "danger"; size?: "sm" | "md"; onDark?: boolean }
export interface BadgeProps extends Kids { tone?: Tone; variant?: "soft" | "bold"; dot?: boolean }
export interface BannerProps extends Kids { tone?: Tone; variant?: "inline" | "announce" | "bar"; title?: string; action?: React.ReactNode; onDismiss?: () => void; icon?: string }
export interface ToastProps extends Kids { tone?: Tone; action?: string; onAction?: () => void; onDismiss?: () => void; leaving?: boolean }
export interface EmptyStateProps extends Kids { icon?: string; title?: string; action?: React.ReactNode }
export interface SkeletonProps { width?: number | string; height?: number; radius?: string }
export interface CardProps extends Kids { padding?: "default" | "compact" | "none"; tint?: boolean; dark?: boolean; href?: string; className?: string; style?: React.CSSProperties }
export interface MediaCardProps { image?: string; alt?: string; label?: string; title?: string; meta?: string; href?: string; ratio?: string; pending?: boolean; style?: React.CSSProperties }
export interface SectionHeaderProps { title: React.ReactNode; intro?: React.ReactNode; meta?: React.ReactNode; action?: React.ReactNode; size?: "display" | "h1" | "h2"; align?: "start" | "center"; rule?: boolean; as?: "h1" | "h2" | "h3" }
export interface StatProps { value: string; suffix?: string; label: React.ReactNode; delta?: string; trend?: number[]; compact?: boolean }
export interface ListProps extends Kids { title?: string; action?: React.ReactNode }
export interface ListRowProps { icon?: string; tone?: Tone; title: React.ReactNode; meta?: React.ReactNode; aside?: React.ReactNode; actions?: React.ReactNode; onClick?: () => void }
export interface FieldProps extends Kids, Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "children"> {
  label?: string; hint?: string; error?: string; required?: boolean; icon?: string;
  type?: "text" | "email" | "search" | "tel" | "url" | "number" | "password" | "date" | "select" | "textarea"; options?: Opt[];
}
export interface SwitchProps { checked?: boolean; onChange?: (v: boolean) => void; label?: string; hint?: string; disabled?: boolean }
export interface SegmentedProps { options: Opt[]; value: string; onChange?: (v: string) => void; size?: "sm" | "md"; onDark?: boolean; block?: boolean }
export interface ModalProps extends Kids { open: boolean; title: string; footer?: React.ReactNode; onClose?: () => void; wide?: boolean; inline?: boolean }
export interface Series { name: string; values: number[] }
export interface LineChartProps { labels: string[]; series: Series[]; compare?: Series; height?: number; format?: (n: number) => string; area?: boolean }
export interface BarChartProps { data: { label: string; value: number }[]; highlight?: string; horizontal?: boolean; height?: number; format?: (n: number) => string }
export interface MeterProps { label: string; value: number; max?: number; display?: string; note?: string }
export interface SparklineProps { values: number[]; width?: number; height?: number; tone?: string }
export interface AdminNavProps { items: { key: string; label: string; icon: string; count?: number }[]; active?: string; onSelect?: (key: string) => void; user?: string; compact?: boolean; logo?: string }
type MotifTone = "dark" | "light" | "blush";
export interface NetworkProps { tone?: MotifTone; nodes?: number; seed?: number; accents?: number; animate?: boolean; opacity?: number }
export interface WavesProps { tone?: MotifTone; lines?: number; amplitude?: number; animate?: boolean; opacity?: number }
export interface ScribbleProps { shape?: "underline" | "zigzag" | "spark" | "star" | "arrow" | "squiggle" | "loop" | "circle"; tone?: MotifTone | "red"; width?: number; rotate?: number; draw?: boolean; style?: React.CSSProperties }

export declare function Icon(p: IconProps): JSX.Element;
export declare function Button(p: ButtonProps): JSX.Element;
export declare function IconButton(p: IconButtonProps): JSX.Element;
export declare function Badge(p: BadgeProps): JSX.Element;
export declare function Banner(p: BannerProps): JSX.Element;
export declare function Toast(p: ToastProps): JSX.Element;
export declare function EmptyState(p: EmptyStateProps): JSX.Element;
export declare function Skeleton(p: SkeletonProps): JSX.Element;
export declare function Card(p: CardProps): JSX.Element;
export declare function MediaCard(p: MediaCardProps): JSX.Element;
export declare function SectionHeader(p: SectionHeaderProps): JSX.Element;
export declare function Stat(p: StatProps): JSX.Element;
export declare function List(p: ListProps): JSX.Element;
export declare function ListRow(p: ListRowProps): JSX.Element;
export declare function Field(p: FieldProps): JSX.Element;
export declare function Switch(p: SwitchProps): JSX.Element;
export declare function Segmented(p: SegmentedProps): JSX.Element;
export declare function Modal(p: ModalProps): JSX.Element | null;
export declare function Sparkline(p: SparklineProps): JSX.Element;
export declare function LineChart(p: LineChartProps): JSX.Element;
export declare function BarChart(p: BarChartProps): JSX.Element;
export declare function Meter(p: MeterProps): JSX.Element;
export declare function BrandMark(p: { size?: number }): JSX.Element;
export declare function AdminNav(p: AdminNavProps): JSX.Element;
export declare function Network(p: NetworkProps): JSX.Element;
export declare function Waves(p: WavesProps): JSX.Element;
export declare function Scribble(p: ScribbleProps): JSX.Element;
