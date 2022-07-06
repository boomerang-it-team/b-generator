const Validator = require('Validator');
const {bGenerator, ns} =  require("./../../services/bGenerator")
const jsonResponse = require('./../../services/jsonResponse');
const ListJson = require('./../../json/bgenerator/ListJson');
const FormJson = require('./../../json/bgenerator/FormJson');


class CrudController {

    withSkeleton = false;
    user = null;
    config;
    options;
    repository;
    parentModel;
    parentRef;
    objectRef;

    constructor(config, options) {
        this.config = config;
        this.options = options;
    }

    getConfig = async () => {
        return this.config;
    }

    getIndex = async (req, res) => {
        this.withSkeleton = req.body.skeleton || true;
        return await this.fetchList(req, res);
    }

    delete = async (req, res) => {

        const abstractListConfigParser = await bGenerator.parseBGeneratorConfig(await this.getConfig(req), this.options);
        this.repository = abstractListConfigParser.bGeneratorRepository;

        const policiesPassed = await this.checkDeletePolicies(req);
        if(!policiesPassed){
            return jsonResponse.send(res, [], (req.i18n ? req.i18n.t("response.errors.access_denied") : "Access Denied"), 403);
        }

        await this.repository.delete(req.params.id);

        return await this.fetchList(req, res, (req.i18n ? req.i18n.t("response.general.deleted_successfully") : "Item Deleted Successfully." ))

    }

    load = async (req, res) => {
        const mode = req.body.action || 'view'; // view, edit, create

        const abstractListConfigParser = await bGenerator.parseBGeneratorConfig(await this.getConfig(req), this.options);
        this.repository = abstractListConfigParser.bGeneratorRepository;
        this.objectRef = abstractListConfigParser.bGeneratorObjectRef;

        const policiesPassed = await this.checkLoadPolicies(req);
        if(!policiesPassed){
            return jsonResponse.send(res, [], (req.i18n ? req.i18n.t("response.errors.access_denied") : "Access Denied"), 403);
        }

        let item;
        if (mode === 'edit' || mode === 'view') {
            item = await this.repository.find(req.params.id);
            item = await this.postFetchItem(req, item);
        }

        if(mode === 'edit' || mode === 'create'){

            let parent = null;
            if(this.objectRef){
                this.parentModel = abstractListConfigParser.bGeneratorParentModel;
                this.parentRef = abstractListConfigParser.bGeneratorParentRef;
                if(this.parentModel){
                    parent = await this.parentModel.findOne({
                        where: {
                            [this.parentRef]: req.body[this.objectRef]
                        }
                    })
                }else{
                    parent = {
                        [this.parentRef]: req.body[this.objectRef]
                    }
                }
            }

            const defaultRelations = await this.getDefaultRelations(req, mode, item, parent);

            const form = await abstractListConfigParser.form(req, item, parent, defaultRelations);

            const jsonResult = new FormJson({
                req,
                configParser: form,
                item,
                user: this.user,
                pageTitle: (typeof req.i18n !== typeof undefined) ? req.i18n.t(form.title) : form.title,
                actionName: req.body.action,
                pid: null
            });

            return jsonResponse.send(res, await jsonResult.toArray());
        } else { // TODO view
            return jsonResponse.send(res, {});
        }

    }

