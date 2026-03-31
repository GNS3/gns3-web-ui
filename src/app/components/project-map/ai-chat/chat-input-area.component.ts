import {
  ChangeDetectionStrategy,
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ElementRef,
  ChangeDetectorRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { LLMModelConfigWithSource, CopilotMode } from '@models/ai-profile';
import { getModelDisplayName as getModelDisplayNameUtil, shortenModelName } from '@utils/ai-profile.util';
import { ThemeService } from '@services/theme.service';
import { OverlayContainer } from '@angular/cdk/overlay';

/**
 * AI Chat Input Area Component
 * Provides auto-resizing text input and send button
 * Inspired by FlowNet-Lab ChatInput component
 */
@Component({
  selector: 'app-chat-input-area',
  imports: [CommonModule, FormsModule, MatIconModule, MatRippleModule, MatMenuModule, MatDividerModule],
  templateUrl: './chat-input-area.component.html',
  styleUrls: ['./chat-input-area.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatInputAreaComponent implements OnInit, OnDestroy {
  readonly placeholder = input('Type your message... (Ctrl+Enter to send)');
  readonly disabled = input(false);
  readonly maxLength = input(4000);
  readonly showCharCount = input(false);
  readonly warningThreshold = input(0.9); // 90% length triggers warning

  // Model selector inputs
  readonly modelConfigs = input<LLMModelConfigWithSource[]>([]);
  readonly currentModelId = input<string | null>(null);
  readonly currentCopilotMode = input<CopilotMode>('teaching_assistant');

  @Output() messageSent = new EventEmitter<string>();
  @Output() inputChanged = new EventEmitter<string>();
  @Output() modelSelected = new EventEmitter<LLMModelConfigWithSource>();
  @Output() copilotModeSelected = new EventEmitter<CopilotMode>();

  readonly messageInput = viewChild.required<ElementRef<HTMLTextAreaElement>>('messageInput');
  readonly menuTrigger = viewChild.required<MatMenuTrigger>('menuTrigger');

  message = '';
  textareaHeight = 48; // Initial height
  private destroy$ = new Subject<void>();
  private previousMessageLength = 0;
  private currentTheme: string = '';

  private themeService = inject(ThemeService);
  private cdr = inject(ChangeDetectorRef);
  private overlayContainer = inject(OverlayContainer);

  constructor() {
    this.currentTheme = this.themeService.savedTheme;
  }

  ngOnInit() {
    // Initialize textarea height after view is ready
    setTimeout(() => {
      this.adjustTextareaHeight();
    }, 0);

    // Subscribe to theme changes to close menu when theme switches
    this.themeService.themeChanged.pipe(takeUntil(this.destroy$)).subscribe((theme) => {
      this.currentTheme = theme;
      // Close menu if open to force re-render with new theme
      const menuTrigger = this.menuTrigger();
      if (menuTrigger && menuTrigger.menuOpen) {
        menuTrigger.closeMenu();
      }
    });
  }

  /**
   * Ensure menu overlay has correct theme classes when opened
   * This is called when the menu opens via menuOpened event
   */
  ensureMenuTheme(): void {
    // Use requestAnimationFrame for more reliable DOM timing
    requestAnimationFrame(() => {
      const overlayElement = this.overlayContainer.getContainerElement();

      // Apply correct theme class to overlay container
      overlayElement.classList.remove(
        'theme-deeppurple-amber',
        'theme-indigo-pink',
        'theme-magenta-violet',
        'theme-rose-red',
        'theme-pink-bluegrey',
        'theme-purple-green',
        'theme-azure-blue',
        'theme-cyan-orange'
      );
      overlayElement.classList.add(`theme-${this.currentTheme}`);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check if message can be sent
   */
  get canSend(): boolean {
    return this.message.trim().length > 0 && this.message.length <= this.maxLength();
  }

  /**
   * Check if approaching length limit
   */
  get isNearLimit(): boolean {
    return this.message.length >= this.maxLength() * this.warningThreshold();
  }

  /**
   * Handle keyboard event
   * @param event Keyboard event
   */
  handleKeyDown(event: KeyboardEvent): void {
    // Ctrl/Cmd+Enter to send
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      if (this.canSend && !this.disabled()) {
        this.sendMessage();
      }
    }
  }

  /**
   * Input change event
   */
  onInputChange(): void {
    this.inputChanged.emit(this.message);

    // Defer height adjustment to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.adjustTextareaHeight();
    }, 0);
  }

  /**
   * Auto-resize textarea height based on content
   * Inspired by FlowNet-Lab ChatInput implementation
   */
  private adjustTextareaHeight(): void {
    const messageInput = this.messageInput();
    if (!messageInput || !messageInput.nativeElement) {
      return;
    }

    const textarea = messageInput.nativeElement;

    // Reset height to auto to calculate scroll height
    textarea.style.height = 'auto';

    // Calculate new height
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, 48), 200); // Min 48px, Max 200px

    this.textareaHeight = newHeight;

    // Only set height if it changed or message length changed
    // This prevents unnecessary style updates
    if (this.previousMessageLength !== this.message.length) {
      textarea.style.height = `${newHeight}px`;
      this.previousMessageLength = this.message.length;
    }
  }

  /**
   * Send message
   */
  sendMessage(): void {
    if (!this.canSend || this.disabled()) {
      return;
    }

    const message = this.message.trim();
    if (message) {
      this.messageSent.emit(message);
      this.message = '';

      // Reset textarea height after sending
      setTimeout(() => {
        this.adjustTextareaHeight();
      }, 0);
    }
  }

  /**
   * Focus input
   */
  focus(): void {
    const messageInput = this.messageInput();
    if (messageInput && messageInput.nativeElement) {
      messageInput.nativeElement.focus();
    }
  }

  /**
   * Clear input
   */
  clear(): void {
    this.message = '';
    setTimeout(() => {
      this.adjustTextareaHeight();
    }, 0);
  }

  /**
   * Get current model display name (short version for chip)
   * @returns Short model name
   */
  getCurrentModelDisplayName(): string {
    const modelConfigs = this.modelConfigs();
    if (!modelConfigs || modelConfigs.length === 0) {
      return 'Model';
    }

    // Find current model config
    const currentConfig = modelConfigs.find((c) => c.config_id === this.currentModelId());
    if (currentConfig) {
      // Return just the model name (short version)
      return shortenModelName(currentConfig.config.model);
    }

    // If no current model, return first model or default
    return shortenModelName(modelConfigs[0].config.model);
  }

  /**
   * Get full model display name (for tooltip)
   * @returns Full model name with domain
   */
  getFullModelDisplayName(): string {
    const modelConfigs = this.modelConfigs();
    if (!modelConfigs || modelConfigs.length === 0) {
      return 'No model configured';
    }

    // Find current model config
    const currentConfig = modelConfigs.find((c) => c.config_id === this.currentModelId());
    if (currentConfig) {
      return getModelDisplayNameUtil(currentConfig);
    }

    // If no current model, return first model or default
    return getModelDisplayNameUtil(modelConfigs[0]);
  }

  /**
   * Get model display name (wrapper for template)
   * @param config Model config
   * @returns Display name
   */
  getModelDisplayName(config: LLMModelConfigWithSource): string {
    return getModelDisplayNameUtil(config);
  }

  /**
   * Select model and emit event
   * @param config Model config to select
   */
  selectModel(config: LLMModelConfigWithSource): void {
    this.modelSelected.emit(config);
  }

  /**
   * Select copilot mode and emit event
   * @param mode Copilot mode to select
   */
  selectCopilotMode(mode: CopilotMode): void {
    this.copilotModeSelected.emit(mode);
  }
}
