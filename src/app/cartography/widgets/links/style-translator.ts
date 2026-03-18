import { path } from 'd3-path';
import {
    EVE_BEZIER_CURVINESS_DEFAULT,
    EVE_BEZIER_CURVINESS_MAX,
    EVE_BEZIER_CURVINESS_MIN,
    EVE_BEZIER_CURVINESS_STEP,
    EVE_FLOWCHART_ROUNDNESS_DEFAULT,
    EVE_FLOWCHART_ROUNDNESS_MAX,
    EVE_FLOWCHART_ROUNDNESS_MIN,
    EVE_FLOWCHART_ROUNDNESS_STEP,
    EVE_STATE_MACHINE_CURVINESS_DEFAULT,
    EVE_STATE_MACHINE_CURVINESS_MAX,
    EVE_STATE_MACHINE_CURVINESS_MIN,
    EVE_STATE_MACHINE_CURVINESS_STEP,
} from '@models/link-style-constants';
import { LinkStyle } from '@models/link-style';

export type ConnectorLinkType = 'straight' | 'bezier' | 'flowchart' | 'statemachine';
export type ConnectorOrientation = [number, number];
export type LinkPathOptions = {
    bezierVariation?: number;
    sourceOrientation?: ConnectorOrientation;
    targetOrientation?: ConnectorOrientation;
    flowchartDistance?: number;
};

export class StyleTranslator {
    static readonly DEFAULT_LINK_TYPE: ConnectorLinkType = 'straight';
    static readonly BEZIER_CURVINESS_DEFAULT = EVE_BEZIER_CURVINESS_DEFAULT;
    static readonly BEZIER_CURVINESS_MIN = EVE_BEZIER_CURVINESS_MIN;
    static readonly BEZIER_CURVINESS_MAX = EVE_BEZIER_CURVINESS_MAX;
    static readonly BEZIER_CURVINESS_STEP = EVE_BEZIER_CURVINESS_STEP;
    static readonly STATE_MACHINE_CURVINESS_DEFAULT = EVE_STATE_MACHINE_CURVINESS_DEFAULT;
    static readonly STATE_MACHINE_CURVINESS_MIN = EVE_STATE_MACHINE_CURVINESS_MIN;
    static readonly STATE_MACHINE_CURVINESS_MAX = EVE_STATE_MACHINE_CURVINESS_MAX;
    static readonly STATE_MACHINE_CURVINESS_STEP = EVE_STATE_MACHINE_CURVINESS_STEP;
    static readonly STATE_MACHINE_ZERO_CURVE_OFFSET = 10;
    static readonly STATE_MACHINE_TRANSLATE_Y = 3;
    static readonly FLOWCHART_ROUNDNESS_DEFAULT = EVE_FLOWCHART_ROUNDNESS_DEFAULT;
    static readonly FLOWCHART_ROUNDNESS_MIN = EVE_FLOWCHART_ROUNDNESS_MIN;
    static readonly FLOWCHART_ROUNDNESS_MAX = EVE_FLOWCHART_ROUNDNESS_MAX;
    static readonly FLOWCHART_ROUNDNESS_STEP = EVE_FLOWCHART_ROUNDNESS_STEP;

    static getLinkStyle(linkStyle: LinkStyle) {
        // Qt::PenStyle-compatible: 1=Solid, 2=Dash, 3=Dot, 4=DashDot, 5=DashDotDot
        if (linkStyle.type == 2) {
            return `10, 10`;
        }
        if (linkStyle.type == 3) {
            return `${linkStyle.width}, ${linkStyle.width}`;
        }
        if (linkStyle.type == 4) {
            return `20, 10, ${linkStyle.width}, 10`;
        }
        if (linkStyle.type == 5) {
            return `20, 10, ${linkStyle.width}, ${linkStyle.width}, ${linkStyle.width}, 10`;
        }
        return `0, 0`;
    }

    static normalizeLinkType(linkType?: string): ConnectorLinkType {
        const normalized = (linkType || '').toLowerCase().replace(/[\s_-]/g, '');

        if (normalized === 'bezier') {
            return 'bezier';
        }
        if (normalized === 'flowchart') {
            return 'flowchart';
        }
        if (normalized === 'statemachine') {
            return 'statemachine';
        }
        return StyleTranslator.DEFAULT_LINK_TYPE;
    }

