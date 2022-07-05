const {ns} = require("../../services/bGenerator");

const BaseJson = require('./BaseJson');

class ListJson extends BaseJson {

    count;
    page;
    limit;
    headerItems;
    withSkeleton;
    fields;
    objectActions;
    listActions;
    batchActions;
    generalActions;
    items;
    customView;
    modelName;
    filterItems;
    pageTitle;
    parentKey;
    response;
    layout;
    objectActionsDisplay;

    constructor(request, response, abstractListConfigParser, items, count, page, limit, withSkeleton = false, formDefaults, currentUser, pageTitle = null, parentKey = null) {
        super(abstractListConfigParser);

        this.request = request;
        this.count = count;
        this.page = page;
        this.limit = limit;
        this.headerItems = abstractListConfigParser[ns.NS_DISPLAY]
        this.withSkeleton = withSkeleton;
        this.fields =abstractListConfigParser[ns.NS_FIELDS];
        this.objectActions = abstractListConfigParser[ns.NS_OBJECT_ACTIONS];
        this.batchActions = abstractListConfigParser[ns.NS_BATCH_ACTIONS];
        this.generalActions = abstractListConfigParser[ns.NS_GENERAL_ACTIONS];
        this.listActions = abstractListConfigParser[ns.NS_ACTIONS];
        this.items = items;
        this.customView = abstractListConfigParser[ns.NS_CUSTOM_VIEW];
        this.modelName = abstractListConfigParser[ns.NS_MODEL];
        this.filterItems = abstractListConfigParser[ns.NS_FILTER];
        this.layout = abstractListConfigParser[ns.NS_LAYOUT]
        this.objectActionsDisplay = abstractListConfigParser[ns.NS_OBJECT_ACTIONS_DISPLAY]
        this.pageTitle = pageTitle;
        this.parentKey = parentKey;
        this.response = response;
    }

    toArray = async () => {
        let res = {};
        res.count = this.count;
        res.page = this.page;
        res.limit = this.limit;

        if(this.withSkeleton){
            res.headerItems = this.headerItems;
            res.filterItems = this.filterItems;
            res.fields = this.fieldsToJson(this.fields);
            res.batchActions = this.actionsToJson(this.batchActions, null, this.parentKey);
            res.generalActions = this.actionsToJson(this.generalActions, null, this.parentKey);
            res.listActions = this.actionsToJson(this.listActions, null, this.parentKey);
        }

        this.items = await this.itemsToJson(this.items);
        res.items = this.objectActionsToJson(this.items, this.objectActions);
        res.objectActions = this.objectActions && Object.keys(this.objectActions).length > 0;
        res.objectActionsDisplay = this.objectActionsDisplay;
        res.layout = this.layout;

        res.title = this.pageTitle + "";
        res.actionName = 'list';

        return res;
    }

    itemsToJson = async (items) => {

        let res = [];

        for(let i = 0; i < items.length; i++){
            const item = items[i];

            let itRes = {};
            itRes.key = item.custom_key ? item.custom_key : item.id;
            itRes.attributes = item;

            for(let j = 0; j < this.headerItems.length; j++){
                const headerItem = this.headerItems[j];
                if(headerItem.substr(0, 1) === '_') {
                    this.response.render(this.customView + "/list" + headerItem, {
                        item
                    }, function (err, html){
                        itRes[headerItem] = html;
                    })
                } else {
                    if(typeof item[headerItem] === 'function'){
                        if(item[headerItem] !== null){
                            const objRel = await item[headerItem]();
                            itRes[headerItem] = objRel ? objRel.__toString() + '' : '';
                        }else{
                            itRes[headerItem] = '';
                        }
                    }else{
                        itRes[headerItem] = item[headerItem] === null ? '' : item[headerItem] + '';
                    }
                }
            }

            res = res.concat(itRes);

        }
        items.map(item => {
        })


        return res;
    }

    objectActionsToJson = (items, actions) => {

        const itemKeys = Object.keys(items);
        for(let i = 0; i < itemKeys.length; i++){
            const itemKey = itemKeys[i];

            const item = items[itemKey];
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
                            if(m[1] && item.attributes[m[1]]){
                                acRes[ns.NS_ROUTE] = acRes[ns.NS_ROUTE].replace(":" + m[1], item.attributes[m[1]]);
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
                    if(typeof item['attributes'][condition] === 'function'){
                        if(item['attributes'][condition]() === true){
                            itRes = itRes.concat({
                                key,
                                value: acRes
                            });
                        }
                    }else{
                        if(item['attributes'][condition] === true){
                            itRes = itRes.concat({
                                key,
                                value: acRes
                            });
                        }
                    }
                }else{
                    itRes = itRes.concat({
                        key,
                        value: acRes
                    });
                }

                if(action[ns.NS_VIEW]){
                    acRes[ns.NS_VIEW] = action[ns.NS_VIEW];
                }

            }

            items[itemKey][ns.NS_OBJECT_ACTIONS] = itRes;
            delete items[itemKey]['attributes'];

        }

        return items;

    }



}

module.exports = ListJson;