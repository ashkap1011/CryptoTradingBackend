PROJECT_ID=cryptotradingtrainer
ZONE=us-central1-c

run-local:
	sudo docker-compose up

####

create-tf-backend-bucket:
	gsutil mb -p ${PROJECT_ID} gs://${PROJECT_ID}-terraform

####

check-env:
ifndef ENV
	$(error Please set ENV=[staging|prod])
endif

# This cannot be indented or else make will include spaces in front of secret
define get-secret
$(shell gcloud secrets versions access latest --secret=$(1) --project=$(PROJECT_ID))
endef

###

ENV=staging

terraform-create-workspace: 
	cd terraform && \
		terraform workspace new ${ENV}
	

terraform-init:
	cd terraform && \
		terraform workspace select ${ENV} && \
		terraform init

TF_ACTION?=plan
terraform-action:
	cd terraform && \
		terraform workspace select $(ENV) && \
		terraform $(TF_ACTION) \
		-var-file="./environments/common.tfvars" \
		-var-file="./environments/$(ENV)/config.tfvars" \
		-var="mongodbatlas_private_key=$(call get-secret,mongodbatlas_private_key)" \
		-var="atlas_user_password=$(call get-secret,atlas_user_password_$(ENV))" \
		-var="cloudflare_api_token=$(call get-secret,cloudflare_api_token)"\


####

SSH_STRING=ash@cryptotradingapp-vm-$(ENV)

GITHUB_SHA?=latest
LOCAL_TAG=cryptoapp:$(GITHUB_SHA)
REMOTE_TAG=gcr.io/$(PROJECT_ID)/$(LOCAL_TAG)

DB_NAME=cryptotradingapp
CONTAINER_NAME=cryptoapp-api


ssh:
	gcloud compute ssh $(SSH_STRING) \
		--project=$(PROJECT_ID) \
		--zone=$(ZONE)

ssh-cmd:
	gcloud compute ssh $(SSH_STRING) \
		--project=$(PROJECT_ID) \
		--zone=$(ZONE) \
		--command="$(CMD)"


build:
	sudo docker build -t $(LOCAL_TAG) .

push:
	sudo docker tag $(LOCAL_TAG) $(REMOTE_TAG)
	sudo docker push $(REMOTE_TAG)



deploy:
	$(MAKE) ssh-cmd CMD='docker-credential-gcr configure-docker'
	@echo "pulling new container image..."
	$(MAKE) ssh-cmd CMD='docker pull $(REMOTE_TAG)'
	@echo "removing old container..."
	-$(MAKE) ssh-cmd CMD='docker container stop $(CONTAINER_NAME)'
	-$(MAKE) ssh-cmd CMD='docker container rm $(CONTAINER_NAME)'
	@echo "starting new container..."
	@$(MAKE) ssh-cmd CMD='\
		docker run -d --name=$(CONTAINER_NAME) \
			--restart=unless-stopped \
			-p 80:3000 \
			-e PORT=3000 \
			-e \"MONGO_URI=mongodb+srv://cryptoapp-user-$(ENV):$(call get-secret,atlas_user_password_$(ENV))@cryptotradingapp-$(ENV).ankwp.mongodb.net/$(DB_NAME)?retryWrites=true&w=majority\" \
			-e GOOGLE_CLIENT_ID=617566378887-khjaah7hs28js6k5aam3c11o58gpbas4.apps.googleusercontent.com \
			-e GOOGLE_CLIENT_SECRET=$(call get-secret,google_oauth_client_secret) \
			$(REMOTE_TAG) \
			'