    static getLinkPath(
        source: [number, number],
        target: [number, number],
        linkStyle: LinkStyle,
        options?: LinkPathOptions
    ) {
        const linkType = StyleTranslator.normalizeLinkType(linkStyle?.link_type);

        if (linkType === 'bezier') {
            const bezierVariation =
                typeof options?.bezierVariation === 'number' && !Number.isNaN(options.bezierVariation)
                    ? options.bezierVariation
                    : 0;
            const adjustedBezierCurviness = StyleTranslator.getEffectiveBezierMajorAnchor(
                linkStyle?.bezier_curviness,
                bezierVariation
            );

            return StyleTranslator.getJsPlumbBezierPath(
                source,
                target,
                adjustedBezierCurviness,
                options?.sourceOrientation,
                options?.targetOrientation
            );
        }
        if (linkType === 'flowchart') {
            const flowchartRoundness = StyleTranslator.normalizeFlowchartRoundness(linkStyle?.flowchart_roundness);
            return StyleTranslator.getFlowchartPath(source, target, flowchartRoundness, options?.flowchartDistance);
        }
        if (linkType === 'statemachine') {
            const stateMachineCurviness = StyleTranslator.normalizeStateMachineCurviness(linkStyle?.bezier_curviness);
            return StyleTranslator.getStateMachinePath(source, target, stateMachineCurviness);
        }
        return StyleTranslator.getStraightPath(source, target);
    }

    static getLinkTransform(linkStyle: LinkStyle): string | null {
        const linkType = StyleTranslator.normalizeLinkType(linkStyle?.link_type);

        if (linkType === 'statemachine') {
            return `translate(0,${StyleTranslator.STATE_MACHINE_TRANSLATE_Y})`;
        }

        return null;
    }

    static normalizeBezierCurviness(bezierCurviness?: number): number {
        const rawValue =
            typeof bezierCurviness === 'number' && !Number.isNaN(bezierCurviness)
                ? bezierCurviness
                : StyleTranslator.BEZIER_CURVINESS_DEFAULT;

        const steppedValue =
            Math.round(rawValue / StyleTranslator.BEZIER_CURVINESS_STEP) * StyleTranslator.BEZIER_CURVINESS_STEP;

        return Math.max(
            StyleTranslator.BEZIER_CURVINESS_MIN,
            Math.min(StyleTranslator.BEZIER_CURVINESS_MAX, steppedValue)
        );
    }

    static getEffectiveBezierMajorAnchor(bezierCurviness?: number, bezierVariation: number = 0): number {
        const normalizedCurviness = StyleTranslator.normalizeBezierCurviness(bezierCurviness);
        const normalizedVariation =
            typeof bezierVariation === 'number' && !Number.isNaN(bezierVariation) ? bezierVariation : 0;

        // EVE/jsPlumb expected direction: positive UI curviness bends the opposite side
        // of our coordinate mapping, so we invert the configured value here.
        return -normalizedCurviness + normalizedVariation;
    }

    static normalizeFlowchartRoundness(flowchartRoundness?: number): number {
        const rawValue =
            typeof flowchartRoundness === 'number' && !Number.isNaN(flowchartRoundness)
                ? flowchartRoundness
                : StyleTranslator.FLOWCHART_ROUNDNESS_DEFAULT;

        const steppedValue =
            Math.round(rawValue / StyleTranslator.FLOWCHART_ROUNDNESS_STEP) * StyleTranslator.FLOWCHART_ROUNDNESS_STEP;

        return Math.max(
            StyleTranslator.FLOWCHART_ROUNDNESS_MIN,
            Math.min(StyleTranslator.FLOWCHART_ROUNDNESS_MAX, steppedValue)
        );
    }

