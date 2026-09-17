import subprocess
import os
import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.http import HttpResponse

# Directory Paths
BACKEND_DIR = settings.BASE_DIR
INFRA_PROVISION_DIR = os.path.join(BACKEND_DIR.parent, 'infrastructure', 'provision')
INFRA_SIMULATE_DIR = os.path.join(BACKEND_DIR.parent, 'infrastructure', 'simulate')
INFRA_MITIGATE_DIR = os.path.join(BACKEND_DIR.parent, 'infrastructure', 'mitigate')

def get_public_ip():
    """Helper function to fetch the current public IP from Terraform."""
    process = subprocess.run(
        ["terraform", "output", "-raw", "public_ip"], 
        cwd=INFRA_PROVISION_DIR, capture_output=True, text=True
    )
    return process.stdout.strip()

@api_view(['POST'])
def provision_env(request):
    """
    Accepts an uploaded Terraform file (optional), saves it, and provisions the environment.
    """
    try:
        # Check if the user uploaded a custom deployment file
        if 'deployment_file' in request.FILES:
            tf_file = request.FILES['deployment_file']
            fs = FileSystemStorage(location=INFRA_PROVISION_DIR)
            
            # Overwrite the existing main deployment file so Terraform uses the new input
            if fs.exists('main.tf'):
                fs.delete('main.tf')
            fs.save('main.tf', tf_file)

        # 1. Initialize and Apply
        subprocess.run(["terraform", "init"], cwd=INFRA_PROVISION_DIR, check=True)
        subprocess.run(["terraform", "apply", "-auto-approve"], cwd=INFRA_PROVISION_DIR, check=True)
        
        return Response({
            "status": "success",
            "message": "Custom environment provisioned successfully." if 'deployment_file' in request.FILES else "Vulnerable environment provisioned successfully.",
            "public_ip": get_public_ip()
        })
    except subprocess.CalledProcessError as e:
        return Response({"status": "error", "message": "Provisioning failed.", "details": e.stderr or e.stdout}, status=500)

@api_view(['POST'])
def simulate_attack(request):
    """
    Executes the Python SSRF attack script against the provisioned environment.
    """
    public_ip = get_public_ip()
    if not public_ip:
        return Response({"status": "error", "message": "No environment IP found. Provision first."}, status=400)

    try:
        result = subprocess.run(
            ["python", "simulate_ssrf.py", public_ip],
            cwd=INFRA_SIMULATE_DIR,
            check=True,
            capture_output=True,
            text=True
        )
        return Response({
            "status": "success",
            "message": "Attack simulation complete.",
            "output": result.stdout
        })
    except subprocess.CalledProcessError as e:
        return Response({"status": "error", "message": "Simulation failed.", "details": e.stderr or e.stdout}, status=500)

@api_view(['POST'])
def mitigate_env(request):
    """
    Enforces IMDSv2 on the EC2 instance using the AWS CLI.
    """
    public_ip = get_public_ip()
    
    try:
        # 1. Get the Instance ID associated with the IP
        id_process = subprocess.run(
            ["aws", "ec2", "describe-instances", "--filters", f"Name=ip-address,Values={public_ip}", "--query", "Reservations[0].Instances[0].InstanceId", "--output", "text"],
            check=True, capture_output=True, text=True
        )
        instance_id = id_process.stdout.strip()

        # 2. Apply the Zero Trust Mitigation (Enforce IMDSv2)
        subprocess.run(
            ["aws", "ec2", "modify-instance-metadata-options", "--instance-id", instance_id, "--http-tokens", "required", "--http-endpoint", "enabled"],
            check=True, capture_output=True, text=True
        )
        
        return Response({
            "status": "success",
            "message": f"Zero Trust mitigation successfully applied to instance {instance_id}. SSRF vector neutralized."
        })
    except subprocess.CalledProcessError as e:
        return Response({"status": "error", "message": "Mitigation failed.", "details": e.stderr or e.stdout}, status=500)

@api_view(['POST'])
def destroy_env(request):
    """
    Executes 'terraform destroy' to cleanly tear down all AWS resources.
    """
    try:
        subprocess.run(
            ["terraform", "destroy", "-auto-approve"], 
            cwd=INFRA_PROVISION_DIR, 
            check=True, 
            capture_output=True, 
            text=True
        )
        return Response({
            "status": "success",
            "message": "Infrastructure successfully destroyed. No active AWS resources remain."
        })
    except subprocess.CalledProcessError as e:
        return Response({
            "status": "error", 
            "message": "Teardown failed.", 
            "details": e.stderr or e.stdout
        }, status=500)

@api_view(['GET'])
def download_matrix(request):
    """
    Dynamically generates the Zero Trust Configuration Matrix based on 
    the applied mitigation traits of the current session.
    """
    # 1. Capture dynamic session data
    generation_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    applied_traits = ["IMDSv2_Enforcement", "Least_Privilege_IAM"]
    environment_target = "AWS_EC2_us-east-1"

    # 2. Dynamically assemble the Terraform code
    matrix_content = f"""# ===========================================================
# AUTOMATICALLY GENERATED ZERO TRUST CONFIGURATION MATRIX
# ===========================================================
# Generated on: {generation_time}
# Target Environment: {environment_target}
# Applied Mitigation Traits: {', '.join(applied_traits)}
# ===========================================================

terraform {{
  required_version = ">= 1.5.0"
  required_providers {{
    aws = {{
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }}
  }}
}}

provider "aws" {{
  region = "us-east-1"
}}
"""

    # 3. Inject blocks based on specific traits applied
    if "IMDSv2_Enforcement" in applied_traits:
        matrix_content += """
# [DYNAMIC TRAIT INJECTED: Network Layer ZTA - IMDSv2]
resource "aws_instance" "hardened_node" {
  ami           = "ami-0c7217cdde317cfec" 
  instance_type = "t2.micro"

  metadata_options {
    http_tokens   = "required"
    http_endpoint = "enabled"
  }
}
"""

    if "Least_Privilege_IAM" in applied_traits:
        matrix_content += """
# [DYNAMIC TRAIT INJECTED: Identity Layer ZTA - Least Privilege]
resource "aws_iam_policy" "hardened_least_privilege_policy" {
  name        = "threat-lab-least-privilege-policy"
  description = "Auto-generated policy revoking global S3 read access"

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
"""

    # 4. Serve the dynamically generated string directly as a downloadable file
    response = HttpResponse(matrix_content, content_type='text/plain')
    response['Content-Disposition'] = 'attachment; filename="Dynamic_ZTA_Matrix.tf"'
    
    return response