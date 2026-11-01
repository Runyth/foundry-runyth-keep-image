# Runyth Keep Image

Runyth Keep Image remembers the last concrete token image an actor cycled to and applies
that image again when that actor's next token is placed on a Scene, instead of shuffling
to a fresh wildcard roll each time.

## Supported environment

- Foundry Virtual Tabletop 13
- System-agnostic: any actor with a normal token prototype can keep an image

## Requires Runyth Cycle Token

Runyth Keep Image is designed as the memory companion of
[Runyth Cycle Token](https://github.com/Runyth/foundry-runyth-cycle-token), which cycles
token images during play: with the memory, an actor that cycled through wildcard images
keeps the image it wore last when a new token of that actor is placed. The declared
relationship accepts Runyth Cycle Token 0.2.6 and later. Foundry marks this
module inactive until the required companion module is installed and enabled.

## Features

- Remembers the newest concrete token image shown by a token of an owned actor whose
  prototype token uses a wildcard image.
- Applies the remembered image to the next placed token of that actor, so the creature
  keeps the face it wore last instead of rolling again.
- Accepts only concrete images: wildcard sources such as `mysteries/creature*.webp`,
  Foundry wildcard templates such as `{shape}`, blank values, and the default
  `icons/svg/mystery-man.svg` token are never remembered or reapplied.
- Stores each memory as an ordinary actor flag in the `runyth-keep-image` flag scope, so
  it travels with the actor like other flags and nothing else on the world document is
  touched.
- Reacts to the image a token ends up wearing, whatever produced that change: the module
  listens to token image updates on the actor rather than to a specific API call.
- Acts only on the calling client: image changes and placements are recorded on the
  client that performed them, and only for actors it owns.
- Keeps no module settings. The behaviour needs no configuration and no dashboard, and it
  adds no UI of its own.

## How the memory works

1. While a token's image changes during play, the change is stored on the actor when
   three gates pass: the new source is a concrete image file, the change was performed by
   the current client, and the actor is owned by that client while its prototype token
   uses a wildcard image source.
2. When a token of that actor is about to be created on a Scene, the remembered image
   replaces the rolled wildcard image, so placement continues from the last image the
   actor displayed. When nothing usable is remembered, token creation continues exactly
   as Foundry normally performs it.
3. When an actor's prototype token stops using a wildcard image, both remembering and
   reapplying stop for that actor as well.

## Ownership and permissions

- Only a client that owns an actor records memories for that actor, so characters owned
  by players keep their own images and the Game Master's tokens keep the Game Master's
  choice.
- Placement redirection happens on the client that places the token, using the flag data
  that client can read from the actor.
- Memories are ordinary actor flags: the module stores no documents, no settings data,
  and no world-level state.

## Installation

1. Install **Runyth Cycle Token** first, as required by the module relationship.
2. Extract the `runyth-keep-image` directory into:

   ```text
   <Foundry user-data>/Data/modules/
   ```

3. Restart Foundry VTT.
4. Enable **Runyth Keep Image** in the world.

When updating from an earlier version, replace the existing `runyth-keep-image`
directory. Remembered images remain stored on their actors.

## Development validation

With Node.js 24 (22.13 or later works):

```text
npm test
npm run check
```

These checks validate manifest identity and URL surfaces, package and lockfile
agreement, the required companion module relationship, source notices, licence and
publication hygiene, token-image memory and placement behaviour through hook shims, and
deterministic byte-identical release packaging.
They do not replace testing in a live Foundry world.

## Releases

The GitHub repository is
[`Runyth/foundry-runyth-keep-image`](https://github.com/Runyth/foundry-runyth-keep-image).
Every release attaches:

```text
runyth-keep-image-v<version>-mod.zip
runyth-keep-image-v<version>-src.zip
runyth-keep-image-v<version>-doc.zip
module.json
runyth-keep-image-v<version>-SHA256SUMS.txt
```

The `module.json` manifest download URL points at the matching release's installable
archive, and the marked Latest release is always the highest published version.

## Licence

Copyright © 2026  [Daniel Braniewski](https://brani.dev/)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
