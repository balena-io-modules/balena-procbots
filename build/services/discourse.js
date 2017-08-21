"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const path = require("path");
const request = require("request-promise");
const service_scaffold_1 = require("./service-scaffold");
class DiscourseService extends service_scaffold_1.ServiceScaffold {
    constructor(data, listen) {
        super();
        this.postsSynced = new Set();
        this.connectionDetails = data;
        if (listen) {
            this.expressApp.post(`/${DiscourseService._serviceName}/`, (formData, response) => {
                if (!this.postsSynced.has(formData.body.post.id)) {
                    this.postsSynced.add(formData.body.post.id);
                    this.queueData({
                        context: formData.body.post.topic_id,
                        cookedEvent: {},
                        type: 'post',
                        rawEvent: formData.body.post,
                        source: DiscourseService._serviceName,
                    });
                    response.sendStatus(200);
                }
            });
        }
    }
    request(requestOptions) {
        return request(requestOptions).promise();
    }
    emitData(context) {
        const qs = {
            api_key: this.connectionDetails.token,
            api_username: this.connectionDetails.username,
        };
        _.merge(qs, context.data.qs);
        const requestOptions = {
            body: context.data.body,
            json: true,
            qs,
            url: `https://${this.connectionDetails.instance}/${context.data.path}`,
            method: context.data.method,
        };
        return context.method(requestOptions);
    }
    verify(_data) {
        return true;
    }
    get serviceName() {
        return DiscourseService._serviceName;
    }
    get apiHandle() {
        return {
            discourse: this,
        };
    }
}
DiscourseService._serviceName = path.basename(__filename.split('.')[0]);
exports.DiscourseService = DiscourseService;
function createServiceListener(data) {
    return new DiscourseService(data, true);
}
exports.createServiceListener = createServiceListener;
function createServiceEmitter(data) {
    return new DiscourseService(data, false);
}
exports.createServiceEmitter = createServiceEmitter;

//# sourceMappingURL=discourse.js.map
