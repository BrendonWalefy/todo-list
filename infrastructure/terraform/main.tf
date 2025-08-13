terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# DynamoDB Table
resource "aws_dynamodb_table" "tasks_table" {
  name           = "${var.project_name}-tasks-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  range_key      = "userId"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name     = "UserIdStatusIndex"
    hash_key = "userId"
    range_key = "status"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Lambda Function
resource "aws_lambda_function" "tasks_api" {
  filename         = "../backend/dist/lambda.zip"
  function_name    = "${var.project_name}-tasks-api-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs20.x"
  timeout         = 30
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.tasks_table.name
      ENVIRONMENT    = var.environment
    }
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for Lambda
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy-${var.environment}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.tasks_table.arn,
          "${aws_dynamodb_table.tasks_table.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# API Gateway
resource "aws_api_gateway_rest_api" "tasks_api" {
  name        = "${var.project_name}-tasks-api-${var.environment}"
  description = "Tasks API for Kanban application"
}

# API Gateway Resource
resource "aws_api_gateway_resource" "tasks" {
  rest_api_id = aws_api_gateway_rest_api.tasks_api.id
  parent_id   = aws_api_gateway_rest_api.tasks_api.root_resource_id
  path_part   = "tasks"
}

# API Gateway Methods
resource "aws_api_gateway_method" "get_tasks" {
  rest_api_id   = aws_api_gateway_rest_api.tasks_api.id
  resource_id   = aws_api_gateway_resource.tasks.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "post_task" {
  rest_api_id   = aws_api_gateway_rest_api.tasks_api.id
  resource_id   = aws_api_gateway_resource.tasks.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "put_task" {
  rest_api_id   = aws_api_gateway_rest_api.tasks_api.id
  resource_id   = aws_api_gateway_resource.tasks.id
  http_method   = "PUT"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "delete_task" {
  rest_api_id   = aws_api_gateway_rest_api.tasks_api.id
  resource_id   = aws_api_gateway_resource.tasks.id
  http_method   = "DELETE"
  authorization = "NONE"
}

# Lambda Integration
resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id = aws_api_gateway_rest_api.tasks_api.id
  resource_id = aws_api_gateway_resource.tasks.id
  http_method = aws_api_gateway_method.get_tasks.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.tasks_api.invoke_arn
}

resource "aws_api_gateway_integration" "lambda_integration_post" {
  rest_api_id = aws_api_gateway_rest_api.tasks_api.id
  resource_id = aws_api_gateway_resource.tasks.id
  http_method = aws_api_gateway_method.post_task.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.tasks_api.invoke_arn
}

resource "aws_api_gateway_integration" "lambda_integration_put" {
  rest_api_id = aws_api_gateway_rest_api.tasks_api.id
  resource_id = aws_api_gateway_resource.tasks.id
  http_method = aws_api_gateway_method.put_task.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.tasks_api.invoke_arn
}

resource "aws_api_gateway_integration" "lambda_integration_delete" {
  rest_api_id = aws_api_gateway_rest_api.tasks_api.id
  resource_id = aws_api_gateway_resource.tasks.id
  http_method = aws_api_gateway_method.delete_task.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.tasks_api.invoke_arn
}

# Lambda Permission
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.tasks_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.tasks_api.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "deployment" {
  depends_on = [
    aws_api_gateway_integration.lambda_integration,
    aws_api_gateway_integration.lambda_integration_post,
    aws_api_gateway_integration.lambda_integration_put,
    aws_api_gateway_integration.lambda_integration_delete
  ]

  rest_api_id = aws_api_gateway_rest_api.tasks_api.id
  stage_name  = var.environment
}

# Outputs
output "api_gateway_url" {
  value = "${aws_api_gateway_rest_api.tasks_api.execution_arn}/${var.environment}/tasks"
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.tasks_table.name
}

output "lambda_function_name" {
  value = aws_lambda_function.tasks_api.function_name
}
