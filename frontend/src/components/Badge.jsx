export default function Badge({ text, color }) {
  const c = color || '#8B949E';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 600,
      background: `${c}1F`, color: c,
    }}>
      {text}
    </span>
  );
}
