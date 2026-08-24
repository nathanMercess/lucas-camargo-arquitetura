import { ContactMessage } from '../models/contact-message.model';
import { ContactBucket } from '../models/contact-bucket.model';
import { ContactMessageIndex } from '../models/contact-message-index.model';
import { ContactSubmission } from '../models/contact-submission.model';

export async function storeContactMessage(
  bucket: ContactBucket,
  submission: ContactSubmission,
  requestId: string,
  turnstileHostname: string,
  now = new Date(),
): Promise<ContactMessage | null> {
  const receivedAt = now.toISOString();
  const id = crypto.randomUUID();
  const message: ContactMessage = {
    schemaVersion: 1,
    id,
    receivedAt,
    status: 'new',
    name: submission.name,
    email: submission.email,
    phone: submission.phone,
    subject: submission.subject,
    message: submission.message,
    source: 'website',
    requestId,
    turnstileHostname,
  };
  const datePath = receivedAt.slice(0, 10).replaceAll('-', '/');
  const compactTimestamp = receivedAt.replace(/[-:.]/g, '');
  const key = `contacts/messages/${datePath}/${compactTimestamp}-${id}.json`;
  const storageOptions = {
    onlyIf: { etagDoesNotMatch: '*' },
    httpMetadata: {
      cacheControl: 'no-store',
      contentType: 'application/json; charset=utf-8',
    },
  } as const;
  const stored = await bucket.put(key, JSON.stringify(message), storageOptions);

  if (!stored)
    return null;

  const index: ContactMessageIndex = {
    schemaVersion: 1,
    id,
    objectKey: key,
  };
  const storedIndex = await bucket.put(
    `contacts/index/${id}.json`,
    JSON.stringify(index),
    storageOptions,
  );

  return storedIndex ? message : null;
}
