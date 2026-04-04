---
title: ".NET Core/Angular and CORS"
excerpt: "One of the toughest subjects for me to tackle as a professional web developer has been CORS. If you type in “I hate CORS” into…"
date: "2021-08-11T18:01:51"
author: "Jamie Nordmeyer"
featuredImage: "/wp-content/uploads/2021/08/pexels-pixabay-60504-scaled.jpg"
featuredImageAlt: ""
wpLink: "/2021/08/11/net-core-angular-and-cors/"
categories:
  - name: "Angular"
    slug: "angular"
  - name: "C#"
    slug: "c-sharp"
tags:
  - name: "angular"
    slug: "angular"
  - name: "C#"
    slug: "c"
  - name: "cors"
    slug: "cors"
---

One of the toughest subjects for me to tackle as a professional web developer has been CORS. If you type in “I hate CORS” into Google, you might be surprised at how many results you’ll get (or maybe not…). I get why we use CORS. And it seems simple enough to implement. But, getting it to work properly in my project has been an adventure in frustration to say the least.

The project that I’m working on consists of two repositories. The first is an Angular 12 application for the front-end. The second is a.NET 5 Web API project for the back-end. I could have done this project as a combined project, as.NET does have a way to host an Angular or React application in the API, at which point CORS is not an issue since the origin for the site matches the API origin. However I wanted to keep the Angular application separate from the API for multiple reasons:

1. The code bases are in their own repositories
2. They can be built, unit tested, and deployed independently
3. The Angular app can be deployed to a static hosting site, such as Amazon’s S3, which is much cheaper than having to host a server; the Angular code can be downloaded then ran from the browser with no back-end server necessary for the Angular application itself
4. Each project starts up faster; running Angular or React from within the API project does work, but takes a lot longer to get up and running when you start the application

The downside of keeping the projects separate is dealing with CORS. Because the two projects run separately, they run from different URL’s. When running in debug mode on your developer machine,.NET applications by default run on port 5000 and 5001, and Angular apps run on port 4200. I’ve tried this on multiple occasions, and have always found it to be a glorious pain, despite it being something that SHOULD be incredibly simple. You pass back the proper headers, and it “just works”. But no.

I finally got this scenario working on my development environment, and it’s working fantastically, so I wanted to get it documented here while it’s fresh on my mind.

## Server-Side (.NET 5)

On the server-side, we need to set up the API project to send back the proper HTTP headers, specifically *Access-Control-Allow-Origin* header. The value here MUST match the root of the front-end application’s URL WITHOUT the trailing forward slash. In the case of Angular, unless you’ve changed the port, that means that the header value MUST be *http://localhost:4200*.

You can set this up in your Startup.cs file, in the ConfigureServices method using the services.AddCors extension method:

```csharp
services.AddCors(options =>
{
    options.AddPolicy(
        name: CORS_POLICY,
        builder =>
        {
            builder.WithOrigins(Configuration["WebAppUrl"].Trim('/', '\\'))
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
});
```

The CORS\_POLICY value is just an arbitrary string constant, and can be anything that you want it to be. I have a value in my appsettings.json file called WebAppUrl that contains the URL of my web application. The WithOrigins method is what will tell.NET to return the access-control-allow-origin header, and it will do so with the value from configuration. The other 3 methods, AllowAnyMethod, AllowAnyHeader, and AllowCredentials tell the browser to allow any HTTP method to be used, any header to be used, and to accept credential cookies received on the API. Without this final call, an authorization cookie sent from the API from a sign-in call would NOT be saved in the browser.

The final change necessary in the.NET code is in the Configure method, where you have to call app.UseCors:

```csharp
...

app.UseRouting();

app.UseCors(CORS_POLICY);

app.Use(async (httpContext, next) =>
{
    var apiMode = httpContext.Request.Path.StartsWithSegments("/api");
    if (apiMode)
    {
        httpContext.Request.Headers[HeaderNames.XRequestedWith] = "XMLHttpRequest";
    }
    await next();
});

app.UseAuthentication();
app.UseAuthorization();

app.UseEndpoints(endpoints =>
{
    endpoints.MapHealthChecks("/health");
    endpoints.MapControllers()
        .RequireCors(CORS_POLICY);
});
```

UseCors MUST be placed between the calls to UseRouting and UseAuthentication/UseAuthorization. Also notice that there’s a call to RequireCors in the call to UseEndpoints, off of the MapControllers call. The app.Use call adds the XRequestedWith header to all API calls, which I found to be necessary for this to all work as well.

## Client-Side (Angular)

In my Angular application, HTTP calls need to specify that they want to include credentials, otherwise these calls won’t work properly with CORS to deal with the authentication cookie. So you can create an HttpInterceptor like so:

```typescript
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable()
export class CorsRequestInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    req = req.clone({
      withCredentials: true,
    });

    return next.handle(req);
  }
}
```

You then register the interceptor in your app.module.ts file:

```typescript
providers: [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: CorsRequestInterceptor,
    multi: true,
  },
],
```

And that’s “it”. It’s completely possible that this is crazy simple for many. But given the number of hits that I found on Google saying otherwise… I’m hoping that this will be useful to someone down the road, including me on my next project!
