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
            pageTitle: req.i18n ? req.i18n.t(list.title + "") : list.title
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

        let input = req.body || {};

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

        const validationRules = await configParser.prepareFormValidation(req, configParser.bGeneratorFields, filterItems, null, parent, {}, ns.NS_FILTER);

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
            const list = await configParser.report(req, parent, defaultRelations);

            // inja bayad apply criteria kone
            // variable ha ro begire
            const filterCriteria = input;
            const sort = this.prepareSort(req.body);

            let flattenFilterItems = [];
            Object.entries(filterItems).map(fKey => {
                fKey[1].map(f => {
                    flattenFilterItems = flattenFilterItems.concat(f);
                })
            })

            const query = await this.applyCriteria(req, configParser, flattenFilterItems, filterCriteria, sort);

            const isExport = req.body.export === 'excel' || req.query.export === 'excel';

            // get columns
            const columns = await this.getColumns(req, configParser, isExport);

            // get header
            const headers = await this.getHeaders(req, configParser, isExport);

            // get variables
            const variables = await this.getVariables(req, isExport);

            // get dataExpr
            const dataExpression = await this.getDataExpression(req, configParser, isExport);

            // get footerExpression
            const footerExpression = await this.getFooterExpression(req, configParser, isExport);

            // get pageSumData
            const pageSumData = await this.getPageSumData(req, configParser, isExport);

            // getDataFormat
            const dataFormat = await this.getDataFormat(req, configParser, isExport);

            // getCountColumns
            const countColumns = await this.getCountColumns(req, configParser, isExport);

            const page = req.body.page || 1;
            const limit = configParser.bGeneratorPerPage;

            if(isExport){

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
                    req.i18n ? req.i18n.t(list.title + "") : list.title,
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
            const list = await configParser.report(req, parent, defaultRelations);

            const jsonResult = new ReportPrepareJson({
                req,
                configParser: list,
                pageTitle: (typeof req.i18n !== typeof undefined) ? req.i18n.t(list.title + '') : list.title + '',
                errors: configParser.formatErrors(v),
                input
            });

            return await jsonResult.toArray().then(dt => {
                return jsonResponse.send(res, dt, (req.i18n ? req.i18n.t("common:response.errors.validation") : "There is a problem during sending form."), 422);
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
        return await abstractListConfigParser.report(req, parent, defaultRelations);

    }

    postFetchList = async (req, items) => {
        return items;
    }

    checkIndexPolicies = async (req) => {
        return true;
    }

    getColumns = async  (req, configParser, isExport = false) => {
        return configParser.bGeneratorColumnItems;
    }

    getHeaders = async  (req, configParser, isExport = false) => {
        return await this.getHeadersAction(req, configParser, isExport)
    }

    getHeadersAction = async  (req, configParser, isExport = false) => {

        const items = !isExport ? configParser.bGeneratorListItems : configParser.bGeneratorExcelItems;
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

    getVariables = async  (req, isExport = false) => {
        return {};
    }

    getDataExpression = async (req, configParser, isExport = false) => {
        return await this.getDataExpressionAction(req, configParser, isExport);
    }

    getDataExpressionAction = async (req, configParser, isExport = false) => {

        const items = !isExport ? configParser.bGeneratorListItems : configParser.bGeneratorExcelItems;
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

    getFooterExpression = async (req, configParser, isExport = false) => {
        return await this.getFooterExpressionAction(req, configParser, isExport)
    }

    getFooterExpressionAction = async (req, configParser, isExport = false) => {

        const items = !isExport ? configParser.bGeneratorListItems : configParser.bGeneratorExcelItems;
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

    getPageSumData = async (req, configParser, isExport = false) => {
        return await this.getPageSumDataAction(req, configParser, isExport);
    }

    getPageSumDataAction = async (req, configParser, isExport = false) => {

        const items = !isExport ? configParser.bGeneratorListItems : configParser.bGeneratorExcelItems;
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

    getDataFormat = async (req, configParser, isExport = false) => {
        return await this.getDataFormatAction(req, configParser, isExport)
    }

    getDataFormatAction = async (req, configParser, isExport = false) => {
        const items = !isExport ? configParser.bGeneratorListItems : configParser.bGeneratorExcelItems;
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

    getCountColumns = async (req, configParser, isExport = false) => {
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

    preReport = async (req, parent, isValid) => {
        return true;
    }

    applyCriteria = async (req, configParser, bGeneratorFilterItems, filterCriteria, sort) => {
        return this.repository.applyCriteria(configParser, bGeneratorFilterItems, filterCriteria, sort);
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