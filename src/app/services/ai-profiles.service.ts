import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpController } from './http-controller.service';
import { Controller } from '@models/controller';
import {
  LLMModelConfigResponse,
  LLMModelConfigInheritedResponse,
  LLMModelConfigListResponse,
  CreateLLMModelConfigRequest,
  UpdateLLMModelConfigRequest
} from '@models/ai-profile';

/**
 * Service for managing LLM model configurations
 */
@Injectable({
  providedIn: 'root'
})
export class AiProfilesService {

  constructor(private httpController: HttpController) {}

  /* ==================== User Configuration Methods ==================== */

  /**
   * Get user's effective configurations (own + inherited from groups)
   * GET /v3/access/users/{user_id}/llm-model-configs
   */
  getConfigs(controller: Controller, userId: string): Observable<LLMModelConfigInheritedResponse> {
    return this.httpController.get<LLMModelConfigInheritedResponse>(
      controller,
      `/access/users/${userId}/llm-model-configs`
    ).pipe(
      catchError(error => {
        console.error('Failed to get user configs:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get user's own configurations only (no inheritance)
   * GET /v3/access/users/{user_id}/llm-model-configs/own
   */
  getOwnConfigs(controller: Controller, userId: string): Observable<LLMModelConfigListResponse> {
    return this.httpController.get<LLMModelConfigListResponse>(
      controller,
      `/access/users/${userId}/llm-model-configs/own`
    ).pipe(
      catchError(error => {
        console.error('Failed to get user own configs:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get user's default configuration
   * GET /v3/access/users/{user_id}/llm-model-configs/default
   */
  getDefaultConfig(controller: Controller, userId: string): Observable<LLMModelConfigResponse> {
    return this.httpController.get<LLMModelConfigResponse>(
      controller,
      `/access/users/${userId}/llm-model-configs/default`
    ).pipe(
      catchError(error => {
        console.error('Failed to get default config:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new user configuration
   * POST /v3/access/users/{user_id}/llm-model-configs
   */
  createConfig(
    controller: Controller,
    userId: string,
    config: CreateLLMModelConfigRequest
  ): Observable<LLMModelConfigResponse> {
    return this.httpController.post<LLMModelConfigResponse>(
      controller,
      `/access/users/${userId}/llm-model-configs`,
      config
    ).pipe(
      catchError(error => {
        console.error('Failed to create config:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update a user configuration
   * PUT /v3/access/users/{user_id}/llm-model-configs/{config_id}
   */
  updateConfig(
    controller: Controller,
    userId: string,
    configId: string,
    updates: UpdateLLMModelConfigRequest
  ): Observable<LLMModelConfigResponse> {
    return this.httpController.put<LLMModelConfigResponse>(
      controller,
      `/access/users/${userId}/llm-model-configs/${configId}`,
      updates
    ).pipe(
      catchError(error => {
        console.error('Failed to update config:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a user configuration
   * DELETE /v3/access/users/{user_id}/llm-model-configs/{config_id}
   */
  deleteConfig(
    controller: Controller,
    userId: string,
    configId: string
  ): Observable<void> {
    return this.httpController.delete<void>(
      controller,
      `/access/users/${userId}/llm-model-configs/${configId}`
    ).pipe(
      catchError(error => {
        console.error('Failed to delete config:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Set default configuration for a user
   * PUT /v3/access/users/{user_id}/llm-model-configs/default/{config_id}
   */
  setDefaultConfig(
    controller: Controller,
    userId: string,
    configId: string
  ): Observable<LLMModelConfigResponse> {
    return this.httpController.put<LLMModelConfigResponse>(
      controller,
      `/access/users/${userId}/llm-model-configs/default/${configId}`,
      {}
    ).pipe(
      catchError(error => {
        console.error('Failed to set default config:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Unset default configuration for a user
   * PUT /v3/access/users/{user_id}/llm-model-configs/{config_id} with is_default: false
   */
  unsetDefaultConfig(
    controller: Controller,
    userId: string,
    configId: string
  ): Observable<LLMModelConfigResponse> {
    return this.httpController.put<LLMModelConfigResponse>(
      controller,
      `/access/users/${userId}/llm-model-configs/${configId}`,
      { is_default: false }
    ).pipe(
      catchError(error => {
        console.error('Failed to unset default config:', error);
        return throwError(() => error);
      })
    );
  }

  /* ==================== Group Configuration Methods ==================== */

  /**
   * Get all group configurations
   * GET /v3/access/groups/{group_id}/llm-model-configs
   */
  getGroupConfigs(controller: Controller, groupId: string): Observable<LLMModelConfigListResponse> {
    return this.httpController.get<LLMModelConfigListResponse>(
      controller,
      `/access/groups/${groupId}/llm-model-configs`
    ).pipe(
      catchError(error => {
        console.error('Failed to get group configs:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get group's default configuration
   * GET /v3/access/groups/{group_id}/llm-model-configs/default
   */
  getDefaultGroupConfig(controller: Controller, groupId: string): Observable<LLMModelConfigResponse> {
    return this.httpController.get<LLMModelConfigResponse>(
      controller,
      `/access/groups/${groupId}/llm-model-configs/default`
    ).pipe(
      catchError(error => {
        console.error('Failed to get default group config:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new group configuration
   * POST /v3/access/groups/{group_id}/llm-model-configs
   */
  createGroupConfig(
    controller: Controller,
    groupId: string,
    config: CreateLLMModelConfigRequest
  ): Observable<LLMModelConfigResponse> {
    return this.httpController.post<LLMModelConfigResponse>(
      controller,
      `/access/groups/${groupId}/llm-model-configs`,
      config
    ).pipe(
      catchError(error => {
        console.error('Failed to create group config:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update a group configuration
   * PUT /v3/access/groups/{group_id}/llm-model-configs/{config_id}
   */
  updateGroupConfig(
    controller: Controller,
    groupId: string,
    configId: string,
    updates: UpdateLLMModelConfigRequest
  ): Observable<LLMModelConfigResponse> {
    return this.httpController.put<LLMModelConfigResponse>(
      controller,
      `/access/groups/${groupId}/llm-model-configs/${configId}`,
      updates
    ).pipe(
      catchError(error => {
        console.error('Failed to update group config:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a group configuration
   * DELETE /v3/access/groups/{group_id}/llm-model-configs/{config_id}
   */
  deleteGroupConfig(
    controller: Controller,
    groupId: string,
    configId: string
  ): Observable<void> {
    return this.httpController.delete<void>(
      controller,
      `/access/groups/${groupId}/llm-model-configs/${configId}`
    ).pipe(
      catchError(error => {
        console.error('Failed to delete group config:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Set default configuration for a group
   * PUT /v3/access/groups/{group_id}/llm-model-configs/default/{config_id}
   */
  setDefaultGroupConfig(
    controller: Controller,
    groupId: string,
    configId: string
  ): Observable<LLMModelConfigResponse> {
    return this.httpController.put<LLMModelConfigResponse>(
      controller,
      `/access/groups/${groupId}/llm-model-configs/default/${configId}`,
      {}
    ).pipe(
      catchError(error => {
        console.error('Failed to set default group config:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Unset default configuration for a group
   * PUT /v3/access/groups/{group_id}/llm-model-configs/{config_id} with is_default: false
   */
  unsetDefaultGroupConfig(
    controller: Controller,
    groupId: string,
    configId: string
  ): Observable<LLMModelConfigResponse> {
    return this.httpController.put<LLMModelConfigResponse>(
      controller,
      `/access/groups/${groupId}/llm-model-configs/${configId}`,
      { is_default: false }
    ).pipe(
      catchError(error => {
        console.error('Failed to unset default group config:', error);
        return throwError(() => error);
      })
    );
  }
}
