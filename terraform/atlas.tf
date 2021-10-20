provider "mongodbatlas" {
  public_key = "pqhjhamh"
  private_key  = "9c982226-7fa8-4330-bc52-79cd73094a0f"
}
# cluster

resource "mongodbatlas_cluster" "mongo_cluster" {
  project_id = var.atlas_project_id
  name       = "${var.app_name}-${terraform.workspace}"
  num_shards = 1

  provider_backup_enabled      = true
  auto_scaling_disk_gb_enabled = true
  mongo_db_major_version       = "4.2"

  //Provider Settings "block"
  provider_name               = "GCP"
  disk_size_gb                = 2
  provider_instance_size_name = "M10"
  provider_region_name        = "CENTRAL_US"
}


# db user

resource "mongodbatlas_database_user" "mongo_user" {
  username           = "cryptoapp-user-${terraform.workspace}"
  password           = var.atlas_user_password
  project_id         = var.atlas_project_id
  auth_database_name = "admin"

  roles {
    role_name     = "readWrite"
    database_name = "cryptotrading"
  }
}

# ip whitelist - references gcp isntance

resource "mongodbatlas_project_ip_access_list" "mongo_access_list" {
  project_id = var.atlas_project_id
  ip_address = google_compute_address.ip_address.address
}

