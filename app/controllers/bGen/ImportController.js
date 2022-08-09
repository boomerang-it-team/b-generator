const Validator = require('Validator');
const bImportExcel = require("./../../services/bImportExcel");
const {ns} =  require("./../../services/bGenerator")
const jsonResponse = require('./../../services/jsonResponse');
const ImportPrepareJson = require("./../../json/bgenerator/ImportPrepareJson");
const os = require("os");
const fs = require('fs');

class ImportController {

    config;
    options;

    constructor(config, options) {
        this.config = config;
        this.options = options;
    }

    getConfig = async () => {
        return this.config;
    }

    prepare = async (req, res) => {

        const policiesPassed = await this.checkPolicies(req);
        if(!policiesPassed){
            return jsonResponse.send(res, [], (req.i18n ? req.i18n.t("common:response.errors.access_denied") : "Access Denied"), 403);
        }

        const configParser = await bImportExcel.parseBReportMakerConfig(await this.getConfig(req), this.options);
        const list = await configParser.prepareImport(req);

        const jsonResult = new ImportPrepareJson({
            req,
            configParser: list,
            pageTitle: req.i18n ? req.i18n.t(list.title + "") : list.title
        });

        return await jsonResult.toArray().then(dt => {
            return jsonResponse.send(res, dt);
        })

    }

    downloadSampleData = async  (req, res) => {

        const policiesPassed = await this.checkPolicies(req);
        if(!policiesPassed){
            return jsonResponse.send(res, [], (req.i18n ? req.i18n.t("common:response.errors.access_denied") : "Access Denied"), 403);
        }

        const configParser = await bImportExcel.parseBReportMakerConfig(await this.getConfig(req), this.options);
        const list = await configParser.prepareImport(req);

        const headers = await this.getHeaders (req, configParser, true)
        return await configParser.exportSampleDataToExcel(req, res, req.i18n ? req.i18n.t(list[ns.NS_TITLE] + "") : list[ns.NS_TITLE], headers);

    }

    import = async (req, res) => {

        const policiesPassed = await this.checkPolicies(req);
        if(!policiesPassed){
            return jsonResponse.send(res, [], (req.i18n ? req.i18n.t("common:response.errors.access_denied") : "Access Denied"), 403);
        }

        const { from, to, simulate } = req.body;

        let file;
        let filename = null;
        let uploadPath = null;
        let mimetype = null;
        if (req.files && Object.keys(req.files).length !== 0) {
            file = req.files.file;
            filename = Date.now() + "-" + file.name;
            const tempDir = os.tmpdir();
            uploadPath = tempDir + "/" + filename;
            mimetype = file.mimetype;
        }

        // inja avval file ro migire
        const configParser = await bImportExcel.parseBReportMakerConfig(await this.getConfig(req), this.options);
        const list = await configParser.prepareImport(req);

        const validationRules = {
            from: "required|integer|min:1",
            to: "required|integer",
            simulate: "nullable|boolean",
            file: 'required|in:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.binary.macroEnabled.12,application/vnd.ms-excel'
        };
        const v = Validator.make({ from, to, simulate: simulate == "true" ? true : false, file: mimetype }, validationRules);

        if(v.fails()){

            const jsonResult = new ImportPrepareJson({
                req,
                configParser: list,
                pageTitle: req.i18n ? req.i18n.t(list.title + "") : list.title,
                errors: configParser.formatErrors(v)
            });

            return await jsonResult.toArray().then(dt => {
                return jsonResponse.send(res, dt, (req.i18n ? req.i18n.t("common:response.errors.validation") : "There is a problem during sending form."), 422);
            })
            
        }

        if(!file || !uploadPath){
            return jsonResponse.send(res, {}, (req.i18n ? req.i18n.t("common:response.general.failed") : "There was an error performing the operation."));
        }

        // upload file
        return file.mv(uploadPath).then(err => {

            if (err) {
                return res.status(500).send(err)
            }

            return configParser.loadWorkbook(uploadPath);
        })
        .then(async (workbook) => {
            const worksheet = workbook.getWorksheet(1);

            if(!worksheet){
                return Promise.reject("Worksheet not found.");
            }

            let highestRow = worksheet.rowCount;
            if(simulate) {
                highestRow = Math.min(500, highestRow);
            }

            const headers = await this.getHeaders(req, configParser, simulate);
            const reverseMapping = await this.mapHeadersToFields(req, configParser, headers, simulate);
            const mappingToColumnNumber = await this.mapHeadersToColNumbers(req, worksheet, headers, simulate);
            
            const allHeadersArePresent = this.checkAllHeadersArePresent(mappingToColumnNumber);
            if(allHeadersArePresent.hasError){

                const jsonResult = new ImportPrepareJson({
                    req,
                    configParser: list,
                    pageTitle: req.i18n ? req.i18n.t(list.title + "") : list.title,
                    errors: {
                        file: ["Missing Columns: (" + allHeadersArePresent.notFoundItems.join(", ") + ") Inside Excel File"]
                    }
                });

                return await jsonResult.toArray().then(dt => {
                    return jsonResponse.send(res, dt, (req.i18n ? req.i18n.t("common:response.errors.validation") : "There is a problem during sending form."), 422);
                })

            }

            let itemsToStore = [];

            const first_row = 2;

            for(let i = Math.max(first_row, from); i <= Math.min(highestRow, to); i++){
                const row = worksheet.getRow(i);
                const itemToStore =  await this.getRowData(req, i + 1, configParser, headers, row, mappingToColumnNumber, reverseMapping, simulate);
                if(simulate){
                    if(itemToStore && itemToStore.length > 0){
                        itemsToStore = itemsToStore.concat([[i].concat(itemToStore)]);
                    }
                }else{
                    if(itemToStore){
                        itemsToStore = itemsToStore.concat(itemToStore);
                    }
                }
            }

            // removing the file
            fs.unlinkSync(uploadPath);

            // inja age simulate bood mifreste too khorooji,
            // age simulate nabood store mikone
            if(simulate){

                return jsonResponse.send(res, {
                    headers: ['#'].concat(headers),
                    has_footer: false,
                    has_sum_page: false,
                    result: {
                        count: itemsToStore.length,
                        page_number: 1,
                        count_per_page: itemsToStore.length,
                        data: itemsToStore
                    }
                }, "Showing Maximum 500 rows in simulation mode.");

            }else{
                await this.storeData(req, itemsToStore);

                return jsonResponse.send(res,
                    {},
                    (req.i18n ? req.i18n.t("common:response.general.success") : "Operation was done successfully."));
            }

        })
        .catch(error => {
            throw error;
            return jsonResponse.send(res, {}, (req.i18n ? req.i18n.t(error) : error));
        })

    }

