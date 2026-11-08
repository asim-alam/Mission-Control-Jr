# Mission expansion: implementation handoff

Open the [complete build plan](docs/mission-expansion/README.md).

It specifies six new playable missions, bringing the game to nine story missions plus the existing Thirty Sols exercise:

- Mars: **A Place to Hide**, **The Greenhouse Promise**, **Earth Can't Answer Yet**.
- Moon: **Chasing the Sun**, **Dust at the Door**, **Beyond the Ridge**.

The package includes complete fictional mission scripts informed by NASA materials, F01–F12 repairs to existing behavior, state/clock/carry/save contracts, NASA provenance instructions, 3D artifact specifications, implementation-agent work orders, and release acceptance checks.

For an implementation agent, begin with the [copy-paste lead instruction and work orders](docs/mission-expansion/04-AGENT-WORK-ORDERS.md). **Build, export, integrate, and validate the actual necessary GLB artifacts and editable generators. A written asset list or placeholder is not a delivered model or mission.**

Implementation project: `/home/asim/CODE/Mission Control Jr/Mission Control Jr`.

Status: all six new mission controllers, scenes, generated 3D artifacts, campaign integration, provenance data, and F01–F12 code repairs are implemented in the worktree. Release acceptance is still underway: see the [current implementation status](docs/mission-expansion/implementation-status.md) for test evidence and remaining browser, target-age, and hardware gates. The older audit remains as a labeled pre-expansion baseline; this request expands its scope to include a separate Moon campaign.
