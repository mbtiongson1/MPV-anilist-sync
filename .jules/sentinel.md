## 2025-02-14 - Fix SSRF in /api/image endpoint
**Vulnerability:** Server-Side Request Forgery (SSRF) allowed retrieving internal resources (like AWS IMDSv2 metadata via 169.254.169.254) by passing arbitrary URLs to the image proxy endpoint.
**Learning:** External user inputs were passed blindly to `requests.get()` without proper host validation.
**Prevention:** Implement an allowlist approach for expected external hosts using `urllib.parse.urlparse()`. Make sure to account for subdomains securely, for example by checking if the domain `endswith("." + allowed_domain)`.
