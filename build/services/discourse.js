"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const path = require("path");
const request = require("request-promise");
const service_utilities_1 = require("./service-utilities");
class DiscourseService extends service_utilities_1.ServiceUtilities {
    constructor(data, listen) {
        super();
        this.postsSynced = new Set();
        this.connectionDetails = data;
        if (listen) {
            this.startListening();
        }
    }
    emitData(context) {
        console.log(this.connectionDetails, context);
        return new Promise((resolve) => {
            const qs = {
                api_key: this.connectionDetails.token,
                api_username: this.connectionDetails.username,
            };
            _.merge(qs, context.qs);
            const requestOptions = {
                body: context.payload,
                json: true,
                qs,
                url: `https://${this.connectionDetails.instance}/${context.path}`,
                method: context.method,
            };
            request(requestOptions)
                .then((result) => {
                resolve(result);
            });
        });
    }
    verify(_data) {
        return true;
    }
    startListening() {
        this.expressApp.post(`/${DiscourseService._serviceName}/`, (formData, response) => {
            if (!this.postsSynced.has(formData.body.post.id)) {
                this.postsSynced.add(formData.body.post.id);
                this.queueData({
                    context: formData.body.post.topic_id,
                    cookedEvent: {},
                    event: 'post',
                    rawEvent: formData.body.post,
                    source: DiscourseService._serviceName,
                });
                response.sendStatus(200);
            }
        });
    }
    get serviceName() {
        return DiscourseService._serviceName;
    }
    get apiHandle() {
        return;
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