    static normalizeStateMachineCurviness(stateMachineCurviness?: number): number {
        const rawValue =
            typeof stateMachineCurviness === 'number' && !Number.isNaN(stateMachineCurviness)
                ? stateMachineCurviness
                : StyleTranslator.STATE_MACHINE_CURVINESS_DEFAULT;

        const steppedValue =
            Math.round(rawValue / StyleTranslator.STATE_MACHINE_CURVINESS_STEP) *
            StyleTranslator.STATE_MACHINE_CURVINESS_STEP;

        return Math.max(
            StyleTranslator.STATE_MACHINE_CURVINESS_MIN,
            Math.min(StyleTranslator.STATE_MACHINE_CURVINESS_MAX, steppedValue)
        );
    }

    static getContinuousOrientation(
        source: [number, number],
        target: [number, number]
    ): ConnectorOrientation {
        const deltaX = target[0] - source[0];
        const deltaY = target[1] - source[1];

        if (Math.abs(deltaX) >= Math.abs(deltaY)) {
            return [deltaX >= 0 ? 1 : -1, 0];
        }

        return [0, deltaY >= 0 ? 1 : -1];
    }

    static getBezierControlPoints(
        source: [number, number],
        target: [number, number],
        majorAnchor: number,
        sourceOrientation?: ConnectorOrientation,
        targetOrientation?: ConnectorOrientation
    ) {
        const resolvedSourceOrientation = StyleTranslator.sanitizeOrientation(
            sourceOrientation || StyleTranslator.getContinuousOrientation(source, target)
        );
        const resolvedTargetOrientation = StyleTranslator.sanitizeOrientation(
            targetOrientation || StyleTranslator.getContinuousOrientation(target, source)
        );

        const sourceControlPoint = StyleTranslator.findBezierControlPoint(
            source,
            source,
            target,
            resolvedSourceOrientation,
            resolvedTargetOrientation,
            majorAnchor
        );
        const targetControlPoint = StyleTranslator.findBezierControlPoint(
            target,
            target,
            source,
            resolvedTargetOrientation,
            resolvedSourceOrientation,
            majorAnchor
        );

        return {
            sourceControlPoint,
            targetControlPoint,
            sourceOrientation: resolvedSourceOrientation,
            targetOrientation: resolvedTargetOrientation,
        };
    }

    static getBezierSideSign(
        source: [number, number],
        target: [number, number],
        majorAnchor: number,
        sourceOrientation?: ConnectorOrientation,
        targetOrientation?: ConnectorOrientation
    ) {
        const { sourceControlPoint } = StyleTranslator.getBezierControlPoints(
            source,
            target,
            majorAnchor,
            sourceOrientation,
            targetOrientation
        );

        const lineX = target[0] - source[0];
        const lineY = target[1] - source[1];
        const controlX = sourceControlPoint[0] - source[0];
        const controlY = sourceControlPoint[1] - source[1];
        const crossProduct = lineX * controlY - lineY * controlX;

        if (Math.abs(crossProduct) < 0.0001) {
            return 1;
        }

        return crossProduct > 0 ? 1 : -1;
    }

    private static getStraightPath(source: [number, number], target: [number, number]) {
        const lineGenerator = path();
        lineGenerator.moveTo(source[0], source[1]);
        lineGenerator.lineTo(target[0], target[1]);
        return lineGenerator.toString();
    }

