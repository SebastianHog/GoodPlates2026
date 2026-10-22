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

## Do this to run it locally

### .env

- NUXT_MONGODB_URI
  - Your NUXT_MONGODB_URI should look like this: mongodb://MongoDBUsername:MongoDBPassword@IP:PORT/goodplates?authSource=admin
- NUXT_S3_ENDPOINT, NUXT_S3_ACCESS_KEY_ID, NUXT_S3_SECRET_ACCESS_KEY
  - Images are stored in Garage, set it up with [deploy/garage/README.md](deploy/garage/README.md)

### Running locally

1. Install all dependencies

```bash
   npm install
```

2. Start the dev server:

```bash
npm run dev
```
