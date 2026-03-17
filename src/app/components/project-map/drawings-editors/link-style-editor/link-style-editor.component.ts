import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
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
  styleUrls: ['./link-style-editor.component.scss'],
})
export class LinkStyleEditorDialogComponent implements OnInit {
  controller: Controller;
  project: Project;
  link: Link;
  formGroup: UntypedFormGroup;
  borderTypes = ["Solid", "Dash", "Dot", "Dash Dot", "Dash Dot Dot"];
  linkTypes = ["Straight", "Bezier", "Flowchart", "StateMachine"];
  private readonly linkTypeValues = ["straight", "bezier", "flowchart", "statemachine"];
  bezierCurvinessMin = StyleTranslator.BEZIER_CURVINESS_MIN;
  bezierCurvinessMax = StyleTranslator.BEZIER_CURVINESS_MAX;
  bezierCurvinessStep = StyleTranslator.BEZIER_CURVINESS_STEP;
  bezierCurvinessDefault = StyleTranslator.BEZIER_CURVINESS_DEFAULT;
  stateMachineCurvinessMin = StyleTranslator.STATE_MACHINE_CURVINESS_MIN;
  stateMachineCurvinessMax = StyleTranslator.STATE_MACHINE_CURVINESS_MAX;
  stateMachineCurvinessStep = StyleTranslator.STATE_MACHINE_CURVINESS_STEP;
  stateMachineCurvinessDefault = StyleTranslator.STATE_MACHINE_CURVINESS_DEFAULT;
  flowchartRoundnessMin = StyleTranslator.FLOWCHART_ROUNDNESS_MIN;
  flowchartRoundnessMax = StyleTranslator.FLOWCHART_ROUNDNESS_MAX;
  flowchartRoundnessStep = StyleTranslator.FLOWCHART_ROUNDNESS_STEP;
  flowchartRoundnessDefault = StyleTranslator.FLOWCHART_ROUNDNESS_DEFAULT;
  private curvinessLinkTypeContext: string = StyleTranslator.DEFAULT_LINK_TYPE;

  constructor(
    public dialogRef: MatDialogRef<LinkStyleEditorDialogComponent>,
    private formBuilder: UntypedFormBuilder,
    private toasterService: ToasterService,
    private linkService: LinkService,
    private linksDataSource: LinksDataSource,
    private linksEventSource: LinksEventSource,
    private linkToMapLink: LinkToMapLinkConverter,
    private nonNegativeValidator: NonNegativeValidator
  ) {
    this.formGroup = this.formBuilder.group({
      color: new UntypedFormControl('', [Validators.required]),
      width: new UntypedFormControl('', [Validators.required, nonNegativeValidator.get]),
      type: new UntypedFormControl('', [Validators.required]),
      linkType: new UntypedFormControl('', [Validators.required]),
      bezierCurviness: new UntypedFormControl(this.bezierCurvinessDefault, [Validators.required]),
      flowchartRoundness: new UntypedFormControl(this.flowchartRoundnessDefault, [
        Validators.required,
        Validators.min(this.flowchartRoundnessMin),
        Validators.max(this.flowchartRoundnessMax),
      ])
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
    if (
      this.link.link_style?.type !== undefined
      && this.link.link_style.type >= 0
      && this.link.link_style.type < this.borderTypes.length
    ) {
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
      const currentCurviness = this.normalizeCurvinessByLinkType(previousLinkType, rawCurviness);
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
      if (!this.link.link_style) {
        this.link.link_style = {} as LinkStyle;
      }

      const originalLinkType = this.normalizeLinkType(
        this.link.link_style.link_type || LinkTypeCache.get(this.link.project_id, this.link.link_id)
      );

      this.link.link_style.color = this.formGroup.controls['color'].value;
      this.link.link_style.width = this.formGroup.controls['width'].value;

      let type = this.borderTypes.indexOf(this.formGroup.controls['type'].value);
      this.link.link_style.type = type;
      this.link.link_style.link_type = this.normalizeLinkType(this.formGroup.controls['linkType'].value);
      this.link.link_style.bezier_curviness = this.normalizeCurvinessByLinkType(
        this.link.link_style.link_type,
        this.formGroup.controls['bezierCurviness'].value
      );
      this.link.link_style.flowchart_roundness = StyleTranslator.normalizeFlowchartRoundness(this.formGroup.controls['flowchartRoundness'].value);

      const expectedLinkType = this.link.link_style.link_type;
      const expectedBezierCurviness = this.link.link_style.bezier_curviness;
      const expectedFlowchartRoundness = this.link.link_style.flowchart_roundness;
      const linkTypeChanged = expectedLinkType !== originalLinkType;

      this.linkService.updateLinkStyle(this.controller, this.link).subscribe(
        (link: Link) => {
          if (!link.link_style) {
            link.link_style = {} as LinkStyle;
          }

          const returnedLinkType = link.link_style.link_type;
          const hasExplicitServerLinkType =
            typeof returnedLinkType === 'string' && returnedLinkType.trim().length > 0;
          const serverReturnedDifferentLinkType =
            hasExplicitServerLinkType &&
            this.normalizeLinkType(returnedLinkType) !== this.normalizeLinkType(expectedLinkType);

          if (!link.link_style.link_type && expectedLinkType) {
            link.link_style.link_type = expectedLinkType;
          }

          if (link.link_style.bezier_curviness === undefined && expectedBezierCurviness !== undefined) {
            link.link_style.bezier_curviness = expectedBezierCurviness;
          }

          if (link.link_style.flowchart_roundness === undefined && expectedFlowchartRoundness !== undefined) {
            link.link_style.flowchart_roundness = expectedFlowchartRoundness;
          }

          LinkTypeCache.set(link.project_id, link.link_id, link.link_style.link_type);
          LinkTypeCache.setBezierCurviness(
            link.project_id,
            link.link_id,
            this.normalizeCurvinessByLinkType(link.link_style.link_type, link.link_style.bezier_curviness)
          );
          LinkTypeCache.setFlowchartRoundness(
            link.project_id,
            link.link_id,
            StyleTranslator.normalizeFlowchartRoundness(link.link_style.flowchart_roundness)
          );

          this.linksDataSource.update(link);
          this.linksEventSource.edited.next(this.linkToMapLink.convert(link));

          if (linkTypeChanged && expectedLinkType && serverReturnedDifferentLinkType) {
            this.toasterService.warning('Link type was not persisted by the controller. Please update gns3-server.');
          } else {
            this.toasterService.success('Link updated');
          }

          this.dialogRef.close();
        },
        () => {
          this.toasterService.error('Unable to update link style');
        }
      );
    } else {
      this.toasterService.error(`Entered data is incorrect`);
    }
  }
}
