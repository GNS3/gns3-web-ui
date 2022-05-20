import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadServiceService {

  private countSource = new BehaviorSubject(0);
  currentCount = this.countSource.asObservable();
  private cancelItem = new BehaviorSubject(false);
  currentCancelItemDetails = this.cancelItem.asObservable();

  constructor() { }

  processBarCount(processCount:number) {
    this.countSource.next(processCount)
  }
  cancelFileUploading(){
    this.cancelItem.next(true)
  }
  
}
