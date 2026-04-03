---
title: "C# 8 Null Forgiving Operator"
excerpt: "Yup, that’s actually a thing! I’ve never personally seen it discussed in any of the talks or presentations that I’ve seen on C# 8, but…"
date: "2019-10-24T08:00:01"
author: "Jamie Nordmeyer"
featuredImage: null
featuredImageAlt: ""
wpLink: "/2019/10/24/c-8-null-forgiving-operator/"
categories:
  - name: "C#"
    slug: "c-sharp"
tags:
  - name: "C#8"
    slug: "c8"
---

Yup, that’s actually a thing! I’ve never personally seen it discussed in any of the talks or presentations that I’ve seen on C# 8, but I ran into a scenario last night where it was useful to have, and managed to track it down on Microsoft’s documentation site, which I’ll link to below.

So, the scenario that sent me searching for a solution, and which led me to this little discussed operator, was working with the new Nullable Reference Types in C# 8. More specifically, I was setting up an Entity Framework DbContext:

```csharp
public class ApplicationDbContext : DbContext
{
  public DbSet<Address> Addresses { get; set; }
  ...
}
```

This is valid C# code. However, what I was noticing was that the Addresses property was getting the squiggly indicator that the value hadn’t been initialized. Since I’ve enabled Nullable Reference Types, the compiler thought I was leaving non-null value uninitialized. However, Entity Framework will, at run-time, ensure that this property has a value well before I can use it. So I don’t NEED to initialize it. And I couldn’t even if I wanted to; DbSet does’t have a public constructor.

The solution, it turns out, is to use the Null Forgiving Operator. It looks like this:

```csharp
public class ApplicationDbContext : DbContext
{
  public DbSet<Address> Addresses { get; set; } = null!;
  ...
}
```

The difference is that I initialized my property to *null!* Technically speaking, the Null Forgiving Operator is actually the exclamation point specifically. But what I’m doing here is deliberately setting the property to null, THEN “promising” the compiler that I KNOW this value will be initialized by some method that the compiler can’t see (in this case, it’s the Entity Framework run-time that will initialize the property). With that change, the squiggly goes away, the code still compiles, and the application still runs.

Having just dove into C# 8 recently, I’m looking forward to finding more of these gems, and changing my coding styles to better use the newer features available. I’ve only used the Nullable Reference Types for a couple days now… but I love ’em!! And if you want to know more about the Null Forgiving Operator, you can find Microsoft’s documentation on it here: [https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/operators/null-forgiving](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/operators/null-forgiving)
