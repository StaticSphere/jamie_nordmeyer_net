---
title: "Mocking Systems Resources in C#/ASP.NET"
excerpt: "Static System Resources When writing unit tests in C#, one question that often comes up is how to mock static resources, and which static resources…"
date: "2021-02-10T19:29:25"
author: "Jamie Nordmeyer"
featuredImage: "../../../../assets/images/2021/02/clock-scaled.jpg"
featuredImageAlt: ""
wpLink: "/2021/02/10/mocking-systems-resources-in-c-asp-net/"
categories:
  - name: "Architecture"
    slug: "architecture"
  - name: "C#"
    slug: "c-sharp"
  - name: "Unit Testing"
    slug: "unit-testing"
tags:
  - name: "unit testing"
    slug: "unit-testing"
---

## Static System Resources

When writing unit tests in C#, one question that often comes up is how to mock static resources, and which static resources make sense to mock in the first place. I tend to think of this in terms of whether or not the static resource is doing something that I can’t directly control. For instance, I wouldn’t mock `string.IsNullOrEmpty`. It’s a pure function, meaning that it has no side effects, and given the same input, it will always return the same output. It also doesn’t rely on any external data.

Dates area different story. `DateTime.Now` is NOT a pure function (C# properties ARE functions under the covers, so this terminology still applies) because it relies on the system clock to do its work, which is constantly changing, and largely out of your control. Therefore, unit testable code should NOT use it.

Well, what if you NEED to use it? Maybe you’re using it to set the created date on a database record. Or your using it to do some sort of date/time comparison math. The answer, like ANY external resource that you don’t control, is to wrap it in a service, and when you write your unit tests, mock that service.

When I write code, I’ll put DateTime operations that rely on the system clock (for instance, `DateTime.AddDays` does not rely on the system clock, so I don’t add it to the service; this IS a pure function, and doesn’t need to be mocked) behind an interface called `IDateTimeService`, and inject that into any code that needs to call `Now` or `UtcNow`. Then I create an implementation of that interface, `DateTimeService`, that simply calls the system clock reliant methods.

```csharp
public interface IDateTimeService
{
    DateTime UtcNow { get; }
}

public class DateTimeService : IDateTimeService
{
    public DateTime UtcNow => DateTime.UtcNow;
}
```

Simplistic, yes. But what I get from this is that at run time, I can still ask the host server for the current date and time. But when I’m working with unit tests, I’m able to tell my test EXACTLY what date/time I want to work with for a given test. I just mock the `IDateTimeService`, and tell it to always return the same date/time value, regardless of what the date and time really are. If I have logic that says “If my record date is before the current date/time, then do X”, this is now extremely easy to test.

## ASP.NET Context

This technique also works really well for values in the HttpContext that you don’t have control of because it’s expected that the ASP.NET runtime will set these values for you. How do you mock these? A good example is mocking the user principle. I want to be able to write unit tests where I can control what, and if, the User ID is set. In the case of one of the projects I’m working on, this is an integer value, and it resides in the `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier` claim. The code for this looks as follows:

```csharp
public interface IPrincipalService
{
    int UserId { get; }
}

public class PrincipalService : IPrincipalService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public PrincipalService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public int UserId
    {
        get
        {
            var claimsPrincipal = _httpContextAccessor.HttpContext?.User;
            if (claimsPrincipal == null)
                throw new MissingClaimsPrincipalException();

            return int.Parse(claimsPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "", CultureInfo.CurrentCulture);
        }
    }
}
```

In the implementation, I’m getting the claims principal from the `IHttpContextAccessor.HttpContext` instance. If it’s not there, I throw a custom exception. I then find the name identifier claim, convert it to an integer, and return it. But now, when I unit test any code that needs this information, I can just mock the `IPrincipalService` interface, which is extremely easy since it’s simply returning an integer.