    getHeaders = async  (req, configParser, isSimulate = false) => {
        return await this.getHeadersAction(req, configParser, isSimulate)
    }

    getHeadersAction = async  (req, configParser, isSimulate = false) => {

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

    mapHeadersToFields = async  (req, configParser, headers, isSimulate = false) => {
        return await this.mapHeadersToFieldsAction(req, configParser, headers, isSimulate)
    }

    mapHeadersToFieldsAction = async  (req, configParser, headers, isSimulate = false) => {

        const fieldsObj = configParser.bGeneratorFields;
        const fields = Object.keys(fieldsObj).map(key => {
            return {
                name: key,
                ...fieldsObj[key]
            }
        });

        let resItems = {};

        headers.map(label => {

            const fieldArr = fields.filter(x => {
                if(x && x[ns.NS_LABEL]){
                    if (typeof req.i18n !== typeof undefined) {
                        return req.i18n.t(x[ns.NS_LABEL]) === label;
                    } else {
                        return x[ns.NS_LABEL] === label;
                    }
                }else{
                    return x[ns.NS_NAME] === label;
                }
            });

            resItems[label] = fieldArr.length > 0 ? fieldArr[0] : null
        })

        return resItems;

    }

    mapHeadersToColNumbers = async  (req, worksheet, headers, isSimulate = false) => {
        return await this.mapHeadersToColNumbersAction(req, worksheet, headers, isSimulate)
    }

    mapHeadersToColNumbersAction = async  (req, worksheet, headers, isSimulate = false) => {

        const highestColumn = worksheet.columnCount;

        let resItems = {}

        headers.map(x => {
            resItems[x] = null;
        });

        for(let c = 1; c <= highestColumn; c++) {
            const headerCell = worksheet.getRow(1).getCell(c).value.trim();

            headers.map(label => {
                if(headerCell === label){
                    resItems[label] = c;
                }
            })

        }

        return resItems;
    }

    checkAllHeadersArePresent = (mappingToColumnNumber) => {
        let hasError = false;
        let notFoundItems = [];
        Object.keys(mappingToColumnNumber).map(key => {
            if(!mappingToColumnNumber[key]){
                hasError = true;
                notFoundItems = notFoundItems.concat(key);
            }
        })

        return {
            hasError,
            notFoundItems
        }
    }

    getRowData = async (req, seqnr, configParser, headers, row, mappingToColumnNumber, reverseMapping, simulate) => {
        return this.getRowDataAction(req, seqnr, configParser, headers, row, mappingToColumnNumber, reverseMapping, simulate);
    }

    getRowDataAction = async (req, seqnr, configParser, headers, row, mappingToColumnNumber, reverseMapping, simulate) => {

        let item = simulate ? [] : new configParser.bGeneratorModel;
        headers.map(label => {
            if(simulate){
                item = item.concat(
                    row.getCell(mappingToColumnNumber[label]).value
                )
            }else{
                if(reverseMapping[label]){
                    item[reverseMapping[label][ns.NS_NAME]] = row.getCell(mappingToColumnNumber[label]).value;
                }
            }
        })

        return item;

    }

    storeData = async (items, options) => {
        for(let i = 0; i < items.length; i++){
            await items.save(options);
        }
    }

    checkPolicies = async (req) => {
        return true;
    }

}

module.exports = ImportController;