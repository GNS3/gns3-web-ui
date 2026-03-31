import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WebConsoleComponent } from './web-console.component';
import { NodeConsoleService } from '@services/nodeConsole.service';
import { ThemeService } from '@services/theme.service';
import { XtermContextMenuService } from '@services/xterm-context-menu.service';

describe('WebConsoleComponent', () => {
  let component: WebConsoleComponent;
  let fixture: ComponentFixture<WebConsoleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: NodeConsoleService, useValue: {} },
        { provide: ThemeService, useValue: { getActualTheme: () => 'dark' } },
        { provide: XtermContextMenuService, useValue: { attachContextMenu: () => () => {} } },
      ]
      }).compileComponents();

    fixture = TestBed.createComponent(WebConsoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
