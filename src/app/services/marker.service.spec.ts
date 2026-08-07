import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { MarkerService } from './marker.service';
import { HttpController } from './http-controller.service';
import { Controller } from '@models/controller';

describe('MarkerService', () => {
  let service: MarkerService;
  let mockHttpController: any;
  const mockController = { id: 1 } as Controller;
  const PROJECT_ID = 'proj-1';
  const LINK_ID = 'link-1';
  const NAME = 'arp';

  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpController = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    service = new MarkerService(mockHttpController);
  });

  describe('project-level definitions', () => {
    it('listDefinitions → GET /marker-definitions', () => {
      mockHttpController.get.mockReturnValue(of({}));
      service.listDefinitions(mockController, PROJECT_ID).subscribe();
      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        `/projects/${PROJECT_ID}/marker-definitions`
      );
      expect(mockHttpController.get).toHaveBeenCalledTimes(1);
    });

    it('createDefinition → POST /marker-definitions with body', () => {
      mockHttpController.post.mockReturnValue(of({}));
      const body = { name: NAME, bpf: 'arp', tag: 5 };
      service.createDefinition(mockController, PROJECT_ID, body).subscribe();
      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        `/projects/${PROJECT_ID}/marker-definitions`,
        body
      );
    });

    it('updateDefinition → PUT /marker-definitions/{encoded name}', () => {
      mockHttpController.put.mockReturnValue(of({}));
      const body = { name: 'a/b c', bpf: 'icmp' };
      service.updateDefinition(mockController, PROJECT_ID, 'a/b c', body).subscribe();
      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        `/projects/${PROJECT_ID}/marker-definitions/${encodeURIComponent('a/b c')}`,
        body
      );
    });

    it('deleteDefinition → DELETE /marker-definitions/{encoded name}', () => {
      mockHttpController.delete.mockReturnValue(of(undefined));
      service.deleteDefinition(mockController, PROJECT_ID, NAME).subscribe();
      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        `/projects/${PROJECT_ID}/marker-definitions/${encodeURIComponent(NAME)}`
      );
    });
  });

  describe('aggregation', () => {
    it('aggregateList → GET /markers', () => {
      mockHttpController.get.mockReturnValue(of({}));
      service.aggregateList(mockController, PROJECT_ID).subscribe();
      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        `/projects/${PROJECT_ID}/markers`
      );
    });
  });

  describe('definition pause/resume + per-marker enable', () => {
    it('pauseDefinition → POST /marker-definitions/{name}/pause with empty body', () => {
      mockHttpController.post.mockReturnValue(of(undefined));
      service.pauseDefinition(mockController, PROJECT_ID, NAME).subscribe();
      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        `/projects/${PROJECT_ID}/marker-definitions/${encodeURIComponent(NAME)}/pause`,
        {}
      );
    });

    it('resumeDefinition → POST /marker-definitions/{name}/resume with empty body', () => {
      mockHttpController.post.mockReturnValue(of(undefined));
      service.resumeDefinition(mockController, PROJECT_ID, NAME).subscribe();
      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        `/projects/${PROJECT_ID}/marker-definitions/${encodeURIComponent(NAME)}/resume`,
        {}
      );
    });

    it('setEnabled → PUT /links/{lid}/markers/{name} with {enabled}', () => {
      mockHttpController.put.mockReturnValue(of({}));
      service.setEnabled(mockController, PROJECT_ID, LINK_ID, NAME, false).subscribe();
      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        `/projects/${PROJECT_ID}/links/${LINK_ID}/markers/${encodeURIComponent(NAME)}`,
        { enabled: false }
      );
    });
  });

  describe('per-link markers (unchanged shape)', () => {
    it('list → GET /links/{lid}/markers', () => {
      mockHttpController.get.mockReturnValue(of({}));
      service.list(mockController, PROJECT_ID, LINK_ID).subscribe();
      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        `/projects/${PROJECT_ID}/links/${LINK_ID}/markers`
      );
    });

    it('create → POST /links/{lid}/markers', () => {
      mockHttpController.post.mockReturnValue(of({}));
      service.create(mockController, PROJECT_ID, LINK_ID, { bpf: 'tcp' }).subscribe();
      expect(mockHttpController.post).toHaveBeenCalledWith(
        mockController,
        `/projects/${PROJECT_ID}/links/${LINK_ID}/markers`,
        { bpf: 'tcp' }
      );
    });

    it('update → PUT /links/{lid}/markers/{name}', () => {
      mockHttpController.put.mockReturnValue(of({}));
      service.update(mockController, PROJECT_ID, LINK_ID, NAME, { bpf: 'udp' }).subscribe();
      expect(mockHttpController.put).toHaveBeenCalledWith(
        mockController,
        `/projects/${PROJECT_ID}/links/${LINK_ID}/markers/${encodeURIComponent(NAME)}`,
        { bpf: 'udp' }
      );
    });

    it('delete → DELETE /links/{lid}/markers/{name}', () => {
      mockHttpController.delete.mockReturnValue(of(undefined));
      service.delete(mockController, PROJECT_ID, LINK_ID, NAME).subscribe();
      expect(mockHttpController.delete).toHaveBeenCalledWith(
        mockController,
        `/projects/${PROJECT_ID}/links/${LINK_ID}/markers/${encodeURIComponent(NAME)}`
      );
    });
  });

  describe('error passthrough', () => {
    it('surfaces the ControllerError message untouched', () => {
      const serverError = { error: { message: 'Invalid BPF expression: foo bar' } };
      mockHttpController.post.mockReturnValue(throwError(() => serverError));
      let captured: any;
      service
        .createDefinition(mockController, PROJECT_ID, { name: NAME, bpf: 'foo bar' })
        .subscribe({ error: (err) => (captured = err) });
      expect(captured).toBe(serverError);
    });
  });
});
