import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Controller } from '@models/controller';
import { SymbolsComponent } from '@components/preferences/common/symbols/symbols.component';

export interface TemplateSymbolDialogData {
  controller: Controller;
  symbol: string;
}

@Component({
  standalone: true,
  selector: 'app-template-symbol-dialog',
  templateUrl: './template-symbol-dialog.component.html',
  styleUrls: ['./template-symbol-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, SymbolsComponent],
})
export class TemplateSymbolDialogComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<TemplateSymbolDialogComponent>);
  private cd = inject(ChangeDetectorRef);

  controller: Controller;
  symbol: string = '';

  constructor() {
    const data: TemplateSymbolDialogData = inject(MAT_DIALOG_DATA);
    this.controller = data.controller;
    this.symbol = data.symbol;
  }

  ngOnInit() {
    this.cd.markForCheck();
  }

  symbolChanged(chosenSymbol: string) {
    this.symbol = chosenSymbol;
    this.cd.markForCheck();
  }

  onCloseClick() {
    this.dialogRef.close();
  }

  onSelectClick() {
    this.dialogRef.close(this.symbol);
  }
}
