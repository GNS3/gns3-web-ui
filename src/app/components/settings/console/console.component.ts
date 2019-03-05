import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.scss']
})
export class ConsoleComponent implements OnInit {

  consoleForm = new FormGroup({
    'runner': new FormControl('', [ Validators.required ]),
    'command': new FormControl(''),
  });
  
  constructor() { }

  ngOnInit() {
  }

}
