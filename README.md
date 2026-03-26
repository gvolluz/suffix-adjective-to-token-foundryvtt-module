# Suffix Adjective To Token

This Foundry VTT module automatically watches token creation.

If a newly placed token uses Foundry's built-in adjective prefix behavior, this module moves that adjective to the end of the generated name.

Example:
- Foundry-generated name: `Ancient Goblin`
- After this module runs: `Goblin Ancient`

There is no module setting to enable.

What you need:
- The module must be active in your world.
- The token being placed must already be using Foundry's own adjective prefix behavior.

The module tries to reorder the name before the token is created, and also falls back to renaming immediately after creation if Foundry generates the final name later in the workflow.