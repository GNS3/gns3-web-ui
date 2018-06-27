import { Component, OnInit } from '@angular/core';
import { ProgressService } from "./progress.service";

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss']
})
export class ProgressComponent implements OnInit {
  visible = false;

  constructor(
    private progressService: ProgressService
  ) { }

  ngOnInit() {
    this.progressService.state.subscribe((state) => {
      this.visible = state.visible;
    });
  }

}
