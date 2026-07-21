import { PublishedContentObjectBody } from './published-content-object-body.model';
import { PublishedContentObject } from './published-content-object.model';

export interface PublishedContentBucket {
  get(key: string): Promise<PublishedContentObjectBody | null>;
  head(key: string): Promise<PublishedContentObject | null>;
}
