export interface ContactSubmission {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly subject: string;
  readonly message: string;
  readonly turnstileToken: string;
  readonly website: string;
}
