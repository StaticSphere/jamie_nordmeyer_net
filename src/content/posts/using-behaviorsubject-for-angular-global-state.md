---
title: "Using BehaviorSubject for Angular Global State"
excerpt: "When developing applications with modern frameworks like Angular or React, you often hear about the Redux pattern for managing your global state. I’m not going…"
date: "2021-01-24T17:23:24"
author: "Jamie Nordmeyer"
featuredImage: null
featuredImageAlt: ""
wpLink: "/2021/01/24/using-behaviorsubject-for-angular-global-state/"
categories:
  - name: "Angular"
    slug: "angular"
tags:
  - name: "BehaviorSubject"
    slug: "behaviorsubject"
  - name: "State"
    slug: "state"
  - name: "Store"
    slug: "store"
---

When developing applications with modern frameworks like Angular or React, you often hear about the Redux pattern for managing your global state. I’m not going to go into detail about it here, as it is very widely covered already, but in summary, it’s a data flow pattern that aims to make your code less error prone by way of immutable state.

When your application wants to update some global state (the users profile information, details about whether they’re logged in, etc.), your application will dispatch an action request to the store. The store will respond to this request via a reducer, which is a function that, based on the desired action, will create NEW state, based on the previous state, that has the requested change. Any code in your application that is then interested in these changes will be notified of the change. Note that ALL changes to the global state are expected to be done via the dispatching of actions. In this way, only 1 block of code ever changes the application state (the reducer), thus making changes and troubleshooting much easier.

For Angular, the most popular library today for implementing the Redux pattern is the [NgRx library](https://ngrx.io/). There are others well known and used libraries as well, such as [NGXS](https://www.ngxs.io/) and [Akita](https://datorama.github.io/akita/). While these libraries are powerful, they also require varying degrees of ceremony to get up and running. In addition, at least in my experience, they don’t make it very easy to get at the current state outside of the normal RxJs pipeline. This is typically a good thing; Angular data flow is meant to be reactive rather than procedural. But sometimes, you really do just need to ask the store “What is your current state”?

An alternative to using these full Redux libraries is to simply rely on the RxJs [BehaviorSubject](https://www.learnrxjs.io/learn-rxjs/subjects/behaviorsubject) class. Since Angular already relies on RxJs out of the box, you don’t need to `npm install` any additional libraries with this approach. I’m using BehaviorSubject in a project that I’m working on while still enforcing the immutability of my global application state, and am finding that I don’t actually need to be using Redux (actually, most of the Redux libraries are pretty open about you maybe not needing to use them).

The way that I’m using BehaviorSubject is by creating a global Angular service called `StoreService`. This is just a standard Angular service, provided in the root injector:

```typescript
@Injectable({
  providedIn: 'root',
})
export class StoreService {
  private readonly store$ = new BehaviorSubject<ApplicationState>(initialState);
  ...
}
```

I have a private variable called `store$` that uses BehaviorSubject. The fact that this variable is private is important; it means that the ONLY way that you can access the global state is via the functions that the service exposes, allowing me to control exactly how the state is updated or read. The BehaviorSubject class requires an initial value to be provided to its constructor because the BehaviroSubject will always emit a value to any new subscribers. At the time of this writing, my initial state looks like this:

```typescript
export interface ApplicationState {
  pageTitle: string;
  userProfile: UserProfile | null;
  usStates: UsState[] | null;
}

const initialState: ApplicationState = {
  pageTitle: 'My Application',
  userProfile: null,
  usStates: null,
};
```

In libraries such as NgRx, you create functions called Selectors that are responsible for giving you an observable view into slices of your global state. This is easy to do with BehaviorSubject as well:

```typescript
readonly pageTitle$ = this.store$.pipe(map((state) => state.pageTitle));
readonly userProfile$ = this.store$.pipe(map((state) => state.userProfile));
readonly usStates$ = this.store$.pipe(map((state) => state.usStates));
```

Any component or service that wants to subscribe to changes to, say, the pageTitle$ value can do so:

```typescript
this.storeService.pageTitle$.subscribe(title => { doSomethingWithPageTitle(title); };
```

The BehaviorSubject class, as an implementation of an Observable, has a function called `next` that can be used to alter the state. This acts as the reducer in this methodology:

```typescript
setUserProfile(userProfile: UserProfile) {
  this.store$.next({
    ...this.store$.value,
    userProfile,
  });
}
```

Here the `setUserProfile` function takes the userProfile object as a parameter. It calls the BehaviorSubject’s `next` function, and provides a COMPLETELY NEW STATE object to it. This new object is based on the CURRENT state via the TypeScript/JavaScript spread operator, but replaces the userProfile part of the state with the value passed in to the `setUserProfile` function. This will then cause the `userProfile$` observable from above to fire since this value has changed, and any listeners to that Observable will be notified of the change.

When I started this post, I mentioned that it can be tricky to simply get the current snapshot of the state (depending on the framework that you’re using). However, BehaviorSubject makes this available via the `value` property.

```text
get userProfileId(): number | undefined {
  return this.store$.value.userProfile?.id;
}
```

I like this approach to managing my global state because it relies completely on already existing code (you already have RxJs by the very fact that you’re using Angular), and is much simpler to set up than, say, NgRx is. Those libraries serve a definite purpose, and have a large community of people backing them and using them. But if your global state needs are simple enough, then it’s easier to just create a service based on BehaviorSubject (the authors of these libraries will tell you the same thing).

Here then is the complete implementation of my StateService for reference. Feel free to hit me up if you have any questions, or if you have suggestions for improvements to it. I’m always down to learn better ways of doing things!!!

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { UserProfile, UsState } from '../../models';

export interface ApplicationState {
  pageTitle: string;
  userProfile: UserProfile | null;
  usStates: UsState[] | null;
}

const initialState: ApplicationState = {
  pageTitle: 'My Application',
  userProfile: null,
  usStates: null,
};

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  private readonly store$ = new BehaviorSubject<ApplicationState>(initialState);

  readonly pageTitle$ = this.store$.pipe(map((state) => state.pageTitle));
  readonly userProfile$ = this.store$.pipe(map((state) => state.userProfile));
  readonly usStates$ = this.store$.pipe(map((state) => state.usStates));

  get userProfileId(): number | undefined {
    return this.store$.value.userProfile?.id;
  }

  setPageTitle(pageTitle: string) {
    setTimeout(() => {
      this.store$.next({
        ...this.store$.value,
        pageTitle,
      });
    }, 0);
  }

  setUserProfile(userProfile: UserProfile) {
    this.store$.next({
      ...this.store$.value,
      userProfile,
    });
  }

  clearUserProfile() {
    this.store$.next({
      ...this.store$.value,
      userProfile: null,
    });
  }

  userAvatarUpdated() {
    this.store$.next({
      ...this.store$.value,
      userProfile: Object.assign(this.store$.value.userProfile, {
        avatarFileVersion: new Date().getTime().toString(),
      }),
    });
  }

  setUsStates(usStates: UsState[]) {
    this.store$.next({
      ...this.store$.value,
      usStates,
    });
  }
}
```
