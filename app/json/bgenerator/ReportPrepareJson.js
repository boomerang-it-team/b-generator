const {ns} = require("./../../services/bGenerator");

const BaseJson = require('./BaseJson');

class ReportPrepareJson extends BaseJson {

    options;
    request;

    fields;
    batchActions;
    generalActions;
    listActions;
    objectActionsDisplay;
    pageTitle;
    parentKey;
    formFieldSets;
    fieldSetsSkeleton;

    constructor(options) {

        super(options.configParser);

        this.options = options;
        this.request = options.req;

        this.fields = options.configParser[ns.NS_FIELDS];
        this.batchActions = options.configParser[ns.NS_BATCH_ACTIONS];
        this.generalActions = options.configParser[ns.NS_GENERAL_ACTIONS];
        this.listActions = options.configParser[ns.NS_ACTIONS];
        this.objectActionsDisplay = options.configParser[ns.NS_OBJECT_ACTIONS_DISPLAY]
        this.pageTitle = options.pageTitle;
        this.parentKey = options.parentKey;
        this.formFieldSets = options.configParser[ns.NS_FILTER];
        this.fieldSetsSkeleton = options.configParser[ns.NS_FIELDSETS]
    }

    toArray = async () => {

        let res = {};

        res.fields = this.fieldsToJson(this.fields);
        res.formFieldSets = this.formFieldSets;
        res.fieldSetsSkeleton = this.fieldSetsSkeleton;

        res.fields = res.fields.map(field => {
            delete field.value.form
            return field;
        })

        res.batchActions = this.actionsToJson(this.batchActions, null, this.parentKey);
        res.generalActions = this.actionsToJson(this.generalActions, null, this.parentKey);
        res.listActions = this.actionsToJson(this.listActions, null, this.parentKey);
        res.objectActionsDisplay = this.objectActionsDisplay;

        res.title = this.pageTitle + "";
        res.actionName = 'list';

        return res;

    }


}

module.exports = ReportPrepareJson;