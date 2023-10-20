import * as core from '@actions/core';
import * as setup from './setup-cmake';
import * as version from './version';

async function run() {
  try {
    core.debug(`Starting run`);
    const requested_version = core.getInput('version');
    const required_version =
      requested_version === 'latest' ? '' : requested_version;
    const package_name = core.getInput('package-name');
    const env_var_name = core.getInput('env-var-name');
    const releases_url = core.getInput('releases-url');
    const api_token = core.getInput('github-api-token');
    const all_version_info = await version.getAllVersionInfo(
      releases_url,
      api_token
    );
    const chosen_version_info = version.getLatestMatching(
      required_version,
      all_version_info
    );

    const use_32bits = core.getInput('use-32bit').toLowerCase() === 'true';
    const arch_candidates = use_32bits ? ['x86'] : ['x86_64', 'x86'];

    await setup.addCMakeToPath(
      package_name,
      chosen_version_info,
      arch_candidates,
      api_token,
      env_var_name
    );
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}
run();
