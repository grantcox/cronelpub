# Setup guide (for the technical helper)

This is a complete author website — bio, book page, events, and contact —
that the author edits in a **web browser** and publishes with one click.
Nothing is installed on the author's computer, and there is no monthly fee.

**How it works:** the site content lives in this GitHub repository. The author
edits it through a browser page (`/admin`), which commits changes back to
GitHub. Cloudflare watches the repo, rebuilds the site with Eleventy, and
publishes it — usually live within a minute.

- **Cost:** $0/month hosting. Only the domain name (~$10–12/year).
- **Your involvement after setup:** essentially none.

---

## There are two Cloudflare projects

This trips people up. Under **Workers & Pages** you will see two entries, and
they are unrelated:

| Project | Built from | What it is |
|---|---|---|
| `cronelpub` | `grantcox/cronelpub` | The website itself |
| `sveltia-cms-auth` | `grantcox/sveltia-cms-auth` | The `/admin` login helper |

Pushing to the site repo deploys **`cronelpub`** only. The login helper is
fixed infrastructure — it has no reason to redeploy, so a long gap in its
deployment history is normal and not a problem. If you are checking whether a
content change went live, look at `cronelpub`.

## How the site is actually hosted

It is a **Worker with static assets** — not a Pages project. `cronelpub.pages.dev`
does not exist; the Cloudflare-provided URL is `cronelpub.grant-cox.workers.dev`,
and the real address is <https://cronelpub.com>.

The hosting config lives in `wrangler.jsonc`. The lines that matter:

```jsonc
{
  "name": "cronelpub",
  "assets": { "directory": "_site" }
}
```

`_site` is the Eleventy build output and is gitignored, so it is never in the
repo and the build has to run on Cloudflare's side. A push to `main` triggers
a build and deploy automatically.

---

## One-time setup (if you ever rebuild this from scratch)

### 1. Put the site on GitHub
1. Create the repository and push `main`.
2. In `src/admin/config.yml`, set `repo:` to `USERNAME/REPO`.

### 2. Deploy the site to Cloudflare
1. <https://dash.cloudflare.com> → **Workers & Pages** → **Create** →
   **Workers** → import the repository.
2. Build command: `npm run build`. Deploy command: `npx wrangler deploy`.
   The output directory comes from `assets.directory` in `wrangler.jsonc`, so
   you do not set it in the dashboard.
3. You get a free `*.workers.dev` URL. Every push to `main` redeploys.

To deploy by hand at any time: `npm run deploy`.

### 3. The `/admin` login helper
`/admin` needs a small free OAuth worker so the author can sign in with
GitHub. This repo uses a fork of **sveltia-cms-auth**, deployed as its own
Cloudflare Worker.

1. Deploy the worker first, to get its URL.
2. Create a **GitHub OAuth App** with the Authorization callback URL set to
   `<WORKER_URL>/callback` — the `/callback` suffix is required.
3. Configure the worker (see the next section — the split matters).
4. Put the bare worker URL (no `/callback`) into `src/admin/config.yml` as
   `base_url:` and push.

### 4. Point the domain
1. Register the domain.
2. Cloudflare → the `cronelpub` Worker → **Domains & Routes** → add it. HTTPS
   is automatic and free.
3. Set the real domain in `src/_data/site.json` (`url`) and
   `src/admin/config.yml` (`site_url`).

---

## Worker configuration: what is a secret and what is not

Only **one** value is sensitive. Getting this split wrong is why settings
appeared to vanish during setup.

Cloudflare treats the two types differently: plain-text vars are declared by
the Wrangler config and are **replaced on every deploy**, so anything set only
in the dashboard as type `Text` gets wiped. Secrets persist across deploys.

So the non-sensitive values live in the worker repo's `wrangler.toml`, where a
deploy cannot clobber them:

```toml
[vars]
GITHUB_CLIENT_ID = "Ov23li..."
ALLOWED_DOMAINS = "cronelpub.com, *.cronelpub.com"
```

An OAuth Client ID is public by design — it travels in the browser's redirect
URL — and `ALLOWED_DOMAINS` is just the site's own hostnames. Committing those
to a public repo is fine.

`GITHUB_CLIENT_SECRET` must **never** be committed. Set it separately:

```bash
npx wrangler secret put GITHUB_CLIENT_SECRET
```

Or in the dashboard with Type set to **Secret**, not Text.

`ALLOWED_DOMAINS` is what stops other sites pointing their own CMS at this
worker. Keep it set.

## Who can edit the site

Sveltia CMS has no user list of its own — **GitHub decides**. Signing in hands
the CMS a token carrying that person's own GitHub permissions, and every save
is a commit to this repo. So the editor list is exactly the repo's
collaborators with **Write** access, managed under Settings → Collaborators.

`/admin` is a public page and anyone can reach the login screen, but without
write access to the repo their saves fail.

The fork narrows the OAuth scope to `public_repo,user` rather than the
upstream `repo,user`, which keeps the token away from private repositories.
This only works while this repo stays public. If it is ever made private, the
scope must go back to `repo` or sign-in will break.

There is also a **Sign In Using Access Token** option on the login screen. It
takes a GitHub fine-grained personal access token scoped to a single
repository, which is narrower than the OAuth flow and useful for your own
logins or for diagnosing problems: if token sign-in works and GitHub sign-in
does not, the fault is in the worker or the OAuth App, not in `config.yml`.

---

## Events and the "Past" list

Events are markdown files in `src/events/`, added through `/admin`. There are
none yet. The `events.json` sitting in that folder is not an event — it is an
Eleventy directory data file (`{"permalink": false}`) that stops event files
being published as standalone pages. Leave it there.

`eleventy.config.js` splits them into `upcomingEvents` and `pastEvents` by
comparing each event's date against the clock **at build time**, with a
six-hour grace period so an event happening today does not disappear
mid-morning.

Because that comparison only runs during a build, the split is a snapshot. A
finished event stays under "Upcoming" until something triggers the next
deploy. Any content edit does trigger one, and nothing in this repo configures
a scheduled rebuild — no cron trigger in `wrangler.jsonc`, no GitHub Actions
workflow. If a stale "Upcoming" entry ever becomes a problem, a scheduled
build on the Cloudflare side is the fix; check their current docs, as this has
not been set up or tested here.

## Working on it locally
```bash
npm install      # first time
npm start        # preview at http://localhost:8080
npm run deploy   # build and publish by hand
```

`npm run deploy` needs a logged-in Wrangler (`npx wrangler login`) and is only
a fallback — pushing to `main` is the normal route.

The build is plain [Eleventy](https://www.11ty.dev/). You rarely need to touch
`eleventy.config.js`.
