# Infrastructure

The initial local stack is defined in the repository-root `docker-compose.yml`. This directory is reserved for deployment manifests, infrastructure-as-code, and operational configuration as the project grows.

Do not add production credentials to manifests. Use the hosting platform's secret manager and review network exposure before deploying.
