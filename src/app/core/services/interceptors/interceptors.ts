import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // Obtener el token del localStorage
  const token = localStorage.getItem('auth_token');
  
  // Si existe el token, agregarlo al header
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return next(clonedRequest).pipe(
      catchError((error) => {
        // Manejar errores de autenticación
        if (error.status === 401) {
          console.error('🔒 Token inválido o expirado');
          localStorage.removeItem('auth_token');
          router.navigate(['/login']);
        }
        
        if (error.status === 403) {
          console.error('⛔ Acceso prohibido');
        }
        
        return throwError(() => error);
      })
    );
  }
  
  // Si no hay token, continuar con la petición original
  return next(req);
};