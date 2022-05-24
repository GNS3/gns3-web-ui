import { Component, Inject, OnInit, Renderer2, ViewEncapsulation } from '@angular/core';
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { UploadServiceService } from './upload-service.service';

@Component({
  selector: 'app-uploading-processbar',
  templateUrl: './uploading-processbar.component.html',
  styleUrls: ['./uploading-processbar.component.scss'],
  encapsulation: ViewEncapsulation.None,

})
export class UploadingProcessbarComponent implements OnInit {
  uploadProgress: number = 0
  subscription: Subscription;

  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data,
    private _snackRef: MatSnackBarRef<UploadingProcessbarComponent>,
    private _US: UploadServiceService
  ) { }

  ngOnInit() {
    this.subscription = this._US.currentCount.subscribe((count:number) => {
      this.uploadProgress = count;
      if (this.uploadProgress === 100) {
        this.dismiss()
      }
    })
  }



  dismiss() {
    this._snackRef.dismiss();
  }
  cancelItem() {
    this._US.cancelFileUploading(true)
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
