[![StepSecurity Maintained Action](https://raw.githubusercontent.com/step-security/maintained-actions-assets/main/assets/maintained-action-banner.png)](https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions)

## Setup Sops

GitHub Action for installing [Mozilla/Sops](https://github.com/mozilla/sops)

#### Repurposed from [Azure/setup-helm](https://github.com/Azure/setup-helm)

Install a specific version of sops binary on the runner.
Acceptable values are latest or any semantic version string like v3.8.1 Use this action in workflow to define which version of sops will be used.

```yaml
- name: Sops Binary Installer
  uses: step-security/mozilla-sops-action@v2
  with:
     version: 'v3.13.0' # default is latest stable
  id: install
```

Acceptable values for `version`:

- `latest` (default) — queries the GitHub releases API for the current latest release
- a full semver tag like `v3.13.0`
- a bare semver like `3.13.0` — automatically normalized to `v3.13.0`

The cached `sops` binary is prepended to `PATH` and its absolute path is exported as the `sops-path` output.

### Supported platforms

Native binaries are installed for all of these runners:

| OS      | amd64 | arm64 |
| ------- | :---: | :---: |
| Linux   |  yes  |  yes  |
| macOS   |  yes  |  yes  |
| Windows |  yes  |  yes  |

## Inputs

| Input             | Required | Default                                              | Description                                                                                                                         |
| ----------------- | -------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `version`         | yes      | `latest`                                             | SOPS version to install. Accepts `latest`, `vX.Y.Z`, or `X.Y.Z`.                                                                    |
| `downloadBaseURL` | no       | `https://github.com/getsops/sops/releases/download/` | Base URL for the SOPS binary. Must end with a trailing slash and follow the `<tag>/<asset>` layout used by `getsops/sops` releases. |

## Outputs

| Output      | Description                                |
| ----------- | ------------------------------------------ |
| `sops-path` | Absolute path to the cached `sops` binary. |

See [`action.yml`](./action.yml) for the canonical metadata.
