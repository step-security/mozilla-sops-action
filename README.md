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
     version: 'v3.13.1' # default is latest stable
  id: install
```

Acceptable values for `version`:

- `latest` (default) — queries the GitHub releases API for the current latest release
- a full semver tag like `v3.13.1`
- a bare semver like `3.13.1` — automatically normalized to `v3.13.1`

The cached `sops` binary is prepended to `PATH` and its absolute path is exported as the `sops-path` output.

### Avoiding GitHub API rate limits

Resolving `version: latest` queries the GitHub API, which is capped at 60 requests/hour per source IP when unauthenticated — easy to exhaust on shared GitHub-hosted runner IP pools. Pass the job's `GITHUB_TOKEN` to raise that to 1000/hour:

```yaml
- name: Install SOPS
  uses: step-security/mozilla-sops-action@v2
  with:
     token: ${{ secrets.GITHUB_TOKEN }}
```

### Supported platforms

Native binaries are installed for all of these runners:

| OS      | amd64 | arm64 |
| ------- | :---: | :---: |
| Linux   |  yes  |  yes  |
| macOS   |  yes  |  yes  |
| Windows |  yes  |  yes  |

## Inputs

| Input             | Required | Default                                              | Description                                                                                                                                                                                             |
| ----------------- | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`         | yes      | `latest`                                             | SOPS version to install. Accepts `latest`, `vX.Y.Z`, or `X.Y.Z`.                                                                                                                                        |
| `downloadBaseURL` | no       | `https://github.com/getsops/sops/releases/download/` | Base URL for the SOPS binary. Must end with a trailing slash and follow the `<tag>/<asset>` layout used by `getsops/sops` releases.                                                                     |
| `token`           | no       | `''`                                                 | GitHub token used to authenticate the `latest`-version lookup, raising the GitHub API rate limit from 60/hr to 1000/hr. Typically `${{ secrets.GITHUB_TOKEN }}`. Unused when `version` is not `latest`. |

## Outputs

| Output      | Description                                |
| ----------- | ------------------------------------------ |
| `sops-path` | Absolute path to the cached `sops` binary. |

See [`action.yml`](./action.yml) for the canonical metadata.
