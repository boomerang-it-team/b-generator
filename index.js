const bGeneratorRouter = require('./routes/bGenerator.js');
const bGenerator = require('./app/services/bGenerator.js');
const jsonResponse = require('./app/services/jsonResponse.js');
const BaseRepository = require('./app/repositories/BaseRepository.js');
const BaseJson = require('./app/json/bgenerator/BaseJson.js');
const FormJson = require('./app/json/bgenerator/FormJson.js');
const ListJson = require('./app/json/bgenerator/ListJson.js');
const CrudController = require('./app/controllers/bGen/CrudController.js');

const BGenerator = {
    bGeneratorRouter, bGenerator, jsonResponse, BaseRepository, BaseJson, FormJson, ListJson, CrudController
}

module.exports = BGenerator;