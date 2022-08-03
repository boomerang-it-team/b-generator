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

        const withActions = this.objectActionsToJson(this.options.result, this.objectActions);

        const { var_data, ...rest } = this.options.result;

        return {
            headers: this.options.headers,
            result: rest,
            with_actions: withActions,
            data_format: this.options.dataFormat,
            page_sum_data: this.options.pageSumData,
        };

    }

    objectActionsToJson = (results, actions) => {

        let withActions = false;
        const items = results.raw_data;

        const itemKeys = Object.keys(items);
        for(let i = 0; i < itemKeys.length; i++){
            const itemKey = itemKeys[i];

            const item = items[itemKey];
            const varResult = results.var_data[itemKey] || {};
            let itRes = [];

            const actionKeys = Object.keys(actions);
            for(let j = 0; j < actionKeys.length; j++){
                const key = actionKeys[j];

                const action = actions[key];
                let acRes = {...action};

                if(action[ns.NS_ROUTE]){
                    if(action[ns.NS_TYPE] === ns.BUTTON_TYPE_REACT || action[ns.NS_TYPE] === ns.BUTTON_TYPE_ACTION || action[ns.NS_TYPE] === ns.BUTTON_TYPE_MODAL || action[ns.NS_TYPE] === ns.BUTTON_TYPE_METHOD) {

                        acRes[ns.NS_ROUTE] = action[ns.NS_ROUTE];
                        const matches = [...acRes[ns.NS_ROUTE].matchAll(/:(.*?)($|\/)/g)];
                        matches && matches.map(m => {
                            if(m[1] && item[m[1]]){
                                acRes[ns.NS_ROUTE] = acRes[ns.NS_ROUTE].replace(":" + m[1], item[m[1]]);
                            }
                        })

                        if(acRes[ns.NS_ROUTE].substr(0, 1) === '/'){
                            acRes[ns.NS_ROUTE] = process.env.APP_URL + acRes[ns.NS_ROUTE];
                        }

                        acRes[ns.NS_ROUTE] = acRes[ns.NS_ROUTE].replace(":base", this.bGeneratorOptions.wrapper_api_base || process.env.APP_URL);

                    }else{
                        // TODO ROUTES
                        //acRes[ns.NS_ROUTE] = route(action[ns.NS_ROUTE] , [item['key']]);
                    }
                }

                if(action[ns.NS_LABEL]){
                    if(typeof this.request.i18n !== typeof undefined){
                        acRes[ns.NS_LABEL] = this.request.i18n.t(action[ns.NS_LABEL]);
                    }else{
                        acRes[ns.NS_LABEL] = action[ns.NS_LABEL];
                    }
                }

                if(action[ns.NS_CONFIRM]){
                    if(typeof this.request.i18n !== typeof undefined){
                        acRes[ns.NS_CONFIRM] = this.request.i18n.t(action[ns.NS_CONFIRM]);
                    }else{
                        acRes[ns.NS_CONFIRM] = action[ns.NS_CONFIRM];
                    }
                }

                if(acRes[ns.NS_CONDITION]){
                    const condition = acRes[ns.NS_CONDITION];
                    if(varResult[condition] === true){
                        itRes = itRes.concat({
                            key,
                            value: acRes
                        });
                        withActions = true;
                    }
                }else{
                    itRes = itRes.concat({
                        key,
                        value: acRes
                    });
                    withActions = true;
                }

                if(action[ns.NS_VIEW]){
                    acRes[ns.NS_VIEW] = action[ns.NS_VIEW];
                }

            }

            items[itemKey][ns.NS_OBJECT_ACTIONS] = itRes;

        }

        results.raw_data = items;

        return withActions

    }


}

module.exports = ReportJson;