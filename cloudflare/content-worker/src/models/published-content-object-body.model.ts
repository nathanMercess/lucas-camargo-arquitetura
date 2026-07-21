import { PublishedContentObject } from './published-content-object.model';

export interface PublishedContentObjectBody extends PublishedContentObject {
  readonly body: BodyInit | null;
}
