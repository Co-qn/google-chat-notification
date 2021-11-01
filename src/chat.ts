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

export async function notify( name: string,url: string, status: Status, artifactUrl: string) {
  const { owner, repo } = github.context.repo;
  const { eventName, sha, ref, runId, runNumber } = github.context;
  const { number } = github.context.issue;
  const repoUrl = `https://github.com/${owner}/${repo}`;
  const eventPath = eventName === 'pull_request' ? `/pull/${number}` : `/commit/${sha.substring(0, 8)}`;
  const jobUrl = `${repoUrl}/actions/runs/${runId}`;

  const body = {
    cards: [{

      "header": {
        "title": repo,
        "subtitle": name,
        "imageUrl": "https://lh3.googleusercontent.com/proxy/p3mSfQtf-xADb2Us8knTTzMHpQwoBKW5JU3ZISKETZMJ72D3uQMJ9Xa2JbRM1vuYVev448pQU2VgOaz0RCMq0GnlfvX20ruFgNdM9XKmDOTlIgw6yocpurQ=s64-c",
        "imageStyle": "IMAGE"
      },
      sections: [
        {
          widgets: [
            {
              "keyValue": {
                "topLabel": "Build #",
                "content": `<b>${runNumber}</b> - <b><font color="${statusColorPalette[status]}">${statusText[status]}</font></b>`,
                "button": textButton("JOB DETAILS", jobUrl)

              }
            },
            {
              "keyValue": {
                "topLabel": "Event Ref.",
                "content": eventPath,
                "button": textButton("GET ARTIFACT", `https://www.google.com/url?q=${artifactUrl}`)
                }
            }
          ]
        }
      ]
    }]
  };

  const response = await axios.default.post(url, body);
  if (response.status !== 200) {
    throw new Error(`Google Chat notification failed. response status=${response.status}`);
  }
}