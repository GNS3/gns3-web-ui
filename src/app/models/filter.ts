export interface Filter {
  [filterType: string]: (number | string)[];
}

/**
 * The server stores only active filters on a link (all-zero or empty values
 * are stripped on PUT), so having at least one key means an active filter.
 */
export function hasActiveFilters(filters: Filter | undefined | null): boolean {
  return !!filters && Object.keys(filters).length > 0;
}
