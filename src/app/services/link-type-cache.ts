export class LinkTypeCache {
  private static readonly LINK_TYPE_PREFIX = 'gns3-link-type';
  private static readonly BEZIER_CURVINESS_PREFIX = 'gns3-bezier-curviness';
  private static readonly FLOWCHART_ROUNDNESS_PREFIX = 'gns3-flowchart-roundness';

  private static linkTypeKey(projectId: string, linkId: string): string {
    return `${LinkTypeCache.LINK_TYPE_PREFIX}:${projectId}:${linkId}`;
  }

  private static bezierCurvinessKey(projectId: string, linkId: string): string {
    return `${LinkTypeCache.BEZIER_CURVINESS_PREFIX}:${projectId}:${linkId}`;
  }

  private static flowchartRoundnessKey(projectId: string, linkId: string): string {
    return `${LinkTypeCache.FLOWCHART_ROUNDNESS_PREFIX}:${projectId}:${linkId}`;
  }

  static get(projectId?: string, linkId?: string): string | undefined {
    if (!projectId || !linkId) {
      return undefined;
    }

    try {
      const value = localStorage.getItem(LinkTypeCache.linkTypeKey(projectId, linkId));
      return value || undefined;
    } catch {
      return undefined;
    }
  }

  static set(projectId?: string, linkId?: string, linkType?: string): void {
    if (!projectId || !linkId || !linkType) {
      return;
    }

    try {
      localStorage.setItem(LinkTypeCache.linkTypeKey(projectId, linkId), linkType);
    } catch {
      // Ignore storage exceptions in restricted browsing contexts.
    }
  }

  static getBezierCurviness(projectId?: string, linkId?: string): number | undefined {
    if (!projectId || !linkId) {
      return undefined;
    }

    try {
      const value = localStorage.getItem(LinkTypeCache.bezierCurvinessKey(projectId, linkId));
      if (value === null || value === '') {
        return undefined;
      }
      const parsedValue = parseInt(value, 10);
      return Number.isNaN(parsedValue) ? undefined : parsedValue;
    } catch {
      return undefined;
    }
  }

  static setBezierCurviness(projectId?: string, linkId?: string, bezierCurviness?: number): void {
    if (!projectId || !linkId || bezierCurviness === undefined || bezierCurviness === null) {
      return;
    }

    try {
      localStorage.setItem(LinkTypeCache.bezierCurvinessKey(projectId, linkId), `${bezierCurviness}`);
    } catch {
      // Ignore storage exceptions in restricted browsing contexts.
    }
  }

  static getFlowchartRoundness(projectId?: string, linkId?: string): number | undefined {
    if (!projectId || !linkId) {
      return undefined;
    }

    try {
      const value = localStorage.getItem(LinkTypeCache.flowchartRoundnessKey(projectId, linkId));
      if (value === null || value === '') {
        return undefined;
      }
      const parsedValue = parseInt(value, 10);
      return Number.isNaN(parsedValue) ? undefined : parsedValue;
    } catch {
      return undefined;
    }
  }

  static setFlowchartRoundness(projectId?: string, linkId?: string, flowchartRoundness?: number): void {
    if (!projectId || !linkId || flowchartRoundness === undefined || flowchartRoundness === null) {
      return;
    }

    try {
      localStorage.setItem(LinkTypeCache.flowchartRoundnessKey(projectId, linkId), `${flowchartRoundness}`);
    } catch {
      // Ignore storage exceptions in restricted browsing contexts.
    }
  }

  static getStyleSnapshot(projectId?: string, linkId?: string): {
    link_type?: string;
    bezier_curviness?: number;
    flowchart_roundness?: number;
  } | undefined {
    const linkType = LinkTypeCache.get(projectId, linkId);
    const bezierCurviness = LinkTypeCache.getBezierCurviness(projectId, linkId);
    const flowchartRoundness = LinkTypeCache.getFlowchartRoundness(projectId, linkId);

    if (!linkType && bezierCurviness === undefined && flowchartRoundness === undefined) {
      return undefined;
    }

    return {
      link_type: linkType,
      bezier_curviness: bezierCurviness,
      flowchart_roundness: flowchartRoundness,
    };
  }

  static remove(projectId?: string, linkId?: string): void {
    if (!projectId || !linkId) {
      return;
    }

    try {
      localStorage.removeItem(LinkTypeCache.linkTypeKey(projectId, linkId));
      localStorage.removeItem(LinkTypeCache.bezierCurvinessKey(projectId, linkId));
      localStorage.removeItem(LinkTypeCache.flowchartRoundnessKey(projectId, linkId));
    } catch {
      // Ignore storage exceptions in restricted browsing contexts.
    }
  }
}
