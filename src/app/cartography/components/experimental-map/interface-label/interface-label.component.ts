import { Component, OnInit, Input, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CssFixer } from '../../../helpers/css-fixer';

@Component({
  selector: '[app-interface-label]',
  templateUrl: './interface-label.component.html',
  styleUrls: ['./interface-label.component.scss']
})
export class InterfaceLabelComponent implements OnInit {
  @Input('app-interface-label') ignore: any;

  @ViewChild('textSvg') textRef: ElementRef;

  private label = {
    x: 0,
    y: 0,
    text: '',
    style: '',
    rotation: 0
  };

  borderSize = 5;

  textWidth = 0;
  textHeight = 0;

  constructor(
    private elementRef: ElementRef,
    private ref: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private cssFixer: CssFixer
  ) {}

  ngOnInit() {}

  @Input('x')
  set x(value) {
    this.label['x'] = value;
    this.ref.detectChanges();
  }

  @Input('y')
  set y(value) {
    this.label['y'] = value;
    this.ref.detectChanges();
  }

  @Input('text')
  set text(value) {
    this.label['text'] = value;
    this.ref.detectChanges();
  }

  @Input('style')
  set style(value) {
    this.label['style'] = this.cssFixer.fix(value);
    this.ref.detectChanges();
  }

  @Input('rotation')
  set rotation(value) {
    this.label['rotation'] = value;
    this.ref.detectChanges();
  }

  get text() {
    return this.label.text;
  }

  get sanitizedStyle() {
    return this.sanitizer.bypassSecurityTrustStyle(this.label.style);
  }

  get rectX() {
    return 0;
  }

  get rectY() {
    return -this.textRef.nativeElement.getBBox().height - this.borderSize;
  }

  get rectWidth() {
    return this.textRef.nativeElement.getBBox().width + this.borderSize * 2;
  }

  get rectHeight() {
    return this.textRef.nativeElement.getBBox().height + this.borderSize;
  }

  get transform() {
    const bbox = this.elementRef.nativeElement.getBBox();
    const x = this.label.x;
    const y = this.label.y + bbox.height;
    return `translate(${x}, ${y}) rotate(${this.label.rotation}, ${x}, ${y})`;
  }
}
