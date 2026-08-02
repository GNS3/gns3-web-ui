import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationCenterService } from '@services/notification-center.service';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotificationCenterComponent } from './notification-center.component';

describe('NotificationCenterComponent', () => {
  let component: NotificationCenterComponent;
  let fixture: ComponentFixture<NotificationCenterComponent>;
  let notificationCenter: NotificationCenterService;

  beforeEach(async () => {
    localStorage.removeItem('gns3-notification-history');
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [NotificationCenterComponent] }).compileComponents();

    notificationCenter = TestBed.inject(NotificationCenterService);
    fixture = TestBed.createComponent(NotificationCenterComponent);
    component = fixture.componentInstance;
  });

  it('shows the panel only while it is open', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.notification-center')).toBeNull();

    notificationCenter.togglePanel();
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('.notification-center');
    expect(panel).not.toBeNull();
    expect(panel.getAttribute('role')).toBe('region');
  });

  it('shows the unread count beside the panel title', () => {
    notificationCenter.add('success', 'Node started');
    notificationCenter.togglePanel();
    fixture.detectChanges();

    const heading = fixture.nativeElement.querySelector('.notification-center__heading');

    expect(heading.querySelector('h2').textContent.trim()).toBe('Notifications');
    expect(heading.querySelector('.notification-center__unread').textContent.trim()).toBe('1 unread');
  });

  it('filters notification history by category and search text', () => {
    notificationCenter.add('success', 'Node started');
    notificationCenter.add('error', 'Console connection failed');
    notificationCenter.add('warning', 'Server memory is high');

    component.activeFilter.set('error');
    expect(component.filteredNotifications().map((item) => item.message)).toEqual(['Console connection failed']);

    component.activeFilter.set('all');
    component.searchQuery.set('node');
    expect(component.filteredNotifications().map((item) => item.message)).toEqual(['Node started']);
  });

  it('includes the date for notifications from a previous day', () => {
    expect(component.formatTime(new Date('2020-01-02T03:04:05Z').getTime())).toContain('2020');
  });

  it('marks an item as read when it is opened', () => {
    const notification = notificationCenter.add('info', 'Project autosaved');

    component.markAsRead(notification);

    expect(notificationCenter.unreadCount()).toBe(0);
    expect(notificationCenter.notifications()[0].read).toBe(true);
  });

  it('removes an item without propagating the row click', () => {
    const notification = notificationCenter.add('error', 'Delete failed');
    const event = new MouseEvent('click');
    let propagated = false;
    event.stopPropagation = () => {
      propagated = true;
    };

    component.remove(event, notification.id);

    expect(propagated).toBe(true);
    expect(notificationCenter.notifications()).toEqual([]);
  });

  it('closes the panel on Escape', () => {
    notificationCenter.togglePanel();

    component.closeOnEscape();

    expect(notificationCenter.panelOpen()).toBe(false);
  });
});
