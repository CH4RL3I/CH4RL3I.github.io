// The small inline markup used in content/site.json: **bold** and [text](href).
// Links may be in-page anchors, HTTPS URLs or local paths; exclude protocol-relative URLs.
const TOKEN = /\*\*(.+?)\*\*|\[(.+?)\]\((#[\w-]+|https:\/\/[^\s)]+|\/(?!\/)[\w./#?=&%~-]+)\)/g;

export function Rich({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    if (m[1]) {
      out.push(<strong key={at} className="font-medium text-text">{m[1]}</strong>);
    } else {
      const external = m[3].startsWith('https://');
      out.push(
        <a key={at} href={m[3]} download={m[3].startsWith('/') && m[3].endsWith('.pdf') ? true : undefined} className="link" {...(external ? { target: '_blank', rel: 'noopener' } : {})}>
          {m[2]}
        </a>,
      );
    }
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}
