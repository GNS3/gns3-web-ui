import { MapChangeDetectorRef } from './map-change-detector-ref';

describe('MapChangeDetectorRef', () => {
  let detector: MapChangeDetectorRef;

  beforeEach(() => {
    detector = new MapChangeDetectorRef();
  });

  it('should emit event', () => {
    spyOn(detector.changesDetected, 'emit');
    detector.detectChanges();
    expect(detector.changesDetected.emit).toHaveBeenCalledWith(true);
  });
});
