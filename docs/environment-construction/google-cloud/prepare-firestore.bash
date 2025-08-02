#!/bin/bash

# プロジェクトの設定
gcloud config set project ${GOOGLE_CLOUD_PROJECT_ID}

# プロジェクトのIDと番号を取得
gcloud config get-value project
gcloud projects describe ${GOOGLE_CLOUD_PROJECT_ID} --format="value(projectNumber)"

# Firestore APIを有効化
gcloud services enable firestore.googleapis.com

# Firestoreデータベースを作成
gcloud firestore databases create \
  --location=${GOOGLE_CLOUD_REGION} \
  --type=firestore-native

# IAMポリシーのバインディング
gcloud projects add-iam-policy-binding ${GOOGLE_CLOUD_PROJECT_ID} \
  --member="serviceAccount:${RUNNER_SERVICE_ACCOUNT_NAME}@${GOOGLE_CLOUD_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
