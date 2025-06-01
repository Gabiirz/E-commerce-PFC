import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { adminGuard } from './admin.guard';
import { AuthService } from '../service/authService/auth.service';

describe('adminGuard', () => {
  let guard: adminGuard;
  let authServiceMock: Partial<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceMock = {
      get currentUser$() {
        return of(null); // Valor por defecto (usuario no logueado)
      }
    };

    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        adminGuard,
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    guard = TestBed.inject(adminGuard);
  });

  it('should allow activation if user is admin', (done) => {
    spyOnProperty(authServiceMock, 'currentUser$', 'get').and.returnValue(
      of({ user_metadata: { role: 'admin' } })
    );

    guard.canActivate().subscribe(canActivate => {
      expect(canActivate).toBeTrue();
      expect(routerMock.navigate).not.toHaveBeenCalled();
      done();
    });
  });

  it('should deny activation and navigate to /login if user is not admin', (done) => {
    spyOnProperty(authServiceMock, 'currentUser$', 'get').and.returnValue(
      of({ user_metadata: { role: 'user' } })
    );

    guard.canActivate().subscribe(canActivate => {
      expect(canActivate).toBeFalse();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
      done();
    });
  });

  it('should deny activation and navigate to /login if user is null', (done) => {
    spyOnProperty(authServiceMock, 'currentUser$', 'get').and.returnValue(of(null));

    guard.canActivate().subscribe(canActivate => {
      expect(canActivate).toBeFalse();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
      done();
    });
  });
});
