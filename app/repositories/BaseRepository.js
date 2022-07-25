const {Op} = require('sequelize');
const {ns} = require('./../services/bGenerator');

class BaseRepository {

    model;
    fieldSearchable = [];

    constructor(model) {
        this.model = model;
    }

    applyCriteria = (fields, filterItems, filterCriteria, sort) => {

        let enhancedCriteria = {};
        let enhancedInclude = [];
        filterItems && filterItems.map(filterItem => {

            filterCriteria && Object.keys(filterCriteria).map(filterCriterionKey => {

                let filterCriterionValue = filterCriteria[filterCriterionKey];

                let operator = Op.eq;
                if (fields[filterItem][ns.NS_DB_TYPE] === ns.DB_TYPE_INT) {
                    operator = Op.eq;
                } else if (fields[filterItem][ns.NS_DB_TYPE] === ns.DB_TYPE_TEXT) {
                    operator = Op.like;
                } else if (fields[filterItem][ns.NS_DB_TYPE] === ns.DB_TYPE_DATE) {
                    operator = Op.eq;
                }

                if (filterItem === filterCriterionKey) {

                    if (!filterCriterionValue || ("" + filterCriterionValue).trim() === '') {
                        return;
                    }

                    if (operator === Op.like) {
                        filterCriterionValue = '%' + filterCriterionValue + '%';
                    }

                    if(this.model.associations[filterItem] && this.model.associations[filterItem].options){
                        enhancedInclude = enhancedInclude.concat({
                            association: filterItem,
                            where: {
                                id: filterCriterionValue
                            }
                        })
                    } else {
                        enhancedCriteria[filterCriterionKey] = { [operator]: filterCriterionValue } ;
                    }


                }

            })
        })

        return {
            sort,
            criteria: enhancedCriteria,
            include: enhancedInclude
        }

    }

    paginate = (filterItems, filterCriteria, limit, offset, appliedCriteria) => {

        let options = {
            where: appliedCriteria.criteria,
            include: appliedCriteria.include,
            offset,
            limit,
        }

        if(appliedCriteria.sort){
            options.order = [appliedCriteria.sort];
        }

        return this.model.findAndCountAll(options);
    }

    delete = id => {
        return this.model.destroy({
            where: { id }
        })
    }

    newModel = () => {
        return this.model.build();
    }

    create = (input, options) => {
        return this.model.create(input, options);
    }

    update = (input, id) => {
        return this.model.update(input, {
           where: { id }
        });
    }

    find = id => {
        return this.model.findByPk(id);
    }

    findOne = (params) => {
        return this.model.findOne(params);
    }

    count = params => {
        return this.model.count(params);
    }

}

module.exports = BaseRepository;