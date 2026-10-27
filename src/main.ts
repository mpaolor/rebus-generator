import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/rebus_bestemmie_generator';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
