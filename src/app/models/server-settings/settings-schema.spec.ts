import { describe, it, expect } from 'vitest';
import {
  OpenApiDocument,
  extractSettingsSchemas,
  enrichSettingsMetadata,
} from './settings-schema';
import { SETTINGS_METADATA } from './settings-metadata';

// Shapes copied from a live /openapi.json: SettingsResponse points at section
// components through $refs whose names are not uniform.
function openApiDoc(sections: { [section: string]: { [field: string]: object } }): OpenApiDocument {
  const components: Record<string, object> = {};
  const responseProperties: Record<string, object> = {};
  for (const [section, fields] of Object.entries(sections)) {
    const component = `Test${section}Settings`;
    components[component] = { properties: fields };
    responseProperties[section] = { $ref: `#/components/schemas/${component}` };
  }
  components['SettingsResponse'] = { properties: responseProperties };
  return { components: { schemas: components } };
}

describe('extractSettingsSchemas', () => {
  it('resolves the section field schemas through the SettingsResponse references', () => {
    const doc = openApiDoc({
      Server: { port: { type: 'integer', maximum: 65535, exclusiveMinimum: 0 } },
      VPCS: { vpcs_path: { type: 'string', default: 'vpcs' } },
    });

    const schemas = extractSettingsSchemas(doc);

    expect(schemas).not.toBeNull();
    expect(schemas!['Server']!['port']).toBeDefined();
    expect(schemas!['VPCS']!['vpcs_path']).toBeDefined();
    expect(schemas!['Controller']).toBeUndefined();
  });

  it('returns null when the server has no SettingsResponse component', () => {
    expect(extractSettingsSchemas({ components: { schemas: {} } })).toBeNull();
    expect(extractSettingsSchemas({})).toBeNull();
  });

  it('ignores sections whose reference cannot be resolved', () => {
    const doc: OpenApiDocument = {
      components: {
        schemas: {
          SettingsResponse: {
            properties: {
              Server: { $ref: '#/components/schemas/Missing' },
              Qemu: { type: 'object' },
            },
          },
        },
      },
    };

    expect(extractSettingsSchemas(doc)).toBeNull();
  });
});

describe('enrichSettingsMetadata', () => {
  it('adopts the schema description as the field hint', () => {
    const doc = openApiDoc({
      Server: {
        port: { type: 'integer', maximum: 65535, exclusiveMinimum: 0, description: 'HTTP port used to control the server' },
      },
    });

    const port = field('Server', 'port', doc);

    expect(port.hint).toBe('HTTP port used to control the server');
  });

  it('maps numeric bounds, promoting exclusive bounds to the nearest integer', () => {
    const doc = openApiDoc({
      Server: {
        port: { type: 'integer', maximum: 65535, exclusiveMinimum: 0 },
        marker_listen_port: { type: 'integer', minimum: 0, maximum: 65535 },
        vnc_console_start_port_range: { type: 'integer', minimum: 5900, maximum: 65535 },
      },
    });

    expect(bounds('Server', 'port', doc)).toEqual({ min: 1, max: 65535 });
    expect(bounds('Server', 'marker_listen_port', doc)).toEqual({ min: 0, max: 65535 });
    expect(bounds('Server', 'vnc_console_start_port_range', doc)).toEqual({ min: 5900, max: 65535 });
  });

  it('replaces enum options with the server choices, reusing curated labels', () => {
    const doc = openApiDoc({
      Server: {
        protocol: { $ref: '#/components/schemas/ServerProtocol', description: 'Protocol', default: 'http' },
      },
    });
    doc.components!.schemas!['ServerProtocol'] = { type: 'string', enum: ['http', 'https', 'ftp'] };

    const protocol = field('Server', 'protocol', doc);

    expect(protocol.options).toEqual([
      { value: 'http', label: 'HTTP' },
      { value: 'https', label: 'HTTPS' },
      { value: 'ftp', label: 'Ftp' },
    ]);
  });

  it('refines builtin defaults only where the compiled metadata already declares one', () => {
    const doc = openApiDoc({
      Server: {
        // Runtime-resolved default must not make the field revertible.
        name: { type: 'string', default: 'myhost (controller)' },
        port: { type: 'integer', default: 3080 },
        // Masked secret default must not leak into the form.
        compute_password: { type: 'string', default: '**********', writeOnly: true },
      },
      Controller: {
        default_admin_password: { type: 'string', default: '**********', writeOnly: true },
      },
    });

    expect(field('Server', 'name', doc).defaultValue).toBeUndefined();
    expect(field('Server', 'port', doc).defaultValue).toBe(3080);
    expect(field('Server', 'compute_password', doc).defaultValue).toBe('');
    expect(field('Controller', 'default_admin_password', doc).defaultValue).toBe('admin');
  });

  it('leaves fields and sections without schema information untouched', () => {
    const doc = openApiDoc({
      Server: { port: { type: 'integer', maximum: 60000 } },
    });

    const enriched = enrichSettingsMetadata(SETTINGS_METADATA, extractSettingsSchemas(doc)!);

    // Unmentioned field objects keep their identity, the compiled metadata is
    // never mutated, and sections without a schema pass through as-is.
    expect(field('Server', 'name', doc)).toBe(compiledField('Server', 'name'));
    expect(compiledField('Server', 'port').max).toBe(65535);
    expect(enriched.find((s) => s.name === 'Qemu')).toBe(SETTINGS_METADATA.find((s) => s.name === 'Qemu'));
  });

  it('adopts list defaults from the schema', () => {
    const doc = openApiDoc({
      Server: { allowed_interfaces: { type: 'array', items: { type: 'string' }, default: ['eth0'] } },
    });

    expect(field('Server', 'allowed_interfaces', doc).defaultValue).toEqual(['eth0']);
  });
});

function field(section: string, key: string, doc: OpenApiDocument) {
  const enriched = enrichSettingsMetadata(SETTINGS_METADATA, extractSettingsSchemas(doc)!);
  for (const meta of enriched) {
    if (meta.name !== section) {
      continue;
    }
    for (const group of meta.groups) {
      const match = group.fields.find((f) => f.key === key);
      if (match) {
        return match;
      }
    }
  }
  throw new Error(`field ${section}.${key} not found`);
}

// Compiled fields live in curated groups (port sits in "Network and
// security", not the first group) — search them all.
function compiledField(section: string, key: string) {
  const meta = SETTINGS_METADATA.find((s) => s.name === section);
  for (const group of meta?.groups ?? []) {
    const match = group.fields.find((f) => f.key === key);
    if (match) {
      return match;
    }
  }
  throw new Error(`compiled field ${section}.${key} not found`);
}

function bounds(section: string, key: string, doc: OpenApiDocument) {
  const { min, max } = field(section, key, doc);
  return { min, max };
}
