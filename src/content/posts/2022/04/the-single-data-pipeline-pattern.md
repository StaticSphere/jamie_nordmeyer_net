---
title: "The Single Data Pipeline Pattern"
excerpt: "In a previous post, I talked about the Clean Architecture Pattern, and I presented a .NET 6 solution template that can be used to bootstrap…"
date: "2022-04-24T14:18:15"
author: "Jamie Nordmeyer"
featuredImage: "../../../../assets/images/2022/04/pexels-panumas-nikhomkhai-1148820.jpg"
featuredImageAlt: ""
wpLink: "/2022/04/24/the-single-data-pipeline-pattern/"
categories:
  - name: "Architecture"
    slug: "architecture"
  - name: "C#"
    slug: "c-sharp"
tags:
  - name: ".net core"
    slug: "net-core"
  - name: "C#"
    slug: "c"
---

In a previous [post](/2021/11/25/clean-architecture-solution-template/), I talked about the Clean Architecture Pattern, and I presented a.NET 6 solution template that can be used to bootstrap a.NET 6 API solution using this beautiful pattern. One of the patterns used in this template, if you opt into Entity Framework with the `-includeEF` parameter, is what I’m calling the Single Data Pipeline Pattern. I’m not sure if there’s an official name for this pattern, as I couldn’t find one when I went looking for it, so I’ll call it this until someone corrects me. 🙂

I’m a huge fan of sticking as much as possible to the SOLID Programming Principles when you can. This includes the S part of solid, or Single Responsibility Principle. The Single Data Pipeline Pattern, unlike the more traditional repository pattern, strives to ensure that each class in the pattern is only responsible for one and one only data pipeline to the database. It’s not concerned with the full CRUD for an entity. It cares only about reading a single form of the data. Or only about updating it. Or deleting it. But never a combination. This keeps these classes modular, and also satisfies the O of SOLID, or the Open/Closed Principle.

As an example, if I want to get a user’s avatar from the application, I might have an interface and implementation that looks like this:

```csharp
// Interface definition
public interface IGetUserAvatarDataService
{
    Task<StoredFile?> ExecuteAsync(Guid userUniqueKey, CancellationToken cancellationToken = default);
}

// Implementation
public class GetUserAvatarDataService : IGetUserAvatarDataService
{
    private readonly IApplicationDbContext _dbContext;

    public GetUserAvatarDataService(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<StoredFile?> ExecuteAsync(Guid userUniqueKey, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Users
            .Include(x => x.AvatarStoredFile)
            .Where(x => x.UniqueKey == userUniqueKey)
            .Select(x => x.AvatarStoredFile)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
```

The data service, by convention, exposes an `ExecuteAsync` method, which is the services ONLY public method. Note that this class has no ability to update or delete the user’s avatar. It only knows how to retrieve it. If my consuming code needs to also do some other work in the DB aside from retrieving the user’s avatar, then it would inject a data service for each of those additional operations as well.

For example, the endpoint for deleting a user’s avatar might look something like this:

```csharp
public class DeleteUserAvatarCommand : EndpointBaseAsync
    .WithRequest<DeleteUserAvatarViewModel>
    .WithActionResult
{
    private readonly IRequestValidator<DeleteUserAvatarViewModel> _requestValidator;
    private readonly IGetUserWithAvatarDataService _getUserWithAvatarDataService;
    private readonly IDeleteUserAvatarDataService _deleteUserAvatarDataService;
    private readonly IFileService _fileService;

    public DeleteUserAvatarCommand(
        IRequestValidator<DeleteUserAvatarViewModel> requestValidator,
        IGetUserWithAvatarDataService getUserWithAvatarDataService,
        IDeleteUserAvatarDataService deleteUserAvatarDataService,
        IFileService fileService)
    {
        _requestValidator = requestValidator;
        _getUserWithAvatarDataService = getUserWithAvatarDataService;
        _deleteUserAvatarDataService = deleteUserAvatarDataService;
        _fileService = fileService;
    }

    [HttpDelete("api/v{version:apiVersion}/user/{uniqueKey:guid}/avatar")]
    [Authorize]
    public override async Task<ActionResult> HandleAsync([FromRoute] DeleteUserAvatarViewModel request, CancellationToken cancellationToken = default)
    {
        var validationErrors = _requestValidator.ValidateRequest(request);
        if (validationErrors.Any())
            return UnprocessableEntity(validationErrors.ToArray());

        var user = await _getUserWithAvatarDataService.ExecuteAsync(request.UniqueKey, cancellationToken);
        if (user is null)
            return NotFound();

        var fileUniqueKey = user.AvatarStoredFile?.UniqueKey;
        await _deleteUserAvatarDataService.ExecuteAsync(user, cancellationToken);
        _fileService.DeleteAvatarByKey(fileUniqueKey);

        return NoContent();
    }
}
```

Notice that this endpoint uses TWO data services to do is work; one to get the user’s record along with their avatar, and another to affect the avatars deletion. The individual calls to the database are not controlled from the same class as a repository might be. Each is independently injected and maintained. They’re also easy to mock when unit testing the classes that consume the endpoints.

Now that said, a data service using the Single Data Pipeline Pattern CAN interact with the DB more than once, if necessary, inside the `ExecuteAsync` method. The key is that these operations be part of the same data flow. For example, here’s the `ExecuteAsync` method on the `DeleteUserAvatarDataService`:

```csharp
public async ValueTask ExecuteAsync(ApplicationUser user, CancellationToken cancellationToken = default)
{
    if (user?.AvatarStoredFile is not null)
    {
        _dbContext.StoredFiles.Remove(user.AvatarStoredFile);
        user.AvatarStoredFile = null;

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
```

There’s actually TWO distinct database operations going on in this code. When the `_dbContext.SaveChangesAsync` method is called, it will first issue a DELETE statement to remove the `StoredFile` record (metadata for the avatar, or any other file that’s been uploaded by the user in my application), followed by an UPDATE statement on the User record (to set the `AvatarStoredFileId` column, which the `AvatarStoredFile` property is tied to via foreign key, to null).

As a side note, the reason that I use the naming scheme for these data services like I do is to allow me to create some bootstrapping code that will automatically add them to the dependency injection container at startup. This code exists in the.NET 6 solution template referenced at the beginning of this post. Each of my data service contracts will be called `ISomethingDataService`, and its implementation class will be called `SomethingDataService`. Then in my application start up, I can use reflection to pull them all into the DI container:

```csharp
private static readonly Regex InterfacePattern = new Regex("I(?:.+)DataService", RegexOptions.Compiled);
// ...
(from c in typeof(Application.DependencyInjection).Assembly.GetTypes()
 where c.IsInterface && InterfacePattern.IsMatch(c.Name)
 from i in typeof(Infrastructure.DependencyInjection).Assembly.GetTypes()
 where c.IsAssignableFrom(i)
 select new
 {
     Contract = c,
     Implementation = i
 }).ToList()
 .ForEach(x => services.AddScoped(x.Contract, x.Implementation));
```
