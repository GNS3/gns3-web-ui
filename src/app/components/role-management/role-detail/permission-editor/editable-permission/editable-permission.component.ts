import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Permission} from "@models/api/permission";

@Component({
  selector: 'app-editable-permission',
  templateUrl: './editable-permission.component.html',
  styleUrls: ['./editable-permission.component.scss']
})
export class EditablePermissionComponent implements OnInit {

  @Input() permission: Permission;
  @Input() side: 'LEFT' | 'RIGHT';
  @Output() click = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }


  onClick() {
    this.click.emit();
  }

  getToolTip() {
    return `
    action: ${this.permission.action}
    methods: ${this.permission.methods.join(',')}
    path: ${this.permission.path}
    `;
  }
}
