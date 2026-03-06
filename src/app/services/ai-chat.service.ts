import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, Observer, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap, finalize } from 'rxjs/operators';
import { HttpController } from './http-controller.service';
import { Controller } from '@models/controller';
import {
  ChatEvent,
  ChatSession,
  ConversationHistory,
  ChatRequest,
  RenameSessionRequest,
  ChatErrorType,
  ChatError
} from '@models/ai-chat.interface';

/**
 * AI Chat Service
 * Handles all interactions with GNS3 Copilot Chat API
 */
@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private currentProjectId: string | null = null;
  private currentSessionId: string | null = null;
  private isStreaming = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private httpController: HttpController
  ) {}

  /**
   * Stream chat
   * POST /v3/projects/{project_id}/chat/stream
   * @param controller Controller
   * @param projectId Project ID
   * @param request Chat request
   * @returns SSE event stream
   */
  streamChat(controller: Controller, projectId: string, request: ChatRequest): Observable<ChatEvent> {
    this.currentProjectId = projectId;
    this.isStreaming.next(true);

    const url = `${this.getControllerUrl(controller)}/projects/${projectId}/chat/stream`;

    const httpOptions = {
      headers: this.getAuthHeaders(controller)
    };

    return new Observable<ChatEvent>((observer) => {
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...httpOptions.headers as Record<string, string>
        },
        body: JSON.stringify(request)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const processStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                observer.complete();
                break;
              }

              // Decode and add to buffer
              buffer += decoder.decode(value, { stream: true });

              // Process complete lines from buffer
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // Keep incomplete line

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim();

                  if (data) {
                    try {
                      const event: ChatEvent = JSON.parse(data);

                      // Skip heartbeat messages
                      if (event.type === 'heartbeat') {
                        continue;
                      }

                      // Update current session ID
                      if (event.session_id) {
                        this.currentSessionId = event.session_id;
                      }

                      observer.next(event);

                      // Check if done
                      if (event.type === 'done' || event.type === 'error') {
                        observer.complete();
                        break;
                      }
                    } catch (e) {
                      console.error('Failed to parse SSE data:', data, e);
                    }
                  }
                }
              }

              // Exit loop if completed
              if (observer.closed) {
                break;
              }
            }
          } catch (error) {
            console.error('Stream processing error:', error);
            observer.error(error);
          } finally {
            reader.cancel();
          }
        };

        processStream();
      })
      .catch(error => {
        console.error('Fetch error:', error);
        observer.error(this.createChatError(error));
      })
      .finally(() => {
        this.isStreaming.next(false);
      });

      // Return cleanup function
      return () => {
        this.isStreaming.next(false);
      };
    }).pipe(
      catchError(error => {
        this.isStreaming.next(false);
        return throwError(() => this.createChatError(error));
      })
    );
  }

  /**
   * Get sessions list
   * GET /v3/projects/{project_id}/chat/sessions
   * @param controller Controller
   * @param projectId Project ID
   * @returns Sessions list
   */
  getSessions(controller: Controller, projectId: string): Observable<ChatSession[]> {
    return this.httpController.get<ChatSession[]>(
      controller,
      `/projects/${projectId}/chat/sessions`
    ).pipe(
      catchError(error => {
        console.error('Failed to get sessions:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get session history
   * GET /v3/projects/{project_id}/chat/sessions/{session_id}/history
   * @param controller Controller
   * @param projectId Project ID
   * @param sessionId Session ID
   * @param limit Maximum message count (default 100)
   * @returns Session history
   */
  getSessionHistory(
    controller: Controller,
    projectId: string,
    sessionId: string,
    limit: number = 100
  ): Observable<ConversationHistory> {
    const params = limit ? { limit } : undefined;

    return this.httpController.get<ConversationHistory>(
      controller,
      `/projects/${projectId}/chat/sessions/${sessionId}/history`
    ).pipe(
      catchError(error => {
        console.error('Failed to get session history:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Rename session
   * PATCH /v3/projects/{project_id}/chat/sessions/{session_id}
   * @param controller Controller
   * @param projectId Project ID
   * @param sessionId Session ID
   * @param title New title
   * @returns Updated session
   */
  renameSession(
    controller: Controller,
    projectId: string,
    sessionId: string,
    title: string
  ): Observable<ChatSession> {
    const request: RenameSessionRequest = { title };

    return this.httpController.patch<ChatSession>(
      controller,
      `/projects/${projectId}/chat/sessions/${sessionId}`,
      request
    ).pipe(
      catchError(error => {
        console.error('Failed to rename session:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete session
   * DELETE /v3/projects/{project_id}/chat/sessions/{session_id}
   * @param controller Controller
   * @param projectId Project ID
   * @param sessionId Session ID
   * @returns void
   */
  deleteSession(
    controller: Controller,
    projectId: string,
    sessionId: string
  ): Observable<void> {
    return this.httpController.delete<void>(
      controller,
      `/projects/${projectId}/chat/sessions/${sessionId}`
    ).pipe(
      catchError(error => {
        console.error('Failed to delete session:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Pin session
   * PUT /v3/projects/{project_id}/chat/sessions/{session_id}/pin
   * @param controller Controller
   * @param projectId Project ID
   * @param sessionId Session ID
   * @returns Updated session
   */
  pinSession(
    controller: Controller,
    projectId: string,
    sessionId: string
  ): Observable<ChatSession> {
    return this.httpController.put<ChatSession>(
      controller,
      `/projects/${projectId}/chat/sessions/${sessionId}/pin`,
      null
    ).pipe(
      catchError(error => {
        console.error('Failed to pin session:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Unpin session
   * DELETE /v3/projects/{project_id}/chat/sessions/{session_id}/pin
   * @param controller Controller
   * @param projectId Project ID
   * @param sessionId Session ID
   * @returns Updated session
   */
  unpinSession(
    controller: Controller,
    projectId: string,
    sessionId: string
  ): Observable<ChatSession> {
    return this.httpController.delete<ChatSession>(
      controller,
      `/projects/${projectId}/chat/sessions/${sessionId}/pin`
    ).pipe(
      catchError(error => {
        console.error('Failed to unpin session:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current streaming state
   * @returns Whether currently streaming
   */
  getStreamingState(): Observable<boolean> {
    return this.isStreaming.asObservable();
  }

  /**
   * Get current session ID
   * @returns Current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Reset current session
   */
  resetCurrentSession(): void {
    this.currentSessionId = null;
    this.currentProjectId = null;
  }

  /**
   * Get controller URL
   * @param controller Controller
   * @returns Full URL
   */
  private getControllerUrl(controller: Controller): string {
    const protocol = controller.protocol === ControllerProtocol.https ? 'https' : 'http';
    return `${protocol}://${controller.host}:${controller.port}`;
  }

  /**
   * Get auth headers
   * @param controller Controller
   * @returns HTTP headers
   */
  private getAuthHeaders(controller: Controller): HttpHeaders {
    const headers = new HttpHeaders();

    if (controller.user && controller.password) {
      // Basic auth
      const auth = btoa(`${controller.user}:${controller.password}`);
      return headers.set('Authorization', `Basic ${auth}`);
    }

    // Use Bearer token if JWT token is available
    if ((controller as any).token) {
      return headers.set('Authorization', `Bearer ${(controller as any).token}`);
    }

    return headers;
  }

  /**
   * Create chat error object
   * @param error Original error
   * @returns Chat error
   */
  private createChatError(error: any): ChatError {
    if (error.status === 401) {
      return {
        type: ChatErrorType.UNAUTHORIZED,
        message: 'Unauthorized access',
        details: error
      };
    }

    if (error.status === 404) {
      return {
        type: ChatErrorType.SESSION_NOT_FOUND,
        message: 'Session not found',
        details: error
      };
    }

    if (error.message && error.message.includes('fetch')) {
      return {
        type: ChatErrorType.NETWORK_ERROR,
        message: 'Network connection failed',
        details: error
      };
    }

    return {
      type: ChatErrorType.UNKNOWN_ERROR,
      message: error.message || 'Unknown error',
      details: error
    };
  }
}
