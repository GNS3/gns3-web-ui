import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpController } from './http-controller.service';
import { Controller } from '@models/controller';
import {
  AiProfile,
  AiProfilesResponse,
  SetActiveProfileRequest,
  CreateProfileRequest,
  UpdateProfileRequest
} from '@models/ai-profile';

/**
 * Service for managing AI model profiles
 */
@Injectable({
  providedIn: 'root'
})
export class AiProfilesService {

  constructor(private httpController: HttpController) {}

  /**
   * Get all profiles for a user
   * GET /v3/access/users/{user_id}/profiles
   */
  getProfiles(controller: Controller, userId: string): Observable<AiProfilesResponse> {
    return this.httpController.get<AiProfilesResponse>(
      controller,
      `/access/users/${userId}/profiles`
    ).pipe(
      catchError(error => {
        console.error('Failed to get profiles:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get active profile for a user
   * GET /v3/access/users/{user_id}/profiles/active
   */
  getActiveProfile(controller: Controller, userId: string): Observable<AiProfile> {
    return this.httpController.get<AiProfile>(
      controller,
      `/access/users/${userId}/profiles/active`
    ).pipe(
      catchError(error => {
        console.error('Failed to get active profile:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new profile
   * POST /v3/access/users/{user_id}/profiles
   */
  createProfile(
    controller: Controller,
    userId: string,
    profile: CreateProfileRequest
  ): Observable<AiProfile> {
    return this.httpController.post<AiProfile>(
      controller,
      `/access/users/${userId}/profiles`,
      profile
    ).pipe(
      catchError(error => {
        console.error('Failed to create profile:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update a profile
   * PUT /v3/access/users/{user_id}/profiles/{profile_name}
   */
  updateProfile(
    controller: Controller,
    userId: string,
    profileName: string,
    updates: UpdateProfileRequest
  ): Observable<AiProfile> {
    return this.httpController.put<AiProfile>(
      controller,
      `/access/users/${userId}/profiles/${profileName}`,
      updates
    ).pipe(
      catchError(error => {
        console.error('Failed to update profile:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Set active profile
   * PUT /v3/access/users/{user_id}/profiles/active
   */
  setActiveProfile(
    controller: Controller,
    userId: string,
    request: SetActiveProfileRequest
  ): Observable<AiProfilesResponse> {
    return this.httpController.put<AiProfilesResponse>(
      controller,
      `/access/users/${userId}/profiles/active`,
      request
    ).pipe(
      catchError(error => {
        console.error('Failed to set active profile:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a profile
   * DELETE /v3/access/users/{user_id}/profiles/{profile_name}
   */
  deleteProfile(
    controller: Controller,
    userId: string,
    profileName: string
  ): Observable<void> {
    return this.httpController.delete<void>(
      controller,
      `/access/users/${userId}/profiles/${profileName}`
    ).pipe(
      catchError(error => {
        console.error('Failed to delete profile:', error);
        return throwError(() => error);
      })
    );
  }

  /* ==================== Group Profile Methods ==================== */

  /**
   * Get all profiles for a group
   * GET /v3/access/groups/{group_id}/profiles
   */
  getGroupProfiles(controller: Controller, groupId: string): Observable<AiProfilesResponse> {
    return this.httpController.get<AiProfilesResponse>(
      controller,
      `/access/groups/${groupId}/profiles`
    ).pipe(
      catchError(error => {
        console.error('Failed to get group profiles:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get active profile for a group
   * GET /v3/access/groups/{group_id}/profiles/active
   */
  getActiveGroupProfile(controller: Controller, groupId: string): Observable<AiProfile> {
    return this.httpController.get<AiProfile>(
      controller,
      `/access/groups/${groupId}/profiles/active`
    ).pipe(
      catchError(error => {
        console.error('Failed to get active group profile:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new group profile
   * POST /v3/access/groups/{group_id}/profiles
   */
  createGroupProfile(
    controller: Controller,
    groupId: string,
    profile: CreateProfileRequest
  ): Observable<AiProfile> {
    return this.httpController.post<AiProfile>(
      controller,
      `/access/groups/${groupId}/profiles`,
      profile
    ).pipe(
      catchError(error => {
        console.error('Failed to create group profile:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update a group profile
   * PUT /v3/access/groups/{group_id}/profiles/{profile_name}
   */
  updateGroupProfile(
    controller: Controller,
    groupId: string,
    profileName: string,
    updates: UpdateProfileRequest
  ): Observable<AiProfile> {
    return this.httpController.put<AiProfile>(
      controller,
      `/access/groups/${groupId}/profiles/${profileName}`,
      updates
    ).pipe(
      catchError(error => {
        console.error('Failed to update group profile:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Set active group profile
   * PUT /v3/access/groups/{group_id}/profiles/active
   */
  setActiveGroupProfile(
    controller: Controller,
    groupId: string,
    request: SetActiveProfileRequest
  ): Observable<AiProfilesResponse> {
    return this.httpController.put<AiProfilesResponse>(
      controller,
      `/access/groups/${groupId}/profiles/active`,
      request
    ).pipe(
      catchError(error => {
        console.error('Failed to set active group profile:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a group profile
   * DELETE /v3/access/groups/{group_id}/profiles/{profile_name}
   */
  deleteGroupProfile(
    controller: Controller,
    groupId: string,
    profileName: string
  ): Observable<void> {
    return this.httpController.delete<void>(
      controller,
      `/access/groups/${groupId}/profiles/${profileName}`
    ).pipe(
      catchError(error => {
        console.error('Failed to delete group profile:', error);
        return throwError(() => error);
      })
    );
  }
}
