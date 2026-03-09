# Interceptors Directory - Code Review Documentation

---

**Document Generated**: 2026-03-07
**Review Tool**: Claude Code (Sonnet 4.5)
**Review Scope**: src/app/interceptors/ (HTTP Interceptors)

---

## Overview

This directory contains Angular HTTP interceptors that handle HTTP requests and responses, including authentication, token management, and more.

---

## Module Functions

### Interceptor Files

#### **http.interceptor.ts**
**Type**: HTTP Interceptor

**Functions**:
- Intercept all HTTP requests and responses
- Add controller ID to request headers
- Handle authentication errors (401/403)
- Automatic token refresh (currently commented out)
- Manage token refresh state

**Implementation Details**:
- Use RxJS operators to handle requests/responses
- Read controller ID from localStorage
- Handle token refresh flow
- Redirect to login when refresh fails

---

## Issues Found

### 🔴 Critical Security Issues

#### 1. **Authentication Error Handling is Disabled**
**File**: `http.interceptor.ts:15-19`

**Problem Description**:
```typescript
// if (err.status === 401 || err.status === 403) {
//   // Authentication error handling is commented out!
// }
```

**Impact**:
- **Unauthorized users may access protected resources**
- 401/403 errors are not caught and handled
- Users are not redirected to login when token expires
- **Serious security vulnerability**

**Recommendation**:
```typescript
intercept(
  req: HttpRequest<any>,
  next: HttpHandler
): Observable<HttpEvent<any>> {
  return next.handle(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Uncomment and fix immediately
      if (err.status === 401 || err.status === 403) {
        return this.handleAuthError(req, next);
      }

      // Other error handling
      return throwError(() => err);
    })
  );
}

private handleAuthError(
  req: HttpRequest<any>,
  next: HttpHandler
): Observable<HttpEvent<any>> {
  // Check if already refreshing token
  if (this.isRefreshing) {
    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        // Retry request with new token
        const cloned = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next.handle(cloned);
      })
    );
  }

  // Start token refresh
  this.isRefreshing = true;
  this.refreshTokenSubject.next(null);

  return this.authService.refreshToken().pipe(
    switchMap((response: any) => {
      this.isRefreshing = false;
      const newToken = response.token;
      this.refreshTokenSubject.next(newToken);

      // Retry original request
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${newToken}`
        }
      });
      return next.handle(cloned);
    }),
    catchError(error => {
      this.isRefreshing = false;
      // Refresh failed, redirect to login
      this.authService.logout();
      this.router.navigate(['/login']);
      return throwError(() => error);
    })
  );
}
```

#### 2. **No Error Handling for localStorage Operations**
**File**: `http.interceptor.ts:25`

**Problem Description**:
```typescript
const controller_id = JSON.parse(localStorage.getItem(`controller_${id}`));
// No try-catch!
```

**Risk**:
- localStorage data may be tampered with
- JSON.parse may throw exceptions
- Could cause the entire interceptor to fail

**Recommendation**:
```typescript
function getControllerId(id: string): string | null {
  try {
    const item = localStorage.getItem(`controller_${id}`);
    if (!item) {
      return null;
    }
    const data = JSON.parse(item);
    // Validate data structure
    if (data && typeof data === 'object' && 'controller_id' in data) {
      return data.controller_id;
    }
    return null;
  } catch (error) {
    console.error('Error reading controller ID from localStorage:', error);
    return null;
  }
}
```

#### 3. **Missing Null Check**
**File**: `http.interceptor.ts:27`

**Problem Description**:
```typescript
clone.set({
  setHeaders: {
    'Controller-ID': controller_id  // Could be null!
  }
});
```

**Recommendation**:
```typescript
const controllerId = this.getControllerId(id);

if (controllerId) {
  clone = clone.clone({
    setHeaders: {
      'Controller-ID': controllerId
    }
  });
}
```

---

### 🟠 Code Quality Issues

#### 1. **Using location.reload()**
**File**: `http.interceptor.ts:44`

**Problem Description**:
```typescript
location.reload();  // Crude method
```

**Issues**:
- Causes entire page reload
- Loses application state
- Poor user experience

**Recommendation**:
```typescript
// Use Angular Router
constructor(private router: Router) {}

