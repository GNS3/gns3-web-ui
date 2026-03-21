import { Component, Output, EventEmitter, Input, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, inject } from '@angular/core';
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
  standalone: true,
  selector: 'app-chat-input-area',
  imports: [CommonModule, FormsModule, MatIconModule, MatRippleModule, MatMenuModule, MatDividerModule],
  template: `
    <div class="chat-input-area">
      <div class="input-wrapper">
        <textarea
          #messageInput
          [placeholder]="placeholder"
          [disabled]="disabled"
          [(ngModel)]="message"
          (keydown)="handleKeyDown($event)"
          (input)="onInputChange()"
          [rows]="1"
          [maxLength]="maxLength"
          class="chat-textarea"
          [style.height.px]="textareaHeight"
        ></textarea>

        <button
          class="send-button"
          (click)="sendMessage()"
          [disabled]="!canSend || disabled"
          matRipple
        >
          <mat-icon *ngIf="!disabled; else loadingIcon">send</mat-icon>
          <ng-template #loadingIcon>
            <mat-icon class="loading-spinner">refresh</mat-icon>
          </ng-template>
        </button>

        <!-- Model Selector Chip -->
        <button
          class="model-selector-chip"
          #menuTrigger="matMenuTrigger"
          [matMenuTriggerFor]="modelMenu"
          (menuOpened)="ensureMenuTheme()"
          [disabled]="disabled || !modelConfigs || modelConfigs.length === 0"
          [title]="getFullModelDisplayName()"
          matRipple
        >
          <mat-icon class="chip-icon">psychology</mat-icon>
          <span class="chip-text">{{ getCurrentModelDisplayName() }}</span>
          <mat-icon class="chip-arrow">expand_more</mat-icon>
        </button>
      </div>

      <div class="input-footer" *ngIf="showCharCount">
        <span class="char-count" [class.warning]="isNearLimit">{{ message.length }}</span>
        <span class="char-separator"> / </span>
        <span class="char-max">{{ maxLength }}</span>
      </div>
    </div>

    <!-- Model Selection Menu -->
    <mat-menu #modelMenu="matMenu" xPosition="before">
      <div class="model-menu-header">Select AI Model</div>
      <mat-divider></mat-divider>
      <button mat-menu-item *ngFor="let config of modelConfigs" (click)="selectModel(config)" [class.selected]="config.config_id === currentModelId">
        <mat-icon>{{ config.config_id === currentModelId ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
        <span class="model-name">{{ getModelDisplayName(config) }}</span>
        <span class="model-source" *ngIf="config.source === 'group'">Group</span>
      </button>
      <mat-divider *ngIf="!modelConfigs || modelConfigs.length === 0"></mat-divider>
      <button mat-menu-item *ngIf="!modelConfigs || modelConfigs.length === 0" disabled>
        <mat-icon>error_outline</mat-icon>
        <span>No models configured</span>
      </button>

      <!-- Copilot Mode Section -->
      <mat-divider *ngIf="modelConfigs && modelConfigs.length > 0"></mat-divider>
      <div class="copilot-mode-section" *ngIf="modelConfigs && modelConfigs.length > 0">
        <div class="copilot-mode-header">Copilot Mode</div>
        <button mat-menu-item class="copilot-mode-item" (click)="selectCopilotMode('teaching_assistant')" [class.selected]="currentCopilotMode === 'teaching_assistant'">
          <mat-icon>{{ currentCopilotMode === 'teaching_assistant' ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
          <div class="mode-info">
            <span class="mode-name">Teaching Assistant</span>
            <span class="mode-description">Diagnostics only</span>
          </div>
        </button>
        <button mat-menu-item class="copilot-mode-item" (click)="selectCopilotMode('lab_automation_assistant')" [class.selected]="currentCopilotMode === 'lab_automation_assistant'">
          <mat-icon>{{ currentCopilotMode === 'lab_automation_assistant' ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
          <div class="mode-info">
            <span class="mode-name">Lab Automation</span>
            <span class="mode-description">Full configuration access</span>
          </div>
        </button>
      </div>
    </mat-menu>
  `,
  styles: [`
    .chat-input-area {
      display: flex;
      flex-direction: column;
      padding: 16px;
      background: linear-gradient(to bottom, var(--mat-app-background), var(--mat-app-surface-container-low));
      border-top: 1px solid var(--mat-app-outline-variant);
    }

    .input-wrapper {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      width: 100%;
    }

    .chat-textarea {
      flex: 1;
      min-width: 0;
      min-height: 48px;
      max-height: 200px;
      padding: 12px 16px;
      border: 2px solid var(--mat-app-outline-variant);
      border-radius: 24px;
      background: linear-gradient(to bottom, var(--mat-app-surface), var(--mat-app-surface-container-low));
      color: var(--mat-app-on-surface);
      font-family: inherit;
      font-size: 14px;
      line-height: 1.5;
      resize: none;
      outline: none;
      transition: all 0.2s ease;
      box-sizing: border-box;
      overflow-y: auto;
    }

    .chat-textarea:focus {
      border-color: var(--mat-app-primary);
      box-shadow: 0 0 0 4px rgba(var(--mat-app-primary-rgb), 0.1);
    }

    .chat-textarea:hover {
      border-color: var(--mat-app-outline);
    }

    .chat-textarea::placeholder {
      color: var(--mat-app-on-surface-variant);
      opacity: 0.6;
    }

    .chat-textarea:disabled {
      background-color: var(--mat-app-surface-container-high);
      cursor: not-allowed;
      opacity: 0.6;
    }

    /* Custom scrollbar for textarea */
    .chat-textarea::-webkit-scrollbar {
      width: 4px;
    }

    .chat-textarea::-webkit-scrollbar-track {
      background: transparent;
    }

    .chat-textarea::-webkit-scrollbar-thumb {
      background: var(--mat-app-outline-variant);
      border-radius: 2px;
    }

    .chat-textarea::-webkit-scrollbar-thumb:hover {
      background: var(--mat-app-outline);
    }

    .model-selector-chip {
      flex-shrink: 0;
      height: 36px;
      min-width: 100px;
      max-width: 200px;
      padding: 0 12px;
      border: none;
      border-radius: 18px;
      background: linear-gradient(135deg, #00bcd4, #0097a7);
      color: white;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(0, 188, 212, 0.3);
      position: relative;
      overflow: hidden;
      font-family: inherit;
      font-size: 13px;
      font-weight: 500;
    }

    .model-selector-chip::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: 18px;
    }

    .model-selector-chip:hover:not(:disabled) {
      box-shadow: 0 4px 12px rgba(0, 188, 212, 0.5);
      background: linear-gradient(135deg, #00bcd4, #00838f);
      transform: translateY(-1px);

      &::before {
        opacity: 1;
      }
    }

    .model-selector-chip:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 2px 6px rgba(0, 188, 212, 0.3);
    }

    .model-selector-chip:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .chip-icon {
      width: 16px;
      height: 16px;
      font-size: 16px;
      color: white;
      flex-shrink: 0;
    }

    .chip-text {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: white;
      line-height: 1;
    }

    .chip-arrow {
      width: 18px;
      height: 18px;
      font-size: 18px;
      color: white;
      flex-shrink: 0;
    }

    .send-button {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      border: none;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--mat-app-primary), #7c4dff);
      color: var(--mat-app-on-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(124, 77, 255, 0.3);
      position: relative;
      overflow: hidden;
    }

    .send-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: 50%;
    }

    .send-button:hover:not(:disabled) {
      transform: scale(1.15);
      box-shadow: 0 8px 24px rgba(124, 77, 255, 0.5);
      background: linear-gradient(135deg, #7c4dff, #651fff);

      &::before {
        opacity: 1;
      }
    }

    .send-button:active:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(124, 77, 255, 0.3);
    }

    .send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .send-button mat-icon {
      width: 20px;
      height: 20px;
      font-size: 20px;
      color: var(--mat-app-on-primary);
    }

    .loading-spinner {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .input-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-top: 8px;
      padding: 0 4px;
    }

    .char-count {
      font-size: 11px;
      font-weight: 500;
      color: var(--mat-app-on-surface-variant);
      transition: color 0.2s ease;
    }

    .char-count.warning {
      color: var(--mat-app-error);
    }

    .char-separator,
    .char-max {
      font-size: 11px;
      color: var(--mat-app-on-surface-variant);
      opacity: 0.7;
      margin: 0 2px;
    }

    /* Model menu styles */
    .model-menu-header {
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 500;
      color: var(--mat-app-on-surface-variant);
    }

    .model-name {
      flex: 1;
      font-size: 14px;
    }

    .model-source {
      font-size: 11px;
      color: var(--mat-app-primary);
      background: rgba(var(--mat-app-primary-rgb), 0.1);
      padding: 2px 8px;
      border-radius: 12px;
      margin-left: 8px;
    }

    button.mat-menu-item.selected {
      background: rgba(var(--mat-app-primary-rgb), 0.1);
    }

    /* Copilot Mode Section Styles */
    .copilot-mode-section {
      padding: 0;
    }

    .copilot-mode-header {
      padding: 12px 16px 8px 16px;
      font-size: 12px;
      font-weight: 500;
      color: var(--mat-app-on-surface-variant);
      letter-spacing: 0.5px;
    }

    .copilot-mode-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      min-height: 48px;
    }

    .copilot-mode-item .mode-info {
      display: flex;
      flex-direction: column;
      gap: 0;
      flex: 1;
    }

    .copilot-mode-item .mode-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--mat-app-on-surface);
      line-height: 1.2;
    }

    .copilot-mode-item .mode-description {
      font-size: 11px;
      color: var(--mat-app-on-surface-variant);
      opacity: 0.8;
      line-height: 1.2;
      margin-top: 1px;
    }
  `]
})
export class ChatInputAreaComponent implements OnInit, OnDestroy {
  @Input() placeholder = 'Type your message... (Ctrl+Enter to send)';
  @Input() disabled = false;
  @Input() maxLength = 4000;
  @Input() showCharCount = false;
  @Input() warningThreshold = 0.9; // 90% length triggers warning

