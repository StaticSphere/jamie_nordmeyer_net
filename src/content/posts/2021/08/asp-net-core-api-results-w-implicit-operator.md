---
title: "ASP.NET Core API Results w/ Implicit Operator"
excerpt: "In a project that I’m working on (for the sake of the code samples, this is written using .NET 5 and C# 9), I’m using…"
date: "2021-08-21T13:35:44"
author: "Jamie Nordmeyer"
featuredImage: "../../../../assets/images/2021/08/20210821_122534.jpg"
featuredImageAlt: ""
wpLink: "/2021/08/21/asp-net-core-api-results-w-implicit-operator/"
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

In a project that I’m working on (for the sake of the code samples, this is written using.NET 5 and C# 9), I’m using the fantastic [MediatR](https://github.com/jbogard/MediatR/wiki) library by Jimmy Bogard. With this library, I can offload the handing of API requests to handler classes that can be individually dependency injected with just dependencies needed for that one request. I’ve blogged before about using [single-endpoint controllers](/2021/02/13/single-endpoint-asp-net-api-controllers/) as well. Both options work, but I decided to use MediatR for this project. In the end, it’s slightly more code, but after some thought, I think it provides a better separation of concerns, since the handlers don’t have to care that they’re being called in an HTTP context.

Now, in keeping to that idea of properly separating concerns, I did not want my handlers returning action results, as those are typically the domain of your controllers. What I chose to do instead was to use a return type for all my handlers called `RequestResult` or `RequestResult<TResult>`. Each MediatR handler returns an object of one of these two types, which look like this:

```csharp
public record RequestResult
{
    public RequestResultStatus Status { get; init; } = RequestResultStatus.Success;
    public IEnumerable<string> Messages { get; init; } = new List<string>();

    public RequestResult()
    {
    }

    public RequestResult(RequestResultStatus status)
    {
        Status = status;
    }

    public RequestResult(RequestResultStatus status, params string[] messages)
    {
        Status = status;
        Messages = messages;
    }

    ...
}

public record RequestResult<TResult> : RequestResult
{
    public TResult? Data { get; init; }

    public RequestResult(RequestResultStatus status)
        : base(status)
    {
    }

    public RequestResult(RequestResultStatus status, params string[] messages)
        : base(status, messages)
    {
    }

    public RequestResult(TResult data)
    {
        Data = data;
    }

    ...
}
```

Now, in my handlers, when I want to return the results of an operation, I do so by returning either a `RequestResult` or a `RequestResult<TResult>` value. For example, here’s the MediatR handler for returning the avatar image of the currently logged in user:

```csharp
public async Task<RequestResult<FileData>> Handle(AvatarQuery request, CancellationToken cancellationToken = default)
{
    var storedFile = await _storedFileRepository.GetByKeyAsync(request.Key);
    if (storedFile == null)
        return new RequestResult<FileData>(RequestResultStatus.NotFound);

    var bytes = await _fileService.GetAvatarByKeyAsync(request.Key);

    return new RequestResult<FileData>(new FileData(bytes, storedFile.MediaType));
}
```

I’m first seeing if the details of the avatar image exist in the database, and if they don’t, I’m returning a RequestResult with a status of Not Found. I then get the bytes for the avatar from the file service, and return them wrapped in a RequestResult object.

The controller that is calling this handlers looks like this:

```csharp
[ApiController]
[Route("api/v{version:apiVersion}/avatar")]
[ApiVersion("1.0")]
public class AvatarController : ControllerBase
{
    private readonly IMediator _mediator;

    public AvatarController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("{key}")]
    [Authorize]
    public async Task<ActionResult> GetAvatarAsync([FromRoute] AvatarQuery query) =>
        await _mediator.Send(query);
}
```

You’ll notice that GetAvatarAsync HTTP endpoint is simply returning the results of the MediatR `Send` call, which is calling the above Handle method, yet it’s declared with a return type of `Task<ActionResult>`. So how are we going from a `RequestResult<TResult>` to an `ActionResult`? With an implicit operator that has been added to the two `RequestResult` types. Here’s the COMPLETE implementation of these types:

```csharp
public record RequestResult
{
    public RequestResultStatus Status { get; init; } = RequestResultStatus.Success;
    public IEnumerable<string> Messages { get; init; } = new List<string>();

    public RequestResult()
    {
    }

    public RequestResult(RequestResultStatus status)
    {
        Status = status;
    }

    public RequestResult(RequestResultStatus status, params string[] messages)
    {
        Status = status;
        Messages = messages;
    }

    public static implicit operator ActionResult(RequestResult requestResult) =>
        requestResult.Status switch
        {
            RequestResultStatus.Success => new OkResult(),
            RequestResultStatus.NotFound => new NotFoundResult(),
            RequestResultStatus.Invalid when requestResult.Messages.Count() > 0 =>
                new UnprocessableEntityObjectResult(requestResult.Messages),
            RequestResultStatus.Invalid => new UnprocessableEntityResult(),
            RequestResultStatus.Duplicate => new ConflictResult(),
            RequestResultStatus.Unauthorized => new UnauthorizedResult(),
            RequestResultStatus.Gone => new StatusCodeResult((int)HttpStatusCode.Gone),
            _ => new StatusCodeResult((int)HttpStatusCode.InternalServerError)
        };
}

public record RequestResult<TResult> : RequestResult
{
    public TResult? Data { get; init; }

    public RequestResult(RequestResultStatus status)
        : base(status)
    {
    }

    public RequestResult(RequestResultStatus status, params string[] messages)
        : base(status, messages)
    {
    }

    public RequestResult(TResult data)
    {
        Data = data;
    }

    public static implicit operator ActionResult(RequestResult<TResult> requestResult) =>
        requestResult.Status switch
        {
            RequestResultStatus.Success when requestResult.Data is FileData fd =>
                new FileContentResult(fd.Bytes, fd.MimeType),
            RequestResultStatus.Success => new OkObjectResult(requestResult.Data),
            _ => (RequestResult)requestResult
        };
}
```

You’ll notice that there are now implicit operators in both of the `RequestResult` types. Using the new C# 9 pattern matching syntax (I absolutely LOVE this syntax), I’m looking at the `Status` property of the result, and depending on what’s there, returning an appropriate `ActionResult` derived type. If the status is Success, then I return an `OkResult`. NotFound returns a `NotFoundResult`. And so forth. This can obviously be extended out as necessary, but in keeping in line with YAGNI (Ya ain’t gonna need it), I’ve only implemented the things that my code needs.

In the derived `RequestResult<TResult>` type, I have specific needs if the `Data` property is set. I handle those first, then pass off control to the base classes operator if the status is not specific to the `Data` property. In the case of the avatar query, the avatar file is handled with this line, which matches the Success status IF the `Data` property is a FileData type:

```csharp
RequestResultStatus.Success when requestResult.Data is FileData fd =>
                new FileContentResult(fd.Bytes, fd.MimeType)
```

Why go through this trouble? My MediatR handlers don’t need to concern themselves with responding to HTTP requests. As far as they’re “concerned”, they’re just handling a request for action without needing to care about what called them. They ONLY have to pass back a status with possible result data. And then my controllers don’t need to do anything other than call `Send` on the MediatR instance. The operator takes care of the details IMPLICITELY. It provides a beautiful separation of concern.
