# Stemn Desktop

This repository holds the **releases** of the Stemn desktop application (installers and auto-update
manifests). It contains no source code and nothing is committed here by hand.

* Source code: [stemn/stemn-frontend](https://github.com/stemn/stemn-frontend), package `stemn-frontend-desktop`.
* Releases are built, signed and published to this repository's
  [Releases](https://github.com/stemn/stemn-desktop/releases) by the `desktop-release` GitHub Actions
  workflow in `stemn-frontend` (see `docs/plans/desktop-auto-update-and-signing.md` there).
* Installed applications check this repository's release feed for updates (electron-updater).
* Publishing a draft release here runs `.github/workflows/notify-stemn-frontend.yml`, which triggers the
  `promote` job of the release workflow in `stemn-frontend` (secret `STEMN_FRONTEND_DISPATCH_TOKEN`).
* Download the latest version from [stemn.com/download](https://stemn.com/download).

`build/` keeps the installer artwork (icons, DMG background) used by the release build.