    private static getFlowchartPath(
        source: [number, number],
        target: [number, number],
        roundness: number,
        flowchartDistance: number = 0
    ) {
        const deltaX = target[0] - source[0];
        const deltaY = target[1] - source[1];
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        const horizontalDominant = Math.abs(deltaX) >= Math.abs(deltaY);
        const nearAlignedThreshold = 6;
        const safeLength = Math.hypot(deltaX, deltaY) || 1;
        const normalizedDistance =
            typeof flowchartDistance === 'number' && !Number.isNaN(flowchartDistance) ? flowchartDistance : 0;
        const translationX = (-deltaY / safeLength) * normalizedDistance;
        const translationY = (deltaX / safeLength) * normalizedDistance;

        // Keep aligned links visually straight. Elbows appear only once alignment is broken.
        if (absDeltaX <= nearAlignedThreshold || absDeltaY <= nearAlignedThreshold) {
            return StyleTranslator.getStraightPath(source, target);
        }

        const points: [number, number][] = [[source[0], source[1]]];

        if (horizontalDominant) {
            // Keep middle-lane spacing equal to endpoint horizontal-segment spacing,
            // without canceling against group translation on near-diagonal links.
            const desiredMiddleShiftX = (translationX < 0 ? -1 : 1) * Math.abs(translationY);
            const middleX = source[0] + deltaX / 2 + (desiredMiddleShiftX - translationX);
            points.push([middleX, source[1]]);
            points.push([middleX, target[1]]);
        } else {
            const desiredMiddleShiftY = (translationY < 0 ? -1 : 1) * Math.abs(translationX);
            const middleY = source[1] + deltaY / 2 + (desiredMiddleShiftY - translationY);
            points.push([source[0], middleY]);
            points.push([target[0], middleY]);
        }
        points.push([target[0], target[1]]);

        return StyleTranslator.getRoundedPolylinePath(points, Math.abs(roundness));
    }

    private static getRoundedPolylinePath(points: [number, number][], roundness: number) {
        const lineGenerator = path();
        const sanitizedPoints = points.filter((point, index, allPoints) => {
            if (index === 0) {
                return true;
            }
            const previous = allPoints[index - 1];
            return point[0] !== previous[0] || point[1] !== previous[1];
        });

        if (sanitizedPoints.length === 0) {
            return '';
        }

        lineGenerator.moveTo(sanitizedPoints[0][0], sanitizedPoints[0][1]);

        if (sanitizedPoints.length === 1) {
            return lineGenerator.toString();
        }

        if (roundness <= 0) {
            for (let pointIndex = 1; pointIndex < sanitizedPoints.length; pointIndex++) {
                const point = sanitizedPoints[pointIndex];
                lineGenerator.lineTo(point[0], point[1]);
            }
            return lineGenerator.toString();
        }

        const epsilon = 0.0001;
        for (let pointIndex = 1; pointIndex < sanitizedPoints.length - 1; pointIndex++) {
            const previous = sanitizedPoints[pointIndex - 1];
            const current = sanitizedPoints[pointIndex];
            const next = sanitizedPoints[pointIndex + 1];

            const incomingX = current[0] - previous[0];
            const incomingY = current[1] - previous[1];
            const outgoingX = next[0] - current[0];
            const outgoingY = next[1] - current[1];

            const incomingLength = Math.sqrt(incomingX * incomingX + incomingY * incomingY);
            const outgoingLength = Math.sqrt(outgoingX * outgoingX + outgoingY * outgoingY);

            if (incomingLength < epsilon || outgoingLength < epsilon) {
                lineGenerator.lineTo(current[0], current[1]);
                continue;
            }

            const incomingUnitX = incomingX / incomingLength;
            const incomingUnitY = incomingY / incomingLength;
            const outgoingUnitX = outgoingX / outgoingLength;
            const outgoingUnitY = outgoingY / outgoingLength;

            const crossProduct = incomingUnitX * outgoingUnitY - incomingUnitY * outgoingUnitX;
            if (Math.abs(crossProduct) < epsilon) {
                lineGenerator.lineTo(current[0], current[1]);
                continue;
            }

            const cornerRadius = Math.min(roundness, incomingLength / 2, outgoingLength / 2);
            if (cornerRadius < epsilon) {
                lineGenerator.lineTo(current[0], current[1]);
                continue;
            }

            const curveStart: [number, number] = [
                current[0] - incomingUnitX * cornerRadius,
                current[1] - incomingUnitY * cornerRadius,
            ];
            const curveEnd: [number, number] = [
                current[0] + outgoingUnitX * cornerRadius,
                current[1] + outgoingUnitY * cornerRadius,
            ];

            lineGenerator.lineTo(curveStart[0], curveStart[1]);
            lineGenerator.quadraticCurveTo(current[0], current[1], curveEnd[0], curveEnd[1]);
        }

        const finalPoint = sanitizedPoints[sanitizedPoints.length - 1];
        lineGenerator.lineTo(finalPoint[0], finalPoint[1]);
        return lineGenerator.toString();
    }

