# Cloud Security Threat Orchestration System

An automated, end-to-end security testbed demonstrating the exploitation and mitigation of Server-Side Request Forgery (SSRF) vulnerabilities in cloud environments. This project provisions ephemeral AWS infrastructure, executes a Capital One-style SSRF attack to exfiltrate data, and automatically enforces a Zero Trust Architecture (ZTA) via IMDSv2 to neutralize the threat.

## Tech Stack
* **Frontend:** React, Vite, Tailwind CSS v3
* **Backend:** Python, Django REST Framework
* **Infrastructure:** Terraform, AWS CLI, Bash/Python scripts

## Setup Instructions

### 1. Prerequisites
* [Node.js](https://nodejs.org/) installed
* [Python 3.x](https://www.python.org/) installed
* [Terraform](https://developer.hashicorp.com/terraform/downloads) installed
* [AWS CLI](https://aws.amazon.com/cli/) installed and authenticated (`aws configure`)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Activate the venv (.\venv\Scripts\activate on Windows)
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend Setup
```Bash
cd frontend
npm install
npm run dev
