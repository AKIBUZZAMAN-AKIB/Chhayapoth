# Source provenance

This workspace was developed from the previously supplied repository:
https://github.com/AKIBUZZAMAN-AKIB/capacitor-agnt

Reviewed upstream commit: `523c277c5cca27436c1d762fd62eaeb945ce5f79`.

Original NativeKit documentation is retained as `docs/NATIVEKIT-UPSTREAM-README.md`. Vendored plugin notices and licenses remain in their original directories. New Chhayapoth domain, shell, tests and release instructions are an alpha integration, not a claim to have written the upstream native engine.

The owner supplied `calendar (1).html` and `h.html`; their contents are packaged in `www/builtins/planner.json` and `www/builtins/profit.json` without adding the trusted host bridge.

`native-binaries.lock.json` records original vendor binary hashes. Large vendor binaries are restored from the pinned original commit instead of duplicating them in the new source history. Availability of the upstream download remains a build dependency; maintain a trusted backup or mirror before production use.
