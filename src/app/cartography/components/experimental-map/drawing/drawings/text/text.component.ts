import { Component, DoCheck, ElementRef, OnInit, ViewChild, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FontFixer } from '../../../../../helpers/font-fixer';
import { TextElement } from '../../../../../models/drawings/text-element';

@Component({
  standalone: true,
  selector: '[app-text]',
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.scss'],
  imports: [],
})
export class TextComponent implements OnInit, DoCheck {
  static MARGIN = 4;

  readonly text = input<TextElement>(undefined, { alias: 'app-text' });

  @ViewChild('text') textRef: ElementRef;

  lines: string[] = [];

  transformation = '';

  private fontFixer = inject(FontFixer);
  private sanitizer = inject(DomSanitizer);

  ngOnInit() {
    const text = this.text();
    if (text) {
      this.lines = this.getLines(text.text);
    }
  }

  ngDoCheck() {
    this.transformation = this.calculateTransformation();
  }

  get style() {
    const text = this.text();
    if (text) {
      const font = this.fontFixer.fix(text);

      const styles: string[] = [];
      if (font.font_family) {
        styles.push(`font-family: "${text.font_family}"`);
      }
      if (font.font_size) {
        styles.push(`font-size: ${text.font_size}pt`);
      }
      if (font.font_weight) {
        styles.push(`font-weight: ${text.font_weight}`);
      }
      return this.sanitizer.bypassSecurityTrustStyle(styles.join('; '));
    }
  }

  get textDecoration() {
    const text = this.text();
    if (text) {
      return text.text_decoration;
    }
  }

  calculateTransformation() {
    const text = this.text();
    if (this.textRef != undefined && text) {
      const bbox = this.textRef.nativeElement.getBBox();
      const expectedHeight = Number(text.height);
      const yOffset = isFinite(expectedHeight) ? expectedHeight / 2 - (bbox.y + bbox.height / 2) : 0;
      return `translate(0, ${yOffset})`;
    }
    return '';
  }

  getLines(text: string) {
    return text.split(/\r?\n/);
  }
}
