---
title: "Caching Angular Resolver State"
excerpt: "There are certain types of data that we will pull into our applications that do not change, or that change very, very slowly. In these…"
date: "2021-11-16T20:57:30"
author: "Jamie Nordmeyer"
featuredImage: "../../../../assets/images/2021/11/pexels-breakingpic-3237.jpg"
featuredImageAlt: ""
wpLink: "/2021/11/16/caching-angular-resolver-state/"
categories:
  - name: "Angular"
    slug: "angular"
tags:
  - name: "angular"
    slug: "angular"
---

There are certain types of data that we will pull into our applications that do not change, or that change very, very slowly. In these cases, it’s best to load the data into the application once, when it’s needed, and not to ask for it again until the application has been refreshed, or until we decide that we should get the data anew for some other reason.

In my Angular application, I’m using [resolvers](https://angular.io/api/router/Resolve) to pre-fetch any data needed for a route before sending the application to that route. One bit of data that is not likely to change, or will at least change very slowly, would be my repository of state/province data. Though it’s technically POSSIBLE that the U.S. could lose or gain a state, it’s also very unlikely. Therefore, I’d rather cache that data locally in my Angular application the first time that it’s needed… and then not again.

Here is the implementation of my StateProvinceResolver:

```typescript
import { Injectable } from "@angular/core";
import { Resolve } from "@angular/router";
import { StoreService } from "@core/services/store/store.service";
import { StateProvince } from "@shared/models";
import { Observable, of } from "rxjs";
import { mergeMap, take, tap } from "rxjs/operators";
import { StateProvinceService } from "./state-province.service";

@Injectable({
  providedIn: "root",
})
export class StateProvinceResolver implements Resolve<StateProvince[]> {
  constructor(
    private readonly storeService: StoreService,
    private readonly stateProvinceService: StateProvinceService
  ) {}

  resolve(): Observable<StateProvince[]> {
    return this.storeService.stateProvinces$.pipe(
      mergeMap((sp) =>
        sp !== null
          ? of(sp)
          : this.stateProvinceService
              .getStateProvinces()
              .pipe(
                tap((fetched) => this.storeService.setStateProvinces(fetched))
              )
      ),
      take(1) // This is necessary since the stream returned by mergeMap will not complete on its own otherwise
    );
  }
}
```

In a [previous post](/2021/01/24/using-behaviorsubject-for-angular-global-state/), I mentioned that I’m using BehaviorSubject in my application, wrapped in a store service, rather than a 3rd party state library like NgRx or Akita. When Angular executes this resolver, the code will return the stateProvince observable from the store service. It uses mergeMap to return the first result that resolves. If the stateProvince value has a current set of data, meaning that it has already been retrieved, it is immediately returned, wrapped in the `of` operator to make it an observable. If not, then the result of the `stateProvinceService.getStateProvinces` service call is returned. However, before it is returned, the value is tapped, and passed to the storeService for later retrieval.

The `take(1)` at the end is necessary since we’re not directly subscribing to the resolve method, and it won’t complete otherwise. This one took me some time to figure out. By putting the `take(1)` call on there, it causes the observable returned by the mergeMap call to complete immediately, allowing the route to resolve.
