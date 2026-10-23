# Izzy's Learning Academy — V7.13 mobile/tablet acceptance checklist

## P0 — Current regressions (block release)
- [ ] Remove the **duplicate K–3 navigation bars**. Exactly one navigation bar on each grade dashboard.
- [ ] In that bar: **Home** (returns to current grade dashboard), current grade, **Academy stars and level**, and **Back to Academy**.
- [ ] Preserve stars/levels when a learner moves between grades; do not award duplicate stars or overwrite saved progress.
- [ ] Fix K–3 banner aspect ratio on iOS and Android: **never stretch, squash or crop** the scene; show original illustration completely.
- [ ] Check original image pixel dimensions, effective CSS rendering size and device pixel ratio. Supply higher-resolution art where needed; CSS cannot restore missing pixels.
- [ ] Fix welcome artwork so the full **Izzy's Learning Academy** sign is visible on mobile and tablet.
- [ ] Verify deployed homepage shows **V7.13.0** (not cached V7.12.29); ensure GitHub Pages deployment and cache busting.

## P1 — Dashboard architecture
- [ ] Separate Kindergarten, Grade 1, Grade 2, Grade 3 dashboards: selecting a grade must not show another grade's coursework.
- [ ] Match the **approved Grade 5 dashboard structure** while retaining each grade's distinct illustrated scene.
- [ ] Remove the redundant decorative Academy header above the grade banner.
- [ ] Remove the **View full scene** banner button.
- [ ] Show coursework only after its corresponding subject tile is selected; hide the duplicate subject grid/overview.
- [ ] Keep full-screen lessons with clear return to the selected grade dashboard, not hidden below the tiles.
- [ ] Replace the repetitive face grade-selector cards with polished distinct grade designs.
- [ ] Make the same navigation, level and star presentation consistent across grades.

## P2 — Existing functionality to preserve / enhance
- [ ] Add **blank** scratch-paper option alongside ruled and graph paper.
- [ ] Preserve the existing working eraser unchanged.
- [ ] Preserve all saved learning progress, learner profiles, rewards, backup/export, curriculum and games.
- [ ] Keep Grade 5 approved artwork, eight learning tiles and layout unchanged except shared fixes.

## Required quality gates
- [ ] Validate DOM contains exactly one grade navigation and one active subject panel.
- [ ] Test K, 1, 2, 3 and Grade 5 navigation and profile/star persistence.
- [ ] Test iPhone portrait and landscape, Android tablet landscape and portrait.
- [ ] Compare rendered artwork with original source proportions and text/sign visibility.
- [ ] Run syntax, links/assets and GitHub Pages deployment checks.
- [ ] Collect screenshots on devices before declaring visual acceptance.

## Release policy
**Not ready to merge merely because static GitHub checks pass.** Complete the P0 items and device visual acceptance before release.
