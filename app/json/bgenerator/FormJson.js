const {ns} = require("../../services/bGenerator");


const BaseJson = require('./BaseJson');

class FormJson extends BaseJson {

    options;

    constructor(options) {

        super(options.configParser);

        this.options = options;
        this.request = options.req;
    }

    toArray = async () => {

        let res = {};

        const configParser = this.options['configParser'];
        const item = this.options['item'];
        const parentId = this.options['pid'] ? this.options['pid'] : null;

        res.key = item ? item.id : undefined;
        res.fields = this.fieldsToJson(configParser[ns.NS_FIELDS], ns.NS_IN_FORM);
        res.actions = this.actionsToJson(configParser[ns.NS_ACTIONS], item, parentId);
        res.title = this.options['pageTitle'];

        res.formFieldSets = configParser[ns.NS_DISPLAY];
        res.fieldSetsSkeleton = configParser[ns.NS_FIELDSETS];
        res.fieldSetLayout = configParser[ns.NS_FIELDSET_LAYOUT];
        res.layout = configParser[ns.NS_LAYOUT];
        res.hasHelper = true;

        let errors = null;
        let input = [];
        if(this.options['errors']){
            errors = this.options['errors'];
        }

        if(this.options['input']){
            input = this.options['input'];
        }

        res.defaultValues = await this.defaultValuesToJson(configParser[ns.NS_FIELDS], configParser[ns.NS_DISPLAY], item, input, errors);

        res.errors = this.errorsToJson(configParser[ns.NS_DISPLAY], errors);
        res.actionName = this.options['actionName'];

        return res;

    }

}

module.exports = FormJson;