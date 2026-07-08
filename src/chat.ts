import * as github from '@actions/github';
import { Status } from './status';

const statusInfo: { [key in Status]: { text: string; color: string; icon: string } } = {
  success: { text: 'Succeeded', color: '#2cbe4e', icon: '✅' },
  failure: { text: 'Failed', color: '#d50000', icon: '❌' },
  cancelled: { text: 'Cancelled', color: '#ffc107', icon: '⚠️' }
};

const openLinkButton = (text: string, url: string) => ({
  text,
  onClick: { openLink: { url } }
});

interface CardContext {
  owner: string;
  repo: string;
  eventName: string;
  ref: string;
  repoUrl: string;
  eventUrl: string;
  checksUrl: string;
}

export function buildCard(name: string, status: Status, context: CardContext) {
  const { owner, repo, eventName, ref, repoUrl, eventUrl, checksUrl } = context;
  const { text, color, icon } = statusInfo[status];

  return {
    cardsV2: [{
      cardId: 'github-actions-notification',
      card: {
        header: {
          title: name,
          subtitle: `${icon} ${text}`
        },
        sections: [
          {
            widgets: [{
              // header の title/subtitle は HTML 不可のため、色付きステータスは textParagraph で表現する
              textParagraph: {
                text: `<b>${name} <font color="${color}">${text}</font></b>`
              }
            }]
          },
          {
            widgets: [
              {
                decoratedText: {
                  topLabel: 'Repository',
                  text: `${owner}/${repo}`,
                  wrapText: true,
                  startIcon: { knownIcon: 'BOOKMARK' },
                  button: openLinkButton('OPEN', repoUrl)
                }
              },
              {
                decoratedText: {
                  topLabel: 'Event',
                  text: eventName,
                  startIcon: { knownIcon: 'DESCRIPTION' },
                  button: openLinkButton('OPEN', eventUrl)
                }
              },
              {
                decoratedText: {
                  topLabel: 'Ref',
                  text: ref,
                  wrapText: true
                }
              }
            ]
          },
          {
            widgets: [{
              buttonList: {
                buttons: [openLinkButton('OPEN CHECKS', checksUrl)]
              }
            }]
          }
        ]
      }
    }]
  };
}

export async function notify(name: string, url: string, status: Status) {
  const { owner, repo } = github.context.repo;
  const { eventName, ref } = github.context;
  const repoUrl = `https://github.com/${owner}/${repo}`;
  const eventPath = eventName === 'pull_request'
    ? `/pull/${github.context.issue.number}`
    : `/commit/${github.context.sha}`;
  const eventUrl = `${repoUrl}${eventPath}`;
  const checksUrl = `${eventUrl}/checks`;

  const body = buildCard(name, status, { owner, repo, eventName, ref, repoUrl, eventUrl, checksUrl });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const responseBody = await response.text().catch(() => '');
    throw new Error(`Google Chat notification failed. status=${response.status} body=${responseBody}`);
  }
}
