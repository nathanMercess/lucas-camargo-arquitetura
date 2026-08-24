import { ContactSubmission } from '../models/contact-submission.model';

const allowedKeys = new Set([
  'email',
  'message',
  'name',
  'phone',
  'subject',
  'turnstileToken',
  'website',
]);

export function validateContactSubmission(value: unknown): ContactSubmission | null {
  if (!isRecord(value) || Object.keys(value).some((key) => !allowedKeys.has(key)))
    return null;

  const submission: ContactSubmission = {
    name: readTrimmedString(value, 'name'),
    email: readTrimmedString(value, 'email').toLowerCase(),
    phone: readTrimmedString(value, 'phone'),
    subject: readTrimmedString(value, 'subject'),
    message: readTrimmedString(value, 'message'),
    turnstileToken: readTrimmedString(value, 'turnstileToken'),
    website: readTrimmedString(value, 'website'),
  };

  if (
    !isSafeText(submission.name, 2, 120, false) ||
    !isEmail(submission.email) ||
    !isPhone(submission.phone) ||
    !isSafeText(submission.subject, 3, 160, false) ||
    !isSafeText(submission.message, 10, 4_000, true) ||
    submission.turnstileToken.length < 1 ||
    submission.turnstileToken.length > 2_048 ||
    submission.website.length > 200
  )
    return null;

  return submission;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readTrimmedString(value: Readonly<Record<string, unknown>>, key: string): string {
  const item = value[key];

  return typeof item === 'string' ? item.trim() : '';
}

function isSafeText(
  value: string,
  minimum: number,
  maximum: number,
  allowLineBreaks: boolean,
): boolean {
  if (value.length < minimum || value.length > maximum)
    return false;

  return !Array.from(value).some((character) => {
    const codePoint = character.charCodeAt(0);

    if (character === '<' || character === '>' || codePoint === 127)
      return true;

    if (codePoint >= 32)
      return false;

    return !allowLineBreaks || ![9, 10, 13].includes(codePoint);
  });
}

function isEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value);
}

function isPhone(value: string): boolean {
  const digits = value.replace(/[^0-9]/g, '');

  return value.length <= 30 && /^[+0-9() .-]+$/.test(value) && digits.length >= 8 && digits.length <= 15;
}
