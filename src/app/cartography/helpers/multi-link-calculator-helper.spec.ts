import { MapLink } from '../models/map/map-link';
import { MapNode } from '../models/map/map-node';
import { MultiLinkCalculatorHelper } from './multi-link-calculator-helper';

describe('MultiLinkCalculatorHelper', () => {
  let helper: MultiLinkCalculatorHelper;

  beforeEach(() => {
    helper = new MultiLinkCalculatorHelper();
  });

  it('should return no translation for zero distance', () => {
    const translation = helper.linkTranslation(0, { x: 0, y: 0 }, { x: 100, y: 0 });

    expect(translation).toEqual({ dx: 0, dy: 0 });
  });

  it('should return no translation for zero-length links', () => {
    const translation = helper.linkTranslation(14, { x: 10, y: 20 }, { x: 10, y: 20 });

    expect(translation).toEqual({ dx: 0, dy: 0 });
  });

  it('should translate perpendicular to a horizontal link', () => {
    const translation = helper.linkTranslation(7, { x: 0, y: 0 }, { x: 100, y: 0 });

    expect(translation.dx).toBeCloseTo(0, 6);
    expect(translation.dy).toBeCloseTo(7, 6);
  });

  it('should translate perpendicular to a vertical link', () => {
    const translation = helper.linkTranslation(7, { x: 0, y: 0 }, { x: 0, y: 100 });

    expect(translation.dx).toBeCloseTo(-7, 6);
    expect(translation.dy).toBeCloseTo(0, 6);
  });

  it('should assign symmetric offsets for odd link counts', () => {
    const links = [createLink('A', 'B'), createLink('A', 'B'), createLink('A', 'B')];

    helper.assignDataToLinks(links);

    expect(links.map((link) => link.distance)).toEqual([-14, 0, 14]);
  });

  it('should assign symmetric offsets for even link counts', () => {
    const links = [createLink('A', 'B'), createLink('A', 'B'), createLink('A', 'B'), createLink('A', 'B')];

    helper.assignDataToLinks(links);

    expect(links.map((link) => link.distance)).toEqual([-21, -7, 7, 21]);
  });

  it('should reduce spacing for bundles larger than four links', () => {
    const links = [
      createLink('A', 'B'),
      createLink('A', 'B'),
      createLink('A', 'B'),
      createLink('A', 'B'),
      createLink('A', 'B'),
    ];

    helper.assignDataToLinks(links);

    expect(links.map((link) => link.distance)).toEqual([-20, -10, 0, 10, 20]);
  });

  it('should enforce a minimum spacing floor for very dense bundles on small nodes', () => {
    const links = [
      createLink('A', 'B', 40, 40, 40, 40),
      createLink('A', 'B', 40, 40, 40, 40),
      createLink('A', 'B', 40, 40, 40, 40),
      createLink('A', 'B', 40, 40, 40, 40),
      createLink('A', 'B', 40, 40, 40, 40),
      createLink('A', 'B', 40, 40, 40, 40),
      createLink('A', 'B', 40, 40, 40, 40),
    ];

    helper.assignDataToLinks(links);

    expect(links.map((link) => link.distance)).toEqual([-18, -12, -6, 0, 6, 12, 18]);
  });

  it('should group links regardless of source/target ordering', () => {
    const linkAB = createLink('A', 'B');
    const linkBA = createLink('B', 'A');

    helper.assignDataToLinks([linkAB, linkBA]);

    expect(linkAB.distance).toBe(-7);
    expect(linkBA.distance).toBe(7);
  });

  it('should handle missing source or target without affecting valid links', () => {
    const missingSource = createLink(undefined, 'B');
    const missingTarget = createLink('A', undefined);
    const validOne = createLink('A', 'B');
    const validTwo = createLink('A', 'B');

    helper.assignDataToLinks([missingSource, missingTarget, validOne, validTwo]);

    expect(missingSource.distance).toBe(0);
    expect(missingTarget.distance).toBe(0);
    expect(validOne.distance).toBe(-7);
    expect(validTwo.distance).toBe(7);
  });

  it('should set parallelLinksCount for grouped links', () => {
    const links = [createLink('A', 'B'), createLink('A', 'B'), createLink('A', 'B')];

    helper.assignDataToLinks(links);

    expect(links.map((link) => link.parallelLinksCount)).toEqual([3, 3, 3]);
  });
});

function createNode(id: string, width?: number, height?: number): MapNode {
  return {
    id,
    width,
    height,
  } as MapNode;
}

function createLink(
  sourceId?: string,
  targetId?: string,
  sourceWidth?: number,
  sourceHeight?: number,
  targetWidth?: number,
  targetHeight?: number
): MapLink {
  const link = new MapLink();

  if (sourceId) {
    link.source = createNode(sourceId, sourceWidth, sourceHeight);
  }

  if (targetId) {
    link.target = createNode(targetId, targetWidth, targetHeight);
  }

  return link;
}