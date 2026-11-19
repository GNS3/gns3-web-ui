/**
 * Rendering-time evaluation of route privilege data.
 *
 * PrivilegeGuard reads `data.privileges` / `data.privilegesAny` /
 * `data.privilegeMatch` when deciding whether a navigation may activate.
 * Sidebar entries and tab bars gate the SAME routes for visibility and must
 * not re-declare those privilege sets (a silent desync risk); they read the
 * route config instead and evaluate it with this helper, which mirrors the
 * guard's semantics exactly:
 *
 * - `privileges` are all required (or at least one of them with
 *   `privilegeMatch: 'any'`);
 * - `privilegesAny` is an optional "at least one of" group on top;
 * - a route without privilege data is open to everyone.
 */
export interface RoutePrivilegeData {
  privileges?: readonly string[];
  privilegesAny?: readonly string[];
  privilegeMatch?: 'all' | 'any';
}

export function routeDataAllows(data: RoutePrivilegeData | undefined, has: (privilege: string) => boolean): boolean {
  const required = data?.privileges ?? [];
  const anyOf = data?.privilegesAny ?? [];
  if (required.length === 0 && anyOf.length === 0) {
    return true;
  }
  const match = data?.privilegeMatch ?? 'all';
  const allowedRequired = match === 'any' ? required.some(has) : required.every(has);
  return allowedRequired && (anyOf.length === 0 || anyOf.some(has));
}
