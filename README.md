# GoodPlates

GoodPlates was originally my final project in school, I created a small version of a website where you could browse and post recipes.

Ever since I graduated I have still wanted to create a good version of GoodPlates, a version I could actually use. So now I decided to finally get it going.

The original GoodPlates is in another repo, which is why this one is called GoodPlates2026.

My stack for this project:

**Frontend**

- Nuxt 4
- TypeScript
- SCSS (SASS), using BEM naming convention.

**Backend**

- Nitro, Nuxts build in server, for API.
- MongoDB for the database, using the official mongodb driver.
- Garage (S3-compatible) for image storage.

## Do this to run it locally

### .env

- NUXT_MONGODB_URI
  - Your NUXT_MONGODB_URI should look like this: mongodb://MongoDBUsername:MongoDBPassword@IP:PORT/goodplates?authSource=admin
- NUXT_S3_ENDPOINT, NUXT_S3_ACCESS_KEY_ID, NUXT_S3_SECRET_ACCESS_KEY
  - From your Garage setup, see [Setting up Garage](#setting-up-garage)

### Running locally

1. Install all dependencies

```bash
   npm install
```

2. Start the dev server:

```bash
npm run dev
```

## Setting up Garage

Run on the server, from `deploy/garage`.

1. Create a folder for Garage and copy the config into it:

```bash
mkdir -p /opt/garage/meta /opt/garage/data
cp garage.toml /opt/garage/
```

2. Generate the environment variables. `GARAGE_HOST_DIR` is the folder from step 1:

```bash
cat > .env <<EOF
GARAGE_RPC_SECRET=$(openssl rand -hex 32)
GARAGE_ADMIN_TOKEN=$(openssl rand -base64 32)
GARAGE_METRICS_TOKEN=$(openssl rand -base64 32)
GARAGE_DEFAULT_BUCKET=goodplates
GARAGE_DEFAULT_ACCESS_KEY=GK$(openssl rand -hex 12)
GARAGE_DEFAULT_SECRET_KEY=$(openssl rand -hex 32)
GARAGE_HOST_DIR=/opt/garage
EOF
```

3. Start and check for healthy node, and `goodplates` bucket:

```bash
docker compose up -d
docker exec garage /garage status
docker exec garage /garage bucket list
```

4. Add to the app's `.env`:

```
NUXT_S3_ENDPOINT=http://SERVER_IP:3900
NUXT_S3_ACCESS_KEY_ID=<GARAGE_DEFAULT_ACCESS_KEY>
NUXT_S3_SECRET_ACCESS_KEY=<GARAGE_DEFAULT_SECRET_KEY>
```

`/api/health` should show `storage: "connected"`.
