---
title: "Whaddaya Mean “System.Object” Is Not Defined?!?"
excerpt: "Every once in a blue moon or two, Visual Studio can get itself into a bizarre state where it’s not resolving the most basic types,…"
date: "2022-07-31T20:25:44"
author: "Jamie Nordmeyer"
featuredImage: "../../../../assets/images/2022/07/pexels-yan-krukov-4458411.jpg"
featuredImageAlt: ""
wpLink: "/2022/07/31/whaddaya-mean-system-object-is-not-defined/"
categories:
  - name: "Visual Studio"
    slug: "visual-studio"
tags:
  - name: "visual studio"
    slug: "visual-studio"
---

Every once in a blue moon or two, Visual Studio can get itself into a bizarre state where it’s not resolving the most basic types, like `System.Object`. You’ve confirmed that you’re referencing the latest version of.NET or.NET Core, you’ve cleaned and rebuilt your solution, and you’ve even rebooted your computer… all to no avail. What gives?!? Visual Studio ends up looking something like this:

!\[](../../../../assets/images/2022/07/image.png)

Wait… what? “Predefined type ‘System.Object’ is not defined or imported”?!? This is purely a designer thing. If you try to build and/or run the solution, everything works (so long as you don’t have any genuine compiler errors, naturally…)

Well, I’m not entirely sure what is getting copied into the `obj` and/or `bin` folders that would specifically cause this, but when you do a Clean (either with `dotnet clean`, or via the Clean Solution menu command), there are things that aren’t removed that are apparently causing this issue. If someone knows exactly what is doing this, I’d love to know! Either way, the fix is to delete both the `obj` and `bin` folders for each project in the solution that is affected by this issue.

Once you do that, you’ll notice that they get dropped back in almost immediately IF you have the solution open in Visual Studio when you delete them. Once the new `obj` and `bin` folders are created, Visual Studio should visually clean up, and the `System.Object` errors will go away. Woot!

Just one of many of Visual Studio’s idiosyncrasies…
