---
title: "Wait, .NET is HOW old?!?"
excerpt: "Wow, the time has really flown by, hasn’t it?!? Today marks the 20th anniversary of .NET! Released on February 13th, 2002, .NET has been through…"
date: "2022-02-13T07:32:12"
author: "Jamie Nordmeyer"
featuredImage: "/wp-content/uploads/2022/02/pexels-ylanite-koppens-796606.jpg"
featuredImageAlt: ""
wpLink: "/2022/02/13/wait-net-is-how-old/"
categories:
  - name: "C#"
    slug: "c-sharp"
tags:
  - name: ".net"
    slug: "net"
  - name: ".net core"
    slug: "net-core"
  - name: "asp.net"
    slug: "asp-net"
  - name: "C#"
    slug: "c"
---

Wow, the time has really flown by, hasn’t it?!? Today marks the 20th anniversary of.NET! Released on February 13th, 2002,.NET has been through many iterations and changes over its lifetime. Originally released as a Windows only framework, it has been responsible for the careers for millions of developers around the world (including mine).

For those interested in the history full history of.NET, Richard Campbell has done a number of fantastic presentations on the subject. He’s interviewed a ton of people from Microsoft and the open-source community to compile this information, and at some point in the hopefully not too distant future, will be releasing what I suspect will be an AMAZING book on the subject. The following video is 4 years old, but it’s one that I’ve watched a couple times, and Richard does a great job of going over the history up to that point.

<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio"><div class="wp-block-embed__wrapper">
<iframe loading="lazy" title="The History of.NET by Richard Campbell of.NET Rocks!" width="500" height="281" src="https://www.youtube.com/embed/FFCn_z7dn_A?feature=oembed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div></figure>

My personal history with.NET starts way back even before the 1.0 release in February of 2002. The company I worked for at the time was primarily working with a combination of Visual Basic 6, Excel VBA, and CLASSIC ASP based web applications. Microsoft released a beta of the.NET Framework along with their brand new “C based” language called C#.

I remember actually being quite frustrated with the beta! When the beta shipped, there was no form of Visual Studio that supported it yet. Visual Studio existed, but it was primarily an IDE for Visual C++. So to compile the beta bits of C#, you had to use the CSC compiler directly via the csc.exe command. I also recall that `using` statements had not been added to the language yet, so any class you used had to be fully qualified, meaning you were typing a LOT of characters.

Fortunately, the platform has matured exponentially over its 20 years of life and is now used by companies large and small to run their businesses with, with millions of developers working for those companies as.NET software developers, engineers, and architects. Today, it runs on everything from massive server farms down to the tiniest of computing devices like watches and embedded microcontrollers.

As I said, the platform has matured exponentially over the years. When.NET 1.0 released, it shipped without one of the things that I loved from the C++ world; generics. At the time of 1.0, if you wanted to create a strongly typed list of integers, you’d have to implement the `IList` interface. Completely. If you also wanted a strongly typed list of strings, you’d implement the `IList` interface again, this time for strings. When.NET 2 released with support for generics, it rocked the community with how much simpler these sorts of things were.

.NET 3 added support for several new technologies that were designed to update how Windows developers wrote code not only on Windows, but also how we communicated with the web. WPF (Windows Presentation Foundation) allowed us to use an XML based syntax for creating Windows applications and was eventually adopted into the creation of Visual Studio itself. WCF (Windows Communication Foundation) allowed services to communicate with one another using Simple Object Access Protocol, or SOAP, giving us a contractual communication channel for Service Oriented Architecture systems. SOAP is widely frowned upon today with newer architectures and technologies like REST and gRPC replacing it, but it was the way we did things in those days.

Then came.NET 3.5, and the release of LINQ, or Language Integrated Query. LINQ revolutionized how.NET developers worked, allowing us to treat enumerable collections of data in a more functional way than before, and to literally write SQL-like syntax in our code to filter this data. Along with the release of LINQ came the first release of Entity Framework, and whether you love or hate EF, it absolutely changed the development landscape for.NET programming.

.NET 4 and 4.5 set the stage for simpler asynchronous programming and working with data types not necessarily known at compile time by bringing in the Task Parallel Library and dynamics, respectively. The former made it much easier to work with asynchronous programming, with the latter bringing us finally to the methodology that most of us are familiar with today, the `async/await` pattern. This pattern proved so successful that it has seen itself move into other languages as well, such as JavaScript/TypeScript.

At this point, Microsoft moves into cross-platform and open-source support in.NET in earnest with.NET Core. Giving us the ability to develop and run our code bases on Windows, Linux, and Mac was a HUGE leap ahead for.NET and C#. Naturally, some Windows specific things did have to be left behind with the.NET Framework, such as GDI (System.Drawing), Windows Forms, and so forth. But the majority of.NET was able to transition to.NET Core, and this is how we get to write code that runs on everything from massive server farms to the smart watch on your wrist.

Starting with.NET 5, Microsoft of course “merged” their support of.NET into a single runtime. They dropped the Core name (though retained it for ASP.NET Core), and while they will still support the Windows only.NET Framework with security fixes, they are no longer actively working on it, focusing their efforts on.NET 5 and on. They’ve reintroduced Windows Forms development (naturally Windows only, though) to sit on top of.NET 5+, and will be releasing Maui at some point in the future to support cross-platform desktop development with a XAML based programming model.

It truly is a fantastic time to be a.NET software professional or hobbyist!!! Despite the platform being 20 years old, it is still going incredibly strong. It enjoys a thriving community of both corporate and open-source supporters, and with a promised annual release cycle, continues to be added to. Microsoft pays attention to feedback on GitHub, and has even merged in pull requests from the community that have been deployed as part of the official product.

As someone that’s built their entire career on.NET and C#, all I can say is Happy Birthday,.NET and C#!!! And thank you!!
