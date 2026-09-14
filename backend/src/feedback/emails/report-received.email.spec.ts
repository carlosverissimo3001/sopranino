import { FeedbackKind } from '@prisma/client';
import { reportReceivedEmail } from './report-received.email';

const base = {
  to: 'inbox@example.com',
  kind: FeedbackKind.BUG,
  message: 'It plays silence',
  adminUrl: 'https://sopranino.app/admin/reports',
};

describe('reportReceivedEmail', () => {
  // Player text, into an HTML body read in a mail client.
  it('escapes what the player wrote', () => {
    const mail = reportReceivedEmail({
      ...base,
      message: '<img src=x onerror=alert(1)> & "quotes"',
      pagePath: '/about?<b>',
    });

    expect(mail.html).not.toContain('<img src=x');
    expect(mail.html).toContain(
      '&lt;img src=x onerror=alert(1)&gt; &amp; &quot;quotes&quot;',
    );
    expect(mail.html).toContain('/about?&lt;b&gt;');
  });

  it('keeps the subject to one short line', () => {
    const mail = reportReceivedEmail({
      ...base,
      kind: FeedbackKind.SUGGESTION,
      message:
        'A dark mode\r\nfor the game screen, and while at it a much longer list of other ideas',
    });

    expect(mail.subject).toMatch(/^Idea: A dark mode for the game screen/);
    expect(mail.subject).not.toMatch(/[\r\n]/);
    expect(mail.subject.endsWith('...')).toBe(true);
  });

  it('has no reply-to, and says so, when the player left no email', () => {
    const mail = reportReceivedEmail(base);

    expect(mail.replyTo).toBeUndefined();
    expect(mail.text).toContain('From: Guest');
    expect(mail.text).toContain('no one to reply to');
  });
});
