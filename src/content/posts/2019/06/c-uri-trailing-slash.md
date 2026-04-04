---
title: "C# Uri Trailing Slash"
excerpt: "Many libraries that deal with pathing (taking path “fragments” and appending them together to form a larger path) do not care whether you add trailing…"
date: "2019-06-09T16:17:34"
author: "Jamie Nordmeyer"
featuredImage: null
featuredImageAlt: ""
wpLink: "/2019/06/09/c-uri-trailing-slash/"
categories:
  - name: "C#"
    slug: "c-sharp"
  - name: "Programming"
    slug: "programming"
tags:
  - name: "C#"
    slug: "c"
---

![](../../../../assets/images/2019/06/what.png)

Many libraries that deal with pathing (taking path “fragments” and appending them together to form a larger path) do not care whether you add trailing separator characters or not. If you supply them, they let the fragment be. If not, then the fragment separator is automatically added. For instance, both Node’s *path* library, as well as.NET’s System.IO.Path methods, allow you to provide file path fragments, and if there are missing path separators between, they will be added automatically.

Apparently, this is the the case for Uri’s in.NET. Looking through the [documentation](https://docs.microsoft.com/en-us/dotnet/api/system.uri?view=netframework-4.8), there is no direct equivalent for concatenating Uri path fragments. The way that you have to do so is with the Uri constructor. I ran into this issue last week at work, and it cost me a several hours of lost time as I troubleshot the issue. Take a look at this code snippet, which I ran in LinqPad:

```csharp
void Main()
{
	var baseUri1 = new Uri("http://www.somesite.com/api/person/100/hobbies");
	var baseUri2 = new Uri("http://www.somesite.com/api/person/100/hobbies/");

	var compositeUri1 = new Uri(baseUri1, "13");
	var compositeUri2 = new Uri(baseUri2, "13");

	Console.WriteLine(compositeUri1.ToString());
	Console.WriteLine(compositeUri2.ToString());
}
```

baseUri1 has no trailing slash in the Uri, whereas baseUri2 does. If the Uri class worked like other pathing classes, I’d expect both Console.WriteLine calls to produce http://www.somesite.com/api/person/100/hobbies/13. However, that is NOT the case. Instead, I get the following:

> http://www.somesite.com/api/person/100/13 http://www.somesite.com/api/person/100/hobbies/13

Notice that *hobbies* is completely missing from the first Uri. It didn’t just append 13 to hobbies… it actually *removed* hobbies from the Uri altogether before appending the 13. What…?!? I assumed that the Uri class would add the missing trailing slash, so when my code was not working after deployment to our development environment, it wasn’t immediately clear why it couldn’t reach the REST API that it was relying on. Only after adding in additional logging was I able to figure out that the URI being used to talk to our API was invalid.

I do my absolute best to not make assumptions, especially when using the.NET BCL classes and methods. However, it looks like we can still be bit from time to time when something works one way, while we expected that it worked another…
