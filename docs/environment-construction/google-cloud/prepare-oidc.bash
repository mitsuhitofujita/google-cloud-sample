#!/bin/bash

# プロジェクトの設定
gcloud config set project ${GOOGLE_CLOUD_PROJECT_ID}

# プロジェクトのIDと番号を取得
gcloud config get-value project
gcloud projects describe ${GOOGLE_CLOUD_PROJECT_ID} --format="value(projectNumber)"

# 必要なAPIを有効化
gcloud services enable iamcredentials.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable iam.googleapis.com

# 使用できるAPIを確認
gcloud services list --enabled

# サービスアカウントの作成
gcloud iam service-accounts create ${DEPLOYER_SERVICE_ACCOUNT_NAME} \
    --display-name="GitHub Actions Deployer" \
    --description="Service account for GitHub Actions deployments"

# サービスアカウントのメールアドレスを取得
DEPLOYER_SERVICE_ACCOUNT_EMAIL="${DEPLOYER_SERVICE_ACCOUNT_NAME}@${GOOGLE_CLOUD_PROJECT_ID}.iam.gserviceaccount.com"
echo "Service Account Email: ${DEPLOYER_SERVICE_ACCOUNT_EMAIL}"

# Workload Identity Poolの作成
gcloud iam workload-identity-pools create ${WORKLOAD_IDENTITY_POOL_ID} \
    --location="global" \
    --display-name="GitHub Actions Pool" \
    --description="Workload Identity Pool for GitHub Actions"

# Workload Identity Providerの作成
gcloud iam workload-identity-pools providers create-oidc ${WORKLOAD_IDENTITY_PROVIDER} \
    --location="global" \
    --workload-identity-pool=${WORKLOAD_IDENTITY_POOL_ID} \
    --display-name="GitHub Actions Provider" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-condition="assertion.repository_owner == '${GITHUB_ORGANIZATION}'"

# サービスアカウントにWorkload Identity User権限を付与
gcloud iam service-accounts add-iam-policy-binding \
    ${DEPLOYER_SERVICE_ACCOUNT_NAME}@${GOOGLE_CLOUD_PROJECT_ID}.iam.gserviceaccount.com \
    --member="principalSet://iam.googleapis.com/projects/${GOOGLE_CLOUD_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${WORKLOAD_IDENTITY_POOL_ID}/attribute.repository/${GITHUB_ORGANIZATION}/${GITHUB_REPOSITORY}" \
    --role="roles/iam.workloadIdentityUser"

# サービスアカウントに必要な権限を付与
# Cloud Run、Artifact Registry、Cloud Buildなどの権限を付与
gcloud projects add-iam-policy-binding ${GOOGLE_CLOUD_PROJECT_ID} \
    --member="serviceAccount:${DEPLOYER_SERVICE_ACCOUNT_NAME}@${GOOGLE_CLOUD_PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/run.developer"

gcloud projects add-iam-policy-binding ${GOOGLE_CLOUD_PROJECT_ID} \
    --member="serviceAccount:${DEPLOYER_SERVICE_ACCOUNT_NAME}@${GOOGLE_CLOUD_PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding ${GOOGLE_CLOUD_PROJECT_ID} \
    --member="serviceAccount:${DEPLOYER_SERVICE_ACCOUNT_NAME}@${GOOGLE_CLOUD_PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding ${GOOGLE_CLOUD_PROJECT_ID} \
    --member="serviceAccount:${DEPLOYER_SERVICE_ACCOUNT_NAME}@${GOOGLE_CLOUD_PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/cloudbuild.builds.builder"

# 設定値の確認
echo ""
echo "=== GitHub Secretsに設定する値 ==="
echo "GOOGLE_CLOUD_PROJECT_ID: ${GOOGLE_CLOUD_PROJECT_ID}"
echo "GOOGLE_CLOUD_PROJECT_NUMBER: ${GOOGLE_CLOUD_PROJECT_NUMBER}"
echo "GOOGLE_CLOUD_REGION: asia-northeast1"
echo "DEPLOYER_SERVICE_ACCOUNT_NAME: ${DEPLOYER_SERVICE_ACCOUNT_NAME}"
echo "WORKLOAD_IDENTITY_POOL_ID: ${WORKLOAD_IDENTITY_POOL_ID}"
echo "WORKLOAD_IDENTITY_PROVIDER: ${WORKLOAD_IDENTITY_PROVIDER}"

# Workload Identity Providerの完全なリソース名を表示
echo ""
echo "=== Workload Identity Provider Resource Name ==="
echo "projects/${GOOGLE_CLOUD_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${WORKLOAD_IDENTITY_POOL_ID}/providers/${WORKLOAD_IDENTITY_PROVIDER}"
