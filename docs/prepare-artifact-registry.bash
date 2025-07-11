#!/bin/bash

# プロジェクトの設定
gcloud config set project ${GOOGLE_CLOUD_PROJECT_ID}

# プロジェクトのIDと番号を取得
gcloud config get-value project
gcloud projects describe ${GOOGLE_CLOUD_PROJECT_ID} --format="value(projectNumber)"

# Artifact Registry APIを有効化
gcloud services enable artifactregistry.googleapis.com

# Artifact Registryリポジトリの作成
gcloud artifacts repositories create ${ARTIFACT_REGISTRY_REPOSITORY} \
    --repository-format=docker \
    --location=${GOOGLE_CLOUD_REGION} \
    --description="Docker images for backend application" \
    --labels=app=backend,managed-by=github-actions

# リポジトリの作成確認
gcloud artifacts repositories describe ${ARTIFACT_REGISTRY_REPOSITORY} \
    --location=${GOOGLE_CLOUD_REGION}

gcloud projects add-iam-policy-binding ${GOOGLE_CLOUD_PROJECT_ID} \
    --member="serviceAccount:${DEPLOYER_SERVICE_ACCOUNT_NAME}@${GOOGLE_CLOUD_PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"

# サービスアカウントに対する権限確認（すでに設定済みのはず）
gcloud projects get-iam-policy ${GOOGLE_CLOUD_PROJECT_ID} \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:${DEPLOYER_SERVICE_ACCOUNT_NAME}@${GOOGLE_CLOUD_PROJECT_ID}.iam.gserviceaccount.com"
