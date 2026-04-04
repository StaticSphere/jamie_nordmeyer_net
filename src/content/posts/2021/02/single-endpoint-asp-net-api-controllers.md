---
title: "Single Endpoint ASP.NET API Controllers"
excerpt: "Traditional ASP.NET API Controllers When working with ASP.NET API’s, it’s common practice to have a controller class defined that represents the set of endpoints for…"
date: "2021-02-13T22:13:13"
author: "Jamie Nordmeyer"
featuredImage: "../../../../assets/images/2021/02/controller-scaled.jpg"
featuredImageAlt: ""
wpLink: "/2021/02/13/single-endpoint-asp-net-api-controllers/"
categories:
  - name: "Architecture"
    slug: "architecture"
  - name: "C#"
    slug: "c-sharp"
tags:
  - name: "api"
    slug: "api"
  - name: "asp.net"
    slug: "asp-net"
---

## Traditional ASP.NET API Controllers

When working with ASP.NET API’s, it’s common practice to have a controller class defined that represents the set of endpoints for a given resource. For example, if your API is working with a Contact resource, the controller will have several endpoints defined, maybe something like the following:

- GET /contacts
- GET /contacts/1
- POST /contacts
- PUT /contacts
- DELETE /contacts

This would be implemented in a class that ultimately derives from `ControllerBase`, and would handle each endpoint in its own public method as shown in this example code:

```csharp
[ApiController]
[Route("api/[controller]")]
public class ContactController : ControllerBase
{
  private readonly IAppDbContext _dbContext;

  public ContactController(IAppDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [HttpGet]
  public async Task<IEnumerable<ContactViewModel>> GetContacts()
  {
    return await _dbContext.Contacts.Select(c =>
    {
      new ContactViewModel
      {
        Id = c.Id,
        Name = c.Name,
        Active = c.Active
      }
    }).ToListAsync().ConfigureAsync(false);
  }

  [HttpGet("{id:int}")]
  public async Task<ContactViewModel> GetContact(int id)
  {
    return await _dbContext.Contacts.Select(c =>
    {
      new ContactViewModel
      {
        Id = c.Id,
        Name = c.Name,
        Active = c.Active
      }
    }).FirstOrDefault(c => c.Id = id).ConfigureAsync(false);
  }

  ... Etc.
}
```

Usually, you won’t see the controller class methods making direct database calls as this code is doing. Instead, the database work, along with any other work that touches outside resources, will be extracted into services which the controller then uses.

```text
[ApiController]
[Route("api/[controller]")]
public class ContactController : ControllerBase
{
  private readonly IContactService _contactService;

  public ContactController(IContactService contactService)
  {
    _contactService = contactService;
  }

  [HttpGet]
  public async Task<IEnumerable<ContactViewModel>> GetContacts()
  {
    return await _contactService.GetAllContacts();
  }

  [HttpGet("{id:int}")]
  public async Task<ContactViewModel> GetContact(int id)
  {
    return await _contactService.GetContactById(id);
  }

  ... Etc.
}
```

This greatly simplifies our controller, but there’s still a problem. Each endpoint method could very well have their own dependencies. For instance, I might need to inject an email service that must be called when writing a new contact record. I have only 1 endpoint that needs this service (the POST method), yet EVERY endpoint will have this service injected when the controller is created since dependencies are defined by the constructor of the controller class. This means that the ASP.NET runtime must create an instance of the service even when it’s not needed, and it means that you as the developer must set up a mock for it when writing your unit tests.

## Mediator Pattern

A popular solution to this problem is to rely on the [Mediator pattern](https://en.wikipedia.org/wiki/Mediator_pattern). A popular implementation of this pattern for ASP.NET is [Mediatr](https://github.com/jbogard/MediatR). This is an awesome library put together by Jimmy Bogard, who’s also the author of the immensely popular AutoMapper library. The Mediatr library allows your controller to simply take in the request parameters for your endpoint, and then mediate the responsibility of handling the request to another service class whose sole purpose is to handle this ONE request type. There’s a single class that handles the GET /contacts endpoint, another one that handles GET /contacts/{id}, etc. By doing this, you now only need to inject those services that THAT endpoint actually needs. The aforementioned email service is not created or injected for the GET /contacts endpoint handler, but IS created and injected into the POST /contacts endpoint handler.

I think this is an awesome way to think about handling API endpoints; have a single class whose sole purpose is to handle a single endpoint. That’s it. Maintenance is easier, as is unit testing because the class that handles any given endpoint is ONLY as complicated as is necessary to fulfill that single endpoint and no more.

## Single Endpoint Controllers

While the mediator pattern is indeed a great way to manage your controllers to simplify testing, I personally prefer another method; using single endpoint controllers. When using the mediator pattern, you still have a controller with multiple endpoints, with each endpoint calling to the mediator to do work. This is an unnecessary abstraction in my opinion. Instead, I like creating controllers that have just a single endpoint. This works similarly to the mediator services, in that it allows any given endpoint to have just its dependencies injected, and doesn’t require the frontal controller that the mediator pattern uses. ASP.NET does not require that your controller classes actually live in the Controllers folder; this is just a convention. So you can categorize these however you want. In my case, I tend to break them up into folders called Queries and Commands, which follows the CQRS (Command/Query Responsibility Segregation) mindset.

This is an example of one of the endpoint controllers in a project that I’m working on. It’s the DELETE method used for expiring a pricing package in the application (we’re using soft deletes in the app):

```csharp
public class ExpirePackageCommand : ControllerBase
{
    private readonly IAppDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly IDateTimeService _dateTimeService;

    public ExpirePackageCommand(IAppDbContext dbContext, IMapper mapper, IDateTimeService dateTimeService)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _dateTimeService = dateTimeService;
    }

    [HttpDelete("/api/packages/{id:int}")]
    [Authorize(Policy = "CanExpirePackages")]
    public async Task<ActionResult<PackageViewModel>> HandleAsync([FromRoute] int id, CancellationToken cancellationToken = default)
    {
        var package = await _dbContext.Packages.FirstOrDefaultAsync(l => l.Id == id);
        if (package == null)
            return NotFound();

        package.ExpiredOn = _dateTimeService.UtcNow;
        await _dbContext.SaveChangesAsync().ConfigureAwait(false);

        return NoContent();
    }
}
```

In this case, because soft deleting, or expiring, a package means setting the ExpiredOn value to the current UTC date/time, I inject an instance of the IDateTimeService (I discuss the reasons behind this [here](/2021/02/10/mocking-systems-resources-in-c-asp-net/)). However, for a GET operation, this service is unnecessary, so it’s not injected. My controllers are very tight and focused this way, easy to unit test, and minimize abstractions.