  // Model selector inputs
  @Input() modelConfigs: LLMModelConfigWithSource[] = [];
  @Input() currentModelId: string | null = null;
  @Input() currentCopilotMode: CopilotMode = 'teaching_assistant';

  @Output() messageSent = new EventEmitter<string>();
  @Output() inputChanged = new EventEmitter<string>();
  @Output() modelSelected = new EventEmitter<LLMModelConfigWithSource>();
  @Output() copilotModeSelected = new EventEmitter<CopilotMode>();

  @ViewChild('messageInput', { static: true }) messageInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;

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
      if (this.menuTrigger && this.menuTrigger.menuOpen) {
        this.menuTrigger.closeMenu();
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
      const themeClass = this.currentTheme.endsWith('-theme') ? this.currentTheme : `${this.currentTheme}-theme`;

      // Clean and apply correct theme class to overlay container
      overlayElement.classList.remove('dark-theme', 'light-theme', 'dark', 'light');
      overlayElement.classList.add(themeClass);

      // Apply theme class to menu panel
      const panels = overlayElement.querySelectorAll('.mat-menu-panel');
      panels.forEach(panel => {
        panel.classList.remove('dark-theme', 'light-theme');
        panel.classList.add(themeClass);
      });
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
    return this.message.trim().length > 0 && this.message.length <= this.maxLength;
  }

