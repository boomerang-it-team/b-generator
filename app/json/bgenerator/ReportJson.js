const {ns} = require("./../../services/bGenerator");

const BaseJson = require('./BaseJson');

class ReportJson extends BaseJson {

    options;
    request;

    fields;
    objectActions;
    parentKey;

    constructor(options) {

        super(options.configParser);

        this.options = options;
        this.request = options.req;

        this.fields = options.configParser[ns.NS_FIELDS];
        this.objectActions = options.configParser[ns.NS_OBJECT_ACTIONS];
        this.parentKey = options.parentKey;

    }

    toArray = async () => {

        // todo add object actions

        return {
            headers: this.options.headers,
            result: this.options.result,
            data_format: this.options.dataFormat,
            page_sum_data: this.options.pageSumData,
        };

    }


}

module.exports = ReportJson;