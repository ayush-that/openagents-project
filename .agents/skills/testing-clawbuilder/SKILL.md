---
name: testing-clawbuilder
description: Test the ClawBuilder 0G frontend preview, responsive builder UI, and OpenClaw/FastClaw zip export flow. Use when validating UI polish, skill-pack, canvas, footer, icon, or export changes.
---

# ClawBuilder 0G Testing

## Devin Secrets Needed

- None for the static frontend preview and client-side zip export flow.
- `FAL_API_KEY` may be available in some sessions for asset generation experiments, but it is not required for runtime UI/export testing.

## Project Commands

Use Bun only:

```bash
/home/ubuntu/.bun/bin/bun install
/home/ubuntu/.bun/bin/bun run lint
/home/ubuntu/.bun/bin/bun run build
/home/ubuntu/.bun/bin/bun run dev
/home/ubuntu/.bun/bin/bun run preview
```

Do not use npm/yarn/pnpm for this repo unless the project changes its package manager.

## Preview URL

The recurring deployed preview used during PR #3 testing was:

```text
https://dist-wgykkhtq.devinapps.com
```

If a newer deployment exists, use the latest preview URL from the PR description or the deploy tool output.

## Core Runtime Flow

1. Open the preview in Chrome.
2. Verify hero/header visuals first:
   - Product/nav text says `ClawBuilder 0G`.
   - Hero heading says `Build 0G agents without runtime work.` unless intentionally changed.
   - Visible app image icons should come from `/nucleo-glass/*.svg`; brand assets can come from `/brand/` or `/favicon.svg`.
3. Verify responsive behavior:
   - `.react-flow__minimap` should usually be absent if the current design intentionally removed the minimap.
   - Check desktop, tablet around `768px`, and mobile around `375px` for `document.documentElement.scrollWidth <= window.innerWidth + 1`.
   - If the native browser tool cannot set tablet width, use headless Chrome from `/opt/.devin/chrome/chrome/linux-137.0.7118.2/chrome-linux64/chrome` with CDP and `--window-size=768,900`.
4. Load the Shipyard template:
   - Click the `Load template` button on the `Shipyard Engineer` template card.
   - Expected baseline stats: `5 packs`, `20 skills`, `4 steps`.
   - Export target should include `0g://package/shipyard-engineer/{rootHash}`.
5. Add visible packs:
   - Click `Add shown` in the `Skill packs` panel.
   - Expected stats after adding all shown packs: `11 packs`, `42 skills`, `4 steps`.
6. Remove one skill:
   - In the `Skills` panel, click the compact `Remove` action for one skill.
   - Expected stats after removal: `11 packs`, `41 skills`, `4 steps`.
7. Export:
   - Click `Export starter package`.
   - Downloaded file should be `shipyard-engineer.zip`.
   - Inspect with Python `zipfile`; expected core files: `agent.json`, `SOUL.md`, `MEMORY.md`, `workflow.json`, `manifest.0g.json`, `README.md`.
   - Expected after one skill removal: exactly 41 `skills/*/SKILL.md` files.
   - `manifest.0g.json` should include `name: Shipyard Engineer`, `provider.apiBase: https://router-api.0g.ai/v1`, `storage.packageUri: 0g://package/shipyard-engineer/{rootHash}`, and 4 workflow steps.

## Useful Browser Console Audits

CTA icon wrapper/background audit:

```js
[...document.querySelectorAll('a,button')]
  .filter((el) => /Open builder|Export starter package/.test(el.textContent || ''))
  .map((el) => {
    const iconWrap = el.querySelector('span');
    const img = el.querySelector('img');
    const style = iconWrap ? getComputedStyle(iconWrap) : null;
    return {
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      wrapperBackground: style?.backgroundColor,
      wrapperBorderWidth: style?.borderTopWidth,
      wrapperBoxShadow: style?.boxShadow,
      imgSrc: img?.getAttribute('src'),
      imgComplete: img?.complete,
      imgNaturalWidth: img?.naturalWidth,
    };
  });
```

Responsive/minimap audit:

```js
({
  innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  minimapCount: document.querySelectorAll('.react-flow__minimap').length,
  overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
});
```

Visible icon source audit:

```js
const visibleImages = [...document.images].filter((img) => {
  const rect = img.getBoundingClientRect();
  const style = getComputedStyle(img);
  return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
});
visibleImages.filter((img) =>
  !img.complete ||
  img.naturalWidth === 0 ||
  !(img.getAttribute('src')?.startsWith('/nucleo-glass/') || img.getAttribute('src')?.startsWith('/brand/'))
);
```

## Zip Verification Snippet

```bash
python3 - <<'PY'
from zipfile import ZipFile
import json
zip_path = '/tmp/chisel_browser_downloads/shipyard-engineer.zip'
with ZipFile(zip_path) as z:
    names = z.namelist()
    manifest = json.loads(z.read('manifest.0g.json'))
    skill_files = [n for n in names if n.startswith('skills/') and n.endswith('/SKILL.md')]
    print({
        'required_files_present': all(name in names for name in ['agent.json','SOUL.md','MEMORY.md','workflow.json','manifest.0g.json','README.md']),
        'skill_file_count': len(skill_files),
        'manifest_name': manifest.get('name'),
        'api_base': manifest.get('provider', {}).get('apiBase'),
        'package_uri': manifest.get('storage', {}).get('packageUri'),
        'workflow_step_count': len(manifest.get('workflow', [])),
    })
PY
```

## Reporting

For PR runtime testing, post one GitHub PR comment with:

- One concise summary of the preview and flow tested.
- Bulleted pass/fail/untested assertions.
- A recording if UI interactions were used.
- Screenshots in compact markdown tables.
- Export/responsive audit JSON links when useful.
