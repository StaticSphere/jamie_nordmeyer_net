---
title: ".NET, DynamoDB, and DateTime"
excerpt: "There is an issue when using the AWSSDK.DynamoDBv2 NuGet package; it doesn’t like Nullable<DateTime> values. For some reason, the built in converters do not handle…"
date: "2018-09-10T12:53:27"
author: "Jamie Nordmeyer"
featuredImage: null
featuredImageAlt: ""
wpLink: "/2018/09/10/net-dynamodb-and-datetime/"
categories:
  - name: "C#"
    slug: "c-sharp"
  - name: "Programming"
    slug: "programming"
tags:
  - name: "C#"
    slug: "c"
  - name: "DynamoDB"
    slug: "dynamodb"
---

There is an issue when using the AWSSDK.DynamoDBv2 NuGet package; it doesn’t like Nullable<DateTime> values. For some reason, the built in converters do not handle these properties correctly should the value be null.

To remedy the situation, you need to create an IPropertyConverter implementation, and then assign it to the property via the DynamoDBProperty attribute. Here is the IPropertyConverter implementation that I used:

```csharp
public class DateConverter : IPropertyConverter
{
    public object FromEntry(DynamoDBEntry entry)
    {
        var dateTime = entry?.AsString();
        if (string.IsNullOrEmpty(dateTime))
            return null;

        if (!DateTime.TryParse(dateTime, out DateTime value))
            throw new ArgumentException("entry parameter must be a validate DateTime value.", nameof(entry));
        else
            return value;
    }

    public DynamoDBEntry ToEntry(object value)
    {
        if (value == null)
            return new DynamoDBNull();

        if (value.GetType() != typeof(DateTime) && value.GetType() != typeof(DateTime?))
            throw new ArgumentException("value parameter must be a DateTime or a Nullable<DateTime>.", nameof(value));

        return ((DateTime)value).ToString();
    }
}
```

Once that’s defined, you then apply it to your Nullable<DateTime> property by using the 2nd parameter of the DynamoDBProperty attribute:

```csharp
[DynamoDBProperty("created", typeof(DateConverter))]
public DateTime? Created { get; set; }
```
