import { Component, OnInit, Input, ViewChild, ElementRef, DoCheck } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TextElement } from '../../../../../models/drawings/text-element';
import { FontFixer } from '../../../../../helpers/font-fixer';

@Component({
  selector: '[app-text]',
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.scss']
})
export class TextComponent implements OnInit, DoCheck {
  static MARGIN = 4;

  @Input('app-text') text: TextElement;

  @ViewChild('text') textRef: ElementRef;

  lines: string[] = [];

  transformation = '';

  constructor(private fontFixer: FontFixer, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.lines = this.getLines(this.text.text);
  }

  ngDoCheck() {
    this.transformation = this.calculateTransformation();
  }

  get style() {
    const font = this.fontFixer.fix(this.text);

    const styles: string[] = [];
    if (font.font_family) {
      styles.push(`font-family: "${this.text.font_family}"`);
    }
    if (font.font_size) {
      styles.push(`font-size: ${this.text.font_size}pt`);
    }
    if (font.font_weight) {
      styles.push(`font-weight: ${this.text.font_weight}`);
    }
    return this.sanitizer.bypassSecurityTrustStyle(styles.join('; '));
  }

  get textDecoration() {
    return this.text.text_decoration;
  }

  calculateTransformation() {
    const tspans = this.textRef.nativeElement.getElementsByTagName('tspan');
    if (tspans.length > 0) {
      const height = this.textRef.nativeElement.getBBox().height / tspans.length;
      return `translate(${TextComponent.MARGIN}, ${height - TextComponent.MARGIN})`;
    }
    return '';
  }

  getLines(text: string) {
    return text.split(/\r?\n/);
  }
}