// In error handling
this.router.navigate(['/login'], {
  queryParams: {
    reason: 'session_expired',
    redirect: this.router.url
  }
});
```

#### 2. **Empty Error Handling**
**File**: `http.interceptor.ts:40-41`

**Problem Description**:
```typescript
catchError((e) => {
  return throwError(() => e);  // Just re-throws, doesn't add any value
})
```

**Recommendation**:
```typescript
catchError((error: HttpErrorResponse) => {
  // Log the error
  console.error('HTTP error:', {
    status: error.status,
    url: error.url,
    message: error.message
  });

  // Show user-friendly messages
  if (error.status === 0) {
    this.toasterService.showError('Network error. Please check your connection.');
  } else if (error.status >= 500) {
    this.toasterService.showError('Server error. Please try again later.');
  }

  return throwError(() => error);
})
```

#### 3. **Hardcoded Status Codes**
**File**: `http.interceptor.ts`

**Problem Description**:
```typescript
if (err.status === 401 || err.status === 403) {
  // Magic numbers
}
```

**Recommendation**:
```typescript
// http-status.constants.ts
export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

// In interceptor, use it
import { HTTP_STATUS } from './http-status.constants';

if (err.status === HTTP_STATUS.UNAUTHORIZED || err.status === HTTP_STATUS.FORBIDDEN) {
  // ...
}
```

---

### 🟡 Best Practices Violations

#### 1. **Missing Dependency Injection**
**File**: `http.interceptor.ts`

**Problem Description**:
```typescript
export class HttpInterceptor implements HttpInterceptor {
  intercept(...) { ... }
}
```

**Issues**:
- No injection of Router, ToasterService, etc.
- Using `location.reload()` instead of Angular Router

**Recommendation**:
```typescript
@Injectable()
export class HttpInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private toasterService: ToasterService,
    private authService: AuthService,
    private logger: LoggingService
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Now can inject services
  }
}
```

#### 2. **Mixing async/await and RxJS**
**File**: `http.interceptor.ts`

**Problem Description**:
- Using async/await in Observable context
- May cause unpredictable behavior

**Recommendation**:
```typescript
// Use RxJS entirely
intercept(
  req: HttpRequest<any>,
  next: HttpHandler
): Observable<HttpEvent<any>> {
  return next.handle(req).pipe(
    catchError((error: HttpErrorResponse) => {
      return this.handleError(error, req, next);
    })
  );
}

private handleError(
  error: HttpErrorResponse,
  req: HttpRequest<any>,
  next: HttpHandler
): Observable<HttpEvent<any>> {
  if (error.status === 401 || error.status === 403) {
    return this.handleAuthError(req, next);
  }
  return throwError(() => error);
}
```

#### 3. **Missing Request Retry Logic**
**Impact**: When network is unstable

**Recommendation**:
```typescript
import { retryWhen, delay, take } from 'rxjs/operators';

intercept(
  req: HttpRequest<any>,
  next: HttpHandler
): Observable<HttpEvent<any>> {
  return next.handle(req).pipe(
    retryWhen(errors =>
      errors.pipe(
        mergeMap(error => {
          // Don't retry 4xx errors (except 429)
          if (error.status >= 400 && error.status < 500 && error.status !== 429) {
            return throwError(() => error);
          }
          return of(error);
        }),
        delay(1000),  // Wait 1 second
        take(3)  // Retry up to 3 times
      )
    ),
    catchError((error: HttpErrorResponse) => {
      return this.handleError(error, req, next);
    })
  );
}
```

---

## Recommendations

### Priority 1 - Immediate Actions

#### 1. Enable Authentication Error Handling
```typescript
// http.interceptor.ts
intercept(
  req: HttpRequest<any>,
  next: HttpHandler
): Observable<HttpEvent<any>> {
  return next.handle(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Uncomment and fix immediately
      if (err.status === 401 || err.status === 403) {
        return this.handleAuthError(req, next);
      }

      // Log all errors
      this.logger.error('HTTP Error', {
        status: err.status,
        url: err.url,
        message: err.message
      });

      return throwError(() => err);
    })
  );
}
```

#### 2. Add localStorage Error Handling
```typescript
private getControllerId(id: string): string | null {
  try {
    const item = localStorage.getItem(`controller_${id}`);
    if (!item) return null;

    const data = JSON.parse(item);

    // Validate data
    if (!data || typeof data !== 'object') {
      console.warn('Invalid controller data in localStorage');
      return null;
    }

    return data.controller_id || null;
  } catch (error) {
    console.error('Error reading controller ID:', error);
    return null;
  }
}
```

#### 3. Replace location.reload()
```typescript
// Delete
location.reload();

