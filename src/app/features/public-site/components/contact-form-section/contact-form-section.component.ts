import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import { ContactFormSectionConfig } from '../../../../shared/models/contact-form-section-config.model';
import { ContactSubmissionService } from '../../services/contact-submission.service';
import { PublicSiteRuntimeConfigService } from '../../services/public-site-runtime-config.service';
import { TurnstileService } from '../../services/turnstile.service';

function safeTrimmedText(
  minimumLength: number,
  maximumLength: number,
  allowLineBreaks = false,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = typeof control.value === 'string' ? control.value.trim() : '';
    const isSafe = Array.from(value).every((character) => {
      const codePoint = character.charCodeAt(0);

      if (character === '<' || character === '>' || codePoint === 127)
        return false;

      return codePoint >= 32 || (allowLineBreaks && [9, 10, 13].includes(codePoint));
    });

    return value.length >= minimumLength &&
      value.length <= maximumLength &&
      isSafe
      ? null
      : { safeText: true };
  };
}

function validPhone(control: AbstractControl): ValidationErrors | null {
  const value = typeof control.value === 'string' ? control.value.trim() : '';
  const digits = value.replace(/[^0-9]/g, '');

  return value.length <= 30 &&
    /^[+0-9() .-]+$/.test(value) &&
    digits.length >= 8 &&
    digits.length <= 15
    ? null
    : { phone: true };
}

@Component({
  selector: 'app-contact-form-section',
  templateUrl: './contact-form-section.component.html',
  standalone: false,
  styleUrls: ['./contact-form-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactFormSectionComponent implements AfterViewInit, OnDestroy {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  private readonly ngZone = inject(NgZone);

  private readonly runtimeConfig = inject(PublicSiteRuntimeConfigService);

  private readonly submissionService = inject(ContactSubmissionService);

  private readonly turnstile = inject(TurnstileService);

  private readonly turnstileContainer = viewChild.required<ElementRef<HTMLElement>>(
    'turnstileContainer',
  );

  private readonly turnstileToken = signal('');

  private widgetId: string | null = null;

  public readonly config = input.required<ContactFormSectionConfig>();

  public readonly form = this.formBuilder.group({
    name: ['', [safeTrimmedText(2, 120)]],
    email: [
      '',
      [
        Validators.required,
        Validators.maxLength(254),
        Validators.pattern(/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/),
      ],
    ],
    phone: ['', [validPhone]],
    subject: ['', [safeTrimmedText(3, 160)]],
    message: ['', [safeTrimmedText(10, 4_000, true)]],
    website: ['', [Validators.maxLength(200)]],
  });

  public readonly isSubmitting = signal(false);

  public readonly submitSucceeded = signal(false);

  public readonly submitFailed = signal(false);

  public readonly challengeUnavailable = signal(false);

  public readonly isAvailable = computed(
    () =>
      this.submissionService.isAvailable &&
      Boolean(this.runtimeConfig.turnstileSiteKey) &&
      !this.challengeUnavailable(),
  );

  public readonly canSubmit = computed(
    () =>
      this.isAvailable() &&
      Boolean(this.turnstileToken()) &&
      !this.isSubmitting(),
  );

  public constructor() {
    if (!this.submissionService.isAvailable)
      this.form.disable();
  }

  public ngAfterViewInit(): void {
    const siteKey = this.runtimeConfig.turnstileSiteKey;

    if (!siteKey || !this.submissionService.isAvailable)
      return;

    void this.turnstile
      .render(
        this.turnstileContainer().nativeElement,
        siteKey,
        (token) => this.ngZone.run(() => this.turnstileToken.set(token)),
        () => this.ngZone.run(() => this.handleChallengeFailure()),
        () => this.ngZone.run(() => this.turnstileToken.set('')),
      )
      .then((widgetId) => {
        this.widgetId = widgetId;
      })
      .catch(() => {
        this.ngZone.run(() => this.handleChallengeFailure());
      });
  }

  public ngOnDestroy(): void {
    if (this.widgetId)
      this.turnstile.remove(this.widgetId);
  }

  public submit(): void {
    this.submitSucceeded.set(false);
    this.submitFailed.set(false);
    this.form.markAllAsTouched();

    if (this.form.invalid || !this.canSubmit())
      return;

    const value = this.form.getRawValue();

    this.isSubmitting.set(true);
    this.submissionService
      .submit({
        name: value.name.trim(),
        email: value.email.trim(),
        phone: value.phone.trim(),
        subject: value.subject.trim(),
        message: value.message.trim(),
        turnstileToken: this.turnstileToken(),
        website: value.website,
      })
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.resetChallenge();
        }),
      )
      .subscribe({
        next: () => {
          this.form.reset();
          this.submitSucceeded.set(true);
        },
        error: () => this.submitFailed.set(true),
      });
  }

  public hasError(controlName: 'email' | 'message' | 'name' | 'phone' | 'subject'): boolean {
    const control = this.form.controls[controlName];

    return control.invalid && (control.dirty || control.touched);
  }

  private handleChallengeFailure(): void {
    this.turnstileToken.set('');
    this.challengeUnavailable.set(true);
    this.form.disable();
  }

  private resetChallenge(): void {
    this.turnstileToken.set('');

    if (this.widgetId)
      this.turnstile.reset(this.widgetId);
  }
}
