# fredFM Bot

An experimental music bot using `discord.js/voice` and `soundcloud.ts`, streaming **fredFM** radio in Fred Again's Discord community.

## Setup
Environment variables are specified in [.env.example](.env.example).

```sh
pnpm run build
```

```sh
pnpm run start
```

### Docker
A Docker image can be built from `Dockerfile` by running:

```sh
docker build -t fredfm .
```

There may be some network and firewall issues, primarily due to the way the module connects to Discord. This requires further analysis.
