# V7.13.0 — Deployment acceptance checklist

This is a tracking document, **not** proof of completion.

## P0 — Grade dashboards
- [ ] Independent Kindergarten, Grade 1, Grade 2, and Grade 3 dashboard experiences; grade selection stays on Academy homepage
- [ ] Grade 5-consistent navigation and visual hierarchy
- [ ] Full, uncropped, high-resolution grade illustrations; test on iOS phone and Android tablet
- [ ] Remove duplicate Academy header above grade scene
- [ ] Remove View full scene control
- [ ] Hide overview coursework until a subject is selected
- [ ] Home returns to selected grade dashboard; Back to Academy beside stars

## P1 — Learner state
- [ ] Same learner stars and level across grade changes, without inventing or double-awarding
- [ ] Preserve per-grade lessons, saved progress, profile selection, and Family Backup
- [ ] Verify navigation in Math, ELA, STEM, Arcade, and achievements

## P2 — Mobile and responsive artwork
- [x] Welcome artwork CSS no longer forces a cropped mobile aspect ratio (committed, needs device QA)
- [ ] Upload HQ K–3 landscape and phone images and wire responsive sources
- [ ] Test portrait and landscape layouts on phone and tablet
- [ ] Preserve approved grade-selection tiles

## P3 — Sketch Paper
- [x] Add blank page alongside existing lined and graph pages (committed to PR branch)
- [x] Preserve existing eraser and drawing behavior (eraser logic unchanged; device QA pending)
- [ ] Switching paper styles does not silently erase work

## P4 — Release gates
- [x] Verify dashboard patch has been applied to actual HTML (committed on PR branch; device QA pending)
- [ ] Run automated syntax and static checks against final changed files
- [ ] Test interactive navigation, stars, saved progress, and backups in browser
- [ ] Verify visual quality on iOS and Android
- [ ] Only then mark PR ready to merge

## Existing code work
- Homepage image crop correction committed to isolated branch.
- Dashboard patch script and GitHub Actions workflow committed to isolated branch.
- HQ banner package prepared separately; not uploaded to GitHub.
- **Not ready to merge until remaining boxes are checked.**
