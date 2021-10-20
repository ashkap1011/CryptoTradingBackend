terraform {
    backend "gcs" {
        bucket = "cryptotradingtrainer-terraform"
        prefix = "/state/cryptoapp"
    }

    required_providers {
    mongodbatlas = {
      source = "mongodb/mongodbatlas"
      version = "1.0.1"
    }
    cloudflare = {
      source = "cloudflare/cloudflare"
      version = "3.3.0"
    }
  }
}