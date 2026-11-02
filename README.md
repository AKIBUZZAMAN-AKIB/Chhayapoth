# Chhayapoth · ছায়াপথ

Bangla-first personal workspace built on the existing Capacitor/NativeKit agent framework.

**Alpha implementation — not a medical service or emergency communication network.**

## Working local utilities

- Responsive Home / Agent / Calendar / More navigation.
- Shared persistent IndexedDB domain: calendar, habits, income/expenses, notes, reminders, widgets, quiz attempts and Nearby history.
- Validated data, exact minor-unit BDT arithmetic, optimistic revisions, atomic backup restore and metadata-only activity history.
- Home widget templates with add/remove/reorder and a foreground focus timer.
- Numerical graph visualisation and a small deterministic algebra practice assessment.
- Open-Meteo weather retrieval with source, timestamp, cache and offline/error states. **Official BMD/FFWC feeds are links, not integrated live warnings.**
- Original supplied Pro Planner and ProFit applications packaged separately for the native isolated app runtime. Launch is disabled in web preview because opaque iframe storage cannot support their IndexedDB safely. Their original storage is not migrated into the shared domain.
- Three new native-agent tools: `device__chhayapoth_list`, `device__chhayapoth_create`, `device__chhayapoth_update`. These share the same validated records as the UI. Existing approval machinery remains authoritative.
- Existing native provider routing, credentials UI, MCP and mini-app generation/staging preserved in `agent.html`.

## Wired, but not device-verified

- OS notification scheduling/cancellation with permission checks. A saved reminder is **not** reported as scheduled until the native API succeeds.
- Native Nearby discovery, manual authentication-code confirmation, text payloads, acknowledgements and incoming-message deduplication. Web does not simulate peers. Range, Android/iOS interoperability and background behaviour require real devices.
- Native agent inference, launcher widgets and overlays remain platform capabilities; browser preview does not supply native inference. Android floating overlays have no equivalent general iOS support.

## Development

Requires Node **22+**. For native Android builds: JDK **21**, Android SDK 36 and the usual build tools. iOS needs macOS/Xcode and appropriate signing.

```sh
npm ci
npm run typecheck
npm test
npm run prepare:web
npm run preview
# http://localhost:3001
```

`npm run build:bridge` rebuilds the agent-plugin TypeScript definitions and the shared-domain bundle. `prepare:web` and `prepare:native` include these automatically.

For native builds:

```sh
npm run native:restore  # checksum-pinned vendor libraries, about 90 MB
npm run native:sync
npm run android:debug
```

The source package omits large prebuilt vendor `.so` / `.a` files. `native-binaries.lock.json` pins their source commit, size and SHA-256; the restore script refuses mismatches. The original library files were verified against the manifest; large local iOS copies may be pruned and can be restored with the same command. Rebuilding those libraries from Rust is a separate upstream toolchain task.

Browser E2E (install Playwright and its Chromium runtime in your own environment):

```sh
APP_URL=http://localhost:3001 PLAYWRIGHT_MODULE=/path/to/playwright node e2e/product.cjs
```

The test uses a separate browser context. Its weather response is deliberately mocked; it does not claim live-provider availability.

## Security and release

Do **not** place tokens, provider keys or signing material in source, chat messages, remote URLs or release assets. Any token previously posted in a chat should be revoked.

The workflow `.github/workflows/android.yml` builds and verifies a signed release only when all four stable signing secrets exist. Without them, tag builds fail rather than publishing an unsigned or silently throwaway release. Manual `test` signing produces a labelled throwaway artifact, not an update-continuous production identity.

Read [release instructions](docs/chhayapoth/RELEASE.bn.md), [implementation status](docs/chhayapoth/STATUS.bn.md), and [upstream provenance](docs/chhayapoth/PROVENANCE.md).

## Known limits

This is a first functional alpha, not the entire research proposal. There is no clinical validation, broad curriculum tutor, public store backend, online messaging service, cloud sync, fully offline language model, or field-tested disaster mesh. Core records are local and are not encrypted as a health-data vault. A domain backup does not include mini-app profile data or native-agent transcripts. Back up those through their own facilities.

The old diagnostic UI is retained at `testlab.html`. The previous UI-only design is in `prototype/`. Original framework documentation is in `docs/NATIVEKIT-UPSTREAM-README.md`.

## Published test build

[Test-signed alpha release](https://github.com/AKIBUZZAMAN-AKIB/Chhayapoth/releases/tag/test-0.1.0.1) · [successful build](https://github.com/AKIBUZZAMAN-AKIB/Chhayapoth/actions/runs/41341127941).

The APK/AAB passed pipeline signing verification and downloaded SHA-256 checks. The key is throwaway: no production identity or future update continuity is promised. Back up local records before changing builds. No real-device validation is claimed.

## Dashboard UI revision

The product shell now uses a data-first dashboard with exact minor-unit totals, month-backed charts and accessible tables, combined ledger filters, local escaped record search, hash navigation, and corrected modal focus behavior. Bangla typography is bundled locally. Native engine/provider/permission/sandbox implementations are unchanged. See [UI/UX research and verification](docs/chhayapoth/UI-UX-REVIEW.bn.md).

This UI revision is newer than the APK in `test-0.1.0.1`; that earlier release does not contain these changes.
