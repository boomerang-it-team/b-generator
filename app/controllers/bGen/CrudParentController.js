const CrudController = require("./CrudController");

class CrudParentController extends CrudController {

    applyCriteria = (req, bGeneratorFields, bGeneratorFilterItems, filterCriteria, sort) => {
        filterCriteria[this.objectRef] = req.body[this.objectRef];
        return this.repository.applyCriteria(bGeneratorFields, bGeneratorFilterItems, filterCriteria, sort);
    }

    checkIndexPolicies = async (req) => {
        if(!req.body[this.objectRef]){
            return false;
        }
        return true;
    }

    checkDeletePolicies = async (req) => {

        if(!req.body[this.objectRef]){
            return false;
        }

        const item = await this.repository.find(req.params.id);
        if(item[this.objectRef] !== req.body[this.objectRef]){
            return false;
        }

        return true;

    }

    checkLoadPolicies = async (req) => {

        const mode = req.body.action;

        if(mode !== 'create'){
            const item = await this.repository.find(req.params.id);
            if(item[this.objectRef] !== req.body[this.objectRef]){
                return false;
            }
        }

        return true;
    }

    checkStorePolicies = async (req) => {

        const mode = req.body.action;

        if(mode !== "create"){
            const item = await this.repository.find(req.params.id);

            if(item[this.objectRef] !== req.body[this.objectRef]){
                return false;
            }
        }

        return true;
    }

}

module.exports = CrudParentController;