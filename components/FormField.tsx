import React from "react";

type BaseProps = {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
};

type InputProps = BaseProps & {
  type?: "text" | "email" | "tel" | "url";
  placeholder?: string;
};

type TextareaProps = BaseProps & {
  textarea: true;
  placeholder?: string;
  rows?: number;
};

type SelectProps = BaseProps & {
  select: true;
  options: string[];
};

export default function FormField(
  props: InputProps | TextareaProps | SelectProps
) {
  const { label, name, required, hint } = props;
  const base =
    "mt-2.5 w-full rounded-2xl bg-white px-5 py-4 text-[15px] font-medium text-[#1a1513] transition placeholder:text-[#8a7e74]/60 focus:outline-none focus:ring-[3px]";

  const style = {
    border: "1px solid rgba(97,74,68,0.13)",
  } as const;

  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <span className="font-sans text-[13.5px] font-bold text-[#1a1513]">
          {label}
          {required && <span className="ml-1 text-[#e62b1e]">*</span>}
        </span>
        {hint && (
          <span
            className="font-mono text-[10px] font-semibold uppercase text-[#8a7e74]"
            style={{ letterSpacing: "0.14em" }}
          >
            {hint}
          </span>
        )}
      </span>
      {"textarea" in props ? (
        <textarea
          name={name}
          required={required}
          rows={props.rows ?? 5}
          placeholder={props.placeholder}
          className={base}
          style={{
            ...style,
            // @ts-expect-error css custom
            "--tw-ring-color": "rgba(230,43,30,0.2)",
          }}
        />
      ) : "select" in props ? (
        <select
          name={name}
          required={required}
          className={base}
          defaultValue=""
          style={{
            ...style,
            // @ts-expect-error css custom
            "--tw-ring-color": "rgba(230,43,30,0.2)",
          }}
        >
          <option value="" disabled>
            Select…
          </option>
          {props.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          type={props.type ?? "text"}
          required={required}
          placeholder={props.placeholder}
          className={base}
          style={{
            ...style,
            // @ts-expect-error css custom
            "--tw-ring-color": "rgba(230,43,30,0.2)",
          }}
        />
      )}
    </label>
  );
}
