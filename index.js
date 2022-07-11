const bGeneratorRouter = require('./routes/bGenerator.js');
const bGenerator = require('./app/services/bGenerator.js');
const jsonResponse = require('./app/services/jsonResponse.js');
const BaseRepository = require('./app/repositories/BaseRepository.js');
const BaseJson = require('./app/json/bgenerator/BaseJson.js');
const FormJson = require('./app/json/bgenerator/FormJson.js');
const ListJson = require('./app/json/bgenerator/ListJson.js');
const CrudController = require('./app/controllers/bGen/CrudController.js');
const CrudParentController = require('./app/controllers/bGen/CrudParentController.js');
const bReportMaker = require('./app/services/bReportMaker');
const ReportJson = require('./app/json/bgenerator/ReportJson');


const BGenerator = {
    bGeneratorRouter, jsonResponse, BaseRepository, BaseJson, FormJson, ListJson, CrudController, CrudParentController,
    bGenerator: bGenerator.bGenerator,
    ns: bGenerator.ns,
    bReportMaker,
    ReportJson
}

module.exports = BGenerator;