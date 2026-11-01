# Changelog

## 1.0.1 — 2026-11-01

- Corrected the required companion relationship to the actually built Runyth Cycle Token: the manifest floor now names version 0.2.6 instead of the prospective `1.0.0` declaration, so the dependency is satisfiable by the companion as it exists today.
- Confirmed the pairing against the companion's current implementation: Runyth Cycle Token cycles token artwork through ordinary token texture updates and preserves the prototype's wildcard state in its preserve mode, which is exactly the update surface and prototype gate Runyth Keep Image listens to. No runtime change was required.
- No behavioural change: memories still ride on actor flags in the `runyth-keep-image` scope under the same gates.

## 1.0.0 — 2026-11-01

- First Runyth release, published as `runyth-keep-image` / **Runyth Keep Image**.
- Remembers the last concrete token image an actor cycled to and applies that image again to the actor's next placed token while the actor keeps a wildcard token image.
- Accepts concrete images only: wildcard sources, Foundry wildcard templates such as `{shape}`, blank values, and the default mystery-man token are never remembered or reapplied.
- Stores memories as ordinary actor flags in the `runyth-keep-image` flag scope, recorded by the client that performed the image change and only for actors it owns.
- Requires Runyth Cycle Token as a declared module relationship.
- Implemented the publication standard: `AGPL-3.0-or-later` program licence with the standard source notice, deterministic installable, source, and documentation archives with per-version checksums and byte-identical rebuild verification, and the standard quality and release pipelines on Node 24.
