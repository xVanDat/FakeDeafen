# FakeDeafen

A userplugin for Vencord/Equicord that simulates the "Deafen" feature in Discord without sending your actual status to the server.

## Features

- When you press the Deafen button, instead of notifying the server that you've muted your audio, this plugin will automatically set your output and input volume to `0%`.
- When you click it again to un-deafen, the plugin will restore your volume to its previous level.
- Prevents bots that manage voice channels from detecting your deafened state and kicking you, while still giving you the silence you need.
- Intercepts WebSocket payloads locally to ensure no `self_deaf` flags are leaked to the server.

> **Note:** When you click, your deafen status in the bottom left corner will remain white, but rest assured, you will not hear anything (and your mic will be muted).

## How to install

Make sure you build Vencord (or Equicord) from source to allow the use of custom userplugins.

1. Place the `fakeDeafen` folder into the `src/userplugins/` (or `src/plugins/`) directory of Vencord/Equicord.
2. Rebuild the application (`pnpm build`).
3. Enable the "FakeDeafen" plugin in your Vencord/Equicord settings.

## Disclaimers

- This plugin was developed with the assistance of AI. As such, it will not be submitted to the official Vencord/Equicord plugin repositories, and there may be minor unforeseen issues or bugs. Use it at your own discretion.
- This is a local deafen. Other users in the voice channel will not see the red headset icon next to your name.