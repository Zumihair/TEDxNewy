export default function RedCircle({
  size = 200,
  className = "",
  opacity = 1,
}: {
  size?: number;
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      className={`pointer-events-none rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 38% 38%, #ff5247 0%, #e62b1e 42%, #b91d12 75%, #8a1409 100%)",
        opacity,
        boxShadow:
          "inset 6px -14px 24px rgba(0,0,0,0.22), 0 10px 30px rgba(230,43,30,0.35)",
      }}
      aria-hidden
    />
  );
}
