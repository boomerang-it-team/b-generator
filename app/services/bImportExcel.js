const excelJS = require("exceljs");
const moment = require("moment");
const jMoment = require("jalali-moment");
const bGenerator = require("./bGenerator");
const bBase = bGenerator.bGenerator;

class bImportExcel extends bBase {

    bGeneratorIterations = [];

    constructor(options) {
        super(options);
    }

    static parseBReportMakerConfig = async (configFile, options) => {
        let bGenInstance = new bImportExcel(options);
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
        await this.parseTableFields(this.getDefaultFields().concat(json_config[bGenerator.ns.NS_FIELDS]), false);

        if(!json_config[bGenerator.ns.NS_FIELDSETS]){
            json_config[bGenerator.ns.NS_FIELDSETS] = [];
        }

        this.parseTableFieldSets(this.getDefaultFieldSets());

        if(!json_config[bGenerator.ns.NS_LIST]){
            json_config[bGenerator.ns.NS_LIST] = {};
        }

        this.parseListItems(json_config[bGenerator.ns.NS_LIST]);

        if(!json_config[bGenerator.ns.NS_FILTER]){
            json_config[bGenerator.ns.NS_FILTER] = [];
        }

        this.bGeneratorFilterItems = this.parseFormItems(this.getDefaultFilter(), this.bGeneratorFilterItems, false);

    }

    prepareImport = async (req) => {

            return {
                bGeneratorOptions: this.bGeneratorOptions,
                [bGenerator.ns.NS_TITLE]: this.bGeneratorListTitle,
                [bGenerator.ns.NS_DISPLAY]: this.bGeneratorListItems,
                [bGenerator.ns.NS_FIELDS]: this.bGeneratorFields,
                [bGenerator.ns.NS_MODEL]: this.bGeneratorModel,
                [bGenerator.ns.NS_ACTIONS]: this.bGeneratorListActions,
                [bGenerator.ns.NS_GENERAL_ACTIONS]: this.bGeneratorGeneralActions,
                [bGenerator.ns.NS_CUSTOM_VIEW]: this.bGeneratorParams[bGenerator.ns.NS_CUSTOM_VIEW],
                [bGenerator.ns.NS_FILTER]: this.bGeneratorFilterItems,
                [bGenerator.ns.NS_LAYOUT]: this.bGeneratorListLayout,
                [bGenerator.ns.NS_FIELDSETS]: this.bGeneratorFieldSets,
            };
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

    exportSampleDataToExcel = async (req, res, report_title, headers) => {

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
        
        let t = 1;
        let i = 1;
        for(let j = 0; j < headers.length; j++){
            const header = headers[j];

            let row = worksheet.getRow(t);
            worksheet.getCell(t, i).value = header;

            /* ----- style ------- */
            row.getCell(i).border = header_style.border;
            row.getCell(i).font = header_style.font
            row.getCell(i).fill = header_style.fill;
            /* ------------------ */

            i++;
        }

        res.status(200);
        res.setHeader('Content-Type', 'text/xlsx');
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=sampleData.xlsx'
        );
        await workbook.xlsx.write(res)
            .then(function () {
                res.end()
            });

    }

    // TODO CHECK VALIDATION AND MIME TYPES
    loadWorkbook = async (uploadPath) => {
        let workbook = new excelJS.Workbook();
        return workbook.xlsx.readFile(uploadPath);
    }

    isLayoutRightToLeft = (req) => {
        const lng = req.headers['accept-language'] || 'en';
        return lng && (lng.toLowerCase() === "fa" || lng.toLowerCase() === "ar");
    }

    getDefaultFieldSets = () => {
        return [
            { "name": "col1", "label": "col1" },
            { "name": "col2", "label": "col2" },
        ];
    }

    getDefaultFields = () => {
        return [
            { "name": "file", "label": "common:labels.file", "filter": {
                "type": "file"
            }},
            { "name": "simulate", "label": "common:labels.simulate", "filter": {
                    "type": "checkbox", "default": true
            }},
            { "name": "from", "label": "common:labels.from_row", "filter": {
                    "type": "text", "default": 2
            }},
            { "name": "to", "label": "common:labels.to_record", "filter": {
                    "type": "text", "default": 2
            }},
        ];
    }

    getDefaultFilter = () => {
        return {
            "display": {
                "col1": ["file", "simulate"],
                "col2": ["from", "to"]
            }
        }
    }

}
module.exports = bImportExcel;
