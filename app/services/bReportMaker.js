const excelJS = require("exceljs");
const moment = require("moment");
const jMoment = require("jalali-moment");
const bGenerator = require("./bGenerator");
const bBase = bGenerator.bGenerator;

class bReportMaker extends bBase {

    variable_data = [];
    raw_data = [];
    data = [];


    bGeneratorColumnItems = []
    bGeneratorCountColumnItems = []

    constructor(options) {
        super(options);
    }

    static parseBReportMakerConfig = async (configFile, options) => {
        let bGenInstance = new bReportMaker(options);
        await bGenInstance.processConfigFile(configFile);
        return bGenInstance;
    }

    processConfigFile = async (configFile) => {

        const json_config = configFile;
        this.processParams(json_config);

        if(!json_config[bGenerator.ns.NS_FIELDS]){
            json_config[bGenerator.ns.NS_FIELDS] = [];
        }

        // instantiate columns
        await this.parseTableFields(json_config[bGenerator.ns.NS_FIELDS]);

        if(!json_config[bGenerator.ns.NS_LIST]){
            json_config[bGenerator.ns.NS_LIST] = {};
        }

        this.parseListItems(json_config[bGenerator.ns.NS_LIST]);

        if(!json_config[bGenerator.ns.NS_EXCEL]){
            json_config[bGenerator.ns.NS_EXCEL] = {};
        }

        this.parseExcelItems(json_config[bGenerator.ns.NS_EXCEL]);

        this.bGeneratorFilterItems = [];

        if(!json_config[bGenerator.ns.NS_FILTER]){
            json_config[bGenerator.ns.NS_FILTER] = [];
        }

        this.parseFilterItems(json_config[bGenerator.ns.NS_FILTER]);

        // custom for bReportMaker
        this.parseColumnItems(json_config[bGenerator.ns.NS_COLUMNS]);

        this.parseCountColumnItems(json_config[NS_COUNT_COLUMNS]);

    }

    parseColumnItems = (json_config) => {

        if(json_config){

            if(!Array.isArray(json_config)){
                throw "AG Configuration: Columns should be array";
            }

            json_config.map(item => {
                this.bGeneratorColumnItems.push(item);
            })

        }else{

            Object.keys(this.bGeneratorFields).map(item_key => {
                const item_val = this.bGeneratorFields[item_key];
                if(item_val[bGenerator.ns.NS_SEARCHABLE] && item_val[bGenerator.ns.NS_SEARCHABLE] === true){
                    this.bGeneratorFilterItems.push(item_key);
                }else if(bGenerator.ns.DEFAULT_SEARCHABLE === true){
                    this.bGeneratorFilterItems.push(item_key);
                }
            })
        }

    }

    parseCountColumnItems = (json_config) => {

        if(json_config){

            if(!Array.isArray(json_config)){
                throw "AG Configuration: Count Columns should be array";
            }

            json_config.map(item => {
                this.bGeneratorCountColumnItems.push(item);
            })

        }else{
            return []
        }

    }

    defaultObjectActions = () => ({

    });

    defaultListActions = () => ({

    });

    defaultBatchActions = () => ({
        'batchExportExcel': {
            'label': 'generator.exportExcel',
        }
    });


    // -----------------------------------------------------------
    // -----------------------------------------------------------
    // -----------------------------------------------------------


    createReportData = async (model, query, columns, sort, page_number, count_per_page, data_expr, footer_expr, variables, countColumns = []) => {

        let result = {};

        if(!query){
            query = {};
        }

        const offset = (Number(page_number) - 1) * Number(count_per_page);
        const limit = Number(count_per_page);
        const count_query = JSON.parse(JSON.stringify(query)); // clone query

        query.attributes = columns;

        if(countColumns.length > 0){
            for(let i = 0; i < countColumns.length; i++){
                query.attributes = query.attributes.concat(countColumns[i]);
            }
        }

        const count = await model.count(count_query);

        result.count = count;
        result.page_number = page_number;
        result.count_per_page = count_per_page;

        query.raw = true;
        query.limit = limit;
        query.offset = offset;

        if(sort){
            query.order = [sort];
        }

        const data_arr = await model.findAll(query);
        let result_data = [];

        this.raw_data = data_arr;

        for(let i = 0; i < data_arr.length; i++){

            const data = data_arr[i];

            let result_data_row = [];
            const variable_result = await this.computeVariables(data, variables);

            this.variable_data[i] = variable_result;

            for(let j = 0; j < data_expr.length; j++){
                const expr = data_expr[j];

                result_data_row = result_data_row.concat(await this.computeData(data, variable_result, expr, i, offset));
                this.data[i] = result_data_row;

            }

            result_data[i] = result_data_row;

        }

        result['data'] = result_data;
        let footer_data = [];

        for(let i = 0; i < footer_expr.length; i++){
            const expr = footer_expr[i];
            footer_data[i] = await this.computeData(null, footer_data, expr);
        }

        result['footer_data'] = footer_data;
        result['raw_data'] = this.raw_data;
        return result;

    }

