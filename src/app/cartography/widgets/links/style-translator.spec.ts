import { LinkStyle } from '@models/link-style';
import { StyleTranslator } from './style-translator';

describe('StyleTranslator', () => {
  const source: [number, number] = [10, 20];
  const target: [number, number] = [110, 120];

  const createLinkStyle = (linkType?: string): LinkStyle => {
    return {
      color: '#000000',
      width: 2,
      type: 1,
      link_type: linkType,
      bezier_curviness: 150,
      flowchart_roundness: 0,
    };
  };

  it('should return a straight path by default', () => {
    const path = StyleTranslator.getLinkPath(source, target, createLinkStyle());

    expect(path).toEqual('M10,20L110,120');
  });

  it('should generate a bezier path', () => {
    const path = StyleTranslator.getLinkPath(source, target, createLinkStyle('Bezier'));

    expect(path).toContain('C');
  });

  it('should generate a jsPlumb-like bezier for horizontal links', () => {
    const horizontalSource: [number, number] = [10, 20];
    const horizontalTarget: [number, number] = [110, 20];
    const path = StyleTranslator.getLinkPath(horizontalSource, horizontalTarget, createLinkStyle('Bezier'));

    const numbers = (path.match(/-?\d+(?:\.\d+)?/g) || []).map((value) => parseFloat(value));
    const controlPoint1Y = numbers[3];
    const controlPoint2Y = numbers[5];

    expect(controlPoint1Y).not.toBe(20);
    expect(controlPoint2Y).not.toBe(20);
    expect(Math.sign(controlPoint1Y - 20)).toEqual(Math.sign(controlPoint2Y - 20));
  });

  it('should generate an S-shaped bezier when orientations are vertical', () => {
    const horizontalSource: [number, number] = [10, 20];
    const horizontalTarget: [number, number] = [110, 20];
    const path = StyleTranslator.getLinkPath(horizontalSource, horizontalTarget, createLinkStyle('Bezier'), {
      sourceOrientation: [0, 1],
      targetOrientation: [0, -1],
    });

    const numbers = (path.match(/-?\d+(?:\.\d+)?/g) || []).map((value) => parseFloat(value));
    const controlPoint1Y = numbers[3];
    const controlPoint2Y = numbers[5];

    expect(controlPoint1Y).toBeGreaterThan(20);
    expect(controlPoint2Y).toBeLessThan(20);
  });

  it('should apply custom bezier curviness', () => {
    const lowerCurviness = StyleTranslator.getLinkPath(source, target, {
      ...createLinkStyle('Bezier'),
      bezier_curviness: -40,
    });
    const higherCurviness = StyleTranslator.getLinkPath(source, target, {
      ...createLinkStyle('Bezier'),
      bezier_curviness: 260,
    });

    expect(lowerCurviness).not.toEqual(higherCurviness);
  });

  it('should map positive bezier curviness to EVE direction', () => {
    const mostlyVerticalSource: [number, number] = [10, 20];
    const mostlyVerticalTarget: [number, number] = [30, 220];

    const positivePath = StyleTranslator.getLinkPath(mostlyVerticalSource, mostlyVerticalTarget, {
      ...createLinkStyle('Bezier'),
      bezier_curviness: 150,
    });
    const negativePath = StyleTranslator.getLinkPath(mostlyVerticalSource, mostlyVerticalTarget, {
      ...createLinkStyle('Bezier'),
      bezier_curviness: -150,
    });

    const positiveNumbers = (positivePath.match(/-?\d+(?:\.\d+)?/g) || []).map((value) => parseFloat(value));
    const negativeNumbers = (negativePath.match(/-?\d+(?:\.\d+)?/g) || []).map((value) => parseFloat(value));

    const positiveControlPoint1Y = positiveNumbers[3];
    const positiveControlPoint2Y = positiveNumbers[5];
    const negativeControlPoint1Y = negativeNumbers[3];
    const negativeControlPoint2Y = negativeNumbers[5];

    expect(positiveControlPoint1Y).toBeGreaterThan(mostlyVerticalSource[1]);
    expect(positiveControlPoint2Y).toBeLessThan(mostlyVerticalTarget[1]);
    expect(negativeControlPoint1Y).toBeLessThan(mostlyVerticalSource[1]);
    expect(negativeControlPoint2Y).toBeGreaterThan(mostlyVerticalTarget[1]);
  });

  it('should keep a slight bezier bend when curviness is zero', () => {
    const horizontalSource: [number, number] = [10, 20];
    const horizontalTarget: [number, number] = [110, 20];
    const path = StyleTranslator.getLinkPath(horizontalSource, horizontalTarget, {
      ...createLinkStyle('Bezier'),
      bezier_curviness: 0,
    });

    const numbers = (path.match(/-?\d+(?:\.\d+)?/g) || []).map((value) => parseFloat(value));
    const controlPoint1Y = numbers[3];
    const controlPoint2Y = numbers[5];

    expect(controlPoint1Y).not.toEqual(20);
    expect(controlPoint2Y).not.toEqual(20);
    expect(Math.sign(controlPoint1Y - 20)).toEqual(Math.sign(controlPoint2Y - 20));
  });

  it('should generate a flowchart path with elbows', () => {
    const path = StyleTranslator.getLinkPath(source, target, createLinkStyle('flowchart'));

    expect((path.match(/L/g) || []).length).toBeGreaterThan(1);
  });

  it('should keep aligned horizontal flowchart links straight', () => {
    const horizontalSource: [number, number] = [10, 20];
    const horizontalTarget: [number, number] = [110, 20];
    const path = StyleTranslator.getLinkPath(horizontalSource, horizontalTarget, createLinkStyle('flowchart'));

    expect(path).toEqual('M10,20L110,20');
  });

  it('should create flowchart elbows once alignment is broken', () => {
    const horizontalSource: [number, number] = [10, 20];
    const horizontalTarget: [number, number] = [110, 40];
    const path = StyleTranslator.getLinkPath(horizontalSource, horizontalTarget, createLinkStyle('flowchart'));

    expect(path).not.toEqual('M10,20L110,40');
    expect((path.match(/L/g) || []).length).toBeGreaterThan(2);
  });

  it('should offset only flowchart middle lane when distance is provided', () => {
    const horizontalSource: [number, number] = [10, 20];
    const horizontalTarget: [number, number] = [110, 40];
    const basePath = StyleTranslator.getLinkPath(horizontalSource, horizontalTarget, createLinkStyle('flowchart'));
    const shiftedPath = StyleTranslator.getLinkPath(horizontalSource, horizontalTarget, createLinkStyle('flowchart'), {
      flowchartDistance: 14,
    });

    const baseNumbers = (basePath.match(/-?\d+(?:\.\d+)?/g) || []).map((value) => parseFloat(value));
    const shiftedNumbers = (shiftedPath.match(/-?\d+(?:\.\d+)?/g) || []).map((value) => parseFloat(value));

    // Keep endpoints fixed and move only the elbow lane.
    expect(shiftedNumbers[0]).toEqual(baseNumbers[0]);
    expect(shiftedNumbers[1]).toEqual(baseNumbers[1]);
    expect(shiftedNumbers[6]).toEqual(baseNumbers[6]);
    expect(shiftedNumbers[7]).toEqual(baseNumbers[7]);
    expect(shiftedNumbers[2]).not.toBeCloseTo(baseNumbers[2], 4);
    expect(shiftedNumbers[4]).not.toBeCloseTo(baseNumbers[4], 4);
  });

  it('should keep near-diagonal flowchart middle lanes separated after translation', () => {
    const diagonalSource: [number, number] = [10, 20];
    const diagonalTarget: [number, number] = [110, 120];
    const positiveDistance = 14;
    const negativeDistance = -14;

    const positivePath = StyleTranslator.getLinkPath(diagonalSource, diagonalTarget, createLinkStyle('flowchart'), {
      flowchartDistance: positiveDistance,
    });
    const negativePath = StyleTranslator.getLinkPath(diagonalSource, diagonalTarget, createLinkStyle('flowchart'), {
      flowchartDistance: negativeDistance,
    });

    const positiveNumbers = (positivePath.match(/-?\d+(?:\.\d+)?/g) || []).map((value) => parseFloat(value));
    const negativeNumbers = (negativePath.match(/-?\d+(?:\.\d+)?/g) || []).map((value) => parseFloat(value));

    const deltaX = diagonalTarget[0] - diagonalSource[0];
    const deltaY = diagonalTarget[1] - diagonalSource[1];
    const safeLength = Math.hypot(deltaX, deltaY) || 1;
    const translationXPositive = (-deltaY / safeLength) * positiveDistance;
    const translationXNegative = (-deltaY / safeLength) * negativeDistance;

    const positiveRenderedMiddleX = positiveNumbers[2] + translationXPositive;
    const negativeRenderedMiddleX = negativeNumbers[2] + translationXNegative;

    expect(Math.abs(positiveRenderedMiddleX - negativeRenderedMiddleX)).toBeGreaterThan(10);
  });

  it('should round flowchart corners when roundness is set', () => {
    const roundedPath = StyleTranslator.getLinkPath(source, target, {
      ...createLinkStyle('flowchart'),
      flowchart_roundness: 20,
    });
    const sharpPath = StyleTranslator.getLinkPath(source, target, {
      ...createLinkStyle('flowchart'),
      flowchart_roundness: 0,
    });

    expect(roundedPath).toContain('Q');
    expect(roundedPath).not.toEqual(sharpPath);
  });

  it('should generate a statemachine path', () => {
    const bezierPath = StyleTranslator.getLinkPath(source, target, createLinkStyle('bezier'));
    const stateMachinePath = StyleTranslator.getLinkPath(source, target, createLinkStyle('state-machine'));

    expect(stateMachinePath).toContain('C');
    expect(stateMachinePath).not.toEqual(bezierPath);
  });

  it('should apply custom curviness to statemachine links', () => {
    const horizontalSource: [number, number] = [10, 20];
    const horizontalTarget: [number, number] = [110, 20];

    const lowerCurviness = StyleTranslator.getLinkPath(horizontalSource, horizontalTarget, {
      ...createLinkStyle('state-machine'),
      bezier_curviness: 40,
    });
    const higherCurviness = StyleTranslator.getLinkPath(horizontalSource, horizontalTarget, {
      ...createLinkStyle('state-machine'),
      bezier_curviness: 260,
    });

    expect(lowerCurviness).not.toEqual(higherCurviness);
  });

  it('should curve statemachine links outward for positive curviness', () => {
    const horizontalSource: [number, number] = [10, 20];
    const horizontalTarget: [number, number] = [110, 20];
    const path = StyleTranslator.getLinkPath(horizontalSource, horizontalTarget, {
      ...createLinkStyle('state-machine'),
      bezier_curviness: 40,
    });

    const numbers = (path.match(/-?\d+(?:\.\d+)?/g) || []).map((value) => parseFloat(value));
    const controlPoint1Y = numbers[3];
    const controlPoint2Y = numbers[5];

    expect(controlPoint1Y).toBeGreaterThan(20);
    expect(controlPoint2Y).toBeGreaterThan(20);
    expect(controlPoint1Y).toEqual(controlPoint2Y);
  });

  it('should keep a slight statemachine bend when curviness is zero', () => {
    const horizontalSource: [number, number] = [10, 20];
    const horizontalTarget: [number, number] = [110, 20];
    const path = StyleTranslator.getLinkPath(horizontalSource, horizontalTarget, {
      ...createLinkStyle('state-machine'),
      bezier_curviness: undefined,
    });

    const numbers = (path.match(/-?\d+(?:\.\d+)?/g) || []).map((value) => parseFloat(value));
    const controlPoint1Y = numbers[3];
    const controlPoint2Y = numbers[5];

    expect(controlPoint1Y).toBeGreaterThan(20);
    expect(controlPoint2Y).toBeGreaterThan(20);
    expect(controlPoint1Y).toEqual(controlPoint2Y);
  });

  it('should generate an EVE-like statemachine midpoint control shape', () => {
    const eveSource: [number, number] = [5, 0];
    const eveTarget: [number, number] = [284, 3];

    const path = StyleTranslator.getLinkPath(eveSource, eveTarget, {
      ...createLinkStyle('state-machine'),
      bezier_curviness: 0,
    });

    const numbers = (path.match(/-?\d+(?:\.\d+)?/g) || []).map((value) => parseFloat(value));
    const controlPoint1X = numbers[2];
    const controlPoint1Y = numbers[3];
    const controlPoint2X = numbers[4];
    const controlPoint2Y = numbers[5];

    expect(controlPoint1X).toBeCloseTo(144.5, 1);
    expect(controlPoint1Y).toBeCloseTo(11.5, 1);
    expect(controlPoint2X).toBeCloseTo(144.5, 1);
    expect(controlPoint2Y).toBeCloseTo(11.5, 1);
  });

  it('should return a path transform for statemachine links', () => {
    const transform = StyleTranslator.getLinkTransform(createLinkStyle('state-machine'));

    expect(transform).toEqual('translate(0,3)');
  });

  it('should not return a path transform for non-statemachine links', () => {
    const transform = StyleTranslator.getLinkTransform(createLinkStyle('bezier'));

    expect(transform).toBeNull();
  });

  it('should normalize unknown connector types to straight', () => {
    expect(StyleTranslator.normalizeLinkType('unsupported')).toEqual('straight');
  });

  it('should normalize bezier curviness to EVE range', () => {
    expect(StyleTranslator.normalizeBezierCurviness(undefined)).toEqual(150);
    expect(StyleTranslator.normalizeBezierCurviness(-2600)).toEqual(-2500);
    expect(StyleTranslator.normalizeBezierCurviness(2601)).toEqual(2500);
  });

  it('should normalize flowchart roundness to configured range', () => {
    expect(StyleTranslator.normalizeFlowchartRoundness(undefined)).toEqual(0);
    expect(StyleTranslator.normalizeFlowchartRoundness(-260)).toEqual(-250);
    expect(StyleTranslator.normalizeFlowchartRoundness(251)).toEqual(250);
  });

  it('should normalize statemachine curviness to configured range', () => {
    expect(StyleTranslator.normalizeStateMachineCurviness(undefined)).toEqual(0);
    expect(StyleTranslator.normalizeStateMachineCurviness(-2600)).toEqual(-2500);
    expect(StyleTranslator.normalizeStateMachineCurviness(2600)).toEqual(2500);
  });

  it('should vary bezier curves without moving connection points', () => {
    const horizontalSource: [number, number] = [10, 20];
    const horizontalTarget: [number, number] = [110, 20];
    const basePath = StyleTranslator.getLinkPath(horizontalSource, horizontalTarget, createLinkStyle('Bezier'));
    const variedPath = StyleTranslator.getLinkPath(horizontalSource, horizontalTarget, createLinkStyle('Bezier'), {
      bezierVariation: 12,
    });

    expect(basePath).not.toEqual(variedPath);
    expect(basePath.startsWith('M10,20')).toBeTrue();
    expect(basePath.endsWith('110,20')).toBeTrue();
    expect(variedPath.startsWith('M10,20')).toBeTrue();
    expect(variedPath.endsWith('110,20')).toBeTrue();
  });

  it('should return solid dash style for Qt SolidLine type', () => {
    const style = { ...createLinkStyle(), type: 1 };
    expect(StyleTranslator.getLinkStyle(style)).toEqual('0, 0');
  });

  it('should return dash pattern for Qt DashLine type', () => {
    const style = { ...createLinkStyle(), type: 2 };
    expect(StyleTranslator.getLinkStyle(style)).toEqual('10, 10');
  });

  it('should return dot pattern for Qt DotLine type', () => {
    const style = { ...createLinkStyle(), type: 3, width: 2 };
    expect(StyleTranslator.getLinkStyle(style)).toEqual('2, 2');
  });

  it('should return dash-dot pattern for Qt DashDotLine type', () => {
    const style = { ...createLinkStyle(), type: 4, width: 2 };
    expect(StyleTranslator.getLinkStyle(style)).toEqual('20, 10, 2, 10');
  });

  it('should return dash-dot-dot pattern for Qt DashDotDotLine type', () => {
    const style = { ...createLinkStyle(), type: 5, width: 2 };
    expect(StyleTranslator.getLinkStyle(style)).toEqual('20, 10, 2, 2, 2, 10');
  });

  it('should treat legacy type 0 as solid', () => {
    const style = { ...createLinkStyle(), type: 0 };
    expect(StyleTranslator.getLinkStyle(style)).toEqual('0, 0');
  });
});
