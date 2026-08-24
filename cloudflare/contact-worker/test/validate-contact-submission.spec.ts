import { describe, expect, it } from 'vitest';

import { validateContactSubmission } from '../src/validation/validate-contact-submission';

const validSubmission = {
  name: 'Nathan Silva',
  email: 'NATHAN@example.com',
  phone: '+55 (11) 98668-1572',
  subject: 'Projeto residencial',
  message: 'Gostaria de conversar sobre um novo projeto residencial.',
  turnstileToken: 'turnstile-token',
  website: '',
};

describe('validateContactSubmission', () => {
  it('normalizes a valid submission without changing its content', () => {
    expect(validateContactSubmission(validSubmission)).toEqual({
      ...validSubmission,
      email: 'nathan@example.com',
    });
  });

  it('rejects unknown properties and unsafe text', () => {
    expect(validateContactSubmission({ ...validSubmission, role: 'admin' })).toBeNull();
    expect(validateContactSubmission({ ...validSubmission, message: '<script>alert(1)</script>' })).toBeNull();
    expect(validateContactSubmission({ ...validSubmission, name: 'Nathan\nSilva' })).toBeNull();
    expect(validateContactSubmission({ ...validSubmission, email: 'nathan<admin>@example.com' })).toBeNull();
    expect(validateContactSubmission({ ...validSubmission, subject: 'Projeto\u007f residencial' })).toBeNull();
  });

  it('enforces email, phone, message and Turnstile limits', () => {
    expect(validateContactSubmission({ ...validSubmission, email: 'invalid' })).toBeNull();
    expect(validateContactSubmission({ ...validSubmission, phone: '123' })).toBeNull();
    expect(validateContactSubmission({ ...validSubmission, message: 'curta' })).toBeNull();
    expect(validateContactSubmission({ ...validSubmission, turnstileToken: 'x'.repeat(2_049) })).toBeNull();
  });
});
