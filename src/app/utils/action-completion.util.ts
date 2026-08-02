export interface ActionCompletion {
  succeed(): void;
  fail(): void;
}

export function createActionCompletion(
  operationCount: number,
  onComplete: (successfulOperationCount: number) => void
): ActionCompletion {
  let completedOperationCount = 0;
  let successfulOperationCount = 0;

  const complete = (succeeded: boolean) => {
    if (completedOperationCount >= operationCount) return;

    completedOperationCount++;
    if (succeeded) successfulOperationCount++;

    if (completedOperationCount === operationCount) {
      onComplete(successfulOperationCount);
    }
  };

  return {
    succeed: () => complete(true),
    fail: () => complete(false),
  };
}
