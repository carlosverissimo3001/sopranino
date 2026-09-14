import { FeedbackKind } from '@prisma/client';
import { renderEmail } from '../../auth/emails/layout';
import { escapeHtml } from '../../email/escape-html';
import { EmailMessage } from '../../email/types';

const SUBJECT_PREVIEW = 60;

export interface ReportReceived {
  to: string;
  kind: FeedbackKind;
  message: string;
  email?: string;
  senderName?: string;
  pagePath?: string;
  userAgent?: string;
  adminUrl: string;
}

export function reportReceivedEmail(report: ReportReceived): EmailMessage {
  const label = report.kind === FeedbackKind.BUG ? 'Bug report' : 'Idea';
  const oneLine = report.message.replace(/\s+/g, ' ').trim();
  const preview =
    oneLine.length > SUBJECT_PREVIEW
      ? `${oneLine.slice(0, SUBJECT_PREVIEW).trimEnd()}...`
      : oneLine;
  const from = report.senderName ?? 'Guest';

  const details = [
    `From: ${from}${report.email ? ` <${report.email}>` : ''}`,
    report.pagePath && `Page: ${report.pagePath}`,
    report.userAgent && `Browser: ${report.userAgent}`,
  ].filter((line): line is string => Boolean(line));

  return {
    to: report.to,
    replyTo: report.email,
    subject: `${label}: ${preview}`,
    text: [
      report.message,
      '',
      ...details,
      '',
      report.email
        ? 'Reply to this email to answer them.'
        : 'They left no email, so there is no one to reply to.',
      `All reports: ${report.adminUrl}`,
    ].join('\n'),
    html: renderEmail({
      heading: `New ${label.toLowerCase()}`,
      paragraphs: [
        escapeHtml(report.message).replace(/\n/g, '<br>'),
        details.map(escapeHtml).join('<br>'),
      ],
      action: { label: 'Open reports', href: report.adminUrl },
      footnote: report.email
        ? 'Reply to this email to answer them.'
        : 'They left no email, so there is no one to reply to.',
    }),
  };
}
