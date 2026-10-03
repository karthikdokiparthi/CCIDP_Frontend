# BrightGrid CCIDP Admin

React + Vite admin console. First-class frontend — it does not live inside the Spring app.

API (sibling): `../ccidp`. The IdP servlet context-path is `/ccidp`, so this UI calls `/ccidp/api/v1/...`.

## Run locally

1. Start the API on port 8080 (`cd ../ccidp` then `./mvnw spring-boot:run`, or IntelliJ **CcidpApplication**).
2. Copy `.env.example` to `.env` if you do not already have one.

```bash
cd admin-ui
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Environment

| Variable | Typical value | Meaning |
|----------|---------------|---------|
| `VITE_API_BASE_URL` | `/ccidp` | Prefix for `/api/v1`, `/actuator`, `/.well-known` |
| `VITE_API_BASE_URL` | `http://localhost:8080/ccidp` | Call Spring directly (CORS allows `http://localhost:5173`) |
| `VITE_API_BASE_URL` | `http://localhost:8080` | API with **no** context-path |

Vite proxies `/ccidp`, `/api`, `/actuator`, and `/.well-known` to `http://localhost:8080`. Signup username, mail OTP, OIDC, and ERP userinfo stay on the API.

## Docker

```bash
docker build -t ccidp-admin:local --build-arg VITE_API_BASE_URL=/ccidp .
```

Compose (from `../ccidp`) builds image `ccidp-admin` as the `admin` service.

## Build without Docker

```bash
npm run build
npm run preview
```
