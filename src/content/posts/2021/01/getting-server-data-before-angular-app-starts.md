---
title: "Getting Server Data before Angular App Starts"
excerpt: "For an application that I’m building out with .NET Core and Angular 11, I have the need to query the server at application startup to…"
date: "2021-01-10T16:32:03"
author: "Jamie Nordmeyer"
featuredImage: null
featuredImageAlt: ""
wpLink: "/2021/01/10/getting-server-data-before-angular-app-starts/"
categories:
  - name: "Angular"
    slug: "angular"
tags:
  - name: "angular"
    slug: "angular"
  - name: "bootstrap"
    slug: "bootstrap"
---

For an application that I’m building out with.NET Core and Angular 11, I have the need to query the server at application startup to determine if the application has ever been run before. When the owner of the application uses the site for the first time, the back-end code checks to see if there’s an Administrator account in the system. If not, then it assumes that the application has never been run, and takes the user to a First Run screen. Here, the user will create the admin password, and after it has been strength checked, the Administrator account is created with this new password.

I’m also using [NgRx](https://ngrx.io/) in this application for state management. At first, I was trying to do this work through the NgRx store. This worked but felt like overkill. I really only need to know if the Administrator account exists as the application is bootstrapping, and after that, I no longer care about that data, so it doesn’t make sense to keep it in the global store. So where’s the best place to do this then?

## APP\_INITIALIZER

In researching this scenario, I came across the [APP\_INITIALIZER](https://angular.io/api/core/APP_INITIALIZER) injection token. A provider registered with this token will be executed as the application is bootstrapping, which means that it will run BEFORE any of the visual elements of the application begin to process. By returning a promise, you can temporarily halt bootstrapping of the application until the promise is resolved or rejected.

What I did was to make a service call back to my.NET Core back end to ask for the Administrator account, and if I don’t find it, I then redirect the user to the First Run screen where they can create the Administrator password.

I created the code in the Core module, as this code is part of the core functionality of the application, and isn’t required anywhere outside of bootstrapping. Here, then, is what my Core module looks like, with an explanation to follow:

```typescript
import { APP_INITIALIZER, NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { throwIfAlreadyLoaded } from '../singleton-module';
import { BootstrapService } from './services/bootstrap/bootstrap.service';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [BootstrapService, Router],
      useFactory: (bootstrapService: BootstrapService, router: Router) => {
        return () =>
          new Promise<void>((resolve) => {
            const subscription = bootstrapService
              .isApplicationInitialized()
              .subscribe((initialized) => {
                if (initialized !== null) {
                  subscription.unsubscribe();
                  !initialized && router.navigate(['/auth/first-run']);
                  resolve();
                }
              });
          });
      },
    },
  ],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }
}
```

Take a look at the `providers` section of the `@NgModule` declaration. Here, I’m providing the `APP_INITIALIZER` token, which tells Angular that I’m providing an application bootstrapping process. The `multi` parameter ensures that other `APP_INITIALIZER` processes are also allowed to run. Without this, or if I set it to false, only this process would execute. The `deps` value is required to tell Angular’s dependency injection system what services I’ll need for my process to execute correctly.

I’m using the `useFactory` field to provide a function that will get executed as the`APP_INITIALIZER` process. It takes two parameters, which match the aforementioned `deps` value. The `BootstrapService` is specific to my application, and is responsible for finding the Administrator account, if available, as well as writing the Administrator password to the server when needed.

The factory method returns a method that returns a promise. When the factory method executes, this promise is configured to use the `BootstrapService` to see if the Administrator account exists on the server. This is a basic HTTP service to call a.NET Core API, so I’m not showing it here for brevity. If the `initialized` value returned from the `isApplicationInitialized` method returns non-null, the subscription is first unsubscribed from (we’re good RxJs citizens here…). I next look at the `initialized` value, which will be either true or false at this point (not null or undefined), and if it’s false, I redirect the user to `/auth/first-run`, where they’ll be expected to enter a password and create the Administrator account. Finally, I resolve the promise, which allows the bootstrapping process of the application to move on and complete.

Using an `APP_INITIALIZER` provider is a great way to do some work very early on in your Angular application that can drive dependencies or functionality later on after the application is up and running, interacting with your users.
