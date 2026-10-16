"use client";

/**
 * TEDxNewy design-system components (ported from the system's bundle.js).
 * Styled by app/ds.css (`tx-` classes, every value a token from app/tokens.css).
 * Wrap public-site UI in `.voice-brand`; product UI (admin, email, docs) is the default.
 */
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Icon, type IconName } from "./Icon";
import { Sparkline } from "./charts";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

export type Tone = "neutral" | "success" | "warning" | "info" | "danger";
const TONE_ICON: Record<Tone, IconName> = {
  success: "circle-check",
  warning: "triangle-alert",
  info: "info",
  danger: "circle-alert",
  neutral: "info",
};

/** Internal paths go through next/link, everything else is a plain anchor. */
function SmartLink({
  href,
  ...rest
}: { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const external = /^(https?:|mailto:|tel:|#)/.test(href);
  if (external) return <a href={href} {...rest} />;
  return <Link href={href} {...rest} />;
}

/* ---------------------------------- Actions --------------------------------- */

type ButtonBase = {
  variant?: "accent" | "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: IconName;
  iconPosition?: "start" | "end";
  loading?: boolean;
  onDark?: boolean;
  block?: boolean;
};
export type ButtonProps = ButtonBase &
  (
    | ({ href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">)
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
  );

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    icon,
    iconPosition = "end",
    loading,
    onDark,
    block,
    className,
    children,
    ...rest
  } = props;
  const classes = cx(
    "tx-btn",
    `tx-btn--${variant}`,
    size !== "md" && `tx-btn--${size}`,
    onDark && "tx-btn--on-dark",
    block && "tx-btn--block",
    className,
  );
  const px = size === "lg" ? 18 : size === "sm" ? 14 : 16;
  const glyph = loading ? (
    <Icon name="loader-circle" size={px} className="tx-spin" />
  ) : icon ? (
    <Icon name={icon} size={px} strokeWidth={2.25} />
  ) : null;
  const content = (
    <>
      {iconPosition === "start" && glyph}
      {children}
      {iconPosition !== "start" && glyph}
    </>
  );
  if ("href" in props && props.href !== undefined) {
    const { href, ...anchor } = rest as { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <SmartLink href={href} className={classes} aria-busy={loading || undefined} {...anchor}>
        {content}
      </SmartLink>
    );
  }
  const btn = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      type="button"
      className={classes}
      aria-busy={loading || undefined}
      {...btn}
      disabled={btn.disabled || loading}
    >
      {content}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  tone = "neutral",
  size = "md",
  onDark,
  className,
  ...rest
}: {
  icon: IconName;
  label: string;
  tone?: "neutral" | "danger";
  size?: "sm" | "md";
  onDark?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "tx-iconbtn",
        tone === "danger" && "tx-iconbtn--danger",
        size === "sm" && "tx-iconbtn--sm",
        onDark && "tx-iconbtn--on-dark",
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={size === "sm" ? 14 : 16} strokeWidth={2.25} />
    </button>
  );
}

/* --------------------------------- Feedback --------------------------------- */

export function Badge({
  tone = "neutral",
  variant = "soft",
  dot,
  children,
}: {
  tone?: Tone;
  variant?: "soft" | "bold";
  dot?: boolean;
  children?: ReactNode;
}) {
  return (
    <span className={cx("tx-badge", `tx-tone-${tone}`, variant === "bold" && "tx-badge--bold")}>
      {dot && <span className="tx-badge__dot" />}
      {children}
    </span>
  );
}

export function Banner({
  tone = "neutral",
  variant = "inline",
  title,
  children,
  action,
  onDismiss,
  icon,
}: {
  tone?: Tone;
  variant?: "inline" | "announce" | "bar";
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  icon?: IconName;
}) {
  if (variant === "announce" || variant === "bar") {
    return (
      <div
        className={cx("tx-banner", "tx-banner--announce", variant === "bar" && "tx-banner--bar")}
        role="region"
        aria-label={title || "Announcement"}
      >
        <div className="tx-banner__body">
          {title && <strong className="tx-banner__title">{title}</strong>}
          {children}
        </div>
        {action && <div className="tx-banner__action">{action}</div>}
        {onDismiss && <IconButton icon="x" label="Dismiss" onDark size="sm" onClick={onDismiss} />}
      </div>
    );
  }
  return (
    <div className={cx("tx-banner", `tx-tone-${tone}`)} role={tone === "danger" ? "alert" : "status"}>
      <span className="tx-banner__icon">
        <Icon name={icon || TONE_ICON[tone]} size={18} />
      </span>
      <div className="tx-banner__body">
        {title && <strong className="tx-banner__title">{title}</strong>}
        {children}
      </div>
      {action && <div className="tx-banner__action">{action}</div>}
      {onDismiss && <IconButton icon="x" label="Dismiss" size="sm" onClick={onDismiss} />}
    </div>
  );
}

export function Toast({
  tone = "neutral",
  children,
  action,
  onAction,
  onDismiss,
  leaving,
}: {
  tone?: Tone;
  children?: ReactNode;
  action?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  leaving?: boolean;
}) {
  return (
    <div
      className={cx("tx-toast", `tx-tone-${tone}`)}
      data-leaving={leaving || undefined}
      role={tone === "danger" ? "alert" : "status"}
    >
      <Icon name={TONE_ICON[tone]} size={18} strokeWidth={2.25} />
      <span className="tx-toast__msg">{children}</span>
      {action && (
        <button type="button" className="tx-toast__action" onClick={onAction}>
          {action}
        </button>
      )}
      {onDismiss && <IconButton icon="x" label="Dismiss" size="sm" onClick={onDismiss} />}
    </div>
  );
}

export function EmptyState({
  icon = "inbox",
  title,
  children,
  action,
}: {
  icon?: IconName;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="tx-empty">
      <span className="tx-empty__icon">
        <Icon name={icon} size={22} />
      </span>
      {title && <p className="tx-empty__title">{title}</p>}
      {children && <p className="tx-empty__text">{children}</p>}
      {action}
    </div>
  );
}

export function Skeleton({
  width = "100%",
  height = 12,
  radius,
}: {
  width?: number | string;
  height?: number;
  radius?: string;
}) {
  return <span className="tx-skel" style={{ width, height, borderRadius: radius }} />;
}

/* ---------------------------------- Content --------------------------------- */

export function Card({
  children,
  padding = "default",
  tint,
  dark,
  href,
  className,
  style,
}: {
  children?: ReactNode;
  padding?: "default" | "compact" | "none";
  tint?: boolean;
  dark?: boolean;
  href?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const classes = cx(
    "tx-card",
    padding === "none" && "tx-card--flush",
    padding === "compact" && "tx-card--compact",
    tint && "tx-card--tint",
    dark && "tx-card--dark",
    href && "tx-card--link",
    className,
  );
  return href ? (
    <SmartLink href={href} className={classes} style={style}>
      {children}
    </SmartLink>
  ) : (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}

export function MediaCard({
  image,
  alt = "",
  label,
  title,
  meta,
  href,
  ratio = "4/3",
  pending,
  style,
}: {
  image?: string;
  alt?: string;
  label?: string;
  title?: string;
  meta?: string;
  href?: string;
  ratio?: string;
  pending?: boolean;
  style?: CSSProperties;
}) {
  const inner = (
    <>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="tx-media__img" src={image} alt={alt} loading="lazy" />
      )}
      {label && (
        <span className="tx-media__label">
          <Badge variant="bold" tone="neutral">
            {label}
          </Badge>
        </span>
      )}
      {!image && pending && (
        <span className="tx-media__pending">
          <Icon name="image" size={16} strokeWidth={1.75} />
          Photos coming soon
        </span>
      )}
      <span className="tx-media__body">
        {title && <h3 className="tx-media__title">{title}</h3>}
        {meta && <span className="tx-media__meta">{meta}</span>}
      </span>
    </>
  );
  const sty = { aspectRatio: ratio, ...style };
  return href ? (
    <SmartLink href={href} className="tx-media" style={sty}>
      {inner}
    </SmartLink>
  ) : (
    <div className="tx-media" style={sty}>
      {inner}
    </div>
  );
}

export function SectionHeader({
  title,
  intro,
  meta,
  action,
  size = "h2",
  align = "start",
  rule,
  as,
}: {
  title: ReactNode;
  intro?: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  size?: "display" | "h1" | "h2";
  align?: "start" | "center";
  rule?: boolean;
  as?: "h1" | "h2" | "h3";
}) {
  const Tag = as || (size === "h2" ? "h2" : "h1");
  return (
    <div
      className={cx("tx-sh", align === "center" && "tx-sh--center", rule && "tx-sh--rule", !!action && "tx-sh--split")}
    >
      <div className="tx-sh__text">
        <Tag className={cx("tx-sh__title", `tx-sh__title--${size}`)}>{title}</Tag>
        {meta && <p className="tx-sh__meta">{meta}</p>}
        {intro && <p className="tx-sh__intro">{intro}</p>}
      </div>
      {action && <div className="tx-sh__action">{action}</div>}
    </div>
  );
}

export function Stat({
  value,
  suffix,
  label,
  delta,
  trend,
  compact,
}: {
  value: string;
  suffix?: string;
  label: ReactNode;
  delta?: string;
  trend?: number[];
  compact?: boolean;
}) {
  const up = delta && !String(delta).startsWith("-");
  return (
    <div className={cx("tx-stat", compact && "tx-stat--compact")}>
      <span className="tx-stat__label">{label}</span>
      <span className="tx-stat__value">
        {value}
        {suffix && <span className="tx-stat__suffix">{suffix}</span>}
      </span>
      {(delta || trend) && (
        <span className="tx-stat__foot">
          {delta && (
            <span className={cx("tx-stat__delta", up ? "is-up" : "is-down")}>
              <Icon name={up ? "trending-up" : "trending-down"} size={14} />
              {delta}
            </span>
          )}
          {trend && <Sparkline values={trend} />}
        </span>
      )}
    </div>
  );
}

export function ListRow({
  icon,
  tone,
  title,
  meta,
  aside,
  actions,
  onClick,
}: {
  icon?: IconName;
  tone?: Tone;
  title: ReactNode;
  meta?: ReactNode;
  aside?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div className={cx("tx-row", onClick && "tx-row--link", tone && `tx-tone-${tone}`)} onClick={onClick}>
      {icon && (
        <span className="tx-row__lead">
          <Icon name={icon} size={18} />
        </span>
      )}
      <div className="tx-row__main">
        <div className="tx-row__title">{title}</div>
        {meta && <div className="tx-row__meta">{meta}</div>}
      </div>
      {aside && <div className="tx-row__aside">{aside}</div>}
      {actions && (
        <div className="tx-row__actions" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
}

export function List({ children, title, action }: { children?: ReactNode; title?: string; action?: ReactNode }) {
  return (
    <div className="tx-list">
      {title && (
        <div className="tx-list__head">
          <span>{title}</span>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/* ----------------------------------- Forms ---------------------------------- */

type Opt = string | { value: string; label: string; icon?: IconName; count?: number };

export function Field({
  label,
  hint,
  error,
  required,
  type = "text",
  options = [],
  icon,
  id,
  children,
  ...rest
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  type?: "text" | "email" | "search" | "tel" | "url" | "number" | "password" | "date" | "select" | "textarea";
  options?: Opt[];
  icon?: IconName;
  id?: string;
  children?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children">) {
  const auto = useId();
  const fieldId = id || auto;
  let control = children;
  if (!control) {
    const common = {
      id: fieldId,
      className: cx(
        "tx-input",
        type === "textarea" && "tx-input--area",
        type === "select" && "tx-input--select",
        icon && "tx-input--icon",
      ),
      "aria-invalid": error ? true : undefined,
    };
    if (type === "textarea") {
      control = <textarea rows={3} {...common} {...(rest as object)} />;
    } else if (type === "select") {
      control = (
        <select {...common} {...(rest as object)}>
          {options.map((o) => {
            const v = typeof o === "string" ? o : o.value;
            const l = typeof o === "string" ? o : o.label;
            return (
              <option key={v} value={v}>
                {l}
              </option>
            );
          })}
        </select>
      );
    } else {
      control = <input type={type} {...common} {...rest} />;
    }
  }
  return (
    <div className="tx-field">
      {label && (
        <label className="tx-field__label" htmlFor={fieldId}>
          {label}
          {required && (
            <span className="tx-field__req" aria-hidden>
              *
            </span>
          )}
        </label>
      )}
      <div className="tx-field__control">
        {icon && <Icon name={icon} size={16} className="tx-field__icon" />}
        {control}
        {type === "select" && <Icon name="chevron-down" size={16} className="tx-field__chev" />}
      </div>
      {error ? (
        <span className="tx-field__error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="tx-field__hint">{hint}</span>
      ) : null}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked?: boolean;
  onChange?: (v: boolean) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cx("tx-switch", disabled && "is-disabled")}>
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        disabled={disabled}
        className="tx-switch__track"
        onClick={() => onChange?.(!checked)}
      >
        <span className="tx-switch__thumb" />
      </button>
      {(label || hint) && (
        <span className="tx-switch__text">
          {label && <span className="tx-switch__label">{label}</span>}
          {hint && <span className="tx-switch__hint">{hint}</span>}
        </span>
      )}
    </label>
  );
}

export function Segmented({
  options,
  value,
  onChange,
  size = "md",
  onDark,
  block,
}: {
  options: Opt[];
  value: string;
  onChange?: (v: string) => void;
  size?: "sm" | "md";
  onDark?: boolean;
  block?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  useLayoutEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth });
  }, [value, options.length]);
  return (
    <div
      ref={ref}
      role="radiogroup"
      className={cx("tx-seg", size === "sm" && "tx-seg--sm", onDark && "tx-seg--on-dark", block && "tx-seg--block")}
    >
      {thumb && (
        <span className="tx-seg__thumb" style={{ transform: `translateX(${thumb.left - 4}px)`, width: thumb.width }} />
      )}
      {opts.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className="tx-seg__opt"
          onClick={() => onChange?.(o.value)}
        >
          {"icon" in o && o.icon && <Icon name={o.icon} size={14} strokeWidth={2.25} />}
          {o.label}
          {"count" in o && o.count != null && <span className="tx-seg__count">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------- Overlay --------------------------------- */

export function Modal({
  open,
  title,
  children,
  footer,
  onClose,
  wide,
  inline,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  wide?: boolean;
  inline?: boolean;
}) {
  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  const node = (
    <div
      className="tx-scrim"
      style={inline ? { position: "absolute" } : undefined}
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className={cx("tx-modal", wide && "tx-modal--wide")} role="dialog" aria-modal="true" aria-label={title}>
        <div className="tx-modal__head">
          <h2 className="tx-modal__title">{title}</h2>
          {onClose && <IconButton icon="x" label="Close" onClick={onClose} />}
        </div>
        <div className="tx-modal__body">{children}</div>
        {footer && <div className="tx-modal__foot">{footer}</div>}
      </div>
    </div>
  );
  return inline || typeof document === "undefined" ? node : createPortal(node, document.body);
}
