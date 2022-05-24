import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadServiceService {

  private countSource = new Subject();
  currentCount = this.countSource.asObservable();
  private cancelItem = new Subject();
  currentCancelItemDetails = this.cancelItem.asObservable();

  constructor() { }

  processBarCount(processCount:number) {
    this.countSource.next(processCount)
  }
  cancelFileUploading(isCancel){
    this.cancelItem.next(isCancel)
  }
  
}
