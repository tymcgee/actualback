# Actualback
This is a minimal automated backup tool for Actual Budget. By default it will connect to your actual server once a day and save a .zip that can be restored from in the UI (the same operation you can perform from the settings page). You can customize how often it runs using a cron expression. It uses the official Actual API package.

> NOTE: This uses an insecure node flag `NODE_TLS_REJECT_UNAUTHORIZED=0`. For that reason I can only recommend using this on the same server Actual is hosted on, as there may be dubious security implications for cross-internet traffic. I was unable to get self-signed certificates to work.

> NOTE: This only supports unencrypted budgets, but supporting them is not difficult. To support encrypted budgets only requires adding a second parameter to `api.downloadBudget` as seen in [the docs](https://actualbudget.org/docs/api/#connecting-to-a-remote-server).

# Getting Started (docker)
There is no image in any container registries, so you will have to build it yourself. Thankfully it's not difficult:
1. Clone this repository
1. Copy `compose.example.yml` to `compose.yml`
1. Fill out the required environment variables
1. `docker compose build`
4. `docker compose up`
1. A backup is taken on startup so you can see if it works. The backups go into `./data/backups` by default.

Once it is running, try restoring from one of the backups to be sure it works, and then it should be set & forget! For maximum resiliency, make sure to follow standard backup practices and save the files across multiple disks and locations.

# Getting Started (no docker)
Make `.env`:
```bash
ACTUAL_SERVER_URL="https://192.168.1.25:5006/"
ACTUAL_PASSWORD="pass"
ACTUAL_SYNC_ID="uuid"
TZ="America/Los_Angeles"
```

Then start:
```bash
pnpm start
```

# See Also
- [actualbudget-backup](https://github.com/rodriguestiago0/actualbudget-backup) - a similar project with a larger scope
