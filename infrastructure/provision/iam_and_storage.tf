resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# The Target S3 Bucket
resource "aws_s3_bucket" "target_bucket" {
  bucket        = "${var.environment_prefix}-data-vault-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = {
    Name = "${var.environment_prefix}-target-vault"
  }
}

# Upload mock sensitive records
resource "aws_s3_object" "sample_customer_records" {
  bucket  = aws_s3_bucket.target_bucket.id
  key     = "records/customer_data.json"
  content = jsonencode({
    records = [
      { id = 1001, name = "Alice Doe", credit_score = 750, balance = 12500.00 },
      { id = 1002, name = "Bob Smith", credit_score = 680, balance = 4300.50 }
    ]
  })
  content_type = "application/json"
}

# IAM Role assumed by the EC2 instance
resource "aws_iam_role" "vulnerable_app_role" {
  name = "${var.environment_prefix}-app-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "ec2.amazonaws.com" }
      }
    ]
  })
}

# Over-permissioned policy: wide read access across S3
resource "aws_iam_policy" "overpermissive_s3_policy" {
  name        = "${var.environment_prefix}-overpermissive-s3-policy"
  description = "Excessive S3 permissions mirroring the Capital One case study"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:ListAllMyBuckets",
          "s3:ListBucket",
          "s3:GetObject"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "role_policy_attach" {
  role       = aws_iam_role.vulnerable_app_role.name
  policy_arn = aws_iam_policy.overpermissive_s3_policy.arn
}

resource "aws_iam_instance_profile" "app_instance_profile" {
  name = "${var.environment_prefix}-instance-profile"
  role = aws_iam_role.vulnerable_app_role.name
}