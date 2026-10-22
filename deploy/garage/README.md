# Garage

Image storage.

```bash
sudo mkdir -p /opt/garage/meta /opt/garage/data
sudo cp garage.toml /opt/garage/
cp .env.example .env
docker compose up -d
```

Fill in `.env` before starting:

| Variable | Generate with |
| --- | --- |
| `GARAGE_RPC_SECRET`, `GARAGE_DEFAULT_SECRET_KEY` | `openssl rand -hex 32` |
| `GARAGE_ADMIN_TOKEN`, `GARAGE_METRICS_TOKEN` | `openssl rand -base64 32` |
| `GARAGE_DEFAULT_ACCESS_KEY` | `echo "GK$(openssl rand -hex 12)"` |
