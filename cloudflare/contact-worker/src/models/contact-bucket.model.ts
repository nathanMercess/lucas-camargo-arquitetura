import { StoredContactObject } from './stored-contact-object.model';

export interface ContactBucket {
  put(
    key: string,
    value: string,
    options: {
      readonly onlyIf: { readonly etagDoesNotMatch: '*' };
      readonly httpMetadata: {
        readonly cacheControl: 'no-store';
        readonly contentType: 'application/json; charset=utf-8';
      };
    },
  ): Promise<StoredContactObject | null>;
}
