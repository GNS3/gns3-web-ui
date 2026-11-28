import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Controller } from '@models/controller';
import { NodeWipeService } from '@services/node-wipe.service';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Node } from '../../../../../cartography/models/node';
import { WipeNodeActionComponent } from './wipe-node-action.component';

const controller = { id: 1 } as Controller;
const nodeFor = (node_type: string, status = 'stopped') =>
  ({ node_id: 'node-1', project_id: 'project-1', name: 'R1', node_type, status }) as Node;

describe('WipeNodeActionComponent', () => {
  let fixture: ComponentFixture<WipeNodeActionComponent>;
  let wipes: { wipe: ReturnType<typeof vi.fn> };
  let result: Subject<void>;
  const button = () => fixture.nativeElement.querySelector('button') as HTMLButtonElement | null;
  const show = (...nodes: Node[]) => {
    fixture.componentRef.setInput('nodes', nodes);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    result = new Subject<void>();
    wipes = { wipe: vi.fn(() => result) };
    await TestBed.configureTestingModule({
      imports: [WipeNodeActionComponent],
      providers: [{ provide: NodeWipeService, useValue: wipes }],
    }).compileComponents();
    fixture = TestBed.createComponent(WipeNodeActionComponent);
    fixture.componentRef.setInput('controller', controller);
  });
  afterEach(() => fixture.destroy());

  it('ignores a second click while a wipe is in progress and re-enables afterwards', () => {
    const node = nodeFor('qemu', 'started');
    show(node);
    expect(button()?.textContent).toContain('Wipe node');
    button()!.click();
    expect(wipes.wipe).toHaveBeenCalledExactlyOnceWith(controller, 'project-1', [node]);
    fixture.detectChanges();
    expect(fixture.componentInstance.busy()).toBe(true);
    expect(button()!.disabled).toBe(true);
    fixture.componentInstance.wipe();
    expect(wipes.wipe).toHaveBeenCalledTimes(1);
    result.complete();
    fixture.detectChanges();
    expect(fixture.componentInstance.busy()).toBe(false);
    expect(button()!.disabled).toBe(false);
  });

  it('does nothing for an unsupported node even if invoked directly', () => {
    show(nodeFor('cloud', 'started'));
    expect(button()).toBeNull();
    fixture.componentInstance.wipe();
    expect(wipes.wipe).not.toHaveBeenCalled();
  });
});
