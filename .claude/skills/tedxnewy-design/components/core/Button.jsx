import React from "react";
import { Icon } from "./Icon";

/**
 * The pill button. Every variant is 14px/500 label, 999px radius, and lifts 1px
 * on hover; the classes live in tokens/patterns.css exactly as they do in the
 * site's globals.css, so this component only picks one.
 */
export function Button({
  variant = "primary",
  href,
  children,
  icon,
  disabled,
  onClick,
  type = "button",
  className = "",
  style,
  ...rest
}) {
  const cls = `btn-pill btn-${variant} ${className}`.trim();
  const inner = (
    <>
      {children}
      {icon ? <Icon name={icon} size={16} strokeWidth={2.25} /> : null}
    </>
  );
  if (href && !disabled) {
    return (
      <a href={href} className={cls} style={style} onClick={onClick} {...rest}>
        {inner}
      </a>
    );
  }
  return (
    <button type={type} className={cls} style={style} disabled={disabled} onClick={onClick} {...rest}>
      {inner}
    </button>
  );
}
