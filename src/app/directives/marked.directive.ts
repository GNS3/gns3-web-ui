import { Directive, ElementRef, OnInit, Renderer2, Input, OnChanges } from '@angular/core';
import * as marked from 'marked';

@Directive({
    selector: '[appMarked]'
})
export class MarkedDirective implements OnInit, OnChanges {
    @Input() text: string;

    constructor(private elementRef: ElementRef,
        private renderer: Renderer2) { }

    ngOnInit() {
        this.updateText();
    }

    ngOnChanges() {
        this.updateText();
    }

    updateText() {
        const markText = this.text;

        if (markText && markText.length > 0) {
            const markdownHtml = marked(markText);
            this.renderer.setProperty(this.elementRef.nativeElement, 'innerHTML', markdownHtml);
        }
    }
}
