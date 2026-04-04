---
title: "Using Angular Signals for Global State"
excerpt: "With the release of Angular 16 we got access to the new Signals API, along with a host of other features. They are currently in…"
date: "2023-07-29T14:13:05"
author: "Jamie Nordmeyer"
featuredImage: "../../../../assets/images/2023/07/pexels-karol-d-787667.jpg"
featuredImageAlt: ""
wpLink: "/2023/07/29/using-angular-signals-for-global-state/"
categories:
  - name: "Angular"
    slug: "angular"
tags:
  - name: "angular"
    slug: "angular"
---

With the release of Angular 16, we got access to the new [Signals API](https://angular.io/guide/signals), along with a host of other features. Signals are currently in developer preview, meaning they could change before the next Angular release. Even so, they already provide a cleaner way to write reactive code in web applications. They do **not** replace RxJS Observables; Angular services like [HttpClient](https://angular.io/api/common/http/HttpClient) and [resolvers](https://angular.io/api/router/ResolveFn) still rely on RxJS. However, Signals provide another tool for responding to application changes, and in many cases they are easier to understand than the RxJS alternative.

## Code With RxJS

In an application that I’m working on, before Angular 16 shipped, I was using a custom `StoreService` to hold global application state. I’ve tried libraries like [NgRx](https://ngrx.io/) and Akita to manage global state, but found them to be way too heavy-handed for what I wanted (not saying ANYTHING negative towards these libraries; not every tool is right for every job, and the authors of these libraries would probably be the first to tell you that). This custom `StoreService` was created using RxJS, and looked like this:

```typescript
import { Injectable } from '@angular/core';
import { ApplicationState } from '@shared/models';
import { UserCard } from '@shared/models';
import { BehaviorSubject, map } from 'rxjs';

const initialState: ApplicationState = {
  userCard: null,
};

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  private readonly store$ = new BehaviorSubject<ApplicationState>(initialState);
  readonly userCard$ = this.store$.pipe(map((state) => state.userCard));

  setUserCard(userCard: UserCard | null) {
    this.store$.next({
      ...this.store$.value,
      userCard: userCard,
    });
  }
}
```

Here, the UserCard interface represents the basic details of the logged-in user, things like name and data points for putting together a URL to their Avatar image. When I wanted to retrieve the user card for the logged-in user, a service would be used:

```typescript
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, mergeMap, Observable, of, tap } from 'rxjs';
import { StoreService } from '@shared/services';
import { UserCard } from '@shared/models';

@Injectable({
  providedIn: 'root',
})
export class UserCardService {
  constructor(
    private http: HttpClient,
    private storeService: StoreService,
    @Inject('API_BASE_URL') private baseUrl: string
  ) {}

  getUserCard(): Observable<UserCard | null> {
    return this.storeService.userCard$.pipe(
      mergeMap((existingUserCard) =>
        existingUserCard
          ? of(existingUserCard)
          : this.http.get<UserCard>(`${this.baseUrl}v1/users/user-card`).pipe(
              tap((userCard) => this.storeService.setUserCard(userCard)),
              catchError(() => {
                this.storeService.setUserCard(null);
                return of(null);
              })
            )
      )
    );
  }
}
```

In the `getUserCard` method on this service, I first check to see whether `StoreService` already has a loaded `UserCard` instance. If it does, I return that value. If it does not, it makes an HTTP call to retrieve the user card from the server, stores it in `StoreService`, and then returns it.

For the component that displays the user card data, I would expose properties like this as public properties on the component:

```typescript
  get avatarUrl$(): Observable<string | null> {
    return this.storeService.userCard$.pipe(
      map((uc) =>
        uc?.avatarVersionKey && uc.avatarVersionKey !== 0
          ? `${this.apiBaseUrl}v1/users/${uc?.uniqueKey}/avatar?size=64&v=${uc?.avatarVersionKey}`
          : `/assets/images/avatar_small.png`
      )
    );
  }

  get userFullName$(): Observable<string | null> {
    return this.storeService.userCard$.pipe(
      map((siu) => (siu ? `${siu.givenName} ${siu.surName}` : ''))
    );
  }
```

Then in the HTML I need to use the `async` pipe to get the values out:

```html
<span class="name">{{ userFullName$ | async }}</span>
```

## Coding With Signals

This works, and it’s what we’ve been doing for years in Angular. However, now that Signals have arrived, this code can be simplified quite a bit. Let’s start with the Signals-based implementation of `StoreService`.

```typescript
import { Injectable, computed, signal } from '@angular/core';
import { ApplicationState } from '@shared/models';
import { UserCard } from '@shared/models';

const initialState: ApplicationState = {
  userCard: null,
};

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  private readonly _store = signal(initialState);
  readonly userCard = computed(() => this._store().userCard);

  setUserCard(userCard: UserCard | null) {
    this._store.update((s) => ({ ...s, userCard: userCard }));
  }
}
```

So far, it’s not dramatically smaller than the RxJS version. Instead of a `BehaviorSubject`, I’m using a signal. The initial state is still passed in when initializing the signal. I then define `userCard` as a `computed` value. This creates a new signal based on `_store` that automatically notifies listeners whenever `_store` is updated, while returning only the `UserCard` value.

When calling `setUserCard`, I no longer need to call a `next$` method. Calling `next$` makes sense once you remember that an Observable is an event stream, but it can still feel a bit unintuitive. With signals, I call `update`, which feels more natural. `update` passes the current signal value into a function, and I spread it into a new object while replacing the `userCard` value. Right now, my state only contains `UserCard`, but this pattern becomes more useful as global state grows.

The real “Oh…” moment for the cleanliness of the code for me comes in the new implementation of the `UserCardService` class:

```typescript
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, tap } from 'rxjs';
import { StoreService } from '@shared/services';
import { UserCard } from '@shared/models';

@Injectable({
  providedIn: 'root',
})
export class UserCardService {
  constructor(
    private http: HttpClient,
    private storeService: StoreService,
    @Inject('API_BASE_URL') private baseUrl: string
  ) {}

  getUserCard(): Observable<UserCard | null> {
    const uc = this.storeService.userCard();
    if (uc) return of(uc);

    return this.http.get<UserCard>(`${this.baseUrl}v1/users/user-card`).pipe(
      tap((userCard) => this.storeService.setUserCard(userCard)),
      catchError(() => {
        this.storeService.setUserCard(null);
        return of(null);
      })
    );
  }
}
```

The `getUserCard` method still returns an Observable because the consuming resolver expects one. However, the implementation is much easier to understand, in my opinion. I can call `userCard()` on `StoreService` to get the current value, and because it is just a method (not an RxJS Observable), I can return it immediately when it exists, with no need for `mergeMap`. If it doesn’t exist, I call the HTTP endpoint and store the response in `StoreService`.

The component fields are also greatly simplified (it’s really nice not having to use the RxJS `pipe` function):

```typescript
  avatarUrl = computed(() => {
    const uc = this.storeService.userCard();
    return uc?.avatarVersionKey && uc.avatarVersionKey !== 0
      ? `${this.apiBaseUrl}v1/users/${uc?.uniqueKey}/avatar?size=64&v=${uc?.avatarVersionKey}`
      : `/assets/images/avatar_small.png`;
  });
  userFullName = computed(() => {
    const uc = this.storeService.userCard();
    return uc ? `${uc.givenName} ${uc.surName}` : '';
  });
```

And now, in the HTML, we no longer need the `async` pipe. Instead, since each of these properties are signals, we access them like methods in the HTML:

```html
<span class="name">{{ userFullName() }}</span>
```

## Final Thoughts

I really like the new Signals API, and I’m looking forward to seeing where else the Angular team takes it. Will `HttpClient` eventually use Signals (maybe via a new `HttpSignalsClient` class to preserve backward compatibility)? Will there be new template constructs that are Signals-aware? Only time will tell. So far, though, I like what I’m seeing.
