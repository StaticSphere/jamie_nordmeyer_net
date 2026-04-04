---
title: "Comprehensive Logging in .NET Core 2"
excerpt: "Logging is one of those items that are critically important to an applications maintainability and ease of troubleshooting. It also tends to be an afterthought,…"
date: "2018-09-11T12:12:10"
author: "Jamie Nordmeyer"
featuredImage: null
featuredImageAlt: ""
wpLink: "/2018/09/11/comprehensive-logging-in-net-core-2/"
categories:
  - name: "C#"
    slug: "c-sharp"
  - name: "Programming"
    slug: "programming"
tags:
  - name: "logging"
    slug: "logging"
---

Logging is one of those items that are critically important to an applications maintainability and ease of troubleshooting. It also tends to be an afterthought, left as something that you’ll do “if you get around to it.” Fortunately, in.NET Core, there are a couple tricks that you can use to greatly simplify this effort: action filters and exception filters.

The code mentioned in this blog is targeted toward.NET Core 2.0, but should be easy to back-port to 1.x. In the examples that follow, ILoggerService and IHostingService are interfaces that I use for wrapping existing.NET Core interfaces that use extension methods. Because extension methods can’t be wrapped by a mocking framework, you need to create a wrapper implementation around interfaces that use them. I’m a huge fan of the [Moq](https://github.com/moq/moq4) library here, and that is what is being used in the samples below.

## Logging HTTP Requests

The first thing we want to do is to create an action filter. This is a class that implements the IActionFilter interface. This interface defines two methods: OnActionExecuting, which is called whenever a controller action is ABOUT TO BE executed, and OnActionExecuted, which is called AFTER the action has executed. This is useful because it allows us to create a generalized filter that will respond to ALL routed HTTP requests, and do something with that request before and after the controller action is ran, including logging. So, a general filter that will log all routed HTTP requests might look something like this:

```csharp
public class ActionLoggingFilter : IActionFilter
{
    private readonly ILoggerService _logger;

    public ActionLoggingFilter(ILoggerService loggerService)
    {
        _logger = loggerService;
    }

    public void OnActionExecuting(ActionExecutingContext context)
    {
        var method = context.HttpContext.Request.Method;
        var controller = context.RouteData.Values["controller"];
        var action = context.RouteData.Values["action"];
        var message = $"Starting execution of {method} request on {controller}.{action}.";

        _logger.LogDebug(message);
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        var method = context.HttpContext.Request.Method;
        var controller = context.RouteData.Values["controller"];
        var action = context.RouteData.Values["action"];
        var message = $"Completed execution of {method} request on {controller}.{action}.";

        _logger.LogDebug(message);
    }
}
```

The ILoggerService is injected in by.NET Core’s dependency injection framework, and is used in this context to write out logs about the request IF the logging level for the application is set to Debug. This means that, under normal operation, no logs are generated. However, if we need to troubleshoot something, we just need to update the applications configuration so that the logging level is set to Debug. Now, every routed request is preceded and followed by a log entry, allowing us to more easily trace a request’s flow.

## Logging Exceptions

Next, if we want a global exception handler, we need to write a class that implements the IExceptionFilter interface. This class exposes a single method, called OnException, which is called whenever there is an UNHANDLED exception. As an example:

```csharp
public class ApplicationExceptionFilter : IExceptionFilter
{
    private readonly IHostingService _hostingService;
    private readonly IModelMetadataProvider _modelMetadataProvider;
    private readonly ILoggerService _logger;

    public ApplicationExceptionFilter(IHostingService hostingService, IModelMetadataProvider modelMetadataProvider, ILoggerService loggerService)
    {
        _hostingService = hostingService;
        _modelMetadataProvider = modelMetadataProvider;
        _logger = loggerService;
    }

    public void OnException(ExceptionContext context)
    {
        var method = context.HttpContext.Request.Method;
        var controller = context.RouteData.Values["controller"];
        var action = context.RouteData.Values["action"];
        var message = $"An exception was encountered during the execution of a {method} request on {controller}.{action}.";

        _logger.LogError(context.Exception, message);

        if (!_hostingService.IsDevelopment())
            return;

        var result = new ViewResult { ViewName = "CustomError" };
        result.ViewData = new ViewDataDictionary(_modelMetadataProvider, context.ModelState)
        {
            { "Exception", context.Exception }
        };
        context.Result = result;
    }
}
```

Again, the dependency injection framework will provide the 3 defined dependencies here: IHostingService, IModelMetadataProvider, and ILoggerService. The OnException method writes an Error log entry with LogError. It then looks to see if it’s running in development mode. If not, it simply returns, and the exception continues to bubble up, resulting in an appropriate HTTP response code. However, if we ARE in development mode, the context.Result value is provided with details about the error that can be rendered in a browser.

## Wiring it Up

Once you’ve created these two classes, you need to tell.NET Core to use them..NET Core relies on a file called Startup.cs, which allows you to define the services that the application will need, as well as the handler pipeline that will be used when processing an HTTP request. In order to add the filters into the pipeline, you need to adjust your Startup.ConfigureServices method:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddOptions();

    services.AddMvc(options =>
    {
        options.Filters.Add<ActionLoggingFilter>();
        options.Filters.Add<ApplicationExceptionFilter>();
    });

    // Any other services...
}
```

Now when your application runs, all controller actions will be logged (if your configuration is set to Debug logging level), and all unhandled exceptions will be logged, all without you having to add anything additional to your controller actions. You can still add additional, contextual logging to your controller actions if that makes sense.

## Unit Tests

The unit tests for ActionLoggingFilter are pretty strait forward. The ActionContext value passed into the methods of IActionFilter need to be mocked with route data, and looks like this:

```csharp
public class ActionLoggingFilterTests
{
    private readonly Mock<ILoggerService> _loggerService;
    private readonly ActionContext _actionContext;

