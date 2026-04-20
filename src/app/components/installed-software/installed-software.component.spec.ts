import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InstalledSoftwareComponent, InstalledSoftwareDataSource } from './installed-software.component';
import { InstalledSoftwareService } from '@services/installed-software.service';
import { MatTableModule } from '@angular/material/table';

describe('InstalledSoftwareComponent', () => {
  let fixture: ComponentFixture<InstalledSoftwareComponent>;
  let mockService: { list: () => any[] };

  beforeEach(async () => {
    mockService = {
      list: () => [
        { name: 'GNS3 VM', type: 'vm', installed: true },
        { name: 'Dynamips', type: 'dynamips', installed: false },
      ],
    };

    await TestBed.configureTestingModule({
      imports: [InstalledSoftwareComponent, MatTableModule],
      providers: [{ provide: InstalledSoftwareService, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(InstalledSoftwareComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should initialize dataSource signal after ngOnInit', () => {
    expect(fixture.componentInstance.dataSource()).toBeTruthy();
    expect(fixture.componentInstance.dataSource()).toBeInstanceOf(InstalledSoftwareDataSource);
  });

  it('should have displayedColumns signal with name and actions', () => {
    expect(fixture.componentInstance.displayedColumns()).toEqual(['name', 'actions']);
  });

  describe('template rendering', () => {
    it('should render mat-table with dataSource', () => {
      const tableEl = fixture.nativeElement.querySelector('mat-table');
      expect(tableEl).toBeTruthy();
    });

    it('should display software items plus adbutler in the table', () => {
      fixture.detectChanges();
      const rows = fixture.nativeElement.querySelectorAll('mat-row');
      // Service returns 2 items + 1 adbutler = 3 rows
      expect(rows.length).toBe(3);
    });
  });
});

describe('InstalledSoftwareDataSource', () => {
  let dataSource: InstalledSoftwareDataSource;
  let mockService: { list: () => any[] };

  beforeEach(() => {
    mockService = {
      list: () => [{ name: 'Test Software', type: 'test', installed: false }],
    };
    dataSource = new InstalledSoftwareDataSource(mockService as any);
  });

  describe('connect', () => {
    it('should return an observable', () => {
      const result = dataSource.connect();
      expect(result).toBeTruthy();
    });

    it('should emit list of installed software plus adbutler', () => {
      const emittedItems: any[] = [];
      dataSource.connect().subscribe((items) => emittedItems.push(items));

      expect(emittedItems.length).toBe(1);
      expect(emittedItems[0].length).toBe(2); // 1 from service + 1 adbutler
      expect(emittedItems[0]).toContainEqual({ type: 'adbutler' });
    });
  });

  describe('disconnect', () => {
    it('should not throw when called', () => {
      expect(() => dataSource.disconnect()).not.toThrow();
    });
  });

  describe('refresh', () => {
    it('should update installed BehaviorSubject with service list plus adbutler', () => {
      dataSource.refresh();

      expect(dataSource.installed.value.length).toBe(2);
      expect(dataSource.installed.value).toContainEqual({ type: 'adbutler' });
    });

    it('should include software from service in the list', () => {
      dataSource.refresh();

      const serviceItem = dataSource.installed.value.find((item) => item.type === 'test');
      expect(serviceItem).toBeTruthy();
      expect(serviceItem).toEqual({ name: 'Test Software', type: 'test', installed: false });
    });
  });
});
