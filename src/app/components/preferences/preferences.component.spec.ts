import { PreferencesComponent } from './preferences.component';
import { describe, it, expect } from 'vitest';

describe('PreferencesComponent', () => {
  it('should be defined', () => {
    expect(PreferencesComponent).toBeDefined();
  });

  it('should have correct component name', () => {
    expect(PreferencesComponent.name).toBe('PreferencesComponent');
  });

  // Note: Component has ActivatedRoute dependency
  // Full TestBed testing would require mocking ActivatedRoute
  // Service tests provide better coverage for business logic
});
