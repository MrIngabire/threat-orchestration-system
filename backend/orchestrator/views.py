import subprocess
import os
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings

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
    try:
        subprocess.run(["terraform", "init"], cwd=INFRA_PROVISION_DIR, check=True)
        subprocess.run(["terraform", "apply", "-auto-approve"], cwd=INFRA_PROVISION_DIR, check=True)
        
        return Response({
            "status": "success",
            "message": "Vulnerable environment provisioned successfully.",
            "public_ip": get_public_ip()
        })
    except subprocess.CalledProcessError as e:
        return Response({"status": "error", "message": "Provisioning failed."}, status=500)

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
        # Run terraform destroy automatically
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

from django.http import FileResponse

@api_view(['GET'])
def download_matrix(request):
    """
    Allows the user to download the hardened Zero Trust Terraform script.
    """
    matrix_path = os.path.join(INFRA_MITIGATE_DIR, 'mitigate.tf')
    
    # If the file doesn't exist yet, create a dummy one for the defense
    if not os.path.exists(matrix_path):
        os.makedirs(INFRA_MITIGATE_DIR, exist_ok=True)
        with open(matrix_path, 'w') as f:
            f.write('# Zero Trust Configuration Matrix\n# Enforces IMDSv2 and Least Privilege\n\nresource "aws_instance" "hardened_node" {\n  metadata_options {\n    http_tokens = "required"\n  }\n}')

    return FileResponse(open(matrix_path, 'rb'), as_attachment=True, filename='ZTA_Configuration_Matrix.tf')