    private static getStateMachinePath(
        source: [number, number],
        target: [number, number],
        stateMachineCurviness: number
    ) {
        const lineGenerator = path();
        const midpointX = (source[0] + target[0]) / 2;
        const midpointY = (source[1] + target[1]) / 2;
        const orientation = StyleTranslator.getContinuousOrientation(source, target);
        const tangentX = -orientation[1];
        const tangentY = orientation[0];
        const curveOffset = stateMachineCurviness + StyleTranslator.STATE_MACHINE_ZERO_CURVE_OFFSET;

        const controlPoint: [number, number] = [
            midpointX + tangentX * curveOffset,
            midpointY + tangentY * curveOffset,
        ];

        lineGenerator.moveTo(source[0], source[1]);
        lineGenerator.bezierCurveTo(
            controlPoint[0],
            controlPoint[1],
            controlPoint[0],
            controlPoint[1],
            target[0],
            target[1]
        );

        return lineGenerator.toString();
    }

    private static getJsPlumbBezierPath(
        source: [number, number],
        target: [number, number],
        majorAnchor: number,
        sourceOrientation?: ConnectorOrientation,
        targetOrientation?: ConnectorOrientation
    ) {
        const {
            sourceControlPoint,
            targetControlPoint,
        } = StyleTranslator.getBezierControlPoints(
            source,
            target,
            majorAnchor,
            sourceOrientation,
            targetOrientation
        );

        const lineGenerator = path();

        lineGenerator.moveTo(source[0], source[1]);
        lineGenerator.bezierCurveTo(
            sourceControlPoint[0],
            sourceControlPoint[1],
            targetControlPoint[0],
            targetControlPoint[1],
            target[0],
            target[1]
        );

        return lineGenerator.toString();
    }

    private static sanitizeOrientation(orientation: ConnectorOrientation): ConnectorOrientation {
        const clampToOrientationValue = (value: number) => {
            if (value > 0) {
                return 1;
            }

            if (value < 0) {
                return -1;
            }

            return 0;
        };

        return [
            clampToOrientationValue(orientation[0]),
            clampToOrientationValue(orientation[1]),
        ];
    }

    private static findBezierControlPoint(
        point: [number, number],
        sourceAnchorPosition: [number, number],
        targetAnchorPosition: [number, number],
        sourceOrientation: ConnectorOrientation,
        targetOrientation: ConnectorOrientation,
        majorAnchor: number
    ): [number, number] {
        const minorAnchor = 10;
        const isPerpendicular =
            sourceOrientation[0] !== targetOrientation[0] || sourceOrientation[1] === targetOrientation[1];
        const controlPoint: [number, number] = [0, 0];

        if (!isPerpendicular) {
            if (sourceOrientation[0] === 0) {
                controlPoint[0] =
                    sourceAnchorPosition[0] < targetAnchorPosition[0]
                        ? point[0] + minorAnchor
                        : point[0] - minorAnchor;
            } else {
                controlPoint[0] = point[0] - majorAnchor * sourceOrientation[0];
            }

            if (sourceOrientation[1] === 0) {
                controlPoint[1] =
                    sourceAnchorPosition[1] < targetAnchorPosition[1]
                        ? point[1] + minorAnchor
                        : point[1] - minorAnchor;
            } else {
                controlPoint[1] = point[1] + majorAnchor * targetOrientation[1];
            }
        } else {
            if (targetOrientation[0] === 0) {
                controlPoint[0] =
                    targetAnchorPosition[0] < sourceAnchorPosition[0]
                        ? point[0] + minorAnchor
                        : point[0] - minorAnchor;
            } else {
                controlPoint[0] = point[0] + majorAnchor * targetOrientation[0];
            }

            if (targetOrientation[1] === 0) {
                controlPoint[1] =
                    targetAnchorPosition[1] < sourceAnchorPosition[1]
                        ? point[1] + minorAnchor
                        : point[1] - minorAnchor;
            } else {
                controlPoint[1] = point[1] + majorAnchor * sourceOrientation[1];
            }
        }

        return controlPoint;
    }
}
