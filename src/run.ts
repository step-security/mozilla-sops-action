import * as os from 'node:os'
import * as path from 'node:path'
import * as fs from 'node:fs'

import * as toolCache from '@actions/tool-cache'
import * as core from '@actions/core'
import axios, {isAxiosError} from 'axios'

const sopsToolName = 'sops'
export const stableSopsVersion = 'v3.13.0'
const sopsLatestReleaseURL =
   'https://api.github.com/repos/getsops/sops/releases/latest'

export async function run() {
   await validateSubscription()
   let version = core.getInput('version', {required: true})

   if (version !== 'latest' && version[0] !== 'v') {
      version = getValidVersion(version)
   }
   if (version.toLocaleLowerCase() === 'latest') {
      core.info('Getting latest SOPS version')
      version = await getLatestSopsVersion()
   }

   const downloadBaseURL = core.getInput('downloadBaseURL', {required: false})

   core.startGroup(`Installing ${version}`)
   const cachedPath = await downloadSops(downloadBaseURL, version)
   core.endGroup()

   try {
      if (!process.env['PATH']?.startsWith(path.dirname(cachedPath))) {
         core.addPath(path.dirname(cachedPath))
      }
   } catch {
      // do nothing, set as output variable
   }

   core.info(`SOPS tool version '${version}' has been cached at ${cachedPath}`)
   core.setOutput('sops-path', cachedPath)
}

// Prefixes version with v
export function getValidVersion(version: string): string {
   return 'v' + version
}

// Gets the latest SOPS version or returns the stable fallback if the API is
// unreachable.
export async function getLatestSopsVersion(): Promise<string> {
   try {
      const response = await fetch(sopsLatestReleaseURL, {
         headers: {Accept: 'application/vnd.github+json'}
      })
      if (!response.ok) {
         throw new Error(`HTTP ${response.status}`)
      }
      const data = (await response.json()) as {tag_name?: string}
      if (!data.tag_name) {
         throw new Error('Response missing tag_name')
      }
      return data.tag_name
   } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      core.warning(
         `Error while fetching latest SOPS release: ${msg}. Using default version ${stableSopsVersion}`
      )
      return stableSopsVersion
   }
}

export function getArch(): string {
   return os.arch() === 'x64' ? 'amd64' : os.arch()
}

export function getPlatform(): string {
   return os.platform() === 'win32' ? 'windows' : os.platform()
}

export function getExecutableExtension(): string {
   return os.platform() === 'win32' ? '.exe' : ''
}

// Builds the SOPS asset URL. Asset naming on getsops/sops releases:
//   Linux:   sops-<version>.linux.<amd64|arm64>
//   Darwin:  sops-<version>.darwin.<amd64|arm64>
//   Windows: sops-<version>.<amd64|arm64>.exe
export function getSopsDownloadURL(baseURL: string, version: string): string {
   const platform = getPlatform()
   const arch = getArch()
   const asset =
      platform === 'windows'
         ? `sops-${version}.${arch}.exe`
         : `sops-${version}.${platform}.${arch}`
   const normalizedBase = baseURL.endsWith('/') ? baseURL : baseURL + '/'
   const url = new URL(`${version}/${asset}`, normalizedBase)
   return url.toString()
}

export async function downloadSops(
   baseURL: string,
   version: string
): Promise<string> {
   let cachedToolpath = toolCache.find(sopsToolName, version)
   if (cachedToolpath) {
      core.info(`Restoring '${version}' from cache`)
   } else {
      core.info(`Downloading '${version}' from '${baseURL}'`)
      let sopsDownloadPath: string
      try {
         sopsDownloadPath = await toolCache.downloadTool(
            getSopsDownloadURL(baseURL, version)
         )
      } catch (exception) {
         throw new Error(
            `Failed to download SOPS from location ${getSopsDownloadURL(
               baseURL,
               version
            )}`
         )
      }

      fs.chmodSync(sopsDownloadPath, '777')
      cachedToolpath = await toolCache.cacheFile(
         sopsDownloadPath,
         sopsToolName + getExecutableExtension(),
         sopsToolName,
         version
      )
   }

   const sopspath = path.join(
      cachedToolpath,
      sopsToolName + getExecutableExtension()
   )
   if (!fs.existsSync(sopspath)) {
      throw new Error(`SOPS executable not found in path ${cachedToolpath}`)
   }

   fs.chmodSync(sopspath, '777')
   return sopspath
}

async function validateSubscription(): Promise<void> {
   const eventPath = process.env.GITHUB_EVENT_PATH
   let repoPrivate: boolean | undefined

   if (eventPath && fs.existsSync(eventPath)) {
      const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'))
      repoPrivate = eventData?.repository?.private
   }

   const upstream = 'mdgreenwald/mozilla-sops-action'
   const action = process.env.GITHUB_ACTION_REPOSITORY
   const docsUrl =
      'https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions'

   core.info('')
   core.info('[1;36mStepSecurity Maintained Action[0m')
   core.info(`Secure drop-in replacement for ${upstream}`)
   if (repoPrivate === false) core.info('[32m✓ Free for public repositories[0m')
   core.info(`[36mLearn more:[0m ${docsUrl}`)
   core.info('')

   if (repoPrivate === false) return

   const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com'
   const body: Record<string, string> = {action: action || ''}
   if (serverUrl !== 'https://github.com') body.ghes_server = serverUrl
   try {
      await axios.post(
         `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/maintained-actions-subscription`,
         body,
         {timeout: 3000}
      )
   } catch (error) {
      if (isAxiosError(error) && error.response?.status === 403) {
         core.error(
            `[1;31mThis action requires a StepSecurity subscription for private repositories.[0m`
         )
         core.error(`[31mLearn how to enable a subscription: ${docsUrl}[0m`)
         process.exit(1)
      }
      core.info('Timeout or API not reachable. Continuing to next step.')
   }
}
