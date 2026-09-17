# -----------------------------------------------------------
# Zero Trust Configuration Matrix
# -----------------------------------------------------------
# This template serves as the final mitigation artifact, 
# enforcing Zero Trust Architecture (ZTA) across the cloud 
# infrastructure to neutralize Capital One-style SSRF vectors.

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# 1. Network Layer ZTA: Enforce IMDSv2
# Requires a cryptographic token for metadata queries, blocking standard SSRF.
resource "aws_instance" "hardened_node" {
  # (In a live production environment, this block merges with the existing compute module)
  ami           = "ami-0c7217cdde317cfec" 
  instance_type = "t2.micro"

  metadata_options {
    http_tokens   = "required"
    http_endpoint = "enabled"
  }
}

# 2. Identity Layer ZTA: Least Privilege Enforcement
# Revokes implicit global read access to S3 data vaults.
resource "aws_iam_policy" "hardened_least_privilege_policy" {
  name        = "threat-lab-least-privilege-policy"
  description = "Revokes global S3 read access to prevent data exfiltration"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Deny"
        Action   = "s3:*"
        Resource = "*"
      }
    ]
  })
}