  /**
   * Check if approaching length limit
   */
  get isNearLimit(): boolean {
    return this.message.length >= this.maxLength * this.warningThreshold;
  }

  /**
   * Handle keyboard event
   * @param event Keyboard event
   */
  handleKeyDown(event: KeyboardEvent): void {
    // Ctrl/Cmd+Enter to send
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      if (this.canSend && !this.disabled) {
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
    if (!this.messageInput || !this.messageInput.nativeElement) {
      return;
    }

    const textarea = this.messageInput.nativeElement;

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
    if (!this.canSend || this.disabled) {
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
    if (this.messageInput && this.messageInput.nativeElement) {
      this.messageInput.nativeElement.focus();
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
    if (!this.modelConfigs || this.modelConfigs.length === 0) {
      return 'Model';
    }

    // Find current model config
    const currentConfig = this.modelConfigs.find(c => c.config_id === this.currentModelId);
    if (currentConfig) {
      // Return just the model name (short version)
      return shortenModelName(currentConfig.config.model);
    }

    // If no current model, return first model or default
    return shortenModelName(this.modelConfigs[0].config.model);
  }

  /**
   * Get full model display name (for tooltip)
   * @returns Full model name with domain
   */
  getFullModelDisplayName(): string {
    if (!this.modelConfigs || this.modelConfigs.length === 0) {
      return 'No model configured';
    }

    // Find current model config
    const currentConfig = this.modelConfigs.find(c => c.config_id === this.currentModelId);
    if (currentConfig) {
      return getModelDisplayNameUtil(currentConfig);
    }

    // If no current model, return first model or default
    return getModelDisplayNameUtil(this.modelConfigs[0]);
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
