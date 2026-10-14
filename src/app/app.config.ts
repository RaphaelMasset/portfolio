import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // eventCoalescing : Angular groupe plusieurs events dans un même cycle de détection,
    // utile ici parce que la molette envoie des dizaines d’événements par geste.
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes)
  ]
};
