import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../enviroment/enviroment';

// URLs de configuración
const RENDER_API = 'https://tu-backend.onrender.com/api';
const LOCALHOST_API = 'http://localhost:3000/api';

let usingFallback = false;

export const apiFallbackInterceptor: HttpInterceptorFn = (req, next) => {
    // Si la request no es a tu API, dejarla pasar
    if (!req.url.includes('/api/')) {
        return next(req);
    }

    // Reemplazar URL según el modo actual
    let modifiedUrl = req.url;

    if (environment.production) {
        if (usingFallback) {
            // Si estamos en modo fallback, usar localhost
            modifiedUrl = req.url.replace(RENDER_API, LOCALHOST_API);
            console.log('🔄 Usando servidor de respaldo (localhost)');
        } else {
            // Usar Render normalmente
            modifiedUrl = req.url.replace(LOCALHOST_API, RENDER_API);
        }
    }

    const modifiedReq = req.clone({ url: modifiedUrl });

    return next(modifiedReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // Si hay error de conexión y estamos en producción
            if (environment.production &&
                (error.status === 0 || error.status >= 500) &&
                !usingFallback) {

                console.error('❌ Error conectando a Render, cambiando a localhost...');
                usingFallback = true;

                // Reintentar con localhost
                const fallbackUrl = req.url.replace(RENDER_API, LOCALHOST_API);
                const fallbackReq = req.clone({ url: fallbackUrl });

                return next(fallbackReq);
            }

            return throwError(() => error);
        })
    );
};