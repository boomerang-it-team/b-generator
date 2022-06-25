const {ns} = require("../../services/bGenerator");


class BaseJson {

    request;
    bGeneratorOptions;

    constructor(abstractConfigParser) {
        this.bGeneratorOptions = abstractConfigParser.bGeneratorOptions;
    }

    fieldsToJson = (fields, check = ns.NS_IN_INDEX) => {

        let res = [];
        let x = [];
        Object.keys(fields).map(key => {
            const field = fields[key];

            if(fields[key][check] && fields[key][check] === false){
                return;
            }

            if(field[ns.NS_LABEL]){
                if (typeof this.request.i18n !== typeof undefined) {
                    fields[key][ns.NS_LABEL] = this.request.i18n.t(field[ns.NS_LABEL]);
                } else {
                    fields[key][ns.NS_LABEL] = field[ns.NS_LABEL];
                }
            }

            if(field[ns.NS_FORM] && field[ns.NS_FORM][ns.NS_CHOICES]){
                x = [];
                Object.keys(field[ns.NS_FORM][ns.NS_CHOICES]).map(k => {
                    const v = field[ns.NS_FORM][ns.NS_CHOICES][k];
                    x = x.concat({
                        key: k,
                        value: v
                    })
                });
                fields[key][ns.NS_FORM][ns.NS_CHOICES] = x;
            }

            if(field[ns.NS_FILTER] && field[ns.NS_FILTER][ns.NS_CHOICES]){
                x = [];
                Object.keys(field[ns.NS_FILTER][ns.NS_CHOICES]).map(k => {
                    const v = field[ns.NS_FILTER][ns.NS_CHOICES][k];
                    x = x.concat({
                        key: k,
                        value: v
                    });
                });

                fields[key][ns.NS_FILTER][ns.NS_CHOICES] = x;
            }

            if(field[ns.NS_FORM] && field[ns.NS_FORM][ns.NS_PLACEHOLDER]){
                fields[key][ns.NS_FORM][ns.NS_PLACEHOLDER] = field[ns.NS_FORM][ns.NS_PLACEHOLDER];
            }

            if(field[ns.NS_FILTER] && field[ns.NS_FILTER][ns.NS_PLACEHOLDER]){
                fields[key][ns.NS_FILTER][ns.NS_PLACEHOLDER] = field[ns.NS_FILTER][ns.NS_PLACEHOLDER];
            }


            if(field[ns.NS_FORM] && field[ns.NS_FORM][ns.NS_DATA_PROVIDER]){
                if(false /*Route::has(field[ns.NS_FORM][ns.NS_DATA_PROVIDER])*/){
                    //fields[key][ns.NS_FORM][ns.NS_DATA_PROVIDER] = route(fields[key][ns.NS_FORM][ns.NS_DATA_PROVIDER]);
                }
            }

            if(field[ns.NS_FILTER] && field[ns.NS_FILTER][ns.NS_DATA_PROVIDER]){
                if(false /*Route::has(field[ns.NS_FILTER][ns.NS_DATA_PROVIDER])*/){
                    //fields[key][ns.NS_FILTER][ns.NS_DATA_PROVIDER] = route(fields[key][ns.NS_FILTER][ns.NS_DATA_PROVIDER]);
                }
            }

            res = res.concat({
                key,
                value: fields[key]
            })

        })

        return res;
    }

