import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  linkedSignal,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

/** A short query can match millions of times: only this many matches are marked, around the active one. */
const MAX_HIGHLIGHTS = 500;

@Component({
  selector: 'app-configuration-text-editor',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './configuration-text-editor.component.html',
  styleUrl: './configuration-text-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationTextEditorComponent {
  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.settleTimer));
  }
  readonly value = model('');
  readonly label = input('Configuration');
  readonly disabled = input(false);
  readonly fontSize = signal(14);
  readonly query = signal('');
  readonly activeStart = linkedSignal(() => {
    this.value();
    return -1;
  });
  /**
   * False for a moment after each keystroke while a search is active. The
   * highlight mirror is rebuilt from the whole text, which is costly for
   * multi-MiB configurations, so it waits until typing pauses.
   */
  private readonly settled = signal(true);
  private settleTimer: ReturnType<typeof setTimeout> | undefined;
  readonly scrollTop = signal(0);
  readonly scrollLeft = signal(0);
  readonly textarea = viewChild.required<ElementRef<HTMLTextAreaElement>>('textarea');
  readonly lines = computed(() => this.value().split('\n').length);
  readonly lineNumbers = computed(() => Array.from({ length: this.lines() }, (_, i) => i + 1).join('\n'));
  /** Start offsets of every match; each is as long as the query, which is searched literally. */
  readonly matches = computed(() => {
    const query = this.query();
    if (!query || !this.settled()) return [];
    const expression = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches: number[] = [];
    const text = this.value();
    while (expression.exec(text) !== null) {
      matches.push(expression.lastIndex - query.length);
    }
    return matches;
  });
  readonly activeIndex = computed(() => {
    // The offsets are sorted.
    const matches = this.matches();
    const start = this.activeStart();
    let low = 0;
    let high = matches.length - 1;
    while (low <= high) {
      const middle = (low + high) >> 1;
      if (matches[middle] === start) return middle;
      if (matches[middle] < start) low = middle + 1;
      else high = middle - 1;
    }
    return -1;
  });
  readonly highlights = computed(() => {
    const text = this.value();
    const matches = this.matches();
    const length = this.query().length;
    const first = Math.max(0, Math.min(this.activeIndex() - MAX_HIGHLIGHTS / 2, matches.length - MAX_HIGHLIGHTS));
    const segments: { text: string; match: boolean; active: boolean }[] = [];
    let position = 0;
    for (const start of matches.slice(first, first + MAX_HIGHLIGHTS)) {
      segments.push({ text: text.slice(position, start), match: false, active: false });
      segments.push({ text: text.slice(start, start + length), match: true, active: start === this.activeStart() });
      position = start + length;
    }
    // A trailing space gives the mirror the same final empty line as the textarea.
    segments.push({ text: text.slice(position) + ' ', match: false, active: false });
    return segments;
  });

  resizeFont(delta: number) {
    this.fontSize.update((size) => Math.max(11, Math.min(24, size + delta)));
  }

  edit(event: Event) {
    if (this.disabled()) return;
    this.value.set((event.target as HTMLTextAreaElement).value);
    if (this.query()) {
      this.settled.set(false);
      clearTimeout(this.settleTimer);
      this.settleTimer = setTimeout(() => this.settled.set(true), 200);
    }
  }

  search(query: string) {
    this.query.set(query);
    this.activeStart.set(-1);
    if (this.matches().length) this.navigate(1);
  }

  navigate(direction: number) {
    const matches = this.matches();
    if (!matches.length) return;
    const current = this.activeIndex();
    const index =
      current < 0 ? (direction > 0 ? 0 : matches.length - 1) : (current + direction + matches.length) % matches.length;
    const start = matches[index];
    this.activeStart.set(start);
    const textarea = this.textarea().nativeElement;
    textarea.setSelectionRange(start, start + this.query().length);
    const before = this.value().slice(0, start);
    const line = before.split('\n').length - 1;
    const style = getComputedStyle(textarea);
    const lineHeight = parseFloat(style.lineHeight) || this.fontSize() * 1.5;
    const padding = parseFloat(style.paddingTop) || 0;
    textarea.scrollTop = Math.max(0, line * lineHeight + padding - textarea.clientHeight / 2);
    // Estimate the horizontal position in the monospace font, including expanded tabs.
    const column = before
      .slice(before.lastIndexOf('\n') + 1)
      .split('\t')
      .reduce((size, part, index) => (index ? size + 4 - (size % 4) : size) + part.length, 0);
    const characterWidth = this.fontSize() * 0.6;
    textarea.scrollLeft = Math.max(0, column * characterWidth - textarea.clientWidth / 2);
    this.syncScroll();
  }

  searchKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.navigate(event.shiftKey ? -1 : 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.search('');
      this.textarea().nativeElement.focus();
    }
  }

  editorKey(event: KeyboardEvent, search: HTMLInputElement) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      search.focus();
      search.select();
    }
  }

  syncScroll() {
    const textarea = this.textarea().nativeElement;
    this.scrollTop.set(textarea.scrollTop);
    this.scrollLeft.set(textarea.scrollLeft);
  }
}
