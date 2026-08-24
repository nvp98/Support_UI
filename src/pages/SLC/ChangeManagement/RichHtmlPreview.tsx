interface RichHtmlPreviewProps {
  html?: string;
  title: string;
  compact?: boolean;
}

const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "img-src http: https: data:",
  "style-src 'unsafe-inline'",
  "base-uri 'none'",
  "form-action 'none'",
  "navigate-to 'none'",
].join("; ");

const buildPreviewDocument = (html?: string) => `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}">
    <meta name="referrer" content="no-referrer">
    <style>
      html, body { margin: 0; padding: 0; }
      body { color: #374151; font: 14px/1.5 Arial, sans-serif; overflow-wrap: anywhere; padding: 12px; }
      img { height: auto; max-width: 100%; }
      table { border-collapse: collapse; max-width: 100%; }
      td, th { border: 1px solid #d1d5db; padding: 4px 8px; }
      a, area { pointer-events: none; }
    </style>
  </head>
  <body>${html?.trim() || "<p>—</p>"}</body>
</html>`;

export default function RichHtmlPreview({ html, title, compact = false }: RichHtmlPreviewProps) {
  return (
    <iframe
      className={`change-request-rich-content${compact ? " change-request-rich-content--compact" : ""}`}
      referrerPolicy="no-referrer"
      sandbox=""
      srcDoc={buildPreviewDocument(html)}
      tabIndex={-1}
      title={title}
    />
  );
}
