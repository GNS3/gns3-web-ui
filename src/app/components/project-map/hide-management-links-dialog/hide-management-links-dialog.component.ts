import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Node } from '../../../cartography/models/node';

export interface HideManagementLinksDialogData {
  nodes: Node[];
  selectedNodeIds: string[];
}

@Component({
  selector: 'app-hide-management-links-dialog',
  templateUrl: './hide-management-links-dialog.component.html',
  styleUrls: ['./hide-management-links-dialog.component.scss'],
})
export class HideManagementLinksDialogComponent implements OnInit {
  nodes: Node[] = [];
  filteredNodes: Node[] = [];
  selectedNodeIds: string[] = [];
  searchText = '';

  constructor(
    public dialogRef: MatDialogRef<HideManagementLinksDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HideManagementLinksDialogData
  ) {}

  ngOnInit() {
    this.nodes = this.data.nodes.slice().sort((first, second) => first.name.localeCompare(second.name));
    this.selectedNodeIds = [...this.data.selectedNodeIds];
    this.filterNodes();
  }

  filterNodes() {
    const search = this.searchText.toLowerCase();
    this.filteredNodes = this.nodes.filter((node) => node.name.toLowerCase().includes(search));
  }

  toggleNode(nodeId: string, selected: boolean) {
    if (selected && !this.selectedNodeIds.includes(nodeId)) {
      this.selectedNodeIds.push(nodeId);
    }

    if (!selected) {
      this.selectedNodeIds = this.selectedNodeIds.filter((id) => id !== nodeId);
    }
  }

  isSelected(nodeId: string) {
    return this.selectedNodeIds.includes(nodeId);
  }

  onCancelClick() {
    this.dialogRef.close();
  }

  onApplyClick() {
    this.dialogRef.close(this.selectedNodeIds);
  }
}
