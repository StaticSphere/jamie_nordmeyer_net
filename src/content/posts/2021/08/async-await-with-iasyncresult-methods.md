---
title: "Async/Await With IAsyncResult Methods"
excerpt: "One of the applications that I work with uses PowerShell from with a .NET C# API project. The NuGet package that provides the necessary interfaces…"
date: "2021-08-27T16:48:00"
author: "Jamie Nordmeyer"
featuredImage: "../../../../assets/images/2021/08/pexels-wendy-van-zyl-1212179.jpg"
featuredImageAlt: ""
wpLink: "/2021/08/27/async-await-with-iasyncresult-methods/"
categories:
  - name: "C#"
    slug: "c-sharp"
tags:
  - name: ".net core"
    slug: "net-core"
  - name: "C#"
    slug: "c"
---

One of the applications that I work with uses PowerShell from with a.NET C# API project. The NuGet package that provides the necessary interfaces is called System.Management.Automation. It is actively maintained by Microsoft, but has API’s that still use the older `IAsyncResult` methodology of asynchronous programming, including the `Invoke` method on the `PowerShell` object itself.

As a result, when trying to add calls to `Invoke` within methods that are written as `async/await` methods, the fallback was the “good ‘ol” `Task.Run` calls:

```csharp
public async Task<bool> IsSessionAliveAsync()
{
    return await Task.Run(() =>
    {
        _powerShell.Commands.AddCommand("Get-PSSession");

        var result = _powerShell.Invoke();
        return (result?.Count ?? 0) > 0;
    });
}
```

However, today I discovered a neat little method in the `TaskFactory` class called `FromAsync`. This method takes an `IAsyncResult` instance as its first parameter, and a delegate that is triggered when the `IAsyncResult` instance completes. And… it’s awaitable! This makes code flow more naturally (in my humble opinion), and removes a level of scoping/nesting from your code:

```csharp
public async Task<bool> IsSessionAliveAsync()
{
    _powerShell.Commands.AddCommand("Get-PSSession");

    var result = await Task.Factory.FromAsync(_powerShell.BeginInvoke(), _powerShell.EndInvoke);
    return (result?.Count ?? 0) > 0;
}
```

Very nice! I’m sure there are plenty of engineers out there that would see this and say “Well, yeah, that’s been there forever!” Hey, I’m just happy that I found it now! 🙂
