"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parse(status) {
    const s = status.toLowerCase();
    switch (s) {
        case 'success':
        case 'failure':
        case 'cancelled':
            return s;
        default:
            throw Error(`Invalid parameter. status=${status}.`);
    }
}
exports.parse = parse;
