export interface PublishedContentObject {
  readonly httpEtag: string;
  readonly key: string;
  readonly size: number;
  readonly uploaded: Date;
}
