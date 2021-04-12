import { TestBed, inject } from '@angular/core/testing';

import { IndexedDbService } from './indexed-db.service';

describe('IndexedDbService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IndexedDbService],
    });
  });

  it('should be created', inject([IndexedDbService], (service: IndexedDbService) => {
    expect(service).toBeTruthy();
  }));

  it('should get AngularIndexedDB', inject([IndexedDbService], (service: IndexedDbService) => {
    const indexeddb = service.get();
    expect(indexeddb.dbWrapper.dbName).toEqual(IndexedDbService.DATABASE);
    expect(indexeddb.dbWrapper.dbVersion).toEqual(IndexedDbService.VERSION);
  }));
});