    exportToExcel = async (req, res, export_type, model, query, headers, columns, sort, page_number, count_per_page, data_expr, footer_expr, variables, data_format, page_sum_data, has_sum_page, has_footer, report_title, extra_heading = [], output = "web", verbose = false) => {

        if(export_type === "all"){
            page_number = 1;
            count_per_page = 3000;
        }

        const result = await this.createReportData(model, query, columns, sort, page_number, count_per_page, data_expr, footer_expr, variables, verbose);
        await this.exportToExcelByResults(req, res, result, headers, page_number, count_per_page, data_format, report_title, extra_heading);

    }

    exportToExcelByResults = async (req, res, result, headers, page_number, count_per_page, data_format, report_title, extra_heading = []) => {

        const data = result['data'];
        const count = result['count'];

        let sum_page_row = [];
        const footer_row = result['footer_data'];

        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet(report_title);

        worksheet.views = [
            { state: "normal", rightToLeft: this.isLayoutRightToLeft(req) }
        ];

        const default_border = {
            style: 'thin',
            color: '#E8E8E8'
        };

        const header_border = {
            style: 'thin',
            color: '#1006A3'
        }

        const header_style = {
            border: {
                bottom: header_border,
                top: header_border,
                right: header_border,
                left: header_border
            },
            font: {
                bold: false,
                size: 12
            },
            fill: {
                type: 'pattern',
                pattern:'solid',
                fgColor: { argb:'E1E0F7' }
            }
        }

        const odd_style = {
            border: {
                bottom: default_border,
                top: default_border,
                right: default_border,
                left: default_border
            },
            font: {
                bold: false,
                size: 10
            },
            fill: {
                type: 'pattern',
                pattern:'solid',
                fgColor: { argb:'FFFFFF' }
            }
        }

        const even_style = {
            border: {
                bottom: default_border,
                top: default_border,
                right: default_border,
                left: default_border
            },
            font: {
                bold: false,
                size: 10
            },
            fill: {
                type: 'pattern',
                pattern:'solid',
                fgColor: { argb:'F0F0F0' }
            }
        }

        // heading and extra heading
        worksheet.mergeCells('A1:C1');
        worksheet.mergeCells('D1:H1');
        worksheet.getCell('A1').value = (req.i18n ? req.i18n.t("common:labels.report_title") : "Report Title");
        worksheet.getCell('D1').value = report_title;

        /* ----- style ------- */
        worksheet.getCell("A1").border = header_style.border;
        worksheet.getCell("A1").font = header_style.font
        worksheet.getCell("A1").fill = header_style.fill;
        worksheet.getCell("D1").border = odd_style.border;
        worksheet.getCell("D1").font = odd_style.font;
        worksheet.getCell("D1").fill = odd_style.fill;
        /* ------------------ */

        worksheet.mergeCells('A2:C2');
        worksheet.mergeCells('D2:H2');
        worksheet.getCell('A2').value = (req.i18n ? req.i18n.t("common:labels.report_date") : "Report Date");
        worksheet.getCell('D2').value = this.getCurrentDateByLocale(req);

        /* ----- style ------- */
        worksheet.getCell("A2").border = header_style.border;
        worksheet.getCell("A2").font = header_style.font
        worksheet.getCell("A2").fill = header_style.fill;
        worksheet.getCell("D2").border = odd_style.border;
        worksheet.getCell("D2").font = odd_style.font;
        worksheet.getCell("D2").fill = odd_style.fill;
        /* ------------------ */

        worksheet.mergeCells('A3:C3');
        worksheet.mergeCells('D3:H3');
        const total = Math.ceil(count / count_per_page);
        worksheet.getCell('A3').value = (req.i18n ? req.i18n.t("common:labels.page") : "Page");
        worksheet.getCell('D3').value = (req.i18n ? req.i18n.t("common:labels.page_from_total", {page: page_number, total}) : "Page " + page_number + " From " + total);

        /* ----- style ------- */
        worksheet.getCell("A3").border = header_style.border;
        worksheet.getCell("A3").font = header_style.font
        worksheet.getCell("A3").fill = header_style.fill;
        worksheet.getCell("D3").border = odd_style.border;
        worksheet.getCell("D3").font = odd_style.font;
        worksheet.getCell("D3").fill = odd_style.fill;
        /* ------------------ */

        let t = 3;
        const extraKeys = Object.keys(extra_heading);
        for(let i = 0; i < extraKeys.length; i++){
            const ex_key = extraKeys[i];
            const ex_value = extra_heading[ex_key];

            t++;

            worksheet.mergeCells(t, 0, t, 2);
            worksheet.mergeCells(t, 3, t, 7);
            worksheet.getCell(t, 0).value = ex_key;
            worksheet.getCell(t, 3).value = ex_value;

            /* ----- style ------- */
            worksheet.getCell(t, 0).border = header_style.border
            worksheet.getCell(t, 0).font = header_style.font
            worksheet.getCell(t, 0).fill = header_style.fill
            worksheet.getCell(t, 3).border = odd_style.border
            worksheet.getCell(t, 3).font = odd_style.font
            worksheet.getCell(t, 3).fill = odd_style.fill
            /* ------------------ */

        }

        let i = 1;
        for(let j = 0; j < headers.length; j++){
            const header = headers[j];
            let row = worksheet.getRow(t + 2);
            row.getCell(i).value = header;

            /* ----- style ------- */
            row.getCell(i).border = header_style.border;
            row.getCell(i).font = header_style.font
            row.getCell(i).fill = header_style.fill;
            /* ------------------ */

            i++;
        }

        i = 0;
        let row_number = t + 3;
        for(let j = 0; j < data.length; j++){
            const row = data[j];
            const db_row_number = Number(row_number) - (t + 3);
            const excelRow = worksheet.getRow(row_number);
            i = (i + 1) % 2
            let className = "even";
            if(i % 2 === 1){
                className = "odd";
            }

            let col_number = 1;
            for(let k = 0; k < row.length; k++){

                const item = row[k];
                let view_func = data_format[k]['func'] || ""

                excelRow.getCell(col_number).border = odd_style.border
                excelRow.getCell(col_number).font = odd_style.font

                if(className === "even"){
                    excelRow.getCell(col_number).fill = even_style.fill
                }else{
                    excelRow.getCell(col_number).fill = odd_style.fill
                }

                let item_value = item;
                if(item !== null && typeof item === 'object'){
                    item_value = await item.__toString();
                }

                let ddd;
                if(data_format[k][0]){
                    ddd = data_format[k];
                }else{
                    ddd = [data_format[k]];
                }

                // TODO CONDITIONAL STYLES
                excelRow.getCell(col_number).value = item_value;

                col_number++;

            }

            row_number++;
        }

        res.status(200);
        res.setHeader('Content-Type', 'text/xlsx');
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=report.xlsx'
        );
        await workbook.xlsx.write(res)
            .then(function () {
                res.end()
            });

    }


    computeData = async (data, variable_result, expr, index, offset) => {
        if(expr){
            if(typeof expr === 'object'){
                const func = expr.func;
                const val = expr.db_value ? expr.db_value.replaceAll(".", "_") : null;

                switch (func){
                    case "RADIF":
                        return Number(offset) + Number(index) + 1;
                    case "STATIC":
                        return await this.computeStaticFunc(data, variable_result, expr.class_name, expr.method_name, expr.args);
                    case "EXPR":
                        return this.computeExpression(data, variable_result, expr.expr);
                    case "VAR_OBJECT":
                        return await this.computeVariableObject(data, variable_result, expr.expr);
                    case "CONSTANT":
                        return expr.value;
                    default:
                        return "";
                }

            }else{
                return data[expr.replaceAll('.', "_")];
            }
        }

    }

    computeVariables = async (data, variables) => {

        let variable_result = {};
        const varKeys = Object.keys(variables);
        for(let i = 0; i < varKeys.length; i++){
            const var_key = varKeys[i];
            const var_value = variables[var_key]

            switch (var_value.func){
                case "STATIC":
                    variable_result[var_key] = await this.computeStaticFunc(data, variable_result, var_value['class_name'], var_value['method_name'], var_value['args']);
                    break;
                case "EXPR":
                    variable_result[var_key] = this.computeExpression(data, variable_result, var_value['expr']);
                    break;
            }
        }

        return variable_result;
    }

    computeStaticFunc = async (data = null, variable_result = null, class_name, method_name, args) => {
        const args_value = await this.computeArgs(data, variable_result, args);
        return await class_name[method_name].apply(this, args_value);
    }

    computeArgs = async (data = null, variable_result = null, args) => {

        let args_value = [];
        for(let i = 0; i < args.length; i++){
            const arg = args[i];

            if(arg['type'] === 'db_value'){
                args_value = args_value.concat(data[arg.value.replaceAll('.', "_")]);
            } else if (arg['type'] === 'const'){
                args_value = args_value.concat(arg['value']);
            } else if (arg['type'] === 'variable'){
                args_value = await args_value.concat(this.computeVariableObject(data, variable_result, arg['value']));
            }
        }

        return args_value;
    }

    computeExpression = (data = null, variable_result = null, expr_string) => {

        let isString = false;

        if(data !== null){
            const dataKeys = Object.keys(data);
            for(let i = 0; i < dataKeys.length; i++){
                const data_key = dataKeys[i];
                const data_value = data[data_key];
                const _key = data_key.replaceAll('.', "_");
                expr_string = expr_string.replaceAll('['+_key+']', parseInt(data_value));
            }
        }

        if(variable_result !== null){
            const varKeys = Object.keys(variable_result);
            for(let i = 0; i < varKeys.length; i++){
                const data_key = varKeys[i];
                const data_value = variable_result[data_key];

                const _key = data_key.replaceAll('.', "_");
                if(typeof data_value === 'string' && parseFloat(data_value) === 0 && data_value !== "0" && data_value !== "0.0" && data_value !== "0.00"){
                    expr_string = expr_string.replaceAll('{' + _key + '}', data_value, expr_string);
                    isString = true;
                }else if(data_value.indexOf('.') !== -1){
                    expr_string = expr_string.replaceAll('{' + _key + '}', parseFloat(data_value));
                }else{
                    expr_string = expr_string.replaceAll('{' + _key + '}', parseInt(data_value));
                }

            }

        }

        if(isString){
            return expr_string;
        }else{
            return eval(expr_string);
        }

    }

    computeVariableObject = async (data = null, variable_result = null, expr_string) => {

        if(variable_result !== null){

            const splited = expr_string.split('.');
            const varName = splited[0];
            const varObject = splited[1];

            const varKeys = Object.keys(variable_result);
            for(let i = 0; i < varKeys.length; i++) {
                const data_key = varKeys[i];
                const data_value = variable_result[data_key];

                if(data_value === null){
                    // continue;
                }else{
                    const _key = data_key.replaceAll('.', "_");
                    if('{'+_key+'}' === varName){
                        return await data_value[varObject];
                    }
                }
            }

        }

        return "";

    }

    getExprValue = (expr, row_number) => {

        if(row_number < 0) return "";
        if(!Array.isArray(expr)){
            return this._getExprValue(expr, row_number);
        }else{
            const func = expr['func'].toUpperCase();

            if(func === 'EXPR'){
                return this._getExprValue(expr['expr'], row_number);
            }
        }

    }

    _getExprValue = (expr_string, row_number) => {

        expr_string = expr_string.replaceAll('.', '_');

        if(typeof this.raw_data[row_number] !== 'undefined' && this.raw_data[row_number] !== null){
            const rowKeys = Object.keys(this.raw_data[row_number]);
            for(let i = 0; i < rowKeys.length; i++){
                const data_key = rowKeys[i];
                const data_value = this.raw_data[row_number][data_key];

                if(Number.isInteger(data_value)){
                    expr_string = expr_string.replaceAll('['+data_key+']', Number(data_value) + "");
                }else{
                    expr_string = expr_string.replaceAll('['+data_key+']', '"' + data_value + '"');
                }
            }

        }

        if(typeof this.variable_data[row_number] !== 'undefined' && this.variable_data[row_number] !== null){
            const varKeys = Object.keys(this.variable_data[row_number]);
            for(let i = 0; i < varKeys.length; i++){
                const data_key = varKeys[i];
                const data_value = this.variable_data[row_number][data_key];

                if(Number.isInteger(data_value)){
                    expr_string = expr_string.replaceAll('{'+data_key+'}', Number(data_value) + "");
                }else{
                    expr_string = expr_string.replaceAll('{'+data_key+'}', '"' + data_value + '"');
                }
            }
        }

        return eval(expr_string);

    }

    getRawDataRow = (row_number) => {
        return this.raw_data[row_number];
    }

    isLayoutRightToLeft = (req) => {
        const lng = req.headers['accept-language'] || 'en';
        return lng && (lng.toLowerCase() === "fa" || lng.toLowerCase() === "ar");
    }

    getCurrentDateByLocale = req => {
        const lng = req.headers['accept-language'] || 'en';
        if(lng.toLowerCase() !== "fa"){
            return moment().format('YYYY-MM-DD hh:mm:ss')
        }else{
            return jMoment().locale("fa").format('YYYY-MM-DD hh:mm:ss')
        }
    }

}

const NS_COUNT_COLUMNS = 'count_columns';
const NS_FOOTER_EXPR = 'footer_expr';
const NS_PAGE_SUM_DATA = 'page_sum_data';
const NS_DATA_FORMAT = 'data_format';
const NS_DATA_EXPR = 'data_expr';

module.exports = bReportMaker;
module.exports.ns = {
    NS_COUNT_COLUMNS,
    NS_FOOTER_EXPR,
    NS_PAGE_SUM_DATA,
    NS_DATA_FORMAT,
    NS_DATA_EXPR
}
