# Code Along Deployment

This app is ready to deploy as a frontend + proxy server.

## What You Still Need

You need a reachable Piston server for code execution.

- Local development: `PISTON_BASE_URL=http://localhost:2000`
- Public deployment: `PISTON_BASE_URL=https://your-piston-server`

This app does not require end users to install Docker or Piston.

## Production App Deploy

1. Build the app image:

```bash
docker build -t code-along-app .
```

2. Run the app container:

```bash
docker run \
  -p 3000:3000 \
  -e PORT=3000 \
  -e PISTON_BASE_URL=https://your-piston-server \
  -e EXECUTION_RATE_LIMIT_MAX_REQUESTS=30 \
  -e EXECUTION_RATE_LIMIT_WINDOW_MS=60000 \
  code-along-app
```

3. Check health:

```bash
curl http://localhost:3000/health
```

## Piston Deploy

Deploy Piston separately using the official repository:

```bash
git clone https://github.com/engineer-man/piston
cd piston
docker-compose up -d api
```

Then install the runtimes you need from the official CLI.

## Required Production Architecture

- Browser users connect to your deployed Code Along app
- Your app server proxies `/api/piston/*`
- Your Piston server executes code

## Important Limits

- Add a reverse proxy such as Nginx, Caddy, or your platform load balancer
- Keep rate limiting enabled
- Do not expose Piston directly to the browser
- Add auth before public launch
- Add real collaboration and RTC backends before calling the app fully multi-user
