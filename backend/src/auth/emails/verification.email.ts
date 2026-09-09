import { EmailMessage } from '../../email/types';
import { renderEmail } from './layout';

export function verificationEmail(to: string, link: string): EmailMessage {
  return {
    to,
    subject: 'Confirm your email for sopranino',
    text: [
      'Confirm your address to finish setting up your sopranino account:',
      '',
      link,
      '',
      'The link works once and expires in 24 hours.',
      'If you did not sign up, you can ignore this - nothing was created for you.',
    ].join('\n'),
    html: renderEmail({
      heading: 'Confirm your email',
      paragraphs: [
        'One click and this address is yours on sopranino, which is what lets you get back in if you ever forget your password.',
      ],
      action: { label: 'Confirm my email', href: link },
      footnote:
        'The link works once and expires in 24 hours. If you did not sign up, ignore this &mdash; nothing was created for you.',
    }),
  };
}
