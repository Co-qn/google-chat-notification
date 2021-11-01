import * as core from '@actions/core';
import * as JobStatus from './status';
import * as GoogleChat from './chat';

async function run() {
  try {
    const name = core.getInput('name', { required: true });
    const buildNumber = core.getInput('buildNumber', { required: false });
    const url = core.getInput('url', { required: true });
    const status = JobStatus.parse(core.getInput('status', { required: true }));
    const artifactUrl = core.getInput('artifactUrl', { required: true });
    const repoRef = core.getInput('repoRef', { required: false });

    core.debug(`input params: name=${name}, status=${status}, url=${url}, artifactUrl=${artifactUrl}`);

    await GoogleChat.notify(name, buildNumber, repoRef, url, status, artifactUrl);
    console.info('Sent message.')
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
