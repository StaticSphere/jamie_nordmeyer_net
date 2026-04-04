---
title: ".NET Global CLI’s"
excerpt: "UPDATE: This project has now been upgraded to .NET 8. I’ve blogged about it here Merry Christmas and Happy Holidays to everyone!!! I know that…"
date: "2021-12-25T21:24:33"
author: "Jamie Nordmeyer"
featuredImage: "../../../../assets/images/2021/12/console-guid.png"
featuredImageAlt: ""
wpLink: "/2021/12/25/net-global-clis/"
categories:
  - name: "C#"
    slug: "c-sharp"
tags:
  - name: ".net core"
    slug: "net-core"
  - name: "C#"
    slug: "c"
---

**UPDATE**: This project has now been upgraded to.NET 8. I’ve blogged about it [here](/2024/03/03/open-source-project-updates/)

Merry Christmas and Happy Holidays to everyone!!! I know that it’s Christmas day, but as the day winds down, and I sit here after a fabulous Christmas dinner, I have some time to kill, so I thought I’d get out this short post. 🙂

The other day I was watching this video from the talented Nick Chapsas:

<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio"><div class="wp-block-embed__wrapper">
<iframe loading="lazy" title="How to create your own.NET CLI tools to make your life easier" width="500" height="281" src="https://www.youtube.com/embed/JNDgcBDZPkU?start=342&#038;feature=oembed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div></figure>

I’ve created CLI applications before with.NET Core as well as.NET Framework, but I’ve never thought about doing so using the.NET tooling infrastructure. This is actually a really nice way to package up a CLI as a NuGet package, distribute it, and install it globally on your system so that instead of having to use `dotnet run`, you can just use a chosen name for the CLI without having to compile it to a native application on each operating system. In this post, I’m going to cover how I used the tools shown by Nick to create an extremely simple CLI for generating GUID’s.

I created a new.NET 6 console application with the `dotnet new console` command. To this project, I added a reference to the CommandLineParser NuGet package. When this project is built, it creates a NuGet package, so I included the following `PropertyGroup` sections to the.csproj file to define the NuGet attriutes displayed with the package:

```xml
<PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net6.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <PackAsTool>true</PackAsTool>
    <ToolCommandName>guid</ToolCommandName>
    <PackageOutputPath>./dist</PackageOutputPath>
    <DefaultNamespace>StaticSphere.Cli.Guid</DefaultNamespace>
  </PropertyGroup>
<PropertyGroup>
  <PackageVersion>1.0.0</PackageVersion>
  <PackageId>StaticSphere.Cli.Guid</PackageId>
  <Title>GUID Command Line Interface</Title>
  <Company>StaticSphere</Company>
  <Authors>Jamie Nordmeyer</Authors>
  <Copyright>Jamie Nordmeyer © 2021</Copyright>
  <Description>A global .NET based tool for generating GUID's</Description>
  <PackageTags>c#;core;cli</PackageTags>
  <PackageCopyright>Jamie Nordmeyer © 2021</PackageCopyright>
  <PackageProjectUrl>https://github.com/StaticSphere/guid-cli</PackageProjectUrl>
  <PackageLicenseExpression>MIT</PackageLicenseExpression>
  <RepositoryType>git</RepositoryType>
  <RepositoryUrl>https://github.com/StaticSphere/guid-cli</RepositoryUrl>
</PropertyGroup>
```

Next, I created a class called `CommandLineOptions` that tells my application how to display the command line parameters that I want the applications user to optionally provide. When the CLI is run with the `--help` parameter, it uses the settings specified in this class to show the user the parameters that they can define:

```csharp
using CommandLine;

public class CommandLineOptions
{
    [Option('l', "lowercase", Required = false, HelpText = "If specified, the guid is created with lowercase letters")]
    public bool LowerCase { get; set; }

    [Option('n', "nodashes", Required = false, HelpText = "If specified, the guid is created with no dashes")]
    public bool NoDashes { get; set; }
}
```

I really like how the `CommandLineParser` project wraps these options, as it’s extremely easy to specify the options that you want to provide, and to read the code and determine how to use the various parameters are being used.

Finally, the Program.cs file itself is using C# pattern matching syntax, along with the provided options if defined by the user, to create a GUID with the proper output format:

```csharp
using CommandLine;

Parser
    .Default
    .ParseArguments<CommandLineOptions>(Environment.GetCommandLineArgs())
    .WithParsed(o =>
    {
        var guid = o switch
        {
            { LowerCase: false, NoDashes: false } => Guid.NewGuid().ToString().ToUpper(),
            { LowerCase: false, NoDashes: true } => Guid.NewGuid().ToString("N").ToUpper(),
            { LowerCase: true, NoDashes: false } => Guid.NewGuid().ToString(),
            { LowerCase: true, NoDashes: true } => Guid.NewGuid().ToString("N")
        };

        Console.WriteLine(guid);
    });
```

You can still run this application without installing it:

```text
cd <<source location>>
dotnet run
dotnet run --lowercase
dotnet run -n
dotnet run -ln
```

But if you want to install it as a global tool, you’ll need to pack it and install it:

```text
cd <<source location>>
dotnet pack # This creates a NuGet package under the ./dist folder
dotnet tool install --global --add-source ./dist StaticSphere.Cli.Guid
```

But of course, you can install it from NuGet.org if you’d rather have the already compiled version:

```text
dotnet tool install --global StaticSphere.Cli.Guid
```

You can find the source on GitHub [here](https://github.com/StaticSphere/guid-cli), and the NuGet package, ready to be installed, via the above command line, [here](https://www.nuget.org/packages/StaticSphere.Cli.Guid/).
