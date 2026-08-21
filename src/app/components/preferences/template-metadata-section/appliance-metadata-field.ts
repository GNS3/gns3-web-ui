import { ApplianceMetadata } from '@models/appliance-metadata';

/** Credential keys edited in the template details General settings section. */
export type ApplianceCredentialField = 'default_username' | 'default_password';

/** Read a credential for an input's [value]; null/absent render as ''. */
export function applianceCredentialValue(metadata: ApplianceMetadata | null, field: ApplianceCredentialField): string {
  const value = metadata?.[field];
  return value === undefined || value === null || value === '' ? '' : String(value);
}

/**
 * Field-level update behind the General settings credential inputs: clone the
 * current metadata, set (or drop, when empty) the one key, preserve everything
 * else. An all-empty object becomes null (the server's clear semantics).
 */
export function setApplianceCredential(
  current: ApplianceMetadata | null,
  field: ApplianceCredentialField,
  value: string
): ApplianceMetadata | null {
  const next: { [key: string]: unknown } = { ...(current || {}) };
  if (value.trim() !== '') {
    next[field] = value;
  } else {
    delete next[field];
  }
  return Object.keys(next).length > 0 ? (next as ApplianceMetadata) : null;
}
