export default function Badge({ text, color }) {
  const c = color || 'var(--text-tertiary)';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ background: `${c}18`, color: c, border: `1px solid ${c}30` }}
    >
      {text}
    </span>
  );
}