    actionsToJson = (actions, item = null, parentId = null) => {

        let res = [];

        Object.keys(actions).map(key => {

            const action = actions[key];
            let acRes = {};

            if(action[ns.NS_ROUTE]){

                if(action[ns.NS_TYPE] === ns.BUTTON_TYPE_REACT || action[ns.NS_TYPE] === ns.BUTTON_TYPE_ACTION || action[ns.NS_TYPE] === ns.BUTTON_TYPE_MODAL || action[ns.NS_TYPE] === ns.BUTTON_TYPE_METHOD) {

                    acRes[ns.NS_ROUTE] = action[ns.NS_ROUTE];
                    if(parentId != null) {
                        acRes[ns.NS_ROUTE] = acRes[ns.NS_ROUTE].replaceAll(":pid", parentId);
                    }

                    if(item != null){
                        const matches = [...action[ns.NS_ROUTE].matchAll(/:(.*?)($|\/)/g)];
                        matches && matches.map(m => {
                            if(m[1] && item[m[1]]){
                                acRes[ns.NS_ROUTE] = acRes[ns.NS_ROUTE].replace(":" + m[1], item[m[1]]);
                            }
                        })
                    }

                    if(acRes[ns.NS_ROUTE].substr(0, 1) === '/'){
                        acRes[ns.NS_ROUTE] = process.env.APP_URL + acRes[ns.NS_ROUTE];
                    }

                    acRes[ns.NS_ROUTE] = acRes[ns.NS_ROUTE].replace(":base", this.bGeneratorOptions.wrapper_api_base || process.env.APP_URL);

                    actions[key][ns.NS_ROUTE] = acRes[ns.NS_ROUTE];

                /*}else{
                    if(parentId == null){
                        actions[key][ns.NS_ROUTE] = route(action[ns.NS_ROUTE]);
                    }else{
                        actions[key][ns.NS_ROUTE] = route(action[ns.NS_ROUTE], [
                            'pid'   =>  parentId
                    ]);
                    }*/
                }

            }

            if(action[ns.NS_LABEL]){
                actions[key][ns.NS_LABEL] = action[ns.NS_LABEL];
            }

            if(action[ns.NS_CONFIRM]){
                actions[key][ns.NS_CONFIRM] = action[ns.NS_CONFIRM];
            }

            if(action[ns.NS_VIEW]){
                actions[key][ns.NS_VIEW] = action[ns.NS_VIEW];
            }

            if(action[ns.NS_CONDITION] && action[ns.NS_CONDITION] != null) {
                const condition = action[ns.NS_CONDITION];
                if (item[condition] !== true) {
                    return;
                }
            }

            res = res.concat({
                key,
                value: actions[key]
            });

        });

        return res;

    }

    defaultValuesToJson = async (fields, fieldSets, item, input, errors) => {

        let res = {};
        const fieldSetsKeys = Object.keys(fieldSets);
        for(let pp = 0; pp < fieldSetsKeys.length; pp++){
            const fieldSetKey = fieldSetsKeys[pp];
            const fieldSet = fieldSets[fieldSetKey];

            for(let uu = 0; uu < fieldSet.length; uu++){
                const key = fieldSet[uu];

                const haveInput = typeof input.indexOf === 'function' ? input.indexOf(key) !== -1 : input[key];

                let data;
                if(item != null){
                    if(typeof item['get' + key] === 'function'){
                        data = await item['get' + key]();
                    }else{
                        data = item[key];
                    }
                }

                if(fields[key][ns.NS_FORM] && fields[key][ns.NS_FORM][ns.NS_TYPE] !== 'password'){
                    if((errors == null) && !haveInput){
                        if(item != null && typeof data !== 'undefined' && data !== null){
                            const relat = data;
                            if(Array.isArray(relat)){
                                let resArr = [];
                                relat.map(_r => {
                                    if(_r.id){
                                        resArr = resArr.concat(_r.id);
                                    } else {
                                        resArr = resArr.concat(_r);
                                    }
                                })
                                res[key] = resArr;
                            }else{
                                res[key] = data;
                            }
                        }
                    }else{
                        if(haveInput){
                            res[key] = input[key];
                        }else{
                            res[key] = "";
                        }
                    }
                }

            }

        }

        return res;
    }

    errorsToJson = (fieldSets, errors) => {
        let res = {};
        Object.keys(fieldSets).map(fieldSetKey => {
            const fieldSet = fieldSets[fieldSetKey];
            fieldSet.map(key => {
                if(errors && errors[key]){
                    res[key] = errors[key];
                }
            })
        })

        return res;
    }

    toArray = () => {}

}

module.exports = BaseJson;