import { EmailMessage } from '../../email/types';
import { renderEmail } from './layout';

export function emailChangeConfirmEmail(
  to: string,
  link: string,
  displayName: string,
): EmailMessage {
  return {
    to,
    subject: `Confirm your new email for ${displayName} on sopranino`,
    text: [
      `Hi ${displayName},`,
      '',
      'Confirm this address to make it the email on your sopranino account:',
      '',
      link,
      '',
      'Until you do, your old address stays on the account.',
      'The link works once and expires in 24 hours. Not you? Ignore this, and nothing changes.',
    ].join('\n'),
    html: renderEmail({
      heading: 'Confirm your new email',
      greeting: `Hi ${displayName},`,
      paragraphs: [
        'Confirm this address to make it the email on your sopranino account. Until you do, your old address stays on it.',
      ],
      action: { label: 'Confirm my new email', href: link },
      footnote:
        'The link works once and expires in 24 hours. Not you? Ignore this, and nothing changes.',
    }),
  };
}

/** To the address being replaced, which is still the account's until the new one is confirmed. */
export function emailChangeNoticeEmail(params: {
  to: string;
  newEmail: string;
  cancelLink: string;
  displayName: string;
}): EmailMessage {
  const { to, newEmail, cancelLink, displayName } = params;
  return {
    to,
    subject: `Your sopranino email is being changed`,
    text: [
      `Hi ${displayName},`,
      '',
      `Someone signed in as you asked to change the email on your sopranino account to ${newEmail}.`,
      'Nothing changes until that address is confirmed.',
      '',
      'Not you? Cancel it here, then change your password:',
      '',
      cancelLink,
    ].join('\n'),
    html: renderEmail({
      heading: 'Your email is being changed',
      greeting: `Hi ${displayName},`,
      paragraphs: [
        `Someone signed in as you asked to change the email on your sopranino account to <strong>${newEmail}</strong>. Nothing changes until that address is confirmed.`,
      ],
      action: { label: 'Cancel the change', href: cancelLink },
      footnote:
        'If this was you, there is nothing to do. If not, cancel it and change your password.',
    }),
  };
}
