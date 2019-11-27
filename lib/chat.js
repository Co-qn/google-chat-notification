"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const github = __importStar(require("@actions/github"));
const axios = __importStar(require("axios"));
const statusColorPalette = {
    success: "#2cbe4e",
    cancelled: "#ffc107",
    failure: "#ff0000"
};
const statusText = {
    success: "Succeeded",
    cancelled: "Cancelled",
    failure: "Failed"
};
const textButton = (text, url) => ({
    button: {
        textButton: {
            text,
            onClick: { openLink: { url } }
        }
    }
});
function notify(name, url, status) {
    return __awaiter(this, void 0, void 0, function* () {
        const { owner, repo } = github.context.repo;
        const { eventName, sha, ref } = github.context;
        const { number } = github.context.issue;
        const repoUrl = `https://github.com/${owner}/${repo}`;
        const eventPath = eventName === 'pull_request' ? `/pull/${number}` : `/commit/${sha}`;
        const eventUrl = `${repoUrl}${eventPath}`;
        const checksUrl = `${repoUrl}${eventPath}/checks`;
        const body = {
            cards: [{
                    sections: [
                        {
                            widgets: [{
                                    textParagraph: {
                                        text: `<b>${name} <font color="${statusColorPalette[status]}">${statusText[status]}</font></b>`
                                    }
                                }]
                        },
                        {
                            widgets: [
                                {
                                    keyValue: Object.assign({ topLabel: "repository", content: `${owner}/${repo}` }, textButton("OPEN REPOSITORY", repoUrl))
                                },
                                {
                                    keyValue: Object.assign({ topLabel: "event name", content: eventName }, textButton("OPEN EVENT", eventUrl))
                                },
                                {
                                    keyValue: { topLabel: "ref", content: ref }
                                }
                            ]
                        },
                        {
                            widgets: [{
                                    buttons: [Object.assign({}, textButton("OPEN CHECKS", checksUrl))]
                                }]
                        }
                    ]
                }]
        };
        const response = yield axios.default.post(url, body);
        if (response.status !== 200) {
            throw new Error(`Google Chat notification failed. response status=${response.status}`);
        }
    });
}
exports.notify = notify;
