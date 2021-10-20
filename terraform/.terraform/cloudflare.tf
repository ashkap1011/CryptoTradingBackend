provider "cloudflare" {
  version = "~> 2.0"
  api_token = var.cloudflare_api_token
}

# Zone
resource "cloudflare_zones" "cf_zones" {
  filter {
    name = var.domain
  }
}

# DNS Address record
resource "cloudflare_record" "dns_record" {
  zone_id = cloudflare_zones.cf_zones.zones[0].id
  name    = "cryptotrading${terraform.workspace == "prod" ? "" : "-${terraform.workspace}"}"
  value   = google_compute_address.ip_address.address
  type    = "A"
  proxied = true
}
