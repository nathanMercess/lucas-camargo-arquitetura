export interface WorkerExecutionContext {
  waitUntil(task: Promise<unknown>): void;
}
