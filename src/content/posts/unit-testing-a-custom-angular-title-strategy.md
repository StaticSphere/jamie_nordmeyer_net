---
title: "Unit Testing a Custom Angular Title Strategy"
excerpt: "I’ve been trying to figure this out for a while but couldn’t find any good resources online on how to unit test a custom Angular…"
date: "2023-03-05T13:37:34"
author: "Jamie Nordmeyer"
featuredImage: "/wp-content/uploads/2023/03/pexels-charlie-solorzano-1762815.jpg"
featuredImageAlt: ""
wpLink: "/2023/03/05/unit-testing-a-custom-angular-title-strategy/"
categories:
  - name: "Angular"
    slug: "angular"
  - name: "Unit Testing"
    slug: "unit-testing"
tags:
  - name: "angular"
    slug: "angular"
---

I’d been trying to figure this out for a while, but couldn’t find good resources online for unit testing a custom Angular Title Strategy (the `TitleStrategy` abstract base class was introduced in Angular 14). As a result, I left it largely untested in my project for a while. Fortunately, the implementation is simple, but I still felt "naked" not having it covered by tests. I finally found time to dig through the Angular source code and found documentation for how the Angular team tests this themselves. Here’s the GitHub link: [angular/page\_title\_strategy\_spec.ts at c0c7efaf7c8a53c1a6f137aac960757cc804f263 · angular/angular (github.com)](https://github.com/angular/angular/blob/c0c7efaf7c8a53c1a6f137aac960757cc804f263/packages/router/test/page_title_strategy_spec.ts)

Again, the implementation for my title strategy is extremely simple:

```typescript
import { Injectable } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { RouterStateSnapshot, TitleStrategy } from "@angular/router";

@Injectable()
export class AppTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  updateTitle(routerState: RouterStateSnapshot): void {
    const title = this.buildTitle(routerState);
    this.title.setTitle(`My Application${ !!title ? ' - ' + title : '' }`);
  }
}
```

All this does is set the page title to "My Application" (name changed to protect my work...), or "My Application - Route Title" as the user navigates around the application. Simple. But how do I test it? Trying to mock up `RouterStateSnapshot` wasn’t getting me anywhere.

After digging through Angular’s GitHub repo, I realized the trick was to NOT mock `RouterStateSnapshot`. Instead, get a reference to the injected `Router` and `Document` instances, emulate a routing event, then check the document title. To do this, pass the results of both the `provideLocationMocks` and `provideRouter` methods from `@angular/common/testing` and `@angular/router` respectively during the `configureTestingModule` call. Then, in each test, call `router.resetConfig` to emulate a route event. Here is my testing implementation:

```typescript
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { Component } from '@angular/core';
import { AppTitleStrategy } from './app-title-strategy.service';

describe('AppTitleStrategyService', () => {
  let router: Router;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideLocationMocks(),
        provideRouter([]),
        {
          provide: TitleStrategy,
          useClass: AppTitleStrategy,
        },
      ],
    });

    router = TestBed.inject(Router);
    document = TestBed.inject(DOCUMENT);
  });

  it('should set page title correctly when title is not provided', fakeAsync(() => {
    router.resetConfig([
      {
        path: 'home',
        component: TestComponent
      }
    ]);

    router.navigateByUrl('/home');
    tick();
    expect(document.title).toBe('My Application');
  }));

  it('should set page title correctly when title is empty string', fakeAsync(() => {
    router.resetConfig([
      {
        path: 'home',
        title: '',
        component: TestComponent
      }
    ]);

    router.navigateByUrl('/home');
    tick();
    expect(document.title).toBe('My Application');
  }));

  it('should set page title correctly when title is provided', fakeAsync(() => {
    router.resetConfig([
      {
        path: 'home',
        title: 'Home',
        component: TestComponent
      }
    ]);

    router.navigateByUrl('/home');
    tick();
    expect(document.title).toBe('My Application - Home');
  }));
});

@Component({template: ''})
export class TestComponent {
}
```
