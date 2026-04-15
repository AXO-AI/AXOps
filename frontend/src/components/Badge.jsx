export default function Badge({ text, color }) {
  const c = color || '#6C7281';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 600, letterSpacing: 0.3, background: `${c}18`, color: c }}>
      {text}
    </span>
  );
}
