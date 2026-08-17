// components/DataTable/utils.ts
export function sortData<T>(data: T[], accessor: keyof T, direction: 'asc' | 'desc') {
  return [...data].sort((a, b) => {
    const aValue = a[accessor];
    const bValue = b[accessor];
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}
