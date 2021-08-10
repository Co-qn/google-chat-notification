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
  const { eventName, sha, ref, runId } = github.context;
  const { number } = github.context.issue;
  const repoUrl = `https://github.com/${owner}/${repo}`;
  const eventPath = eventName === 'pull_request' ? `/pull/${number}` : `/commit/${sha}`;
  const eventUrl = `${repoUrl}${eventPath}`;
  const checksUrl = `${repoUrl}${eventPath}/checks`;
  const jobUrl = `${repoUrl}/actions/runs/${runId}`;

  const body = {
    cards: [{

      "header": {
        "title": repo,
        "subtitle": ref,
        "imageUrl": "https://lh3.googleusercontent.com/proxy/p3mSfQtf-xADb2Us8knTTzMHpQwoBKW5JU3ZISKETZMJ72D3uQMJ9Xa2JbRM1vuYVev448pQU2VgOaz0RCMq0GnlfvX20ruFgNdM9XKmDOTlIgw6yocpurQ=s64-c",
        "imageStyle": "IMAGE"
      },
      sections: [
        {
          widgets: [
            {
              "textParagraph": {
                "text": `<b>Commit ID:</b> ${sha.substring(0, 8)}<br><b>Status:</b> <font color="${statusColorPalette[status]}">${statusText[status]}</font><br><b>Event:</b> ${eventName}`
              }
            },
            {
              keyValue: {
                topLabel: "Artifact",
                contentMultiline: "true",
                content: `${name}`,
                // "bottomLabel": "Download",
                // "onClick": {
                //   "openLink": {
                //     "url": `https://www.google.com/url?q=${artifactUrl}`
                //   }
                // }
                button: {
                  textButton: {
                    text: "GET IT",
                    onClick: {
                      openLink: {
                        url: `https://www.google.com/url?q=${artifactUrl}`
                      }
                    }
                  }
                }
              }
            }
            // {
            //   keyValue: {
            //     topLabel: "CI",
            //     content: "Open job",
            //     button:
            //     {
            //       textButton: {
            //         text: "DETAILS",
            //         onClick: {
            //           openLink: {
            //             url: `${jobUrl}`
            //           }
            //         }
            //       }
            //     }
            //   }
            // }
          ]
        },
        {
          widgets: [
            // {
            //   "keyValue": {
            //     "topLabel": "Artifact",
            //     "contentMultiline": "true",
            //     "content": `${artifactUrl}`,
            //     "bottomLabel": "Download",
            //     "onClick": {
            //       "openLink": {
            //         "url": `https://www.google.com/url?q=${artifactUrl}`
            //       }
            //     },
            //   }
            // },
            // {
            //   keyValue: {
            //     topLabel: "Artifact",
            //     content: "click button to download",
            //     button:
            //     {
            //       textButton: {
            //         text: "DOWNLOAD",
            //         onClick: {
            //           openLink: {
            //             url: `https://www.google.com/url?q=${artifactUrl}`
            //           }
            //         }
            //       }
            //     }
            //   }
            {

              buttons: [
                {
                  textButton: {
                    text: "JOB DETAILS",
                    onClick: {
                      openLink: {
                        url: `${jobUrl}`
                      }
                    }
                  }
                }]
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