# Suffix Adjective To Token

This Foundry VTT module automatically watches token creation and moves Foundry's random adjective from the front of the token name to the end.

Example:
- Foundry-generated name: `Fatigue Blinker`
- After this module runs: `Blinker Fatigue`

There is no module setting to enable.

What you need:
- The module must be active in your world.
- The token being placed must already be using Foundry's own adjective prefix behavior on its prototype token.

The module tries to reorder the name before token creation and also falls back to renaming immediately after creation if Foundry generates the final name later in the workflow.
