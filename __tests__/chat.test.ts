import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notify } from '../src/chat';
import { Status } from '../src/status';

const mockContext = vi.hoisted(() => ({
  repo: { owner: 'Co-qn', repo: 'google-chat-notification' },
  eventName: 'push',
  sha: 'abc1234',
  ref: 'refs/heads/main',
  issue: { owner: 'Co-qn', repo: 'google-chat-notification', number: 42 },
}));

vi.mock('@actions/github', () => ({ context: mockContext }));

const WEBHOOK_URL = 'https://chat.googleapis.com/v1/spaces/XXX/messages?key=YYY';
const REPO_URL = 'https://github.com/Co-qn/google-chat-notification';

const fetchMock = vi.fn();

const sentBody = () => JSON.parse(fetchMock.mock.calls[0][1].body);
const sentCard = () => sentBody().cardsV2[0].card;
const findDecoratedText = (topLabel: string) => {
  const widgets = sentCard().sections.flatMap((section: any) => section.widgets);
  return widgets.find((widget: any) => widget.decoratedText?.topLabel === topLabel)?.decoratedText;
};

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockResolvedValue({ ok: true, status: 200, text: async () => '{}' });
  mockContext.eventName = 'push';
  mockContext.sha = 'abc1234';
  mockContext.ref = 'refs/heads/main';
});

describe('notify', () => {
  it('webhook URL に POST / Content-Type: application/json で fetch を1回呼ぶ', async () => {
    await notify('Build', WEBHOOK_URL, 'success');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(WEBHOOK_URL);
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toContain('application/json');
  });

  it('body は cardsV2[0].cardId と cardsV2[0].card を持つ', async () => {
    await notify('Build', WEBHOOK_URL, 'success');

    const body = sentBody();
    expect(body.cardsV2).toHaveLength(1);
    expect(body.cardsV2[0].cardId).toBeTruthy();
    expect(body.cardsV2[0].card).toBeTruthy();
  });

  it.each<[Status, string]>([
    ['success', '✅ Succeeded'],
    ['failure', '❌ Failed'],
    ['cancelled', '⚠️ Cancelled'],
  ])('header に title=name と status の文言が入る (%s)', async (status, subtitle) => {
    await notify('Build', WEBHOOK_URL, status);

    expect(sentCard().header.title).toBe('Build');
    expect(sentCard().header.subtitle).toBe(subtitle);
  });

  it.each<[Status, string, string]>([
    ['success', '#2cbe4e', 'Succeeded'],
    ['failure', '#d50000', 'Failed'],
    ['cancelled', '#ffc107', 'Cancelled'],
  ])('先頭 section の textParagraph にステータス色付き HTML が入る (%s)', async (status, color, text) => {
    await notify('Build', WEBHOOK_URL, status);

    const firstWidget = sentCard().sections[0].widgets[0];
    expect(firstWidget.textParagraph.text).toContain(`<font color="${color}">${text}</font>`);
  });

  it('Repository の decoratedText に owner/repo とリポジトリへのリンクが入る', async () => {
    await notify('Build', WEBHOOK_URL, 'success');

    const repository = findDecoratedText('Repository');
    expect(repository.text).toBe('Co-qn/google-chat-notification');
    expect(repository.button.onClick.openLink.url).toBe(REPO_URL);
  });

  it('push イベントでは Event の decoratedText が commit URL を指す', async () => {
    mockContext.eventName = 'push';

    await notify('Build', WEBHOOK_URL, 'success');

    const event = findDecoratedText('Event');
    expect(event.text).toBe('push');
    expect(event.button.onClick.openLink.url).toBe(`${REPO_URL}/commit/abc1234`);
  });

  it('pull_request イベントでは Event の decoratedText が pull URL を指す', async () => {
    mockContext.eventName = 'pull_request';

    await notify('Build', WEBHOOK_URL, 'success');

    const event = findDecoratedText('Event');
    expect(event.text).toBe('pull_request');
    expect(event.button.onClick.openLink.url).toBe(`${REPO_URL}/pull/42`);
  });

  it('Ref の decoratedText に context.ref が入る', async () => {
    await notify('Build', WEBHOOK_URL, 'success');

    expect(findDecoratedText('Ref').text).toBe('refs/heads/main');
  });

  it('buttonList の OPEN CHECKS ボタンが checks URL を指す', async () => {
    await notify('Build', WEBHOOK_URL, 'success');

    const widgets = sentCard().sections.flatMap((section: any) => section.widgets);
    const buttonList = widgets.find((widget: any) => widget.buttonList)?.buttonList;
    const checksButton = buttonList.buttons.find((button: any) => button.text === 'OPEN CHECKS');
    expect(checksButton.onClick.openLink.url).toBe(`${REPO_URL}/commit/abc1234/checks`);
  });

  it('metadata 付きなら専用 section に decoratedText が並ぶ', async () => {
    await notify('Deploy', WEBHOOK_URL, 'success', [
      { label: 'Deploy URL', value: 'https://myapp.example.com' },
      { label: 'Environment', value: 'production' },
    ]);

    const deployUrl = findDecoratedText('Deploy URL');
    const environment = findDecoratedText('Environment');
    expect(deployUrl.text).toBe('https://myapp.example.com');
    expect(environment.text).toBe('production');
    // Repository らの section とは別の専用 section に入る
    const metadataSection = sentCard().sections.find((section: any) =>
      section.widgets.some((widget: any) => widget.decoratedText?.topLabel === 'Deploy URL')
    );
    expect(metadataSection.widgets).toHaveLength(2);
  });

  it('URL 値の metadata には OPEN ボタンが付く', async () => {
    await notify('Deploy', WEBHOOK_URL, 'success', [
      { label: 'Deploy URL', value: 'https://myapp.example.com' },
    ]);

    expect(findDecoratedText('Deploy URL').button.onClick.openLink.url).toBe('https://myapp.example.com');
  });

  it('非 URL 値の metadata には button が付かない', async () => {
    await notify('Deploy', WEBHOOK_URL, 'success', [
      { label: 'Environment', value: 'production' },
    ]);

    expect(findDecoratedText('Environment').button).toBeUndefined();
  });

  it('metadata 省略時は section 数が従来どおり3つ', async () => {
    await notify('Build', WEBHOOK_URL, 'success');

    expect(sentCard().sections).toHaveLength(3);
  });

  it('レスポンスが非 2xx なら status とレスポンス body を含む Error を throw する', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, text: async () => 'invalid payload' });

    await expect(notify('Build', WEBHOOK_URL, 'success')).rejects.toThrow(/400.*invalid payload/);
  });

  it('fetch 自体が reject したら例外が伝播する', async () => {
    fetchMock.mockRejectedValue(new Error('network error'));

    await expect(notify('Build', WEBHOOK_URL, 'success')).rejects.toThrow('network error');
  });
});
