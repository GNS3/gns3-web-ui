import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { Link } from '@models/link';
import { LinkStyle } from '@models/link-style';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { ToasterService } from '@services/toaster.service';
import { LinkTypeCache } from '@services/link-type-cache';
import { NonNegativeValidator } from '../../../../validators/non-negative-validator';
import { LinkService } from '@services/link.service';
import { LinksDataSource } from '../../../../cartography/datasources/links-datasource';
import { LinksEventSource } from '../../../../cartography/events/links-event-source';
import { LinkToMapLinkConverter } from '../../../../cartography/converters/map/link-to-map-link-converter';
import { StyleTranslator } from '../../../../cartography/widgets/links/style-translator';

@Component({
  selector: 'app-link-style-editor',
  templateUrl: './link-style-editor.component.html',
  styleUrl: './link-style-editor.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkStyleEditorDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<LinkStyleEditorDialogComponent>);
  private formBuilder = inject(UntypedFormBuilder);
  private toasterService = inject(ToasterService);
  private linkService = inject(LinkService);
  private linksDataSource = inject(LinksDataSource);
  private linksEventSource = inject(LinksEventSource);
  private linkToMapLink = inject(LinkToMapLinkConverter);
  private nonNegativeValidator = inject(NonNegativeValidator);

  controller: Controller;
  project: Project;
  link: Link;
  formGroup: UntypedFormGroup;
  borderTypes = ['Solid', 'Dash', 'Dot', 'Dash Dot', 'Dash Dot Dot'];

  constructor() {
    this.formGroup = this.formBuilder.group({
      color: new UntypedFormControl('', [Validators.required]),
      width: new UntypedFormControl('', [Validators.required, this.nonNegativeValidator.get]),
      type: new UntypedFormControl('', [Validators.required]),
    });
  }

  ngOnInit() {
    if (!this.link.link_style) {
      this.link.link_style = {} as LinkStyle;
    }

    // Use the canonical default color per link type so CSS can handle theme conversion.
    // Saving a theme-adjusted color would lock the cable permanently, breaking switching.
    const defaultColor = this.link.link_type === 'serial' ? '#800000' : '#000000';
    this.formGroup.controls['color'].setValue(this.link.link_style?.color ?? defaultColor);

    const width = this.link.link_style?.width !== undefined ? this.link.link_style.width : 2;
    this.formGroup.controls['width'].setValue(width);

    let type = this.borderTypes[0];
    if (this.link.link_style?.type !== undefined) {
      type = this.borderTypes[this.link.link_style.type];
    }
    this.formGroup.controls['type'].setValue(type);

    const cachedLinkType = LinkTypeCache.get(this.link.project_id, this.link.link_id);
    const configuredLinkType = this.link.link_style.link_type || cachedLinkType;
    const normalizedLinkType = this.normalizeLinkType(configuredLinkType);
    this.formGroup.controls['linkType'].setValue(this.getLinkTypeLabel(configuredLinkType));

    const cachedBezierCurviness = LinkTypeCache.getBezierCurviness(this.link.project_id, this.link.link_id);
    const configuredBezierCurviness =
      this.link.link_style?.bezier_curviness !== undefined
        ? this.link.link_style.bezier_curviness
        : cachedBezierCurviness;

    this.applyCurvinessValidators(normalizedLinkType);

    this.formGroup.controls['bezierCurviness'].setValue(
      this.normalizeCurvinessByLinkType(normalizedLinkType, configuredBezierCurviness)
    );
    this.curvinessLinkTypeContext = normalizedLinkType;

    const cachedFlowchartRoundness = LinkTypeCache.getFlowchartRoundness(this.link.project_id, this.link.link_id);
    const configuredFlowchartRoundness =
      this.link.link_style?.flowchart_roundness !== undefined
        ? this.link.link_style.flowchart_roundness
        : cachedFlowchartRoundness;

    this.formGroup.controls['flowchartRoundness'].setValue(
      StyleTranslator.normalizeFlowchartRoundness(configuredFlowchartRoundness)
    );

    this.formGroup.controls['linkType'].valueChanges.subscribe((selectedLinkTypeLabel) => {
      const selectedLinkType = this.normalizeLinkType(selectedLinkTypeLabel);
      const previousLinkType = this.curvinessLinkTypeContext;
      this.applyCurvinessValidators(selectedLinkType);

      const rawCurviness = this.formGroup.controls['bezierCurviness'].value;
      const currentCurviness = this.normalizeCurvinessByLinkType(prev253
 
iousLinkType, rawCurviness);
      const previousTypeDefaultCurviness = this.getCurvinessDefaultByLinkType(previousLinkType);
      const shouldUseSelectedTypeDefault = currentCurviness === previousTypeDefaultCurviness;
      const selectedTypeDefaultCurviness = this.getCurvinessDefaultByLinkType(selectedLinkType);

      const nextCurviness = shouldUseSelectedTypeDefault
        ? selectedTypeDefaultCurviness
        : this.normalizeCurvinessByLinkType(selectedLinkType, rawCurviness);

      this.formGroup.controls['bezierCurviness'].setValue(
        nextCurviness,
        { emitEvent: false }
      );

      this.curvinessLinkTypeContext = selectedLinkType;
    });
  }

  private normalizeLinkType(linkType?: string): string {
    return StyleTranslator.normalizeLinkType(linkType);
  }

  private getLinkTypeLabel(linkType?: string): string {
    const normalized = this.normalizeLinkType(linkType);
    const index = this.linkTypeValues.indexOf(normalized);
    return this.linkTypes[index === -1 ? 0 : index];
  }

  isCurvinessSelected(): boolean {
    const selectedLinkType = this.normalizeLinkType(this.formGroup.controls['linkType'].value);
    return selectedLinkType === 'bezier' || selectedLinkType === 'statemachine';
  }

  isFlowchartSelected(): boolean {
    return this.normalizeLinkType(this.formGroup.controls['linkType'].value) === 'flowchart';
  }

  get curvinessMin(): number {
    return this.getCurvinessMinByLinkType(this.normalizeLinkType(this.formGroup.controls['linkType'].value));
  }

  get curvinessMax(): number {
    return this.getCurvinessMaxByLinkType(this.normalizeLinkType(this.formGroup.controls['linkType'].value));
  }

  get curvinessStep(): number {
    return this.getCurvinessStepByLinkType(this.normalizeLinkType(this.formGroup.controls['linkType'].value));
  }

  private normalizeCurvinessByLinkType(linkType: string, value: number): number {
    if (linkType === 'statemachine') {
      return StyleTranslator.normalizeStateMachineCurviness(value);
    }

    return StyleTranslator.normalizeBezierCurviness(value);
  }

  private getCurvinessMinByLinkType(linkType: string): number {
    return linkType === 'statemachine' ? this.stateMachineCurvinessMin : this.bezierCurvinessMin;
  }

  private getCurvinessMaxByLinkType(linkType: string): number {
    return linkType === 'statemachine' ? this.stateMachineCurvinessMax : this.bezierCurvinessMax;
  }

  private getCurvinessStepByLinkType(linkType: string): number {
    return linkType === 'statemachine' ? this.stateMachineCurvinessStep : this.bezierCurvinessStep;
  }

  private getCurvinessDefaultByLinkType(linkType: string): number {
    return linkType === 'statemachine' ? this.stateMachineCurvinessDefault : this.bezierCurvinessDefault;
  }

  private applyCurvinessValidators(linkType: string): void {
    this.formGroup.controls['bezierCurviness'].setValidators([
      Validators.required,
      Validators.min(this.getCurvinessMinByLinkType(linkType)),
      Validators.max(this.getCurvinessMaxByLinkType(linkType)),
    ]);
    this.formGroup.controls['bezierCurviness'].updateValueAndValidity({ emitEvent: false });
  }

  onNoClick() {
    this.dialogRef.close();
  }

  onYesClick() {
    if (this.formGroup.valid) {
      this.link.link_style.color = this.formGroup.get('color').value;
      this.link.link_style.width = this.formGroup.get('width').value;

      let type = this.borderTypes.indexOf(this.formGroup.get('type').value);
      this.link.link_style.type = type;

      this.linkService.updateLinkStyle(this.controller, this.link).subscribe((link) => {
        this.linksDataSource.update(link);
        this.linksEventSource.edited.next(this.linkToMapLink.convert(link));
        location.reload();
        // we add this code/line for reload the entire page because single graph/link style is not updated automatically.
        // this.toasterService.success("Link updated");
        this.dialogRef.close();
      });
    } else {
      this.toasterService.error(`Entered data is incorrect`);
    }
  }
}
