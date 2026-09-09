import { EmailMessage } from '../../email/types';
import { renderEmail } from './layout';

/**
 * Deliberately unlike the shape a phishing template takes: named rather than
 * addressed to nobody, the link written out plainly before the button, and no
 * alarm about who asked. That silhouette -- third person warning, big coloured
 * call to action, urgency about expiry -- is what filters weigh, and reset mail
 * is judged hardest of anything we send.
 */
export function passwordResetEmail(
  to: string,
  link: string,
  displayName: string,
): EmailMessage {
  return {
    to,
    subject: `Set a new password for ${displayName} on sopranino`,
    text: [
      `Hi ${displayName},`,
      '',
      'Here is your link to set a new password on sopranino:',
      '',
      link,
      '',
      'Your stats, streak and history are all still there.',
      'The link works once, for the next hour.',
      'Not you? Nothing has changed, and you can ignore this.',
    ].join('\n'),
    html: renderEmail({
      heading: 'Set a new password',
      greeting: `Hi ${displayName},`,
      paragraphs: [
        `Here is your link to set a new password on sopranino: <a href="${link}" style="color:#1db954">${link}</a>`,
        'Your stats, streak and history are all still there, waiting on the same account.',
      ],
      action: { label: 'Open the link', href: link },
      footnote:
        'The link works once, for the next hour. Not you? Nothing has changed, and you can ignore this.',
    }),
  };
}
