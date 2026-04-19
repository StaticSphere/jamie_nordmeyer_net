---
title: "Using Python Type Hints with AWS Lambda"
excerpt: "When working with AWS Lambda functions, you have access to some libraries by default such as boto3. However, what is NOT include by default is type hint stubs for these libraries."
date: "2026-04-18T17:16:37"
author: "Jamie Nordmeyer"
featuredImage: "../../../../assets/images/coding_screen.jpg"
featuredImageAlt: ""
wpLink: "/2026/04/18/python-lambda-typing/"
categories:
  - name: "Python"
    slug: "python"
  - name: "AWS"
    slug: "aws"
tags:
  - name: "Python"
    slug: "python"
  - name: "Typing"
    slug: "typing"
  - name: "Lambda"
    slug: "lambda"
---

When working with AWS Lambda functions, you have access to some libraries by default such as [boto3](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html).
However, what is NOT include by default is type hint stubs for these libraries. If you're writing your Lambda functions using Python and Python type hints, then you won't be able
to use the boto3 types in the AWS Lambda runtime unless you include them in a layer or in a deployment package. If, however, you just want to keep your Lambda function simple
and not have to worry about layers or deployment packages, there is an option.

You do have access to the `typing` package in AWS Lambda Functions, and one of the exported types that you can export is called `TYPE_CHECKING`.
This is a constant that is `True` when you're working in your local development environment, but is `False` when your code is running in the AWS Lambda runtime.
What this lets you do is to import the boto3 types when you're developing and testing in your local environment, but then when you deploy to AWS Lambda, you can
tell the code to ignore the imports; they'll act the same as if you'd used them to alias the `Any` type.

For example, I wrote this code recently for a Lambda function that reads a CSV file from S3 and updates items in a DynamoDB table based on the contents of the CSV.
I wanted to use type hints for the boto3 types, but I didn't want to have to worry about including them in a layer or deployment package. By using `TYPE_CHECKING`,
I was able to import the boto3 types for local development and testing, and when the code was deployed into AWS Lambda, the types are treated like `Any`, and the
Lambda function works as expected.

```python
# Import TYPE_CHECKING to determine if we need to import types for development
from typing import TYPE_CHECKING, Any

import csv
import io
import os
from decimal import Decimal
from typing import Any, Dict, Iterable, Mapping

import boto3
from boto3.dynamodb.conditions import Attr

# Only import these types when we're in a development environment, not in the AWS Lambda runtime
if TYPE_CHECKING:
    from mypy_boto3_dynamodb.service_resource import Table
    from mypy_boto3_s3.client import S3Client

def parse_value(value: str) -> Any:
    """
    Convert CSV string values into DynamoDB-friendly Python values.

    DynamoDB via boto3 prefers Decimal over float for numeric values.
    Empty strings are returned as None so the caller can choose to skip them.
    """
    stripped: str = value.strip()

    if stripped == "":
        return None

    # Try int first
    try:
        return int(stripped)
    except ValueError:
        pass

    # Try decimal next
    try:
        return Decimal(stripped)
    except Exception:
        pass

    return stripped


def build_update_expression(
    row: Mapping[str, str],
    key_fields: set[str],
) -> tuple[str, Dict[str, str], Dict[str, Any]]:
    """
    Build a DynamoDB SET update expression from the non-key fields in a CSV row.
    """
    expression_attribute_names: Dict[str, str] = {}
    expression_attribute_values: Dict[str, Any] = {}
    set_parts: list[str] = []

    for field_name, raw_value in row.items():
        if field_name in key_fields:
            continue

        parsed_value: Any = parse_value(raw_value)
        if parsed_value is None:
            # Skip blank values so they do not overwrite existing attributes.
            continue

        name_token: str = f"#f_{field_name}"
        value_token: str = f":v_{field_name}"

        expression_attribute_names[name_token] = field_name
        expression_attribute_values[value_token] = parsed_value
        set_parts.append(f"{name_token} = {value_token}")

    if not set_parts:
        raise ValueError("No updatable fields were found in the row.")

    update_expression: str = "SET " + ", ".join(set_parts)
    return update_expression, expression_attribute_names, expression_attribute_values


def update_row(
    table: Table,
    row: Mapping[str, str],
    partition_key_name: str = "person_id",
    sort_key_name: str = "sort_id",
) -> None:
    """
    Update a single DynamoDB item identified by partition and sort keys.
    """
    if partition_key_name not in row or sort_key_name not in row:
        raise ValueError(
            f"Row must contain '{partition_key_name}' and '{sort_key_name}'."
        )

    key: Dict[str, Any] = {
        partition_key_name: parse_value(row[partition_key_name]),
        sort_key_name: parse_value(row[sort_key_name]),
    }

    update_expression, expression_attribute_names, expression_attribute_values = (
        build_update_expression(row, {partition_key_name, sort_key_name})
    )

    table.update_item(
        Key=key,
        UpdateExpression=update_expression,
        ExpressionAttributeNames=expression_attribute_names,
        ExpressionAttributeValues=expression_attribute_values,
        ConditionExpression=Attr(partition_key_name).exists() & Attr(sort_key_name).exists(),
    )


def read_csv_from_s3(s3_client: S3Client, bucket: str, key: str) -> list[dict[str, str]]:
    """
    Read a CSV object from S3 and return a list of rows.
    """
    response = s3_client.get_object(Bucket=bucket, Key=key)
    body_bytes: bytes = response["Body"].read()
    text_stream = io.StringIO(body_bytes.decode("utf-8"))
    reader = csv.DictReader(text_stream)
    return list(reader)


def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """
    Lambda entry point.

    Expected event shape:
    {
        "bucket": "my-bucket-name",
        "key": "updates.csv"
    }

    Or use environment variables:
    - TABLE_NAME
    - UPDATES_BUCKET
    - UPDATES_KEY
    """
    table_name: str = os.environ["TABLE_NAME"]

    bucket: str = event.get("bucket") or os.environ["UPDATES_BUCKET"]
    key: str = event.get("key") or os.environ["UPDATES_KEY"]

    dynamodb = boto3.resource("dynamodb")
    s3_client = boto3.client("s3")

    table: Table = dynamodb.Table(table_name)

    rows: list[dict[str, str]] = read_csv_from_s3(s3_client, bucket, key)

    updated_count: int = 0
    failed_rows: list[dict[str, Any]] = []

    for index, row in enumerate(rows, start=1):
        try:
            update_row(table, row)
            updated_count += 1
        except Exception as exc:
            failed_rows.append(
                {
                    "row_number": index,
                    "person_id": row.get("person_id"),
                    "sort_id": row.get("sort_id"),
                    "error": str(exc),
                }
            )

    return {
        "statusCode": 200,
        "table": table_name,
        "source": {"bucket": bucket, "key": key},
        "rows_processed": len(rows),
        "rows_updated": updated_count,
        "rows_failed": len(failed_rows),
        "failures": failed_rows,
    }
```

The output of this Lambda function will look something like this when it runs successfully, with all specified DynamoDB rows processed and updated:

```json
{
  "statusCode": 200,
  "table": "test_table",
  "source": {
    "bucket": "nordy-test-bucket-us-west-2",
    "key": "updates.csv"
  },
  "rows_processed": 3,
  "rows_updated": 3,
  "rows_failed": 0,
  "failures": []
}
```