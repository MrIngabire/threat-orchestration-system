data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
}

resource "aws_instance" "vulnerable_node" {
  ami                  = data.aws_ami.amazon_linux_2023.id
  instance_type        = "t3.micro"
  subnet_id            = aws_subnet.lab_public_subnet.id
  vpc_security_group_ids = [aws_security_group.web_sg.id]
  iam_instance_profile = aws_iam_instance_profile.app_instance_profile.name

  # CRITICAL FLAW: IMDSv1 enabled by setting http_tokens to optional
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "optional"
    http_put_response_hop_limit = 1
  }

  user_data = <<-EOF
              #!/bin/bash
              dnf update -y
              dnf install -y python3 python3-pip
              
              # Minimal web app simulating an internal fetching endpoint (vulnerable to SSRF)
              cat << 'APP' > /home/ec2-user/server.py
              from http.server import HTTPServer, BaseHTTPRequestHandler
              import urllib.request
              from urllib.parse import urlparse, parse_qs

              class Handler(BaseHTTPRequestHandler):
                  def do_GET(self):
                      parsed = urlparse(self.path)
                      if parsed.path == "/fetch":
                          params = parse_qs(parsed.query)
                          target_url = params.get("url", [None])[0]
                          if not target_url:
                              self.send_response(400)
                              self.end_headers()
                              self.wfile.write(b"Missing 'url' parameter")
                              return
                          try:
                              req = urllib.request.Request(target_url)
                              with urllib.request.urlopen(req, timeout=5) as response:
                                  data = response.read()
                                  self.send_response(200)
                                  self.end_headers()
                                  self.wfile.write(data)
                          except Exception as e:
                              self.send_response(500)
                              self.end_headers()
                              self.wfile.write(str(e).encode())
                      else:
                          self.send_response(200)
                          self.end_headers()
                          self.wfile.write(b"Threat Orchestration Lab Node Active")

              server = HTTPServer(("0.0.0.0", 80), Handler)
              server.serve_forever()
              APP

              python3 /home/ec2-user/server.py &
              EOF

  tags = {
    Name = "${var.environment_prefix}-target-ec2"
  }
}

output "public_ip" {
  description = "Public IP address of the vulnerable EC2 node"
  value       = aws_instance.vulnerable_node.public_ip
}

output "target_bucket_name" {
  description = "Target S3 bucket name"
  value       = aws_s3_bucket.target_bucket.id
}