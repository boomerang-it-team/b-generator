const CrudController = require("./CrudController");

class CrudParentController extends CrudController {

    applyCriteria = (req, bGeneratorFields, bGeneratorFilterItems, filterCriteria, sort) => {
        filterCriteria[this.objectRef] = req.body[this.objectRef];
        return this.repository.applyCriteria(bGeneratorFields, bGeneratorFilterItems, filterCriteria, sort);
    }

    checkIndexPolicies = async (req) => {
        return await this.checkIndexPoliciesAction(req);
    }

    checkIndexPoliciesAction = async (req) => {
        if(!req.body[this.objectRef]){
            return false;
        }
        return true;
    }

    checkDeletePolicies = async (req) => {
        return await this.checkDeletePoliciesAction(req);
    }

    checkDeletePoliciesAction = async (req) => {

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
        return await this.checkLoadPoliciesAction(req);
    }

    checkLoadPoliciesAction = async (req) => {

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
        return await this.checkStorePoliciesAction(req);
    }

    checkStorePoliciesAction = async (req) => {

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