    store = async (req, res) => {
        const mode = req.body.action;

        const policiesPassed = await this.checkStorePolicies(req);
        if(!policiesPassed){
            return jsonResponse.send(res, [], (req.i18n ? req.i18n.t("response.errors.access_denied") : "Access Denied"), 403);
        }

        const abstractListConfigParser = await bGenerator.parseBGeneratorConfig(await this.getConfig(req), this.options);
        this.repository = abstractListConfigParser.bGeneratorRepository;
        this.objectRef = abstractListConfigParser.bGeneratorObjectRef;

        let formItems;
        if (mode === "update") {
            formItems = abstractListConfigParser.bGeneratorEditItems;
        } else { // create and save and add
            formItems = abstractListConfigParser.bGeneratorNewItems;
        }

        let item;
        if (mode === "update") {
            item = await this.repository.find(req.params.id);
        } else { // create and save and add
            item = this.repository.newModel();
        }

        let input = req.body;

        let parent = null;
        if(this.objectRef){
            this.parentModel = abstractListConfigParser.bGeneratorParentModel;
            this.parentRef = abstractListConfigParser.bGeneratorParentRef;
            if(this.parentModel) {
                parent = await this.parentModel.findOne({
                    where: {
                        [this.parentRef]: req.body[this.objectRef]
                    }
                })
            }else{
                parent = {
                    [this.parentRef]: req.body[this.objectRef]
                }
            }
        }

        const validationRules = await abstractListConfigParser.prepareFormValidation(req, abstractListConfigParser.bGeneratorFields, formItems, item, parent, []);

        Object.keys(validationRules).map(validationRule => {
            if(typeof input[validationRule] === typeof undefined){
                input[validationRule] = null;
            }

            if(validationRules[validationRule].indexOf("bool") !== -1 && input[validationRule] === null){
                input[validationRule] = false;
            }
        })

        const v = Validator.make(input, validationRules);

        let isValid = true;
        if(v.fails()){
            isValid = false;
        }

        isValid = await this.preStore(req, item, isValid, mode);

        if(isValid){

            if(mode === 'update'){
                Object.keys(input).map(k => {
                    if(this.isInsideFormItems(abstractListConfigParser.bGeneratorFields, formItems, k)){
                        item[k] = input[k];
                    }
                })

                /* ---- FOR PARENT ---- */
                if(this.objectRef){
                    item[this.objectRef] = req.body[this.objectRef];
                }
                /* -------------------- */

                await item.save()
            }else{ // create, save and add
                let createItem = item;
                Object.keys(input).map(k => {
                    if(this.isInsideFormItems(abstractListConfigParser.bGeneratorFields, formItems, k)){
                        createItem[k] = input[k];
                    }
                });

                /* ---- FOR PARENT ---- */
                if(this.objectRef){
                    createItem[this.objectRef] = req.body[this.objectRef];
                }
                /* -------------------- */

                item = await createItem.save();
            }

            const keys = Object.keys(input);
            for(let yy = 0; yy < keys.length; yy++){
                const k = keys[yy];
                if(this.isInsideFormItems(abstractListConfigParser.bGeneratorFields, formItems, k)) {
                    if (typeof item['set' + k] === 'function') {
                        item['set' + k](input[k]);
                        await item.save();
                    }
                }
            }

            let message, forwardAction;
            if (mode === "save_and_add") {
                message = req.i18n ? req.i18n.t("response.general.created_successfully_you_can_add_another_one_below") : "Item created successfully. You can add another below.";
                forwardAction = 'create';
            } else if(mode === 'create'){
                message = req.i18n ? req.i18n.t("response.general.created_successfully") : "Item Created Successfully.";
                forwardAction = 'edit';
            } else {
                message = req.i18n ? req.i18n.t("response.general.updated_successfully") : "Item Updated Successfully.";
                forwardAction = 'edit';
            }

            item = await this.postStore(req, item, mode, forwardAction);
            item = await this.postFetchItem(req, item);
            const ni = forwardAction === 'create' ? null : item;

            const customResponse = await this.customStoreResponse(req, res, item, mode, forwardAction);
            if(customResponse !== false){
                return customResponse;
            }

            const defaultRelations = await this.getDefaultRelations(req, mode, item, parent);

            const config = await abstractListConfigParser.form(req, ni, parent, defaultRelations);
            const jsonResult = new FormJson({
                req,
                configParser: config,
                item: ni,
                user: this.user,
                pageTitle: (typeof req.i18n !== typeof undefined) ? req.i18n.t(config.title + "") : config.title + "",
                actionName: forwardAction,
                pid: null
            });

            return jsonResponse.send(res, await jsonResult.toArray(), message);

        }else{

            let forwardAction;
            if (mode === "save_and_add") {
                forwardAction = 'create';
            } else if(mode === 'create'){
                forwardAction = 'create';
            } else {
                forwardAction = 'edit';
            }

            if(mode === 'update'){
                item = await this.postFetchItem(req, item);
            }

            const defaultRelations = await this.getDefaultRelations(req, mode, item, parent);

            const form = await abstractListConfigParser.form(req, mode === 'update' ? item : null, parent, defaultRelations);
            const jsonResult = new FormJson({
                req,
                configParser: form,
                item,
                user: this.user,
                pageTitle: (typeof req.i18n !== typeof undefined) ? req.i18n.t(form.title + '') : form.title + '',
                errors: abstractListConfigParser.formatErrors(v),
                input,
                actionName: forwardAction,
                pid: null,
            });

            return jsonResponse.send(res, await jsonResult.toArray(), (req.i18n ? req.i18n.t("common:response.errors.validation") : "There is a problem during sending form."), 422);

        }
    }

