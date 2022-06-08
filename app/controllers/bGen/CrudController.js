const Validator = require('Validator');
const {bGenerator, ns} =  require("./../../services/bGenerator")
const jsonResponse = require('./../../services/jsonResponse');
const ListJson = require('./../../json/bgenerator/ListJson');
const FormJson = require('./../../json/bgenerator/FormJson');


class CrudController {

    withSkeleton = false;
    user = null;
    config;
    repository;

    constructor(config) {
        this.config = config;
    }

    getConfig = async () => {
        return this.config;
    }

    getIndex = async (req, res) => {
        this.withSkeleton = req.body.skeleton || true;
        this.user = req.user;

        return await this.fetchList(req, res);
    }

    delete = async (req, res) => {

        this.user = req.user;

        const abstractListConfigParser = await bGenerator.parseBGeneratorConfig(await this.getConfig(req));
        this.repository = abstractListConfigParser.bGeneratorRepository;
        await this.repository.delete(req.params.id);

        return await this.fetchList(req, res, "Item Deleted Successfully.")

    }

    load = async (req, res) => {
        const mode = req.body.action || 'view'; // view, edit, create
        this.user = req.user;

        const abstractListConfigParser = await bGenerator.parseBGeneratorConfig(await this.getConfig(req));
        this.repository = abstractListConfigParser.bGeneratorRepository;

        let item;
        if (mode === 'edit' || mode === 'view') {
            item = await this.repository.find(req.params.id);
            item = await this.postFetchItem(req, item);
        }

        if(mode === 'edit' || mode === 'create'){
            const form = await abstractListConfigParser.form(req, item, null, {});

            const jsonResult = new FormJson({
                req,
                configParser: form,
                item,
                user: this.user,
                pageTitle: form.title,
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
        this.user = req.user;

        const abstractListConfigParser = await bGenerator.parseBGeneratorConfig(await this.getConfig(req));
        this.repository = abstractListConfigParser.bGeneratorRepository;

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

        const input = req.body;
        const validationRules = abstractListConfigParser.prepareFormValidation(req, abstractListConfigParser.bGeneratorFields, formItems, item, null, []);

        const v = Validator.make(input, validationRules);

        let isValid = true;
        if(v.fails()){
            isValid = false;
        }

        isValid = await this.preStore(req, item, isValid, mode);

        if(isValid){

            if(mode === 'update'){
                Object.keys(input).map(k => {
                    if(this.isInsideFormItems(formItems, k)){
                        item[k] = input[k];
                    }
                })
                await item.save()
            }else{ // create, save and add
                let createItem = {};
                Object.keys(input).map(k => {
                    if(this.isInsideFormItems(formItems, k)){
                        createItem[k] = input[k];
                    }
                });
                item = await this.repository.create(createItem);
            }

            const keys = Object.keys(input);
            for(let yy = 0; yy < keys.length; yy++){
                const k = keys[yy];
                if(this.isInsideFormItems(formItems, k)) {
                    if (typeof item['set' + k] === 'function') {
                        item['set' + k](input[k]);
                        await item.save();
                    }
                }
            }

            let message, forwardAction;
            if (mode === "save_and_add") {
                message = "Item created successfully. You can add another item below.";
                forwardAction = 'create';
            } else if(mode === 'create'){
                message = "Item created successfully.";
                forwardAction = 'edit';
            } else {
                message = "Item updated successfully.";
                forwardAction = 'edit';
            }

            item = await this.postStore(req, item, mode, forwardAction);
            item = await this.postFetchItem(req, item);
            const ni = forwardAction === 'create' ? null : item;
            const config = await abstractListConfigParser.form(req, ni, null, []);
            const jsonResult = new FormJson({
                req,
                configParser: config,
                item: ni,
                user: this.user,
                pageTitle: config.title + "",
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

            const form = await abstractListConfigParser.form(req, mode === 'update' ? item : null, null, {});
            const jsonResult = new FormJson({
                req,
                configParser: form,
                item,
                user: this.user,
                pateTitle: form.title + '',
                errors: abstractListConfigParser.formatErrors(v),
                input,
                actionName: forwardAction,
                pid: null,
            });

            return jsonResponse.send(res, await jsonResult.toArray(), "There is a problem during sending form.", 422);

        }
    }

    isInsideFormItems = (formItems, item) => {
        const formItemsKeys = Object.keys(formItems);
        for(let i = 0; i < formItemsKeys.length; i++){
            const formItem = formItems[formItemsKeys[i]];
            for(let j = 0; j < formItem.length; j++){
                if(formItem[j] === item) return true;
            }
        }

        return false;
    }

    fetchList = async (req, res, message) => {
        const filterCriteria = req.body.filter || {};
        const sort = this.prepareSort(req.body);

        let items = [];
        let count = 0;

        const abstractListConfigParser = await bGenerator.parseBGeneratorConfig(await this.getConfig(req));
        this.repository = abstractListConfigParser.bGeneratorRepository;

        this.repository.applyCriteria(abstractListConfigParser.bGeneratorFields, abstractListConfigParser.bGeneratorFilterItems, filterCriteria, sort);

        const page = req.body.page || 1;
        const limit = abstractListConfigParser.bGeneratorPerPage;
        const offset = (page - 1) * limit;

        const list = await abstractListConfigParser.list(req);

        return this.repository.paginate(abstractListConfigParser.bGeneratorFilterItems, filterCriteria, limit, offset).then(async rs => {
            items = rs.rows;
            count = rs.count;

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

}

module.exports = CrudController;