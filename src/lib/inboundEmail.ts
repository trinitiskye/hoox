// Turning a received email into the text of a support reply.

const decode = (s: string) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

/** HTML → plain text (good enough for email replies) */
export function htmlToText(html: string) {
  return decode(html
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, '')
    .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, '\n')       // quoted history
    .replace(/<div class="gmail_quote[\s\S]*$/i, '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|tr|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ''));
}

/** Keep only what the person wrote above the quoted reply */
export function newText(raw: string) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  for (const line of lines) {
    const l = line.trim();
    if (/^On .+wrote:$/i.test(l) || /^On .+(AM|PM|\d{4}).*$/i.test(l) && /wrote/i.test(l)) break;
    if (/^-{2,}\s*Original Message/i.test(l) || /^_{5,}$/.test(l) || /^From: .+/i.test(l) && out.length > 0) break;
    if (/Please keep your reply above this line/i.test(l)) break;
    if (/^(Sent from my|Get Outlook for)/i.test(l)) break;
    if (l.startsWith('>')) continue;
    out.push(line);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
