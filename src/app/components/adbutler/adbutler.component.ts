import { Component, OnInit, ElementRef, ViewChild, ViewEncapsulation, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AdButlerResponse } from '../../models/adbutler';
import { ToasterService } from '../../services/toaster.service';

@Component({
  selector: 'app-adbutler',
  templateUrl: './adbutler.component.html',
  styleUrls: ['./adbutler.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AdbutlerComponent implements OnInit {
  @ViewChild('ad') ad: ElementRef;
  @Input() theme: string;
  @Output() onLoad = new EventEmitter();
  htmlCode: string;

  constructor(
    private httpClient: HttpClient,
    private toasterService: ToasterService
  ) {}

  ngOnInit() {
    this.httpClient
      .get('https://servedbyadbutler.com/adserve/;ID=165803;size=0x0;setID=371476;type=json;').subscribe(
        response => {
          this.onLoad.emit(true);
          this.htmlCode = response['placements'].placement_1.body;
          this.ad.nativeElement.insertAdjacentHTML('beforeend', this.htmlCode);
        },
        error => {}
      );
  }
}
