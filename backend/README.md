# UniBus Spring Boot backend

This directory is the isolated replacement for `supabase/functions/make-server`. Phase 1 established the runtime and test environment. Phase 2 migrates the public notice, route, and bus read APIs while authenticated and mutation APIs remain on the Edge Function.

## Requirements

- JDK 21 for direct local execution
- Docker for integration tests and image builds
- Supabase CLI for the existing local PostgreSQL, Realtime, and Storage stack

The repository currently keeps schema migrations under `../supabase/migrations`. Spring validates mapped entities but never creates or updates the schema (`ddl-auto=validate`), and SQL initialization is disabled.

## Run directly

Start the existing local Supabase stack first:

```bash
supabase start
```

Copy `.env.example` values into your shell, then run:

```bash
export SUPABASE_DB_URL='jdbc:postgresql://127.0.0.1:54322/postgres?sslmode=disable'
export SUPABASE_DB_USERNAME='postgres'
export SUPABASE_DB_PASSWORD='postgres'
./gradlew bootRun
```

`GET http://localhost:8080/health` is the compatibility health endpoint. `GET /actuator/health` is used by Docker and infrastructure health checks.

Point the frontend's public reads at Spring while keeping all other requests on Supabase Edge Functions:

```bash
VITE_PUBLIC_API_BASE_URL=http://localhost:8080 npm run dev
```

The migrated endpoints are documented in [`docs/public-api-contract.md`](docs/public-api-contract.md).

## Test and build

```bash
./gradlew clean test
./gradlew clean build
docker build -t unibus-backend:phase1 .
```

The integration test starts an isolated PostgreSQL 15 container. It never connects to the production Supabase database. Tests run before the image build; the Dockerfile packages the already-verifiable application without requiring a Docker socket inside the build container.

On macOS with Docker Desktop, the full build can also run without a host JDK:

```bash
docker run --rm \
  -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal \
  -v "$PWD:/workspace" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -w /workspace \
  gradle:8.14.3-jdk21-alpine \
  gradle clean build --no-daemon
```

## Run in Docker with local Supabase

`compose.yaml` points the API container to the Supabase CLI database on the host:

```bash
docker compose up --build
```

Production credentials must be supplied as runtime environment variables. Do not bake them into the image or commit an `.env` file.

## Migration safety boundaries

- Only health and the documented public GET endpoints are public.
- Every not-yet-migrated route and every mutation method is denied by Spring Security.
- The datasource is required and Hibernate cannot mutate the schema.
- Request bodies with a declared size above 6 MiB are rejected, matching the Edge Function boundary.
- Existing Supabase Realtime and Storage clients remain unchanged.
- Notice detail view-count increments and route path coordinate/cache updates preserve existing Edge behavior. Contract tests exercise those writes only in an isolated PostgreSQL container.
