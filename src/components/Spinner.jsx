export default function Spinner({ size = 18 }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-neutral-400 border-t-transparent"
      style={{
        width: size,
        height: size,
      }}
    />
  );
}