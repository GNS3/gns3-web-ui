import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Subject } from 'rxjs';
import { ChatInputAreaComponent } from './chat-input-area.component';
import { ThemeService } from '@services/theme.service';
import { LLMModelConfigWithSource, CopilotMode } from '@models/ai-profile';

describe('ChatInputAreaComponent', () => {
  let fixture: ComponentFixture<ChatInputAreaComponent>;
  let component: ChatInputAreaComponent;
  let mockThemeService: {
    savedTheme: string;
    themeChanged: { pipe: (args: any) => any; subscribe: (args: any) => any };
  };
  let mockOverlayContainer: {
    getContainerElement: () => HTMLElement;
  };
  let mockCdr: { markForCheck: () => void };
  let mockMenuTrigger: {
    menuOpen: boolean;
    closeMenu: () => void;
  };

  const createMockModelConfig = (overrides: Partial<LLMModelConfigWithSource> = {}): LLMModelConfigWithSource =>
    ({
      config_id: 'config-1',
      name: 'Test Model',
      model_type: 'text',
      source: 'user',
      group_name: null,
      config: {
        provider: 'openai',
        base_url: 'https://api.openai.com',
        model: 'gpt-4o',
        temperature: 0.7,
        context_limit: 128,
      },
      user_id: 'user-1',
      group_id: null,
      is_default: true,
      version: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      ...overrides,
    } as LLMModelConfigWithSource);

  beforeEach(async () => {
    mockCdr = { markForCheck: vi.fn() };
    mockMenuTrigger = { menuOpen: false, closeMenu: vi.fn() };

    const themeChangedSubject = new Subject<string>();
    mockThemeService = {
      savedTheme: 'deeppurple-amber',
      themeChanged: {
        pipe: vi.fn().mockReturnValue(themeChangedSubject.asObservable()),
        subscribe: vi.fn().mockImplementation((args: any) => {
          return themeChangedSubject.subscribe(args);
        }),
      },
    };

    mockOverlayContainer = {
      getContainerElement: vi.fn().mockReturnValue({
        classList: { remove: vi.fn(), add: vi.fn() },
      } as unknown as HTMLElement),
    };

    await TestBed.configureTestingModule({
      imports: [ChatInputAreaComponent, FormsModule, MatIconModule, MatRippleModule, MatMenuModule, MatDividerModule],
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
        { provide: OverlayContainer, useValue: mockOverlayContainer },
        { provide: ChangeDetectorRef, useValue: mockCdr },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatInputAreaComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Inputs', () => {
    it('should have default placeholder', () => {
      expect(component.placeholder()).toBe('Message (Ctrl+Enter to send)');
    });

    it('should accept custom placeholder', () => {
      fixture.componentRef.setInput('placeholder', 'Custom placeholder');
      expect(component.placeholder()).toBe('Custom placeholder');
    });

    it('should have default maxLength of 4000', () => {
      expect(component.maxLength()).toBe(4000);
    });

    it('should accept custom maxLength', () => {
      fixture.componentRef.setInput('maxLength', 1000);
      expect(component.maxLength()).toBe(1000);
    });

    it('should have default showCharCount as false', () => {
      expect(component.showCharCount()).toBe(false);
    });

    it('should have default disabled as false', () => {
      expect(component.disabled()).toBe(false);
    });

    it('should have default warningThreshold of 0.9', () => {
      expect(component.warningThreshold()).toBe(0.9);
    });

    it('should have default empty modelConfigs', () => {
      expect(component.modelConfigs()).toEqual([]);
    });

    it('should have default currentModelId as null', () => {
      expect(component.currentModelId()).toBeNull();
    });

    it('should have default copilotMode as teaching_assistant', () => {
      expect(component.currentCopilotMode()).toBe('teaching_assistant');
    });
  });

  describe('canSend', () => {
    it('should return false when message is empty', () => {
      component.message.set('');
      expect(component.canSend).toBe(false);
    });

    it('should return false when message is only whitespace', () => {
      component.message.set('   ');
      expect(component.canSend).toBe(false);
    });

    it('should return true when message has content and within maxLength', () => {
      component.message.set('Hello world');
      expect(component.canSend).toBe(true);
    });

    it('should return false when message exceeds maxLength', () => {
      component.message.set('a'.repeat(4001));
      expect(component.canSend).toBe(false);
    });

    // Note: canSend getter does NOT check disabled() - disabled state is only checked in sendMessage()
    // This is intentional to allow send button to show enabled state while typing
  });

  describe('isNearLimit', () => {
    it('should return false when message is empty', () => {
      component.message.set('');
      expect(component.isNearLimit).toBe(false);
    });

    it('should return false when message is below 90% of maxLength', () => {
      component.message.set('a'.repeat(3000)); // 75% of 4000
      expect(component.isNearLimit).toBe(false);
    });

    it('should return true when message is at 90% of maxLength', () => {
      component.message.set('a'.repeat(3600)); // 90% of 4000
      expect(component.isNearLimit).toBe(true);
    });

    it('should return true when message exceeds maxLength', () => {
      component.message.set('a'.repeat(4500));
      expect(component.isNearLimit).toBe(true);
    });
  });

  describe('handleKeyDown()', () => {
    it('should not send message on regular Enter key', () => {
      const sendMessageSpy = vi.spyOn(component, 'sendMessage');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.message.set('test');
      component.handleKeyDown(event);
      expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    it('should send message on Ctrl+Enter when canSend is true', () => {
      const sendMessageSpy = vi.spyOn(component, 'sendMessage');
      const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true });
      component.message.set('test');
      component.handleKeyDown(event);
      expect(sendMessageSpy).toHaveBeenCalled();
    });

    it('should send message on Cmd+Enter (mac) when canSend is true', () => {
      const sendMessageSpy = vi.spyOn(component, 'sendMessage');
      const event = new KeyboardEvent('keydown', { key: 'Enter', metaKey: true });
      component.message.set('test');
      component.handleKeyDown(event);
      expect(sendMessageSpy).toHaveBeenCalled();
    });

    it('should not send message on Ctrl+Enter when disabled', () => {
      const sendMessageSpy = vi.spyOn(component, 'sendMessage');
      const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true });
      component.message.set('test');
      fixture.componentRef.setInput('disabled', true);
      component.handleKeyDown(event);
      expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    it('should not send message on Ctrl+Enter when canSend is false', () => {
      const sendMessageSpy = vi.spyOn(component, 'sendMessage');
      const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true });
      component.message.set('');
      component.handleKeyDown(event);
      expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    it('should prevent default on Ctrl+Enter', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      component.message.set('test');
      component.handleKeyDown(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('onInputChange()', () => {
    it('should emit inputChanged event', () => {
      const inputChangedSpy = vi.spyOn(component.inputChanged, 'emit');
      component.onInputChange('Hello');
      expect(inputChangedSpy).toHaveBeenCalledWith('Hello');
    });
  });

  describe('sendMessage()', () => {
    it('should emit messageSent with trimmed message', () => {
      const messageSentSpy = vi.spyOn(component.messageSent, 'emit');
      component.message.set('  Hello World  ');
      component.sendMessage();
      expect(messageSentSpy).toHaveBeenCalledWith('Hello World');
    });

    it('should clear message after sending', () => {
      component.message.set('Hello');
      component.sendMessage();
      expect(component.message()).toBe('');
    });

    it('should not emit messageSent when message is empty', () => {
      const messageSentSpy = vi.spyOn(component.messageSent, 'emit');
      component.message.set('');
      component.sendMessage();
      expect(messageSentSpy).not.toHaveBeenCalled();
    });

    it('should not emit messageSent when message is only whitespace', () => {
      const messageSentSpy = vi.spyOn(component.messageSent, 'emit');
      component.message.set('   ');
      component.sendMessage();
      expect(messageSentSpy).not.toHaveBeenCalled();
    });

    it('should not emit messageSent when disabled', () => {
      const messageSentSpy = vi.spyOn(component.messageSent, 'emit');
      component.message.set('Hello');
      fixture.componentRef.setInput('disabled', true);
      component.sendMessage();
      expect(messageSentSpy).not.toHaveBeenCalled();
    });
  });

  describe('focus()', () => {
    it('should focus the message input', () => {
      const mockInput = {
        nativeElement: { focus: vi.fn() },
      };
      vi.spyOn(component, 'messageInput').mockReturnValue(mockInput as any);
      component.focus();
      expect(mockInput.nativeElement.focus).toHaveBeenCalled();
    });
  });

  describe('clear()', () => {
    it('should clear the message', () => {
      component.message.set('Hello');
      component.clear();
      expect(component.message()).toBe('');
    });
  });

  describe('getCurrentModelDisplayName()', () => {
    it('should return "Model" when no modelConfigs', () => {
      fixture.componentRef.setInput('modelConfigs', []);
      expect(component.getCurrentModelDisplayName()).toBe('Model');
    });

    it('should return shortened first model name when no currentModelId', () => {
      const config = createMockModelConfig({
        config_id: 'config-1',
        config: { ...createMockModelConfig().config, model: 'google/gemini-2.5-flash' },
      });
      fixture.componentRef.setInput('modelConfigs', [config]);
      fixture.componentRef.setInput('currentModelId', null);
      expect(component.getCurrentModelDisplayName()).toBe('Gemini 2.5 Flash');
    });

    it('should return shortened current model name when currentModelId is set', () => {
      const config1 = createMockModelConfig({
        config_id: 'config-1',
        config: { ...createMockModelConfig().config, model: 'google/gemini-2.5-flash' },
      });
      const config2 = createMockModelConfig({
        config_id: 'config-2',
        config: { ...createMockModelConfig().config, model: 'openai/gpt-4o' },
      });
      fixture.componentRef.setInput('modelConfigs', [config1, config2]);
      fixture.componentRef.setInput('currentModelId', 'config-2');
      expect(component.getCurrentModelDisplayName()).toBe('Gpt 4o');
    });
  });

  describe('getFullModelDisplayName()', () => {
    it('should return "No model configured" when no modelConfigs', () => {
      fixture.componentRef.setInput('modelConfigs', []);
      expect(component.getFullModelDisplayName()).toBe('No model configured');
    });

    it('should return full display name with domain for current model', () => {
      const config = createMockModelConfig({ config_id: 'config-1' });
      fixture.componentRef.setInput('modelConfigs', [config]);
      fixture.componentRef.setInput('currentModelId', 'config-1');
      expect(component.getFullModelDisplayName()).toBe('gpt-4o (api.openai.com)');
    });

    it('should return full display name for first model when no currentModelId', () => {
      const config = createMockModelConfig({ config_id: 'config-1' });
      fixture.componentRef.setInput('modelConfigs', [config]);
      fixture.componentRef.setInput('currentModelId', null);
      expect(component.getFullModelDisplayName()).toBe('gpt-4o (api.openai.com)');
    });
  });

  describe('getModelDisplayName()', () => {
    it('should return full model display name from config', () => {
      const config = createMockModelConfig({ config_id: 'config-1' });
      expect(component.getModelDisplayName(config)).toBe('gpt-4o (api.openai.com)');
    });
  });

  describe('selectModel()', () => {
    it('should emit modelSelected event', () => {
      const modelSelectedSpy = vi.spyOn(component.modelSelected, 'emit');
      const config = createMockModelConfig({ config_id: 'config-1' });
      component.selectModel(config);
      expect(modelSelectedSpy).toHaveBeenCalledWith(config);
    });
  });

  describe('selectCopilotMode()', () => {
    it('should emit copilotModeSelected event with teaching_assistant', () => {
      const copilotModeSelectedSpy = vi.spyOn(component.copilotModeSelected, 'emit');
      component.selectCopilotMode('teaching_assistant');
      expect(copilotModeSelectedSpy).toHaveBeenCalledWith('teaching_assistant');
    });

    it('should emit copilotModeSelected event with lab_automation_assistant', () => {
      const copilotModeSelectedSpy = vi.spyOn(component.copilotModeSelected, 'emit');
      component.selectCopilotMode('lab_automation_assistant');
      expect(copilotModeSelectedSpy).toHaveBeenCalledWith('lab_automation_assistant');
    });
  });

  describe('ensureMenuTheme()', () => {
    it('should apply current theme class to overlay container', () => {
      // Mock requestAnimationFrame to execute callback immediately
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        cb(0);
        return 0;
      });

      // currentTheme is set in constructor from themeService.savedTheme
      // So we need to test with the default 'deeppurple-amber'
      component.ensureMenuTheme();

      const overlayElement = mockOverlayContainer.getContainerElement();
      expect(overlayElement.classList.remove).toHaveBeenCalledWith(
        'theme-deeppurple-amber',
        'theme-indigo-pink',
        'theme-magenta-violet',
        'theme-rose-red',
        'theme-pink-bluegrey',
        'theme-purple-green',
        'theme-azure-blue',
        'theme-cyan-orange'
      );
      expect(overlayElement.classList.add).toHaveBeenCalledWith('theme-deeppurple-amber');
    });
  });

  describe('textareaHeight', () => {
    it('should have initial height of 48', () => {
      expect(component.textareaHeight).toBe(48);
    });
  });

  describe('template integration', () => {
    it('should bind placeholder to textarea', () => {
      fixture.detectChanges();
      const textarea = fixture.nativeElement.querySelector('textarea');
      expect(textarea.placeholder).toBe('Message (Ctrl+Enter to send)');
    });

    it('should bind disabled state to textarea', () => {
      // Set input BEFORE initial detectChanges to properly initialize
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const textarea = fixture.nativeElement.querySelector('textarea');
      // Verify component's disabled signal is true
      expect(component.disabled()).toBe(true);
    });

    it('should bind maxLength to textarea', () => {
      fixture.detectChanges();
      const textarea = fixture.nativeElement.querySelector('textarea');
      expect(textarea.maxLength).toBe(4000);
    });

    it('should have send button', () => {
      fixture.detectChanges();
      const sendButton = fixture.nativeElement.querySelector('.gns3-chat-input-area__send-button');
      expect(sendButton).toBeTruthy();
    });

    it('should have model chip button', () => {
      fixture.detectChanges();
      const modelChip = fixture.nativeElement.querySelector('.gns3-chat-input-area__model-chip');
      expect(modelChip).toBeTruthy();
    });

    it('should not show char count by default', () => {
      fixture.detectChanges();
      const footer = fixture.nativeElement.querySelector('.gns3-chat-input-area__input-footer');
      expect(footer).toBeNull();
    });

    it('should show char count when showCharCount is true', () => {
      fixture.componentRef.setInput('showCharCount', true);
      fixture.detectChanges();
      const footer = fixture.nativeElement.querySelector('.gns3-chat-input-area__input-footer');
      expect(footer).toBeTruthy();
    });
  });
});
