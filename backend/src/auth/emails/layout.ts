/**
 * One layout for every mail we send.
 *
 * Tables and inline styles rather than anything modern: mail clients are a
 * decade behind browsers, Outlook still renders through Word, and a stylesheet
 * in the head is stripped by half of them.
 *
 * Deliberately close to plain. A transactional mail that looks like a
 * newsletter gets filed like one, and everything here is a link someone asked
 * for.
 */

const GREEN = '#1db954';
const INK = '#111111';
const MUTED = '#6b7280';
const HAIRLINE = '#e5e7eb';

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface EmailBody {
  heading: string;
  /**
   * Who this is for. A template sent to a list cannot say this, so naming the
   * account is one of the few honest signals a filter can weigh in our favour.
   */
  greeting?: string;
  /** One per paragraph, in order. */
  paragraphs: string[];
  action: { label: string; href: string };
  /** Under the button, smaller. The "if this was not you" line. */
  footnote: string;
}

export function renderEmail({
  heading,
  greeting,
  paragraphs,
  action,
  footnote,
}: EmailBody): string {
  const body = paragraphs
    .map(
      (text) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${INK}">${text}</p>`,
    )
    .join('');

  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f6f7f8">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f8;padding:32px 12px">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid ${HAIRLINE};border-radius:14px;font-family:${FONT}">
        <tr>
          <td style="padding:28px 32px 0">
            <p style="margin:0 0 24px;font-size:13px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:${GREEN}">sopranino</p>
            <h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;font-weight:800;color:${INK}">${heading}</h1>
            ${
              greeting
                ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${INK}">${greeting}</p>`
                : ''
            }
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 32px 28px">
            <a href="${action.href}" style="display:inline-block;background:${GREEN};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:999px">${action.label}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 28px">
            <p style="margin:0 0 14px;font-size:13px;line-height:1.6;color:${MUTED}">${footnote}</p>
            <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};border-top:1px solid ${HAIRLINE};padding-top:14px">
              If the button does not work, paste this into your browser:<br>
              <a href="${action.href}" style="color:${MUTED};word-break:break-all">${action.href}</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
