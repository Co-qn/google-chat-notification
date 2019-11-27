import * as core from '@actions/core';
import * as JobStatus from './status';
import * as GoogleChat from './chat';

async function run() {
  try {
    const name = core.getInput('name', { required: true });
    const url = core.getInput('url', { required: true });
    const status = JobStatus.parse(core.getInput('status', { required: true }));

    core.debug(`input params: name=${name}, status=${status}, url=${url}`);

    await GoogleChat.notify(name, url, status);
    console.info('Sent message.')
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
