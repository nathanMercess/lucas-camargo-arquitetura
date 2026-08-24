export interface ContactMessage {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly receivedAt: string;
  readonly status: 'new';
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly subject: string;
  readonly message: string;
  readonly source: 'website';
  readonly requestId: string;
  readonly turnstileHostname: string;
}