// Replace with
this.router.navigate(['/login'], {
  queryParams: { session: 'expired' }
});
```

### Priority 2 - Short-term Improvements

#### 1. Implement Complete Token Refresh
```typescript
@Injectable()
export class HttpInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private router: Router,
    private authService: AuthService,
    private toasterService: ToasterService
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Add token to request
    const authReq = this.addToken(req);

    return next.handle(authReq).pipe(
      catchError(error => {
        if (error.status === 401 && !authReq.url.includes('refresh')) {
          return this.handleAuthError(authReq, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(req: HttpRequest<any>): HttpRequest<any> {
    const token = this.authService.getToken();
    if (token) {
      return req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return req;
  }

  private handleAuthError(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap(token => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(token);
          return next.handle(this.addToken(req));
        }),
        catchError(error => {
          this.isRefreshing = false;
          this.authService.logout();
          this.router.navigate(['/login']);
          return throwError(() => error);
        })
      );
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next.handle(this.addToken(req)))
    );
  }
}
```

#### 2. Add Request Logging (Development Only)
```typescript
intercept(
  req: HttpRequest<any>,
  next: HttpHandler
): Observable<HttpEvent<any>> {
  if (!environment.production) {
    console.log('HTTP Request:', {
      url: req.url,
      method: req.method,
      headers: req.headers.keys()
    });
  }

  return next.handle(req).pipe(
    tap(event => {
      if (!environment.production && event instanceof HttpResponse) {
        console.log('HTTP Response:', {
          url: event.url,
          status: event.status
        });
      }
    })
  );
}
```

### Priority 3 - Long-term Improvements

#### 1. Create Multiple Specialized Interceptors
```typescript
// auth.interceptor.ts - Handle authentication specifically
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Token logic
  }
}

// controller-id.interceptor.ts - Handle controller ID specifically
@Injectable()
export class ControllerIdInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Controller ID logic
  }
}

// error-handling.interceptor.ts - Handle errors specifically
@Injectable()
export class ErrorHandlingInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Error handling logic
  }
}

// logging.interceptor.ts - Handle logging specifically
@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Logging logic
  }
}

// Register in order in app.module.ts
providers: [
  { provide: HTTP_INTERCEPTORS, useClass: LoggingInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: ControllerIdInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: ErrorHandlingInterceptor, multi: true }
]
```

#### 2. Add Request Cancellation Support
```typescript
@Injectable()
export class HttpInterceptor implements HttpInterceptor {
  private pendingRequests = new Map<string, Subscription>();

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const key = req.url + req.params.toString();

    // Cancel duplicate pending requests
    if (this.pendingRequests.has(key)) {
      this.pendingRequests.get(key)?.unsubscribe();
      this.pendingRequests.delete(key);
    }

    const subscription = next.handle(req).subscribe();
    this.pendingRequests.set(key, subscription);

    return next.handle(req).pipe(
      finalize(() => {
        this.pendingRequests.delete(key);
      })
    );
  }
}
```

---

## Testing Recommendations

### Unit Tests
```typescript
describe('HttpInterceptor', () => {
  let interceptor: HttpInterceptor;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getToken', 'refreshToken', 'logout']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HttpInterceptor,
        { provide: AuthService, useValue: authSpy }
      ]
    });

    interceptor = TestBed.inject(HttpInterceptor);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as any;
  });

  it('should add auth token to request', () => {
    authService.getToken.and.returnValue('test-token');

    interceptor.intercept(
      new HttpRequest('GET', '/api/test'),
      TestBed.inject(HttpHandler)
    ).subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('should handle 401 errors', () => {
    // Test token refresh logic
  });
});
```

---

## Security Checklist

- [ ] Enable 401/403 error handling
- [ ] Add error handling for localStorage operations
- [ ] Store tokens in secure location (consider httpOnly cookies)
- [ ] Implement CSRF protection
- [ ] Validate token format and expiration
- [ ] Don't log sensitive information
- [ ] Implement appropriate timeouts
- [ ] Validate server responses
