/** Read live membership totals without flooding the API or blocking the list. */
export async function loadDepartmentMemberCounts(
  departmentIds: readonly string[],
  readCount: (departmentId: string) => Promise<number>,
  onCount: (departmentId: string, count: number | null) => void,
  isCancelled: () => boolean = () => false,
): Promise<void> {
  let nextIndex = 0;

  const loadNext = async () => {
    while (nextIndex < departmentIds.length && !isCancelled()) {
      const departmentId = departmentIds[nextIndex++];
      let count: number | null = null;
      try {
        const total = await readCount(departmentId);
        if (Number.isInteger(total) && total >= 0) count = total;
      } catch {
        // An unavailable count must not be displayed as an empty department.
      }
      if (!isCancelled()) onCount(departmentId, count);
    }
  };

  await Promise.all(Array.from({ length: Math.min(4, departmentIds.length) }, loadNext));
}
