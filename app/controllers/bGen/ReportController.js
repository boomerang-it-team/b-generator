const Validator = require('Validator');
const bReportMaker = require("./../../services/bReportMaker");
const {ns} =  require("./../../services/bGenerator")
const jsonResponse = require('./../../services/jsonResponse');
const ReportPrepareJson = require("./../../json/bgenerator/ReportPrepareJson");
const ReportJson = require("./../../json/bgenerator/ReportJson");


class ReportController {

    config;
    options;

    constructor(config, options) {
        this.config = config;
        this.options = options;
    }

    getConfig = async () => {
        return this.config;
    }

    getIndex = async (req, res) => {

        const list = await this.processFilter(req);

        const policiesPassed = await this.checkIndexPolicies(req);
        if(!policiesPassed){
            return jsonResponse.send(res, [], (req.i18n ? req.i18n.t("common:response.errors.access_denied") : "Access Denied"), 403);
        }

        const jsonResult = new ReportPrepareJson({
            req,
            configParser: list,
            title: list.title
        });

        return await jsonResult.toArray().then(dt => {
            return jsonResponse.send(res, dt);
        })

    }

    report = async (req, res) => {

        const policiesPassed = await this.checkIndexPolicies(req);
        if(!policiesPassed){
            return jsonResponse.send(res, [], (req.i18n ? req.i18n.t("common:response.errors.access_denied") : "Access Denied"), 403);
        }

        const configParser = await bReportMaker.parseBReportMakerConfig(await this.getConfig(req), this.options);
        this.repository = configParser.bGeneratorRepository;
        this.objectRef = configParser.bGeneratorObjectRef;

        const filterItems = configParser.bGeneratorFilterItems;

        let input = req.body.filter || {};

        let parent = null;
        if(this.objectRef){
            this.parentModel = configParser.bGeneratorParentModel;
            this.parentRef = configParser.bGeneratorParentRef;
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


        const filterItemsToValidationRules = {"default": filterItems};
        const validationRules = await configParser.prepareFormValidation(req, configParser.bGeneratorFields, filterItemsToValidationRules, null, parent, {}, ns.NS_FILTER);

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

        isValid = await this.preReport(req, parent, isValid);

        if(isValid){

            const defaultRelations = await this.getDefaultRelations(req, "report", parent);
            const list = await configParser.list(req, parent, defaultRelations);

            // inja bayad apply criteria kone
            // variable ha ro begire
            const filterCriteria = input;
            const sort = this.prepareSort(req.body);
            const query = this.applyCriteria(req, configParser.bGeneratorFields, filterItems, filterCriteria, sort);

            // get columns
            const columns = await this.getColumns(req, configParser);

            // get header
            const headers = await this.getHeaders(req, configParser);

            // get variables
            const variables = await this.getVariables(req);

            // get dataExpr
            const dataExpression = await this.getDataExpression(req, configParser);

            // get footerExpression
            const footerExpression = await this.getFooterExpression(req, configParser);

            // get pageSumData
            const pageSumData = await this.getPageSumData(req, configParser);

            // getDataFormat
            const dataFormat = await this.getDataFormat(req, configParser);

            // getCountColumns
            const countColumns = await this.getCountColumns(req, configParser);

            const page = req.body.page || 1;
            const limit = configParser.bGeneratorPerPage;

            if(req.body.export === 'excel' || req.query.export === 'excel'){

                const extraHeading = await this.getExtraHeading(req, configParser);
                const verbose = this.getVerbose(req);
                const hasFooter = await this.hasFooter(req, configParser);
                const hasSumPage = await this.hasSumPage(req, configParser);

                return  configParser.exportToExcel(
                    req,
                    res,
                    'all',
                    configParser.bGeneratorModel,
                    query,
                    headers,
                    columns,
                    sort,
                    page,
                    limit,
                    dataExpression,
                    footerExpression,
                    variables,
                    dataFormat,
                    pageSumData,
                    hasSumPage,
                    hasFooter,
                    list.title,
                    extraHeading,
                    "web",
                    verbose
                )

            } else {

                const result = await configParser.createReportData(
                    configParser.bGeneratorModel,
                    query,
                    columns,
                    sort,
                    page,
                    limit,
                    dataExpression,
                    footerExpression,
                    variables,
                    countColumns
                );

                const jsonResult = new ReportJson({
                    req,
                    configParser: list,
                    result,
                    headers,
                    dataFormat,
                    pageSumData
                });

                return await jsonResult.toArray().then(dt => {
                    return jsonResponse.send(res, dt);
                })

            }


        } else {

            const defaultRelations = await this.getDefaultRelations(req, "report", parent);
            const list = await configParser.list(req, parent, defaultRelations);

            const jsonResult = new ReportPrepareJson({
                req,
                configParser: list,
                pageTitle: (typeof req.i18n !== typeof undefined) ? req.i18n.t(list.title + '') : list.title + '',
                errors: configParser.formatErrors(v),
                input
            });

            return await jsonResult.toArray().then(dt => {
                return jsonResponse.send(res, dt);
            })

        }


    }

    processFilter = async (req) => {

        const abstractListConfigParser = await bReportMaker.parseBReportMakerConfig(await this.getConfig(req), this.options);

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


        const defaultRelations = await this.getDefaultRelations(req, "report", parent);
        return await abstractListConfigParser.list(req, parent, defaultRelations);

    }

    postFetchList = async (req, items) => {
        return items;
    }

    checkIndexPolicies = async (req) => {
        return true;
    }

    getColumns = async  (req, configParser) => {
        return configParser.bGeneratorColumnItems;
    }

    getHeaders = async  (req, configParser) => {

        const items = configParser.bGeneratorListItems;
        const fields = configParser.bGeneratorFields;

        let resItems = [];

        items.map(key => {

            const field = fields[key];

            if(field && field[ns.NS_LABEL]){
                if (typeof req.i18n !== typeof undefined) {
                    resItems = resItems.concat(req.i18n.t(field[ns.NS_LABEL]))
                } else {
                    resItems = resItems.concat(field[ns.NS_LABEL])
                }
            }else{
                resItems = resItems.concat(key);
            }

        })

        return resItems;

    }

    getVariables = async  (req) => {
        return {};
    }

    getDataExpression = async (req, configParser) => {

        const items = configParser.bGeneratorListItems;
        const fields = configParser.bGeneratorFields;

        let resItems = [];

        items.map(key => {

            const field = fields[key];

            if(field && field[bReportMaker.ns.NS_DATA_EXPR]){
                resItems = resItems.concat(field[bReportMaker.ns.NS_DATA_EXPR])
            }else{
                resItems = resItems.concat(key)
            }

        })

        return resItems;
    }

    getFooterExpression = async (req, configParser) => {

        const items = configParser.bGeneratorListItems;
        const fields = configParser.bGeneratorFields;

        let resItems = [];

        items.map(key => {

            const field = fields[key];

            if(field && field[bReportMaker.ns.NS_FOOTER_EXPR]){
                resItems = resItems.concat(field[bReportMaker.ns.NS_FOOTER_EXPR])
            }else{
                resItems = resItems.concat(null)
            }

        })

        return resItems;

    }

    getPageSumData = async (req, configParser) => {

        const items = configParser.bGeneratorListItems;
        const fields = configParser.bGeneratorFields;

        let resItems = [];

        items.map(key => {

            const field = fields[key];

            if(field && field[bReportMaker.ns.NS_PAGE_SUM_DATA]){
                resItems = resItems.concat(field[bReportMaker.ns.NS_PAGE_SUM_DATA])
            }else{
                resItems = resItems.concat(null)
            }

        })

        return resItems;
    }

    getDataFormat = async (req, configParser) => {
        const items = configParser.bGeneratorListItems;
        const fields = configParser.bGeneratorFields;

        let resItems = [];

        items.map(key => {

            const field = fields[key];

            if(field && field[bReportMaker.ns.NS_DATA_FORMAT]){
                resItems = resItems.concat(field[bReportMaker.ns.NS_DATA_FORMAT])
            }else{
                resItems = resItems.concat({})
            }

        })

        return resItems;
    }

    getCountColumns = async (req, configParser) => {
        return configParser.bGeneratorCountColumnItems;
    }

    getExtraHeading = async (req, configParser) => {
        return [];
    }

    hasSumPage = (req, configParser) => {
        return false;
    }

    hasFooter = (req, configParser) => {
        return false;
    }

    getDefaultRelations = async (req, mode, parent) => {
        return null;
    }

    preReport = (req, parent, isValid) => {
        return true;
    }

    applyCriteria = (req, bGeneratorFields, bGeneratorFilterItems, filterCriteria, sort) => {
        return this.repository.applyCriteria(bGeneratorFields, bGeneratorFilterItems, filterCriteria, sort);
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

    getVerbose = req => {
        return false;
    }


}

module.exports = ReportController;