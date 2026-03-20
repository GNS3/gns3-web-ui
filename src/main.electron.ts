import { ApplicationRef, enableProdMode } from '@angular/core';
import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// Pure AOT bootstrap
platformBrowser()
  .bootstrapModule(AppModule)
  .then((moduleRef) => {
    const applicationRef = moduleRef.injector.get(ApplicationRef);
    const componentRef = applicationRef.components[0];
  })
  .catch((err) => {
    console.error('Bootstrap error:', err);
  });
