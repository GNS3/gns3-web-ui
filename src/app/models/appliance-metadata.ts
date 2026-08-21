/**
 * Metadata persisted on a template describing the appliance it was installed
 * from (server: appliance_to_template._build_appliance_metadata — a snapshot
 * taken at install time; later registry updates do not affect it).
 *
 * All fields are optional and may be null or absent (the server materializes
 * the known keys as null in responses — treat null like missing). The server
 * model is extra="allow" and passes unknown keys through, so read-modify-write
 * edits must preserve keys it does not know about.
 */
export interface ApplianceMetadata {
  appliance_id?: string | null;
  description?: string | null;
  vendor_name?: string | null;
  vendor_url?: string | null;
  vendor_logo_url?: string | null;
  documentation_url?: string | null;
  product_name?: string | null;
  product_url?: string | null;
  status?: string | null;
  availability?: string | null;
  maintainer?: string | null;
  maintainer_email?: string | null;
  installation_instructions?: string | null;
  default_username?: string | null;
  default_password?: string | null;
  // Unknown/future registry keys — preserved on read-modify-write.
  [key: string]: unknown;
}
