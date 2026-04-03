---
title: "Clean Architecture Solution Template"
excerpt: "UPDATE: This project has now been upgraded to .NET 8. I’ve blogged about it here. I’ve become a huge fan of the Clean Architecture pattern…"
date: "2021-11-25T14:55:17"
author: "Jamie Nordmeyer"
featuredImage: "/wp-content/uploads/2021/11/pexels-dmitry-demidov-3852577.jpg"
featuredImageAlt: ""
wpLink: "/2021/11/25/clean-architecture-solution-template/"
categories:
  - name: "Architecture"
    slug: "architecture"
  - name: "C#"
    slug: "c-sharp"
tags:
  - name: ".net core"
    slug: "net-core"
  - name: "asp.net"
    slug: "asp-net"
  - name: "C#"
    slug: "c"
---

**UPDATE**: This project has now been upgraded to.NET 8. I’ve blogged about it [here](/2024/03/03/open-source-project-updates/).

I’ve become a huge fan of the Clean Architecture pattern when working on.NET API’s. I won’t go into a ton of detail here, as there are a lot of great resources out there on the subject already, including from the person that I first learned it from, Jason Taylor. If you’re unfamiliar with this pattern, do yourself a favor and check out this presentation by Jason from the GOTO 2019 conference:

<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio"><div class="wp-block-embed__wrapper">
<iframe loading="lazy" title="Clean Architecture with ASP.NET Core 3.0 • Jason Taylor • GOTO 2019" width="500" height="281" src="https://www.youtube.com/embed/dK4Yb6-LxAk?feature=oembed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div></figure>

But at the 10,000 foot level, an API project using the Clean Architecture pattern has 4 separate projects (along with the necessary unit testing projects):

- Domain – This project is meant to hold the domain entities of the application. The classes in this project map to the data tables or records in whatever data store the application is configured to use.
- Application – This project contains the business logic and rules that make the application as a whole run as it’s supposed to. It directly references the Domain project, but no other projects within the solution.
- Infrastructure – This project contains the implementation of any logic that needs to communicate with outside entities, such as a database, the file system, other HTTP API’s, and so forth. It references the Application project to gain access to application contracts that it will then implement for accessing the aforementioned external entities.
- Api – This is the front-end of the application, and provides the start-up code and the API endpoint entry points.

## Solution Template NuGet Package

I’ve created a NuGet package called `[StaticSphere.CleanArchitecture.Api](https://www.nuget.org/packages/StaticSphere.CleanArchitecture.Api/)`, and published it to NuGet.org. You can install it using the following command:

```text
dotnet new --install StaticSphere.CleanArchitecture.Api
```

Once installed, you can create a new solution by running the following command:

```text
dotnet new clean-arch <<parameters>>
```

When executed, you’ll get a full.NET 6 ASP.NET API solution that contains the following folder structure (assuming you named to the solution HelloWorld):

- src
    - HelloWorld.Api
    - HelloWorld.Application
    - HelloWorld.Domain
    - HelloWorld.Infrastructure
- tests
    - HelloWorld.Api.Tests
    - HelloWorld.Application.Tests
    - HelloWorld.Infrastructure.Tests

The projects are all.NET 6 applications with [nullable references types](https://docs.microsoft.com/en-us/dotnet/csharp/nullable-references) and [implicit usings](https://docs.microsoft.com/en-us/dotnet/core/project-sdk/msbuild-props#implicitusings) enabled. The unit testing projects use [Xunit](https://xunit.net/) out of the box. There are also support files such as.gitignore,.editorconfig, etc.

There are parameters that can be passed to the `dotnet new` command that alter the solution that is created:

- –includeTests – Determines if the test projects should be included or not. **Default value: true**
- –skipRestore – If specified, skips the automatic restore of the project on create. **Default value: false**
- –useStartup – Determines if the API project should use Startup.cs instead of the newer Minimal API style Program.cs file. **Default value: false**
- –includeEF – If set, the created solution will include Entity Framework Core, and will be configured to use the specified provider (only these providers are currently supported)
    - postgres – Adds Postgres Entity Framework configuration
    - sqlserver – Adds SQL Server Entity Framework configuration

## Open Source

The NuGet package that contains the solution template is completely free and open source, and is [MIT](https://opensource.org/licenses/MIT) licensed. The NuGet package can be found [here](https://www.nuget.org/packages/StaticSphere.CleanArchitecture.Api/), and the source code for the template can be found [here](https://github.com/StaticSphere/clean-architecture-dotnet-template). If you have any suggestions, or would like to contribute to the template, please let me know!
