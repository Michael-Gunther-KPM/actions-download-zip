import * as tc from '@actions/tool-cache';
import * as core from '@actions/core';
import * as io from '@actions/io';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import * as vi from './version-info';

function getURL(
  package_name: string,
  version: vi.VersionInfo,
  arch_candidates: Array<string>
): string {
  core.debug(`All found assets: ${version.assets.map((a) => a.name)}`);
  const assets_for_platform: vi.AssetInfo[] = version.assets.sort();
  // The arch_candidates provides an ordered set of architectures to try, and
  // the first matching asset is used. This will typically be 'x86_64' first,
  // with 'x86' checked if nothing was found.
  let matching_assets = undefined;

  if (assets_for_platform.length != 0) {
    matching_assets = assets_for_platform;
  }

  if (matching_assets == undefined) {
    // If there are no x86_64 or x86 packages then give up.
    throw new Error(`Could not find asset for ${package_name}`);
  }
  core.debug(
    `Assets matching platform and arch: ${matching_assets.map((a) => a.name)}`
  );
  if (matching_assets.length > 1) {
    // If there are multiple assets it is likely to be because there are MacOS
    // builds for PPC, x86 and x86_64. Universal packages prevent parsing the
    // architecture completely, so we need to match against the full name to
    // differentiate between e.g. cmake-2.8.10.2-Darwin-universal.tar.gz and
    // cmake-2.8.10.2-Darwin64-universal.tar.gz.
    // Check to see if this narrows down the options or just removes all options.
    // Prefer to use all previous matches when none of them include '64'.
    //
    // CMake 3.19 and above provide two Mac packages:
    // * cmake-3.19.4-macos-universal.dmg
    // * cmake-3.19.4-macos10.10-universal.dmg
    // The 10.10 package uses OSX deployment target 10.10, while the standard
    // package uses 10.13. As the oldest (and now deprecated) github runner is
    // on 10.15 we can safely choose to use the standard package.
    // https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners
    const possible_assets = matching_assets.filter((a) =>
      a.browser_download_url.match(`${package_name}`)
    );
    if (possible_assets.length > 0) {
      matching_assets = possible_assets;
    }
    if (matching_assets.length > 1) {
      core.warning(
        `Found ${
          matching_assets.length
        } matching packages: ${matching_assets.map((a) => a.name)}`
      );
    }
  }
  const asset_url: string = matching_assets[0].url;
  const num_found: number = matching_assets.length;
  core.debug(`Found ${num_found} assets ${package_name}`);
  core.debug(`Using asset url ${asset_url}`);
  return asset_url;
}

async function getArchive(url: string, api_token = ''): Promise<string> {
  const download = await tc.downloadTool(url, undefined, `token ${api_token}`, {
    accept: 'application/octet-stream',
  });
  if (true) {
    //url.endsWith('zip')) {
    io.mv(download, download + '.zip');
    return await tc.extractZip(download + '.zip');
  } else if (url.endsWith('tar.gz')) {
    return await tc.extractTar(download);
  } else {
    throw new Error(`Could not determine filetype of ${url}`);
  }
}

export async function addCMakeToToolCache(
  package_name: string,
  version: vi.VersionInfo,
  arch_candidates: Array<string>,
  api_token: string
): Promise<string> {
  const extracted_archive = await getArchive(
    getURL(package_name, version, arch_candidates),
    api_token
  );
  try {
    return await tc.cacheDir(extracted_archive, package_name, version.name);
  } catch {
    return await tc.cacheFile(
      extracted_archive,
      package_name,
      package_name,
      version.name
    );
  }
}

async function getBinDirectoryFrom(tool_path: string): Promise<string> {
  // The cmake archive should have a single top level directory with a name
  // similar to 'cmake-3.16.2-win64-x64'. This then has subdirectories 'bin',
  // 'doc', 'share'.
  const root_dir_path = await fsPromises.readdir(tool_path);
  if (root_dir_path.length != 1) {
    throw new Error('Archive does not have expected layout.');
  }
  return path.join(tool_path, root_dir_path[0]);
}

export async function addCMakeToPath(
  package_name: string,
  version: vi.VersionInfo,
  arch_candidates: Array<string>,
  api_token: string,
  env_var_name: string,
  force_reinstall: boolean
): Promise<void> {
  let tool_path: string = tc.find(package_name, version.name);
  if (!tool_path || force_reinstall) {
    tool_path = await addCMakeToToolCache(
      package_name,
      version,
      arch_candidates,
      api_token
    );
  }
  await core.exportVariable(env_var_name, await getBinDirectoryFrom(tool_path));
}
