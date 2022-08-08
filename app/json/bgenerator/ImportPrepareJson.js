const {ns} = require("./../../services/bGenerator");

const BaseJson = require('./BaseJson');

class ImportPrepareJson extends BaseJson {

    options;
    request;

    fields;
    generalActions;
    listActions;
    pageTitle;
    parentKey;
    formFieldSets;
    fieldSetsSkeleton;

    constructor(options) {

        super(options.configParser);

        this.options = options;
        this.request = options.req;
        this.fields = options.configParser[ns.NS_FIELDS];
        this.generalActions = options.configParser[ns.NS_GENERAL_ACTIONS];
        this.listActions = options.configParser[ns.NS_ACTIONS];
        this.parentKey = options.parentKey;
        this.formFieldSets = options.configParser[ns.NS_FILTER];
        this.fieldSetsSkeleton = options.configParser[ns.NS_FIELDSETS]
        this.pageTitle = options.pageTitle;
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

        res.generalActions = this.actionsToJson(this.generalActions, null, this.parentKey);
        res.listActions = this.actionsToJson(this.listActions, null, this.parentKey);

        res.title = this.pageTitle + "";

        let errors = null;
        let input = [];
        if(this.options['errors']){
            errors = this.options['errors'];
        }

        if(this.options['input']){
            input = this.options['input'];
        }

        res.defaultValues = await this.defaultValuesToJson(this.options.configParser[ns.NS_FIELDS], this.options.configParser[ns.NS_FILTER], null, input, errors, ns.NS_FILTER);
        res.errors = this.errorsToJson(this.options.configParser[ns.NS_FILTER], errors);

        return res;

    }


}

module.exports = ImportPrepareJson;