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
  theme: string;
  onLoad = new EventEmitter();
  htmlCode: string;
  staticCode: string = `<a href="https://try.solarwinds.com/gns3-free-toolset-giveaway?CMP=LEC-HAD-GNS3-SW_NA_X_NP_X_X_EN_STSGA_SW-ST-20200901_ST_OF1_TRY-NWSLTR">
  Access Our Favorite Network Free Tools!
 </a><br/>
 Access 20+ network performance management, monitoring, and troubleshooting tools for FREE ($200 Value).<br/>
 <button>
 <a target="_blank" href="https://try.solarwinds.com/gns3-free-toolset-giveaway?CMP=LEC-HAD-GNS3-SW_NA_X_NP_X_X_EN_STSGA_SW-ST-20200901_ST_OF1_TRY-NWSLTR">
 Check it out!
 </a>
 </button>`;

  constructor(
    private httpClient: HttpClient
  ) {}

  ngOnInit() {
    this.httpClient
      .get('https://servedbyadbutler.com/adserve/;ID=165803;size=0x0;setID=371476;type=json;').subscribe(
        response => {
          if (response && response['placements'] && response['placements'].placement_1 && response['placements'].placement_1.body) {
            this.onLoad.emit(true);
            this.htmlCode = response['placements'].placement_1.body;
            this.ad.nativeElement.insertAdjacentHTML('beforeend', this.htmlCode);
          } else {
            this.onLoad.emit(true);
            this.htmlCode = this.staticCode;
          }
        },
        error => {}
      );
  }
}
