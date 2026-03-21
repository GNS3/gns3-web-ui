import '@angular/compiler';
import { importProvidersFrom, enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { enableDebugTools } from '@angular/platform-browser';
import { AppModule } from './app/app.module';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(AppModule),
  ]
}).then((appRef) => {
  // allows to run `ng.profiler.timeChangeDetection();`
  enableDebugTools(appRef.components[0]);
}).catch((err) => console.log(err));