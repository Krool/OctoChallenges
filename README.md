# OctoChallenges

by **Krool**

An in-game addon for the [OctoWoW](https://octowow.st) 1.12.1 private server
that shows **your own** active leveling challenges (Hardcore, War Mode,
Slow & Steady, ...) as an icon column on your character sheet.

- Open your character sheet (**C**) — the icons sit just left of your
  character model, each with a hover tooltip naming the challenge.
- `/octochallenges` lists your active challenges in chat.
- It reads your challenges from the server over the game's existing addon
  channel; nothing is sent anywhere else, and it only ever reads your own.

## Install

Pick either:

- **OctoLauncher (recommended):** open the launcher, go to the Addons tab,
  and paste this repository's URL —
  `https://github.com/Krool/OctoChallenges` — into the **Install Addon**
  box. The launcher keeps it updated automatically after that.
- **Manual:** download this repo and copy the folder to
  `Interface\AddOns\OctoChallenges` (so the files sit at
  `Interface\AddOns\OctoChallenges\OctoChallenges.toc`). Then restart the
  client — new addon folders are only picked up at startup, not on
  `/reload`.

Either way, enable **OctoChallenges** on the character-select AddOns screen
if it isn't already, and make sure your addon memory there isn't capped too
low.

## Bonus: challenges on the character-select screen

This addon also feeds your challenge data to the **character-select list**,
so each character's challenges show *before* you log in — but that half
needs the companion client mod,
[octowow-client-mods](https://github.com/Krool/octowow-client-mods)
(the `patch-9.mpq` file), which also adds character reordering, a
server-status lamp, and a music toggle to the login screen. See that repo's
README for how to install it. Without it, this addon still works fully on
the in-game character sheet — you just don't get the character-select icons.
