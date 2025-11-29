import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';
import { NotificationInterceptorService } from './app/core/services/noti-user-interceptor/noti-user-interceptor';


bootstrapApplication(AppComponent, appConfig)
  .then(appRef => {
    // Inicializar interceptor de notificaciones
    const notifInterceptor = appRef.injector.get(NotificationInterceptorService);
    notifInterceptor.solicitarPermisos();
    console.log('NotificationInterceptor inicializado');
  })
  .catch((err) => console.error(err));
