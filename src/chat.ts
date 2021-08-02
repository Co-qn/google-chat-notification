import * as github from '@actions/github';
import * as axios from 'axios';
import { Status } from './status';

const statusColorPalette: { [key in Status]: string } = {
  success: "#2cbe4e",
  cancelled: "#ffc107",
  failure: "#ff0000"
};

const statusText: { [key in Status]: string } = {
  success: "Succeeded",
  cancelled: "Cancelled",
  failure: "Failed"
};

const textButton = (text: string, url: string) => ({
  textButton: {
    text,
    onClick: { openLink: { url } }
  }
});

export async function notify(name: string, url: string, status: Status, artifactUrl: string) {
  const { owner, repo } = github.context.repo;
  const { eventName, sha, ref } = github.context;
  const { number } = github.context.issue;
  const repoUrl = `https://github.com/${owner}/${repo}`;
  const eventPath = eventName === 'pull_request' ? `/pull/${number}` : `/commit/${sha}`;
  const eventUrl = `${repoUrl}${eventPath}`;
  const checksUrl = `${repoUrl}${eventPath}/checks`;

  const body = {
    cards: [{
      
        "header": {
          "title": "Pizza Bot Customer Support",
          "subtitle": "pizzabot@example.com",
          "imageUrl": "https://goo.gl/aeDtrS",
          "imageStyle": "IMAGE"
        },
      sections: [
        {
          widgets: [{
            textParagraph: {
              text: `<b>${repo} <font color="${statusColorPalette[status]}">${statusText[status]}</font></b>`
            }
          }]
        },
        {
          widgets: [
            {
              keyValue: {
                topLabel: "Download",
                content: artifactUrl,
                button: textButton("DOWNLOAD", eventUrl)
              }
            },
            {
              keyValue: {
                topLabel: "event name",
                content: eventName,
                button: textButton("OPEN EVENT", eventUrl)
              }
            },
            {
              keyValue: { topLabel: "ref", content: ref }
            },
            {
              keyValue: { topLabel: "commit-id", content: sha.substring(0,8) }
            }
          ]
        },
        {
          widgets: [{
            buttons: [textButton("OPEN CHECKS", checksUrl)]
          }]
        }
      ]
    }]
  };

  const response = await axios.default.post(url, body);
  if (response.status !== 200) {
    throw new Error(`Google Chat notification failed. response status=${response.status}`);
  }
}