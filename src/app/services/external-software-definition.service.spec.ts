import { TestBed } from '@angular/core/testing';

import { ExternalSoftwareDefinitionService } from './external-software-definition.service';

describe('ExternalSoftwareDefinitionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ExternalSoftwareDefinitionService = TestBed.get(ExternalSoftwareDefinitionService);
    expect(service).toBeTruthy();
  });
});
