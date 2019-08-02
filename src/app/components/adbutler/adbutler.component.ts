import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, ViewEncapsulation, OnDestroy, Input } from '@angular/core';

@Component({
  selector: 'app-adbutler',
  templateUrl: './adbutler.component.html',
  styleUrls: ['./adbutler.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AdbutlerComponent implements OnInit, AfterViewInit, OnDestroy {
  id: number;
  setId: number;
  rnd: number;
  abkw: string;
  sparkCounter: number;
  divId: string;

  @Input() theme: string;
  @ViewChild('code', {static: false}) code: ElementRef;

  constructor() { }

  ngOnInit() {
    var loadedTextAds355353 = (window as any).loadedTextAds355353;
    if(loadedTextAds355353 == null) {
      (window as any).loadedTextAds355353 = new Array();
    }

    (window as any).id355353 = 165803;
    (window as any).setID355353 = 355353;
    (window as any).rnd = (window as any).rnd || Math.floor(Math.random()*10e6);
    (window as any).abkw = (window as any).abkw ||'';

    var sparkCounter355353 = (window as any).sparkCounter355353;
    if(sparkCounter355353 == null) {
      sparkCounter355353 = 1;
    }
    else {
      sparkCounter355353 = sparkCounter355353 + 1
    }

    (window as any).sparkCounter355353 = sparkCounter355353;
    (window as any).loadedTextAds355353[sparkCounter355353] = false;

    this.id = (window as any).id355353;
    this.divId = "abta355353" + sparkCounter355353;
    this.setId = (window as any).setID355353;
    this.abkw = (window as any).abkw;
    this.rnd = (window as any).rnd;
    this.sparkCounter = (window as any).sparkCounter355353;
  }

  ngAfterViewInit() {
    const scriptUrl = "https://servedbyadbutler.com/adserve/;ID=" + this.id + ";setID=" + this.setId + ";type=textad;kw=" + this.abkw + ";pid=" + this.rnd + ";layoutID=" + this.sparkCounter;

    const scriptElement = document.createElement('script');
    scriptElement.src = scriptUrl;
    scriptElement.type = 'text/javascript';
    scriptElement.async = true;
    scriptElement.charset = 'utf-8';
    this.code.nativeElement.appendChild(scriptElement);
  }

  ngOnDestroy() {
    // start from 0 when switching pages
    (window as any).sparkCounter355353 = 0;
    delete (window as any).loadedTextAds355353[this.sparkCounter];
  }

}