    public ActionLoggingFilterTests()
    {
        _loggerService = new Mock<ILoggerService>();

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Method = "GET";
        var routeData = new RouteData();
        routeData.Values.Add("controller", "Controller");
        routeData.Values.Add("action", "Action");
        _actionContext = new ActionContext(httpContext, routeData, new ActionDescriptor());
    }

    [Fact]
    public void OnActionExecutingLogsDebugMessage()
    {
        var actionExecutingContext = new ActionExecutingContext(
            _actionContext,
            new List<IFilterMetadata>(),
            new Dictionary<string, object>(),
            null);
        var message = "Starting execution of GET request on Controller.Action.";
        _loggerService.Setup(x => x.LogDebug(message));
        var filter = new ActionLoggingFilter(_loggerService.Object);

        filter.OnActionExecuting(actionExecutingContext);

        _loggerService.Verify(x => x.LogDebug(message), Times.Once);
    }

    [Fact]
    public void OnActionExecutedLogsDebugMessage()
    {
        var actionExecutedContext = new ActionExecutedContext(
            _actionContext,
            new List<IFilterMetadata>(),
            null);

        var message = "Completed execution of GET request on Controller.Action.";
        _loggerService.Setup(x => x.LogDebug(message));
        var filter = new ActionLoggingFilter(_loggerService.Object);

        filter.OnActionExecuted(actionExecutedContext);

        _loggerService.Verify(x => x.LogDebug(message), Times.Once);
    }
}
```

Each test creates the appropriate context, then verifies that the LogDebug method was called, and that it was called with the proper message.

The unit tests for the ApplicationExceptionFilter are slightly more complex:

```csharp
public class ApplicationExceptionFilterTests
{
    private readonly Mock<IHostingService> _hostingService;
    private readonly Mock<IModelMetadataProvider> _modelMetadataProvider;
    private readonly Mock<ILoggerService> _loggerService;
    private readonly ActionContext _actionContext;

    public ApplicationExceptionFilterTests()
    {
        _hostingService = new Mock<IHostingService>();
        _modelMetadataProvider = new Mock<IModelMetadataProvider>();
        _loggerService = new Mock<ILoggerService>();

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Method = "GET";
        var routeData = new RouteData();
        routeData.Values.Add("controller", "Controller");
        routeData.Values.Add("action", "Action");
        _actionContext = new ActionContext(httpContext, routeData, new ActionDescriptor());
    }

    [Fact]
    public void OnExceptionLogsErrorMessage()
    {
        var exception = new ApplicationException("Test");
        var exceptionContext = new ExceptionContext(_actionContext, new List<IFilterMetadata>())
        {
            Exception = exception
        };
        var message = "An exception was encountered during the execution of a GET request on Controller.Action.";
        _loggerService.Setup(x => x.LogError(exception, message));
        var filter = new ApplicationExceptionFilter(_hostingService.Object, _modelMetadataProvider.Object, _loggerService.Object);

        filter.OnException(exceptionContext);

        _loggerService.Verify(x => x.LogError(exception, message), Times.Once);
    }

    [Fact]
    public void OnExceptionReturnsViewResultWhenInDevelopmentMode()
    {
        _hostingService.Setup(x => x.IsDevelopment()).Returns(true);
        var identity = ModelMetadataIdentity.ForType(typeof(object));
        var metadata = new Mock<ModelMetadata>(identity) { CallBase = true };
        _modelMetadataProvider.Setup(x => x.GetMetadataForType(typeof(object))).Returns(metadata.Object);

        var exception = new ApplicationException("Test");
        var exceptionContext = new ExceptionContext(_actionContext, new List<IFilterMetadata>())
        {
            Exception = exception
        };
        var filter = new ApplicationExceptionFilter(_hostingService.Object, _modelMetadataProvider.Object, _loggerService.Object);

        filter.OnException(exceptionContext);

        var result = exceptionContext.Result as ViewResult;

        Assert.NotNull(result);
        Assert.Equal("CustomError", result.ViewName);
        Assert.NotNull(result.ViewData);
        Assert.True(result.ViewData.Keys.Contains("Exception"));
        Assert.Equal(exception, result.ViewData["Exception"]);
    }

    [Fact]
    public void OnExceptionDoesNotModifyResultWhenNotInDevelopmentMode()
    {
        _hostingService.Setup(x => x.IsDevelopment()).Returns(false);
        var exception = new ApplicationException("Test");
        var exceptionContext = new ExceptionContext(_actionContext, new List<IFilterMetadata>())
        {
            Exception = exception
        };
        var filter = new ApplicationExceptionFilter(_hostingService.Object, _modelMetadataProvider.Object, _loggerService.Object);

        filter.OnException(exceptionContext);

        var result = exceptionContext.Result;

        Assert.Null(result);
    }
}
```

Again, I have to mock the ActionContext to provide route data. I also have to mock the IModelMetadataProvider interface, which is used in defining the exception values that the IExceptionFilter interface is expected to work with.

A sample application demonstrating these techniques can be found here: [https://github.com/StaticSphere/LoggingSample](https://github.com/StaticSphere/LoggingSample)