    isInsideFormItems = (fields, formItems, item) => {
        const formItemsKeys = Object.keys(formItems);
        for(let i = 0; i < formItemsKeys.length; i++){
            const formItem = formItems[formItemsKeys[i]];
            for(let j = 0; j < formItem.length; j++){
                if(formItem[j] === item && fields[item] && fields[item][ns.NS_FORM][ns.NS_CAN_CHANGE] !== false) return true;
            }
        }

        return false;
    }

    fetchList = async (req, res, message) => {
        const filterCriteria = req.body.filter || {};
        const sort = this.prepareSort(req.body);

        let items = [];
        let count = 0;

        const abstractListConfigParser = await bGenerator.parseBGeneratorConfig(await this.getConfig(req), this.options);
        this.repository = abstractListConfigParser.bGeneratorRepository;
        this.objectRef = abstractListConfigParser.bGeneratorObjectRef;

        /** get Parent **/
        let parent = null;
        if(this.objectRef){
            this.parentModel = abstractListConfigParser.bGeneratorParentModel;
            this.parentRef = abstractListConfigParser.bGeneratorParentRef;
            if(this.parentModel){
                parent = await this.parentModel.findOne({
                    where: {
                        [this.parentRef]: req.body[this.objectRef]
                    }
                })
            }else{
                parent = {
                    [this.parentRef]: req.body[this.objectRef]
                }
            }
        }
        /* -------------- */

        const policiesPassed = await this.checkIndexPolicies(req);
        if(!policiesPassed){
            return jsonResponse.send(res, [], (req.i18n ? req.i18n.t("response.errors.access_denied") : "Access Denied"), 403);
        }

        this.applyCriteria(req, abstractListConfigParser.bGeneratorFields, abstractListConfigParser.bGeneratorFilterItems, filterCriteria, sort);

        const page = req.body.page || 1;
        const limit = abstractListConfigParser.bGeneratorPerPage;
        const offset = (page - 1) * limit;

        const list = await abstractListConfigParser.list(req, parent);

        return this.repository.paginate(abstractListConfigParser.bGeneratorFilterItems, filterCriteria, limit, offset).then(async rs => {
            items = rs.rows;
            count = rs.count;

            items = await abstractListConfigParser.fillListRelations(req, items, abstractListConfigParser.bGeneratorListItems, parent)

            items = await this.postFetchList(req, items);

            const jsonResult = new ListJson(
                req,
                res,
                list,
                items,
                count,
                page,
                limit,
                this.withSkeleton,
                [],
                this.user,
                list.title,
                null
            );

            return await jsonResult.toArray().then(dt => {
                return jsonResponse.send(res, dt, message);
            })

        });

    }

    prepareSort = filterCriteria => {
        if(filterCriteria.sortField){
            if(filterCriteria.sortOrder === 'desc'){
                return [filterCriteria.sortField, filterCriteria.sortOrder];
            }else{
                return [filterCriteria.sortField, 'asc'];
            }
        }

        return null;
    }

    applyCriteria = (req, bGeneratorFields, bGeneratorFilterItems, filterCriteria, sort) => {
        return this.repository.applyCriteria(bGeneratorFields, bGeneratorFilterItems, filterCriteria, sort);
    }

    postFetchList = async (req, items) => {
        return items;
    }

    postFetchItem = async (req, item) => {
        return item;
    }

    preStore = async (req, item, isValid, mode) => {
        return isValid;
    }

    postStore = async (req, item, mode, forwardAction) => {
        return item;
    }

    customStoreResponse = async (req, res, item, mode, forwardAction) => {
        return false;
    }

    checkIndexPolicies = async (req) => {
        return true;
    }

    checkDeletePolicies = async (req) => {
        return true;
    }

    checkLoadPolicies = async (req) => {
        return true;
    }

    checkStorePolicies = async (req) => {
        return true;
    }

    getDefaultRelations = async (req, mode, item, parent) => {
        return null;
    }
}

module.exports = CrudController;