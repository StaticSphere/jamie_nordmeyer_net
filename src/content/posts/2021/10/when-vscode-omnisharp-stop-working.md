---
title: "When VSCode/OmniSharp Stop Working"
excerpt: "I’ve run into issues a couple of times now when working in Visual Studio Code where OmniSharp seems to lose itself. Intellisense isn’t working, nor…"
date: "2021-10-14T17:06:36"
author: "Jamie Nordmeyer"
featuredImage: "/wp-content/uploads/2021/10/pexels-olia-danilevich-4974915.jpg"
featuredImageAlt: ""
wpLink: "/2021/10/14/when-vscode-omnisharp-stop-working/"
categories:
  - name: "C#"
    slug: "c-sharp"
  - name: "Visual Studio Code"
    slug: "visual-studio-code"
tags:
  - name: "C#"
    slug: "c"
  - name: "vscode"
    slug: "vscode"
---

I’ve run into issues a couple of times now when working in Visual Studio Code where OmniSharp seems to lose itself. Intellisense isn’t working, nor are the CTRL+. operations working. I’ve tried restarting OmniSharp, restarting VSCode, and even restarting my computer, but nothing seems to get it working again.

There are two issues that I’ve found that will cause this behavior. The first happens when you’re working with a.sln file at the root of your project. You’ll likely notice that SOME of your projects are working fine with OmniSharp. Intellisense is working, you can “Goto definition” without any issues, and so forth. However, there are one or more projects that simply refuse to work. In this case, the first thing to check is whether or not your project has been added to the.sln file. Visual Studio “proper” does this for you. However, VSCode requires an extension, or that you use the `dotnet` CLI directly. You can add a missing project to your.sln file with the following command from the same directory where the.sln file exists:

`dotnet sln add <<relative_path_to_csproj>>`

The second issue was more frustrating to figure out, and when I did, I had a *forehead slap* moment. Even though I had added the project to my.sln file, OmniSharp still wasn’t working with it. And it had previously been working fine. It had stopped working all of a sudden for no apparent reason.

In the bottom left-ish of VSCode you’ll see a flame button (this represents OmniSharps status), and just to the right of that is a label that shows the root project OR solution that OmniSharp is currently paying attention to.

!\[](/wp-content/uploads/2021/10/image-1.png)

I’d accidentally set this to one of my projects under the solution, rather than on the solution file itself. When that happened, only that project was working with OmniSharp. Once I reset it back to the solution file, BOOM, everything began working correctly again.

So, in summary, if your OmniSharp isn’t working correctly:

1. Verify that your.csproj files are all included in the.sln file (if you’re using a.sln file)
2. Verify that OmniSharp is configured to be rooted on your.sln file, and not one of the.csproj files

Happy coding!
