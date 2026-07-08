import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as core from '@actions/core';
import * as GoogleChat from '../src/chat';

vi.mock('@actions/core', () => ({
  getInput: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  setFailed: vi.fn(),
}));

vi.mock('../src/chat', () => ({
  notify: vi.fn(),
}));

const inputs: { [key: string]: string } = {};

beforeEach(() => {
  vi.resetModules();
  inputs.name = 'Build';
  inputs.url = 'https://chat.googleapis.com/v1/spaces/XXX/messages?key=YYY';
  inputs.status = 'success';
  vi.mocked(core.getInput).mockImplementation((name: string) => inputs[name]);
  vi.mocked(GoogleChat.notify).mockResolvedValue(undefined);
});

// main.ts は import 時に run() を実行するため、モック設定後に動的 import で起動する
const runMain = async () => {
  await import('../src/main');
  await new Promise((resolve) => setImmediate(resolve));
};

describe('run', () => {
  it('inputs を読んで notify に渡す', async () => {
    await runMain();

    expect(GoogleChat.notify).toHaveBeenCalledWith('Build', inputs.url, 'success');
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('status が不正なら setFailed が呼ばれ notify は呼ばれない', async () => {
    inputs.status = 'skipped';

    await runMain();

    expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('Invalid parameter'));
    expect(GoogleChat.notify).not.toHaveBeenCalled();
  });

  it('notify が throw したら setFailed にエラーメッセージが渡る', async () => {
    vi.mocked(GoogleChat.notify).mockRejectedValue(new Error('Google Chat notification failed.'));

    await runMain();

    expect(core.setFailed).toHaveBeenCalledWith('Google Chat notification failed.');
  });
});
