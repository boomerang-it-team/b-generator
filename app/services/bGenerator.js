class bGenerator {

    bGeneratorViewMode;

    bGeneratorSkeleton;
    bGeneratorParams = [];
    bGeneratorFields = {};
    bGeneratorFieldSets = {};
    bGeneratorModel;
    bGeneratorParentModel;
    bGeneratorParentRef = "id";
    bGeneratorObjectRef;
    bGeneratorRepository;
    bGeneratorEntityManager = null;
    bGeneratorModelName;
    bGeneratorParentModelName
    bGeneratorListTitle;
    bGeneratorListItems;
    bGeneratorListSort = null;
    bGeneratorPerPage = 20;
    bGeneratorListLayout = 'tabular'; //tabular,card
    bGeneratorEditLayout = 'justify'; //justify,centered
    bGeneratorNewLayout = 'justify'; //justify,centered
    bGeneratorShowLayout = 'justify'; //justify,centered

    bGeneratorEditFieldSetLayout = "vertical"; // tabbed, wizard,vertical
    bGeneratorNewFieldSetLayout = "vertical"; // tabbed, wizard, vertical
    bGeneratorShowFieldSetLayout = "vertical"; // tabbed, wizard,vertical

    bGeneratorExcelItems;

    bGeneratorNewTitle;
    bGeneratorNewItems;

    bGeneratorEditTitle;
    bGeneratorEditItems;

    bGeneratorShowTitle;
    bGeneratorShowItems;

    bGeneratorFilterItems;
    bGeneratorFilterSession;

    bGeneratorObjectActions;
    bGeneratorObjectActionsDisplay = 'expanded' // collapsed
    bGeneratorListActions;
    bGeneratorCreateActions;
    bGeneratorEditActions;
    bGeneratorBatchActions;
    bGeneratorGeneralActions;
    bGeneratorShowActions;

    bGeneratorSortField = null;
    bGeneratorSortOrder = null;

    bGeneratorOptions;

    parseBGeneratorConfig = async (configFile, options, mode = VIEW_MODE_API) => {
        this.bGeneratorOptions = options;
        await this.processConfigFile(configFile);
        this.bGeneratorViewMode = mode;
        return this;
    }

    processConfigFile = async (configFile) => {

        const json_config = configFile;
        this.processParams(json_config);

        if(!json_config[NS_FIELDS]){
            json_config[NS_FIELDS] = [];
        }

        // instantiate columns
        await this.parseTableFields(json_config[NS_FIELDS]);

        if(!json_config[NS_FIELDSETS]){
            json_config[NS_FIELDSETS] = [];
        }

        // instantiate columns
        this.parseTableFieldSets(json_config[NS_FIELDSETS]);

        if(!json_config[NS_LIST]){
            json_config[NS_LIST] = {};
        }

        this.parseListItems(json_config[NS_LIST]);

        if(!json_config[NS_EXCEL]){
            json_config[NS_EXCEL] = {};
        }

        this.parseExcelItems(json_config[NS_EXCEL]);

        this.bGeneratorEditItems = {};
        this.bGeneratorNewItems = {};
        this.bGeneratorShowItems = {};
        this.bGeneratorFilterItems = [];

        if(!json_config[NS_FORM]){
            json_config[NS_FORM] = [];
        }

        if(!json_config[NS_NEW]){
            json_config[NS_NEW] = [];
        }

        if(!json_config[NS_EDIT]){
            json_config[NS_EDIT] = [];
        }

        if(!json_config[NS_SHOW]){
            json_config[NS_SHOW] = [];
        }

        if(!json_config[NS_FILTER]){
            json_config[NS_FILTER] = [];
        }

        if(json_config[NS_FORM][NS_LAYOUT]){
            this.bGeneratorNewLayout = json_config[NS_FORM][NS_LAYOUT];
            this.bGeneratorEditLayout = json_config[NS_FORM][NS_LAYOUT];
            this.bGeneratorShowLayout = json_config[NS_FORM][NS_LAYOUT];
        }

        if(json_config[NS_FORM][NS_FIELDSET_LAYOUT]){
            this.bGeneratorNewFieldSetLayout = json_config[NS_FORM][NS_FIELDSET_LAYOUT];
            this.bGeneratorEditFieldSetLayout = json_config[NS_FORM][NS_FIELDSET_LAYOUT];
            this.bGeneratorShowFieldSetLayout = json_config[NS_FORM][NS_FIELDSET_LAYOUT];
        }

        this.bGeneratorNewItems = this.parseFormItems(json_config[NS_FORM], this.bGeneratorNewItems);
        this.bGeneratorEditItems = this.parseFormItems(json_config[NS_FORM], this.bGeneratorEditItems);
        this.bGeneratorShowItems = this.parseFormItems(json_config[NS_FORM], this.bGeneratorShowItems, false);

        this.parseNewItems(json_config[NS_NEW]);
        this.bGeneratorNewItems = this.parseFormItems(json_config[NS_NEW], this.bGeneratorNewItems);

        this.parseEditItems(json_config[NS_EDIT]);
        this.bGeneratorEditItems = this.parseFormItems(json_config[NS_EDIT], this.bGeneratorEditItems);

        this.parseShowItems(json_config[NS_SHOW]);
        this.bGeneratorShowItems = this.parseFormItems(json_config[NS_SHOW], this.bGeneratorShowItems, false);

        this.parseFilterItems(json_config[NS_FILTER]);

    }
    
    list = async (req, parentItem = null, defaultRelations = null) => {

        await this.fillFilterRelations(req, this.bGeneratorFilterItems, parentItem, defaultRelations);

        return {
            bGeneratorOptions: this.bGeneratorOptions,
            [NS_TITLE]: this.bGeneratorListTitle,
            [NS_DISPLAY]: this.bGeneratorListItems,
            [NS_FIELDS]: this.bGeneratorFields,
            [NS_OBJECT_ACTIONS]: this.bGeneratorObjectActions,
            [NS_ACTIONS]: this.bGeneratorListActions,
            [NS_GENERAL_ACTIONS]: this.bGeneratorGeneralActions,
            [NS_BATCH_ACTIONS]: this.bGeneratorBatchActions,
            [NS_CUSTOM_VIEW]: this.bGeneratorParams[NS_CUSTOM_VIEW],
            [NS_MODEL]: this.bGeneratorModelName,
            [NS_FILTER]: this.bGeneratorFilterItems,
            [NS_LAYOUT]: this.bGeneratorListLayout,
            [NS_OBJECT_ACTIONS_DISPLAY]: this.bGeneratorObjectActionsDisplay
        };
    }

    form = async (req, item = null, parentItem = null, defaultRelations = []) => {

        let actions, items, title, layout, fieldSetLayout;
        if(item === null){
            actions = this.bGeneratorCreateActions;
            items = this.bGeneratorNewItems;
            title = this.bGeneratorNewTitle;
            layout = this.bGeneratorNewLayout;
            fieldSetLayout = this.bGeneratorNewFieldSetLayout;
        }else{
            actions = this.bGeneratorEditActions;
            items = this.bGeneratorEditItems;
            title = this.bGeneratorEditTitle;
            layout = this.bGeneratorEditLayout;
            fieldSetLayout = this.bGeneratorEditFieldSetLayout;
        }

        await this.fillFormRelations(req, items, item, parentItem, defaultRelations);

        return {
            bGeneratorOptions: this.bGeneratorOptions,
            [NS_FIELDS]: this.bGeneratorFields,
            [NS_ACTIONS]: actions,
            [NS_CUSTOM_VIEW]: this.bGeneratorParams[NS_CUSTOM_VIEW],
            [NS_MODEL]: this.bGeneratorModelName,
            [NS_DISPLAY]: items,
            [NS_TITLE]: title,
            [NS_FIELDSETS]: this.bGeneratorFieldSets,
            [NS_LAYOUT]: layout,
            [NS_FIELDSET_LAYOUT]: fieldSetLayout
        };
    }
    
    processParams = (json_config) => {

        if(json_config[NS_PARAMS]){
            this.bGeneratorParams = json_config[NS_PARAMS];
        }

        if(!this.bGeneratorParams[NS_MODEL] || this.bGeneratorParams[NS_MODEL] === ''){
            throw "AG Configuration: Model Not Defined.";
        }

        // get skeleton
        if(this.bGeneratorParams[NS_SKELETON]){
            this.bGeneratorSkeleton = this.bGeneratorParams[NS_SKELETON];
        }

        // get model

        this.bGeneratorModel = require(this.bGeneratorOptions.base_app_path + this.bGeneratorParams[NS_MODEL]);

        if(!this.bGeneratorModel){
            throw "AG Configuration: Model Cannot be instantiated.";
        }

        const model_explode = this.bGeneratorParams[NS_MODEL].split("/");
        this.bGeneratorModelName = model_explode[model_explode.length - 1];


        // get settings for admin generator parent
        if(this.bGeneratorParams[NS_PARENT_MODEL]){

            this.bGeneratorParentModel = require(this.bGeneratorOptions.base_app_path + this.bGeneratorParams[NS_PARENT_MODEL]);

            const model_explode = this.bGeneratorParams[NS_PARENT_MODEL].split("/");
            this.bGeneratorParentModelName = model_explode[model_explode.length - 1];

        }

        if(this.bGeneratorParams[NS_PARENT_REF]){
            this.bGeneratorParentRef = this.bGeneratorParams[NS_PARENT_REF];
        }

        if(!this.bGeneratorParams[NS_OBJECT_REF]) {
            throw "AG Configuration: Child Related Key Is Not Defined.";
        } else {
            this.bGeneratorObjectRef = this.bGeneratorParams[NS_OBJECT_REF];
        }

        // ---------------------------------------


        // custom views folder
        if(!this.bGeneratorParams[NS_CUSTOM_VIEW]){
            this.bGeneratorParams[NS_CUSTOM_VIEW] = CUSTOM_VIEWS_ROOT + '.' + this.bGeneratorModelName;
        }

        let repository;

        // get repository
        if(this.bGeneratorParams[NS_REPOSITORY]){
            repository = this.bGeneratorParams[NS_REPOSITORY];
        }else{
            throw "AG Configuration: Repository not found";
        }

        try{
            this.bGeneratorRepository = require(this.bGeneratorOptions.base_app_path + repository);
        }catch (e){
            throw "AG Configuration: Cannot Instantiate Repository: " + repository;
        }

    }

    parseTableFieldSets = (json_config_fieldsets) => {
        json_config_fieldsets.map(fieldset => {

            if(!fieldset[NS_NAME]){
                throw "AG Configuration: Fieldsets should have name";
            }

            if(!this.bGeneratorFieldSets[fieldset[NS_NAME]]){
                this.bGeneratorFieldSets[fieldset[NS_NAME]] = {};
            }

            if(fieldset[NS_LABEL]){
                this.bGeneratorFieldSets[fieldset[NS_NAME]][NS_LABEL] = fieldset[NS_LABEL];
            }else{
                this.bGeneratorFieldSets[fieldset[NS_NAME]][NS_LABEL] = "";
            }

            if(fieldset[NS_CLASS]){
                this.bGeneratorFieldSets[fieldset[NS_NAME]][NS_CLASS] = fieldset[NS_CLASS];
            }else{
                this.bGeneratorFieldSets[fieldset[NS_NAME]][NS_CLASS] = "primary";
            }

            return fieldset;
        });

    }

    parseTableFields = async (json_config_fields) => {

        const columns = await this.bGeneratorOptions.sequelize.query('SHOW COLUMNS FROM ' + this.bGeneratorModel.tableName);
        const columnStructures = await this.bGeneratorOptions.sequelize.query('SHOW FIELDS FROM ' + this.bGeneratorModel.tableName);

        columns[0].map(cl => {

            const column = cl['Field'];

            this.bGeneratorFields[column] = {};
            this.bGeneratorFields[column][NS_LABEL] = column;
            this.bGeneratorFields[column][NS_IN_INDEX] = true;
            this.bGeneratorFields[column][NS_IN_FORM] = true;
            this.bGeneratorFields[column][NS_SOTRABLE] = true;

            if(column === 'id'){
                this.bGeneratorFields[column][NS_PRIMARY] = true;
            }

            if(column === 'created_at' || column === 'updated_at' || column === 'deleted_at' || column === 'id'){
                this.bGeneratorFields[column][NS_FILLABLE] = false;
                this.bGeneratorFields[column][NS_IN_FORM] = false;
            }

            // fill form and filter
            this.buildFieldFormStructure(column, columnStructures[0]);
            
        })
        
        if(json_config_fields && json_config_fields.length > 0){

            json_config_fields.map(field => {

                if(!this.bGeneratorFields[field[NS_NAME]]){
                    this.bGeneratorFields[field[NS_NAME]] = {};
                    this.bGeneratorFields[field[NS_NAME]][NS_SEARCHABLE] = false;
                    this.bGeneratorFields[field[NS_NAME]][NS_FILLABLE] = false;
                    this.bGeneratorFields[field[NS_NAME]][NS_FORM] = {};
                    this.bGeneratorFields[field[NS_NAME]][NS_FILTER] = {};
                }

                if(field[NS_LABEL]){
                    this.bGeneratorFields[field[NS_NAME]][NS_LABEL] = field[NS_LABEL];
                }

                if(field[NS_SOTRABLE]){
                    this.bGeneratorFields[field[NS_NAME]][NS_SOTRABLE] = field[NS_SOTRABLE];
                }else{
                    if(!this.bGeneratorFields[field[NS_NAME]][NS_SOTRABLE]){
                        this.bGeneratorFields[field[NS_NAME]][NS_SOTRABLE] = DEFAULT_SORTABLE;
                    }
                }

                if(field[NS_SEARCHABLE]){
                    this.bGeneratorFields[field[NS_NAME]][NS_SEARCHABLE] = field[NS_SEARCHABLE];
                }

                if(field[NS_FILLABLE]){
                    this.bGeneratorFields[field[NS_NAME]][NS_FILLABLE] = field[NS_FILLABLE];
                }

                if(field[NS_PRIMARY]){
                    this.bGeneratorFields[field[NS_NAME]][NS_PRIMARY] = field[NS_PRIMARY];
                }

                if(field[NS_IN_INDEX]){
                    this.bGeneratorFields[field[NS_NAME]][NS_IN_INDEX] = field[NS_IN_INDEX];
                }

                if(field[NS_IN_FORM]){
                    this.bGeneratorFields[field[NS_NAME]][NS_IN_FORM] = field[NS_IN_FORM];
                }

                if(field[NS_DB_TYPE]){
                    this.bGeneratorFields[field[NS_NAME]][NS_DB_TYPE] = field[NS_DB_TYPE];
                }

                if(field[NS_FORM]){
                    if(field[NS_FORM][NS_CLASS]){
                        this.bGeneratorFields[field[NS_NAME]][NS_FORM][NS_CLASS] = field[NS_FORM][NS_CLASS];
                    }
                    if(field[NS_FORM][NS_DEFAULT_VALUE]){
                        this.bGeneratorFields[field[NS_NAME]][NS_FORM][NS_DEFAULT_VALUE] = field[NS_FORM][NS_DEFAULT_VALUE];
                    }
                    if(field[NS_FORM][NS_TYPE]){
                        this.bGeneratorFields[field[NS_NAME]][NS_FORM][NS_TYPE] = field[NS_FORM][NS_TYPE];
                        this.bGeneratorFields[field[NS_NAME]][NS_FILTER][NS_TYPE] = field[NS_FORM][NS_TYPE];
                    }
                    if(field[NS_FORM][NS_DATA_PROVIDER]){
                        this.bGeneratorFields[field[NS_NAME]][NS_FORM][NS_DATA_PROVIDER] = field[NS_FORM][NS_DATA_PROVIDER];
                        this.bGeneratorFields[field[NS_NAME]][NS_FILTER][NS_DATA_PROVIDER] = field[NS_FORM][NS_DATA_PROVIDER];

                        if(field[NS_FORM][NS_MODEL]){
                            this.bGeneratorFields[field[NS_NAME]][NS_FORM][NS_MODEL] = field[NS_FORM][NS_MODEL];
                            this.bGeneratorFields[field[NS_NAME]][NS_FILTER][NS_MODEL] = field[NS_FORM][NS_MODEL];
                        }

                        if(field[NS_FORM][NS_METHOD]){
                            this.bGeneratorFields[field[NS_NAME]][NS_FORM][NS_METHOD] = field[NS_FORM][NS_METHOD];
                            this.bGeneratorFields[field[NS_NAME]][NS_FILTER][NS_METHOD] = field[NS_FORM][NS_METHOD];
                        }

                    }
                    if(field[NS_FORM][NS_CHOICES]){
                        this.bGeneratorFields[field[NS_NAME]][NS_FORM][NS_CHOICES] = field[NS_FORM][NS_CHOICES];
                        this.bGeneratorFields[field[NS_NAME]][NS_FILTER][NS_CHOICES] = field[NS_FILTER][NS_CHOICES];
                    }
                    if(field[NS_FORM][NS_VALIDATION]){
                        this.bGeneratorFields[field[NS_NAME]][NS_FORM][NS_VALIDATION] = field[NS_FORM][NS_VALIDATION];
                        this.bGeneratorFields[field[NS_NAME]][NS_FILTER][NS_VALIDATION] = field[NS_FORM][NS_VALIDATION];
                    }
                    if(field[NS_FORM][NS_HELPER]){
                        this.bGeneratorFields[field[NS_NAME]][NS_FORM][NS_HELPER] = field[NS_FORM][NS_HELPER] === '*' ? '*' : field[NS_FORM][NS_HELPER];
                    }
                    if(field[NS_FORM][NS_PLACEHOLDER]){
                        this.bGeneratorFields[field[NS_NAME]][NS_FORM][NS_PLACEHOLDER] = field[NS_FORM][NS_PLACEHOLDER];
                    }
                    if(field[NS_FORM][NS_EXPANDED]){
                        this.bGeneratorFields[field[NS_NAME]][NS_FORM][NS_EXPANDED] = field[NS_FORM][NS_EXPANDED];
                    }
                    if(field[NS_FORM][NS_MULTIPLE]){
                        this.bGeneratorFields[field[NS_NAME]][NS_FORM][NS_MULTIPLE] = field[NS_FORM][NS_MULTIPLE];
                    }
                }

                if(field[NS_FILTER]){
                    if(field[NS_FILTER][NS_CLASS]){
                        this.bGeneratorFields[field[NS_NAME]][NS_FILTER][NS_CLASS] = field[NS_FILTER][NS_CLASS];
                    }
                    if(field[NS_FILTER][NS_DEFAULT_VALUE]){
                        this.bGeneratorFields[field[NS_NAME]][NS_FILTER][NS_DEFAULT_VALUE] = field[NS_FILTER][NS_DEFAULT_VALUE];
                    }
                    if(field[NS_FILTER][NS_TYPE]){
                        this.bGeneratorFields[field[NS_NAME]][NS_FILTER][NS_TYPE] = field[NS_FILTER][NS_TYPE];
                    }
                    if(field[NS_FILTER][NS_DATA_PROVIDER]){
                        this.bGeneratorFields[field[NS_NAME]][NS_FILTER][NS_DATA_PROVIDER] = field[NS_FILTER][NS_DATA_PROVIDER];
                    }
                    if(field[NS_FILTER][NS_CHOICES]){
                        this.bGeneratorFields[field[NS_NAME]][NS_FILTER][NS_CHOICES] = field[NS_FILTER][NS_CHOICES];
                    }
                    if(field[NS_FILTER][NS_VALIDATION]){
                        this.bGeneratorFields[field[NS_NAME]][NS_FILTER][NS_VALIDATION] = field[NS_FILTER][NS_VALIDATION];
                    }
                    if(field[NS_FILTER][NS_HELPER]){
                        this.bGeneratorFields[field[NS_NAME]][NS_FILTER][NS_HELPER] = field[NS_FILTER][NS_HELPER];
                    }
                    if(field[NS_FILTER][NS_PLACEHOLDER]){
                        this.bGeneratorFields[field[NS_NAME]][NS_FILTER][NS_PLACEHOLDER] = field[NS_FILTER][NS_PLACEHOLDER];
                    }
                    if(field[NS_FILTER][NS_EXPANDED]){
                        this.bGeneratorFields[field[NS_NAME]][NS_FILTER][NS_EXPANDED] = field[NS_FILTER][NS_EXPANDED];
                    }
                    if(field[NS_FILTER][NS_MULTIPLE]){
                        this.bGeneratorFields[field[NS_NAME]][NS_FILTER][NS_MULTIPLE] = field[NS_FILTER][NS_MULTIPLE];
                    }
                }

            })
            
        }

    }

    buildFieldFormStructure = (column, columnStructures) => {

        columnStructures.map(columnStructure => {

            if (columnStructure['Field'] === column) {
                let output_array = columnStructure['Type'].match(/^([\w]+)(\(([\d]+)*(,([\d]+))*\))*(.+)*$/);

                const type = output_array[1];
                const size = output_array[3] ? output_array[3] : null;
                const isNull = columnStructure['Null'];
                const key = columnStructure['Key'];
                const _default = columnStructure['Default'];
                const extra = columnStructure['Extra'];
                let validationForm = [];
                let validationFilter = [];

                if (!this.bGeneratorFields[column][NS_FORM]) {
                    this.bGeneratorFields[column][NS_FORM] = {};
                    this.bGeneratorFields[column][NS_FORM][NS_CLASS] = 'dir-default';
                }

                if (!this.bGeneratorFields[column][NS_FILTER]) {
                    this.bGeneratorFields[column][NS_FILTER] = {};
                    this.bGeneratorFields[column][NS_FILTER][NS_CLASS] = 'dir-default';
                }

                // DEFAULT VALUE
                this.bGeneratorFields[column][NS_FORM][NS_DEFAULT_VALUE] = _default;

                // REQUIRED VALIDATON
                if(isNull === 'NO'){
                    validationForm.push('required');
                    this.bGeneratorFields[column][NS_FORM][NS_HELPER] = '*' + ' ';
                }else{
                    validationForm.push('nullable');
                    this.bGeneratorFields[column][NS_FORM][NS_HELPER] = '';
                }
                validationFilter.push('nullable');
                
                switch (type.toLowerCase()){
                    case "int":
                    case "bigint":

                        this.bGeneratorFields[column][NS_DB_TYPE] = DB_TYPE_INT;

                        if(key === "PRI" && extra === 'auto_increment') {
                            this.bGeneratorFields[column][NS_FORM][NS_TYPE] = 'hidden';
                            this.bGeneratorFields[column][NS_FILTER][NS_TYPE] = 'text';
                            this.bGeneratorFields[column][NS_FILTER][NS_CLASS] = 'dir-ltr';

                        } else if(key === "MUL"){
                            this.bGeneratorFields[column][NS_FORM][NS_TYPE] = 'select';
                            this.bGeneratorFields[column][NS_FILTER][NS_TYPE] = 'select';
                        }else{
                            this.bGeneratorFields[column][NS_FORM][NS_TYPE] = 'text';
                            this.bGeneratorFields[column][NS_FILTER][NS_TYPE] = 'text';
                            this.bGeneratorFields[column][NS_FORM][NS_CLASS] = 'dir-ltr';
                            this.bGeneratorFields[column][NS_FILTER][NS_CLASS] = 'dir-ltr';
                        }

                        break;

                    case "varchar":
                    case "text":
                    case "string":
                    case "longtext":
                    case "enum":

                        this.bGeneratorFields[column][NS_DB_TYPE] = DB_TYPE_TEXT;
                        if(size == null || size <= 256){
                            this.bGeneratorFields[column][NS_FORM][NS_TYPE] = 'text';
                        }else{
                            this.bGeneratorFields[column][NS_FORM][NS_TYPE] = 'textarea';
                        }

                        this.bGeneratorFields[column][NS_FILTER][NS_TYPE] = 'text';

                        validationForm.push('string');
                        validationFilter.push('string');
                        if(size != null){
                            validationForm.push('max:' + size);
                        }

                        break;
                    case "timestamp":
                    case "datetime":

                        this.bGeneratorFields[column][NS_DB_TYPE] = DB_TYPE_DATE;

                        validationForm.push('date');
                        validationFilter.push('date');

                        this.bGeneratorFields[column][NS_FORM][NS_TYPE] = 'datetime';
                        this.bGeneratorFields[column][NS_FILTER][NS_TYPE] = 'datetime_range';

                        break;

                    case "tinyint":
                    case "boolean":
                    case "bool":

                        this.bGeneratorFields[column][NS_DB_TYPE] = DB_TYPE_INT;

                        this.bGeneratorFields[column][NS_FORM][NS_TYPE] = 'checkbox';
                        this.bGeneratorFields[column][NS_FILTER][NS_TYPE] = 'select';

                        let _k;
                        if ((_k = validationForm.indexOf('required')) !== -1) {
                            validationForm.splice(_k, 1);
                            this.bGeneratorFields[column][NS_FORM][NS_HELPER] = '';
                        }

                        if ((_k = validationFilter.indexOf('required')) !== -1) {
                            validationFilter.splice(_k, 1);
                            this.bGeneratorFields[column][NS_FORM][NS_HELPER] = '';
                        }

                        this.bGeneratorFields[column][NS_FILTER][NS_CHOICES] = {
                            '': 'Yes or No',
                            '1': 'Yes',
                            '0': 'No'
                        };
                        break;
                    default:
                        this.bGeneratorFields[column][NS_DB_TYPE] = DB_TYPE_TEXT;
                        this.bGeneratorFields[column][NS_FORM][NS_TYPE] = 'text';
                        this.bGeneratorFields[column][NS_FILTER][NS_TYPE] = 'text';
                        break;
                }

                switch (column.toLowerCase()){
                    case "url":
                    case "link":
                    case "uri":
                        this.bGeneratorFields[column][NS_FORM][NS_CLASS] = 'dir-ltr';
                        this.bGeneratorFields[column][NS_FILTER][NS_CLASS] = 'dir-ltr';
                        this.bGeneratorFields[column][NS_FORM][NS_HELPER] = this.bGeneratorFields[column][NS_FORM][NS_HELPER] + '(Ex: http://www.yourwebsite.com)';
                        validationForm.push('url');
                        break;

                    case "password":
                        this.bGeneratorFields[column][NS_FORM][NS_TYPE] = 'password';
                        this.bGeneratorFields[column][NS_FILTER][NS_TYPE] = 'password';
                        this.bGeneratorFields[column][NS_FORM][NS_CLASS] = 'dir-ltr';
                        this.bGeneratorFields[column][NS_FILTER][NS_CLASS] = 'dir-ltr';
                        break;

                    case "email":
                    case "support_email":
                        this.bGeneratorFields[column][NS_FORM][NS_CLASS] = 'dir-ltr';
                        this.bGeneratorFields[column][NS_FILTER][NS_CLASS] = 'dir-ltr';
                        this.bGeneratorFields[column][NS_FORM][NS_HELPER] = this.bGeneratorFields[column][NS_FORM][NS_HELPER] + '(Ex: youremail@domain.com)';
                        validationForm.push('email');
                        break;

                    case "phone":
                    case "support_phone":
                        this.bGeneratorFields[column][NS_FORM][NS_CLASS] = 'dir-ltr';
                        this.bGeneratorFields[column][NS_FILTER][NS_CLASS] = 'dir-ltr';
                        this.bGeneratorFields[column][NS_FORM][NS_HELPER] = this.bGeneratorFields[column][NS_FORM][NS_HELPER] + '(Ex: +123456789)';
                        break;
                    case "mobile":
                        this.bGeneratorFields[column][NS_FORM][NS_CLASS] = 'dir-ltr';
                        this.bGeneratorFields[column][NS_FILTER][NS_CLASS] = 'dir-ltr';
                        this.bGeneratorFields[column][NS_FORM][NS_HELPER] = this.bGeneratorFields[column][NS_FORM][NS_HELPER] + '(Ex: 1920000000)';
                        break;

                    case "gender":
                    case "sex":
                        this.bGeneratorFields[column][NS_FORM][NS_TYPE] = 'select';
                        this.bGeneratorFields[column][NS_FILTER][NS_TYPE] = 'select';
                        this.bGeneratorFields[column][NS_FORM][NS_CHOICES] = {
                            'm': "Male",
                            'f': "Female",
                            'o': "Other"
                        };

                        this.bGeneratorFields[column][NS_FILTER][NS_CHOICES] = {
                            '': "All",
                            'm': "Male",
                            'f': "Female",
                            'o': "Other"
                        };

                        this.bGeneratorFields[column][NS_FORM][NS_EXPANDED] = true;
                        this.bGeneratorFields[column][NS_FORM][NS_MULTIPLE] = false;

                        validationForm.push('in:m,f,o');
                        validationFilter.push('in:m,f,o');
                        break;

                    case "melli_code":
                    case "mellicode":
                    case "national_number":
                    case "national_code":
                        this.bGeneratorFields[column][NS_FORM][NS_CLASS] = 'dir-ltr';
                        this.bGeneratorFields[column][NS_FILTER][NS_CLASS] = 'dir-ltr';
                        this.bGeneratorFields[column][NS_FORM][NS_MASK] = "9999999999";
                        break;

                    case "username":
                        this.bGeneratorFields[column][NS_FORM][NS_CLASS] = 'dir-ltr';
                        this.bGeneratorFields[column][NS_FILTER][NS_CLASS] = 'dir-ltr';
                        break;

                    case "created_at":
                    case "updated_at":
                    case "deleted_at":
                        break;

                    case "date":
                    case "from_date":
                    case "date_from":
                    case "to_date":
                    case "date_to":
                    case "begin_date":
                    case "end_date":
                        this.bGeneratorFields[column][NS_FORM][NS_TYPE] = 'date';
                        this.bGeneratorFields[column][NS_FILTER][NS_TYPE] = 'date_range';
                        validationForm.push('date');
                        validationFilter.push('date');
                        break;

                    case "ip":
                    case "ip_address":
                        this.bGeneratorFields[column][NS_FORM][NS_CLASS] = 'dir-ltr';
                        this.bGeneratorFields[column][NS_FILTER][NS_CLASS] = 'dir-ltr';
                        this.bGeneratorFields[column][NS_FORM][NS_MASK] = 'ip';
                        validationForm.push('ip');
                        validationFilter.push('ip');
                        break;

                    case "file":
                    case "picture":
                        this.bGeneratorFields[column][NS_FORM][NS_TYPE] = 'file';
                        this.bGeneratorFields[column][NS_FILTER][NS_TYPE] = 'hidden';
                        break;

                    case "descriptor":
                        this.bGeneratorFields[column][NS_FORM][NS_CLASS] = 'dir-ltr';
                        this.bGeneratorFields[column][NS_FILTER][NS_CLASS] = 'dir-ltr';
                }

                this.bGeneratorFields[column][NS_FORM][NS_VALIDATION] = validationForm;
                this.bGeneratorFields[column][NS_FILTER][NS_VALIDATION] = validationFilter;
                
            }

        })

    }

    formatErrors = (v) =>
    {
        return v.getErrors();
    }

    parseListItems = (json_config_list) => {

        this.bGeneratorListTitle = '"'+ this.bGeneratorModelName + '" List';

        if(json_config_list[NS_TITLE]){
            this.bGeneratorListTitle = json_config_list[NS_TITLE];
        }

        this.bGeneratorListItems = [];

        if(json_config_list[NS_DISPLAY]){

            if(!Array.isArray(json_config_list[NS_DISPLAY])){
                throw "AG Configuration: List Display should be array";
            }

            json_config_list[NS_DISPLAY].map(item => {
                if(this.bGeneratorFields[item] && this.bGeneratorFields[item][NS_IN_INDEX] && this.bGeneratorFields[item][NS_IN_INDEX] === false){
                    // do nothing
                }else{
                    this.bGeneratorListItems.push(item);
                }
            })

        }else{

            Object.keys(this.bGeneratorFields).map(item_key => {
                const item_val = this.bGeneratorFields[item_key];

                if(item_val[NS_IN_INDEX] && item_val[NS_IN_INDEX] === true){
                    this.bGeneratorListItems.push(item_key);
                }else if(DEFAULT_IN_INDEX === true){
                    this.bGeneratorListItems.push(item_key);
                }
            })

        }

        if(json_config_list[NS_QUERY]){
            const query = json_config_list[NS_QUERY];
            if(typeof this.bGeneratorRepository[query] === 'undefined'){
                throw "AG Configuration: List Query Method Not Exists: " + query;
            }

            this.bGeneratorRepository[query]();
        }

        if(json_config_list[NS_SORT]){
            this.bGeneratorListSort = json_config_list[NS_SORT];
        }

        // count per page
        if(json_config_list[NS_COUNT_PER_PAGE]){
            this.bGeneratorPerPage = json_config_list[NS_COUNT_PER_PAGE];
        }

        // fill searchable fields.
        Object.keys(this.bGeneratorFields).map(key => {
            const field = this.bGeneratorFields[key];
            if(field[NS_SEARCHABLE]){
                if(field[NS_SEARCHABLE] === true){
                    this.bGeneratorRepository.fieldSearchable.push(key);
                }
            }else{
                if(DEFAULT_SEARCHABLE === true){
                    this.bGeneratorRepository.fieldSearchable.push(key);
                }
            }
        })

        if(json_config_list[NS_LAYOUT]){
            this.bGeneratorListLayout = json_config_list[NS_LAYOUT];
        }

        if(json_config_list[NS_OBJECT_ACTIONS_DISPLAY]){
            this.bGeneratorObjectActionsDisplay = json_config_list[NS_OBJECT_ACTIONS_DISPLAY];
        }

        // process object actions
        this.parseListObjectActions(json_config_list);
        this.parseGeneralActions(json_config_list);
        this.parseBatchActions(json_config_list);
        this.parseListActions(json_config_list);


    }

    parseExcelItems = (json_config_list) => {

        this.bGeneratorExcelItems = [];

        if(json_config_list[NS_DISPLAY]){

            if(!Array.isArray(json_config_list[NS_DISPLAY])){
                throw "AG Configuration: List Display should be array";
            }

            json_config_list[NS_DISPLAY].map(item => {
                if(this.bGeneratorFields[item][NS_IN_INDEX] && this.bGeneratorFields[item][NS_IN_INDEX] === false){
                    // do nothing
                }else{
                    this.bGeneratorExcelItems.push(item);
                }
            })

        }else{

            Object.keys(this.bGeneratorFields).map(item_key => {
                const item_val = this.bGeneratorFields[item_key];

                if(item_val[NS_IN_INDEX] && item_val[NS_IN_INDEX] === true){
                    this.bGeneratorExcelItems.push(item_key);
                }else if(DEFAULT_IN_INDEX === true){
                    this.bGeneratorExcelItems.push(item_key);
                }
            })

        }

    }

    parseFormItems = (json_config_display, formItems, checkInForm = true) => {

        if(json_config_display[NS_DISPLAY]){

            formItems = {};

            Object.keys(json_config_display[NS_DISPLAY]).map(fieldset => {
                const item = json_config_display[NS_DISPLAY][fieldset];

                if(Array.isArray(item)){

                    if(!formItems[fieldset]){
                        formItems[fieldset] = [];
                    }

                    item.map(field => {
                        if(checkInForm && this.bGeneratorFields[field][NS_IN_FORM] && this.bGeneratorFields[field][NS_IN_FORM] === false){
                            // do nothing
                        }else{
                            formItems[fieldset].push(field);
                        }                        
                    })

                }else{

                    if(!formItems["default"]){
                        formItems["default"] = [];
                    }

                    if(checkInForm && this.bGeneratorFields[item][NS_IN_FORM] && this.bGeneratorFields[item][NS_IN_FORM] === false){
                        // do nothing
                    }else{
                        formItems["default"].push(item);
                    }
                }

            })

        }else{
        
            if(formItems.length === 0){

                formItems["default"] = [];

                Object.keys(this.bGeneratorFields).map(item_key => {
                    const item_val = this.bGeneratorFields[item_key];

                    if(checkInForm && item_val[NS_IN_FORM] && item_val[NS_IN_FORM] === true){
                        formItems["default"].push(item_key);
                    }else if(checkInForm && DEFAULT_IN_FORM === true){
                        formItems["default"].push(item_key);
                    }else if(checkInForm === false){
                        formItems["default"].push(item_key);
                    }
                })

            }
        }

        return formItems;

    }

    parseNewItems = (json_config_new) => {

        this.bGeneratorNewTitle = 'New ' + this.bGeneratorModelName;

        if(json_config_new[NS_TITLE]){
            this.bGeneratorNewTitle = json_config_new[NS_TITLE];
        }

        if(json_config_new[NS_LAYOUT]){
            this.bGeneratorNewLayout = json_config_new[NS_LAYOUT];
        }

        if(json_config_new[NS_FIELDSET_LAYOUT]){
            this.bGeneratorNewFieldSetLayout = json_config_new[NS_FIELDSET_LAYOUT];
        }

        this.parseCreateActions(json_config_new);

    }

    parseEditItems = (json_config_edit) => {

        this.bGeneratorEditTitle = 'Edit ' + this.bGeneratorModelName;

        if(json_config_edit[NS_TITLE]){
            this.bGeneratorEditTitle = json_config_edit[NS_TITLE];
        }

        if(json_config_edit[NS_LAYOUT]){
            this.bGeneratorNewLayout = json_config_edit[NS_LAYOUT];
        }

        if(json_config_edit[NS_FIELDSET_LAYOUT]){
            this.bGeneratorNewFieldSetLayout = json_config_edit[NS_FIELDSET_LAYOUT];
        }

        this.parseEditActions(json_config_edit);

    }

    parseShowItems = (json_config_show) => {

        this.bGeneratorShowTitle = 'Show ' + this.bGeneratorModelName;

        if(json_config_show[NS_TITLE]){
            this.bGeneratorShowTitle = json_config_show[NS_TITLE];
        }

        if(json_config_show[NS_LAYOUT]){
            this.bGeneratorNewLayout = json_config_show[NS_LAYOUT];
        }

        if(json_config_show[NS_FIELDSET_LAYOUT]){
            this.bGeneratorNewFieldSetLayout = json_config_show[NS_FIELDSET_LAYOUT];
        }

        this.parseShowActions(json_config_show);

    }

    parseFilterItems = (json_config_filter) => {

        if(this.bGeneratorViewMode === VIEW_MODE_NO_API){

            this.bGeneratorFilterSession = 'generator_' . this.bGeneratorModelName;
            if(json_config_filter[NS_SESSION_PREFIX]){
                this.bGeneratorFilterSession = json_config_filter[NS_SESSION_PREFIX];
            }

        }

        if(json_config_filter[NS_DISPLAY]){

            if(!Array.isArray(json_config_filter[NS_DISPLAY])){
                throw "AG Configuration: Filter Display should be array";
            }

            json_config_filter[NS_DISPLAY].map(item => {
                if(this.bGeneratorFields[item][NS_SEARCHABLE] && this.bGeneratorFields[item][NS_SEARCHABLE] === false){
                    // do nothing
                }else{
                    this.bGeneratorFilterItems.push(item);
                }
            })

        }else{

            Object.keys(this.bGeneratorFields).map(item_key => {
                const item_val = this.bGeneratorFields[item_key];
                if(item_val[NS_SEARCHABLE] && item_val[NS_SEARCHABLE] === true){
                    this.bGeneratorFilterItems.push(item_key);
                }else if(DEFAULT_SEARCHABLE === true){
                    this.bGeneratorFilterItems.push(item_key);
                }
            })
        }

    }

    fillFormRelations = async (req, formItems, item = null, parentItem = null, defaultRelations = null) => {

        const formItemsKeys = Object.keys(formItems);
        for(let pp = 0; pp < formItemsKeys.length; pp++){

            const formFieldSetKey = formItemsKeys[pp];
            const formFieldSet = formItems[formFieldSetKey];

            for(let uu = 0; uu < formFieldSet.length; uu++){
                const fieldName = formFieldSet[uu];
                const field = this.bGeneratorFields[fieldName];
                if(field[NS_FORM]){
                    const form = field[NS_FORM];
                    if(form[NS_DATA_PROVIDER]){
                        const dataProvider = form[NS_DATA_PROVIDER];
                        const validation = form[NS_VALIDATION];
                        const multiple = form[NS_MULTIPLE] ? form[NS_MULTIPLE] : false;
                        let isRequired = validation.indexOf("required") !== -1;
                        const model = form[NS_MODEL] ? form[NS_MODEL] : null;
                        const method = form[NS_METHOD] ? form[NS_METHOD] : null;

                        if(multiple === false && form[NS_PLACEHOLDER]){
                            isRequired = form[NS_PLACEHOLDER];
                        }
                        this.bGeneratorFields[fieldName][NS_FORM][NS_CHOICES] = await this.loadFormFilterRelationFromDB(req, dataProvider, fieldName, model, method, isRequired, item, parentItem, defaultRelations);
                    }
                }
            }

        }

    }

    fillFilterRelations = async (req, formItems, parentItem = null, defaultRelations = null) => {

        for(let pp = 0; pp < formItems.length; pp++){
            const fieldName = formItems[pp];
            const field = this.bGeneratorFields[fieldName];

            if(field[NS_FILTER]){
                const form = field[NS_FILTER];
                if(form[NS_DATA_PROVIDER]){
                    const dataProvider = form[NS_DATA_PROVIDER];
                    const validation = form[NS_VALIDATION];
                    const multiple = form[NS_MULTIPLE] ? form[NS_MULTIPLE] : false;
                    let isRequired = validation.indexOf('required') !== -1;
                    const model = form[NS_MODEL] ? form[NS_MODEL] : null;
                    const method = form[NS_METHOD] ? form[NS_METHOD] : null;

                    if(multiple === false && isRequired === false && form[NS_PLACEHOLDER]){
                        isRequired = form[NS_PLACEHOLDER];
                    }

                    this.bGeneratorFields[fieldName][NS_FILTER][NS_CHOICES] = await this.loadFormFilterRelationFromDB(req, dataProvider, fieldName, model, method, isRequired, null, parentItem, defaultRelations);

                }
            }

        }

    }

    loadFormFilterRelationFromDB = async (req, dataProvider, fieldName, model = null, method = null, isRequired = false, item = null, parentItem = null, defaultRelations = null) => {

        let res;
        let session;
        let choice;

        if(typeof this.bGeneratorRepository[dataProvider] !== 'undefined' || (defaultRelations && defaultRelations[fieldName])) {

            if(defaultRelations && defaultRelations[fieldName]){
                res = defaultRelations[fieldName];
            }else{
                const choices = await this.bGeneratorRepository[dataProvider](item, parentItem);
                res = {};
                choices.map(choice => {
                    res[choice.id] = choice.__toString();
                });
            }

            return res;

        }else if(false /*Route::has($dataProvider)*/){

            if(method == null){
                method = '__toString';
            }

            res = {};

            if(this.bGeneratorViewMode === VIEW_MODE_NO_API){
                session = req.session[this.bGeneratorFilterSession];
            }

            if(req.params[fieldName]) {
                
                choice = this.bGeneratorRepository.find(req.params[fieldName]);
                if(choice != null) {
                    res[choice.id] = choice[method]();
                }

            } else if(item != null){

                choice = this.bGeneratorRepository.find(item[fieldName]);

                if(choice != null){
                    res[choice.id] = choice[method]();
                }

            } else if(this.bGeneratorViewMode === VIEW_MODE_NO_API && req.session['searchFilter'][fieldName]){

                choice = this.bGeneratorRepository.find(session['searchFilter'][fieldName]);

                if(choice != null) {
                    res[choice.id] = choice[method]();
                }

            }

            return res;

        }else{
            throw "AG Configuration: Data Provider Method Not Exists: " + dataProvider;
        }

    }

    prepareFormValidation = (req, fields, formItems, item = null, parentItem = null, defaultRelations = null) => {

        let validationResult = {};

        Object.keys(formItems).map(formFieldSetKey => {
            const formFieldSet = formItems[formFieldSetKey];
            formFieldSet.map(async fieldName => {

                const field = fields[fieldName];

                if (field[NS_FORM]) {
                    const form = field[NS_FORM];
                    let validationArray = form[NS_VALIDATION] ? form[NS_VALIDATION] : ['nullable'];

                    if(Array.isArray(validationArray)){
                        validationArray = validationArray.map(x => {
                            const isUnique = x.indexOf('unique') !== -1;
                            if(isUnique && item !== null) {
                                return x + ',' + item.id;
                            }
                            return x;
                        })
                    }

                    if (form[NS_DATA_PROVIDER]) {
                        const dataProvider = form[NS_DATA_PROVIDER];
                        const multiple = form[NS_MULTIPLE] ? form[NS_MULTIPLE] : false;
                        const model = form[NS_MODEL] ? form[NS_MODEL] : null;
                        const method = form[NS_METHOD] ? form[NS_METHOD] : null;

                        const res = await this.loadFormFilterRelationFromDB(req, dataProvider, fieldName, model, method, false, item, parentItem, defaultRelations);

                        if(model == null){

                            let _in = Object.keys(res);
                            const isRequired = validationArray.indexOf('required') !== -1;
                            if(!isRequired){
                                _in = _in.concat("");
                            }

                            validationArray = validationArray.concat('in:' + _in.join(','));

                        }else{
                            validationArray = validationArray.concat('exists:' + this.bGeneratorModel.tableName + ',id');
                        }

                        if(multiple === true){
                            validationArray = validationArray.concat("array");
                        }
                    }

                    validationResult[fieldName] = validationArray.join('|');
                }

            })
        });

        return validationResult;

    }


    parseListObjectActions = (json_config) => {

        if(!json_config[NS_OBJECT_ACTIONS]){
            this.bGeneratorObjectActions = this.defaultObjectActions();
        }else{
            this.bGeneratorObjectActions = {};

            const objectActions = json_config[NS_OBJECT_ACTIONS];
            objectActions.map(objectAction => {
                if(!objectAction[NS_NAME]){
                    throw "AG Configuration: Object Actions should have key: name";
                }

                let foundInDefaults = false;
                let action;
                if(this.defaultObjectActions()[objectAction[NS_NAME]]){
                    action = this.defaultObjectActions()[objectAction[NS_NAME]];
                    foundInDefaults = true;
                }else{
                    action = {};
                }

                if(objectAction[NS_ROUTE]){
                    action[NS_ROUTE] = objectAction[NS_ROUTE];
                }else if(!foundInDefaults){
                    action[NS_ROUTE] = objectAction[NS_NAME];
                }else{
                    action[NS_ROUTE] = this.bGeneratorModelName + '.' + action[NS_ROUTE];
                }
                
                if(objectAction[NS_CLASS]){
                    action[NS_CLASS] = objectAction[NS_CLASS];
                }

                if(objectAction[NS_ICON]){
                    action[NS_ICON] = objectAction[NS_ICON];
                }else if(!foundInDefaults){
                    action[NS_ICON] = DEFAULT_ICON;
                }
                
                if(objectAction[NS_TYPE]){
                    action[NS_TYPE] = objectAction[NS_TYPE];
                }else if(!foundInDefaults){
                    action[NS_TYPE] = BUTTON_TYPE_LINK;
                }

                if(objectAction[NS_VIEW]){
                    action[NS_VIEW] = objectAction[NS_VIEW];
                }else{
                    action[NS_VIEW] = true;
                }

                if(objectAction[NS_LABEL]){
                    action[NS_LABEL] = objectAction[NS_LABEL];
                }else{
                    action[NS_LABEL] = objectAction[NS_NAME];
                }

                if(objectAction[NS_CONFIRM]){
                    action[NS_CONFIRM] = objectAction[NS_CONFIRM];
                }

                if(objectAction[NS_METHOD]){
                    action[NS_METHOD] = objectAction[NS_METHOD];
                }else if(!foundInDefaults){
                    action[NS_METHOD] = 'post';
                }

                if(objectAction[NS_CONDITION]){
                    action[NS_CONDITION] = objectAction[NS_CONDITION];
                }else if(!foundInDefaults){
                    action[NS_CONDITION] = null;
                }

                this.bGeneratorObjectActions[objectAction[NS_NAME]] = action;

            })

        }
    }

    parseGeneralActions = (json_config) => {

        if(!json_config[NS_GENERAL_ACTIONS]){
            this.bGeneratorGeneralActions = this.defaultGeneralActions();
        } else {

            this.bGeneratorGeneralActions = {};

            const listActions = json_config[NS_GENERAL_ACTIONS];
            listActions.map(listAction => {
                if(!listAction[NS_NAME]){
                    throw "AG Configuration: General Actions should have key: name";
                }

                let foundInDefaults = false;
                let action;
                if(this.defaultGeneralActions()[listAction[NS_NAME]]){
                    action = this.defaultGeneralActions()[listAction[NS_NAME]];
                    foundInDefaults = true;
                }else{
                    action = {};
                }

                if(listAction[NS_ROUTE]){
                    action[NS_ROUTE] = listAction[NS_ROUTE];
                }

                if(listAction[NS_CLASS]){
                    action[NS_CLASS] = listAction[NS_CLASS];
                }

                if(listAction[NS_LABEL]){
                    action[NS_LABEL] = listAction[NS_LABEL];
                }else if(!foundInDefaults){
                    action[NS_LABEL] = listAction[NS_NAME];
                }

                if(listAction[NS_VIEW]){
                    action[NS_VIEW] = listAction[NS_VIEW];
                }else if(!foundInDefaults){
                    action[NS_VIEW] = true;
                }

                this.bGeneratorGeneralActions[listAction[NS_NAME]] = action;

            })

        }

    }

    parseBatchActions = (json_config) => {

        if(!json_config[NS_BATCH_ACTIONS]){
            this.bGeneratorBatchActions = this.defaultBatchActions();
        }else{

            this.bGeneratorBatchActions = {};

            const listActions = json_config[NS_BATCH_ACTIONS];

            listActions.map(listAction => {

                if(!listAction[NS_NAME]){
                    throw "AG Configuration: Actions should have key: name";
                }

                let foundInDefaults = false;
                let action;
                if(this.defaultBatchActions()[listAction[NS_NAME]]){
                    action = this.defaultBatchActions()[listAction[NS_NAME]];
                    foundInDefaults = true;
                }else{
                    action = {};
                }

                if(listAction[NS_LABEL]){
                    action[NS_LABEL] = listAction[NS_LABEL];
                }else if(!foundInDefaults){
                    action[NS_LABEL] = listAction[NS_NAME];
                }

                if(listAction[NS_CONFIRM]){
                    action[NS_CONFIRM] = listAction[NS_CONFIRM];
                }

                this.bGeneratorBatchActions[listAction[NS_NAME]] = action;

            })

        }

    }

    parseListActions = (json_config) => {

        if(!json_config[NS_ACTIONS]){
            this.bGeneratorListActions = this.defaultListActions();
        }else{
            this.bGeneratorListActions = {};

            const listActions = json_config[NS_ACTIONS];
            listActions.map(listAction => {

                if(!listAction[NS_NAME]){
                    throw "AG Configuration: List Actions should have key: name";
                }

                let foundInDefaults = false;
                let action;
                if(this.defaultListActions()[listAction[NS_NAME]]){
                    foundInDefaults = true;
                    action = this.defaultListActions()[listAction[NS_NAME]];
                }else{
                    action = {};
                }

                if(listAction[NS_ROUTE]){
                    action[NS_ROUTE] = listAction[NS_ROUTE];
                }

                if(listAction[NS_TYPE]){
                    action[NS_TYPE] = listAction[NS_TYPE];
                }else if(!foundInDefaults){
                    action[NS_TYPE] = BUTTON_TYPE_LINK;
                }

                if(listAction[NS_CLASS]){
                    action[NS_CLASS] = listAction[NS_CLASS];
                }

                if(listAction[NS_LABEL]){
                    action[NS_LABEL] = listAction[NS_LABEL];
                }else if(!foundInDefaults){
                    action[NS_LABEL] = listAction[NS_NAME];
                }

                if(listAction[NS_VIEW]){
                    action[NS_VIEW] = listAction[NS_VIEW];
                }else if(!foundInDefaults){
                    action[NS_VIEW] = true;
                }

                if(listAction[NS_CONFIRM]){
                    action[NS_CONFIRM] = listAction[NS_CONFIRM];
                }

                if(listAction[NS_CONDITION]){
                    action[NS_CONDITION] = listAction[NS_CONDITION];
                }else if(!foundInDefaults){
                    action[NS_CONDITION] = null;
                }

                this.bGeneratorListActions[listAction[NS_NAME]] = action;

            })

        }

    }

    parseCreateActions = (json_config) => {

        if(!json_config[NS_ACTIONS]){
            this.bGeneratorCreateActions = this.defaultCreateActions();
        }else{

            this.bGeneratorCreateActions = {};

            const listActions = json_config[NS_ACTIONS];
            listActions.map(listAction => {

                if(!listAction[NS_NAME]){
                    throw "AG Configuration: Actions should have key: name";
                }

                let foundInDefaults = false;
                let action;
                if(this.defaultCreateActions()[listAction[NS_NAME]]){
                    action = this.defaultCreateActions()[listAction[NS_NAME]];
                    foundInDefaults = true;
                }else{
                    action = {};
                }

                if(listAction[NS_ROUTE]){
                    action[NS_ROUTE] = listAction[NS_ROUTE];
                }

                if(listAction[NS_CLASS]){
                    action[NS_CLASS] = listAction[NS_CLASS];
                }

                if(listAction[NS_LABEL]){
                    action[NS_LABEL] = listAction[NS_LABEL];
                }else if(!foundInDefaults){
                    action[NS_LABEL] = listAction[NS_NAME];
                }

                if(listAction[NS_VIEW]){
                    action[NS_VIEW] = listAction[NS_VIEW];
                }else if(!foundInDefaults){
                    action[NS_VIEW] = true;
                }

                if(listAction[NS_TYPE]){
                    action[NS_TYPE] = listAction[NS_TYPE];
                }else if(!foundInDefaults){
                    action[NS_TYPE] = BUTTON_TYPE_LINK;
                }

                if(listAction[NS_CONFIRM]){
                    action[NS_CONFIRM] = listAction[NS_CONFIRM];
                }

                if(listAction[NS_CONDITION]){
                    action[NS_CONDITION] = listAction[NS_CONDITION];
                }else if(!foundInDefaults){
                    action[NS_CONDITION] = null;
                }

                this.bGeneratorCreateActions[listAction[NS_NAME]] = action;

            })
        }

    }

    parseEditActions = (json_config) => {

        if(!json_config[NS_ACTIONS]){
            this.bGeneratorEditActions = this.defaultEditActions();
        }else{

            this.bGeneratorEditActions = {};

            const listActions = json_config[NS_ACTIONS];

            listActions.map(listAction => {

                if(!listAction[NS_NAME]){
                    throw "AG Configuration: Actions should have key: name";
                }

                let foundInDefaults = false;
                let action;
                if(this.defaultEditActions()[listAction[NS_NAME]]){
                    action = this.defaultEditActions()[listAction[NS_NAME]];
                    foundInDefaults = true;
                }else{
                    action = {};
                }

                if(listAction[NS_ROUTE]){
                    action[NS_ROUTE] = listAction[NS_ROUTE];
                }

                if(listAction[NS_CLASS]){
                    action[NS_CLASS] = listAction[NS_CLASS];
                }

                if(listAction[NS_LABEL]){
                    action[NS_LABEL] = listAction[NS_LABEL];
                }else if(!foundInDefaults){
                    action[NS_LABEL] = listAction[NS_NAME];
                }


                if(listAction[NS_TYPE]){
                    action[NS_TYPE] = listAction[NS_TYPE];
                }else if(!foundInDefaults){
                    action[NS_TYPE] = BUTTON_TYPE_LINK;
                }

                if(listAction[NS_VIEW]){
                    action[NS_VIEW] = listAction[NS_VIEW];
                }else if(!foundInDefaults){
                    action[NS_VIEW] = true;
                }

                if(listAction[NS_CONFIRM]){
                    action[NS_CONFIRM] = listAction[NS_CONFIRM];
                }

                if(listAction[NS_CONDITION]){
                    action[NS_CONDITION] = listAction[NS_CONDITION];
                }else if(!foundInDefaults){
                    action[NS_CONDITION] = null;
                }

                this.bGeneratorEditActions[listAction[NS_NAME]] = action;


            })

        }

    }

    parseShowActions = (json_config) => {

        if(!json_config[NS_ACTIONS]){
            this.bGeneratorShowActions = this.defaultShowActions();
        }else{

            this.bGeneratorShowActions = {};

            const listActions = json_config[NS_ACTIONS];
            listActions.map(listAction => {

                if(!listAction[NS_NAME]){
                    throw "AG Configuration: Actions should have key: name";
                }

                let foundInDefaults = false;
                let action;
                if(this.defaultShowActions()[listAction[NS_NAME]]){
                    action = this.defaultShowActions()[listAction[NS_NAME]];
                    foundInDefaults = true;
                }else{
                    action = {};
                }

                if(listAction[NS_ROUTE]){
                    action[NS_ROUTE] = listAction[NS_ROUTE];
                }

                if(listAction[NS_CLASS]){
                    action[NS_CLASS] = listAction[NS_CLASS];
                }

                if(listAction[NS_LABEL]){
                    action[NS_LABEL] = listAction[NS_LABEL];
                }else if(!foundInDefaults){
                    action[NS_LABEL] = listAction[NS_NAME];
                }

                if(listAction[NS_VIEW]){
                    action[NS_VIEW] = listAction[NS_VIEW];
                }else if(!foundInDefaults){
                    action[NS_VIEW] = true;
                }

                if(listAction[NS_TYPE]){
                    action[NS_TYPE] = listAction[NS_TYPE];
                }else if(!foundInDefaults){
                    action[NS_TYPE] = BUTTON_TYPE_LINK;
                }

                if(listAction[NS_METHOD]){
                    action[NS_METHOD] = listAction[NS_METHOD];
                }else if(!foundInDefaults){
                    action[NS_METHOD] = 'post';
                }

                if(listAction[NS_CONFIRM]){
                    action[NS_CONFIRM] = listAction[NS_CONFIRM];
                }

                this.bGeneratorShowActions[listAction[NS_NAME]] = action;

            })

        }

    }


    defaultObjectActions = () => ({
        'show': {
            'route': 'show',
            'class': 'btn btn-default btn-xs',
            'icon': 'glyphicon glyphicon-eye-open',
            'type': BUTTON_TYPE_LINK,
            'label': 'generator.show'
        },
        'edit': {
            'route': 'edit',
        'class': 'btn btn-default btn-xs',
        'icon': 'glyphicon glyphicon-edit',
        'type': BUTTON_TYPE_LINK,
        'label': 'generator.edit'
        },
        'delete': {
            'route': 'destroy',
            'class': 'btn btn-danger btn-xs',
            'icon': 'glyphicon glyphicon-trash',
            'type': BUTTON_TYPE_SUBMIT,
            'confirm': 'generator.are_you_sure',
            'label': 'generator.delete',
            'method': 'delete',
        }
    });

    defaultGeneralActions = () => ({
        'exportExcel': {
            'route': 'exportExcel',
            'class': 'btn btn-success',
            'label': 'generator.exportExcel',
        }
    });

    defaultBatchActions = () => ({
        'batchDelete': {
            'label': 'generator.delete',
        },
        'batchExportExcel': {
            'label': 'generator.exportExcel',
        }
    });

    defaultListActions = () => ({
        'create': {
            'route': 'create',
            'class': 'btn btn-primary',
            'label': 'generator.add_new'
        }
    });

    defaultCreateActions = () => ({
        'list': {
            'route': 'index',
            'class': 'btn btn-default',
            'label': 'generator.cancel',
            'type': BUTTON_TYPE_LINK
        },
        'save': {
            'label': 'generator.save',
            'type': BUTTON_TYPE_SUBMIT,
        },
        'save_and_add': {
            'label': 'generator.save_and_add',
            'type': BUTTON_TYPE_SUBMIT,
        }
    });

    defaultEditActions = () => ({
        'list': {
            'route': 'index',
            'class': 'btn btn-default',
            'label': 'generator.list',
            'type': BUTTON_TYPE_LINK
        },
        'save': {
            'label': 'generator.save',
            'type': BUTTON_TYPE_SUBMIT
        }
    });

    defaultShowActions = () => ({
        'delete': {
            'route': 'destroy',
            'class': 'btn btn-danger',
            'type': BUTTON_TYPE_SUBMIT,
            'confirm': 'generator.are_you_sure',
            'label': 'generator.delete',
            'method': 'delete',
        },
            'list': {
                'route': 'index',
                'class': 'btn btn-default',
                'label': 'generator.list',
                'type': BUTTON_TYPE_LINK,
            }
        })
    }

const VIEW_MODE_API = 'api';
const VIEW_MODE_NO_API = 'noApi';

const NS_PARAMS = 'params';
const NS_CUSTOM_VIEW = 'customView';
const NS_SKELETON = 'skeleton';
const NS_MODEL = 'model';
const NS_REPOSITORY = 'repository';
const NS_ENTITY_MANAGER = 'entityManager';
const NS_THEME = 'theme';
const NS_PARENT_MODEL = 'parentModel';
const NS_PARENT_REF = 'parentRef';
const NS_OBJECT_REF = 'objectRef';
const NS_LAYOUT = 'layout';
const NS_FIELDS = 'fields';
const NS_FIELDSETS = 'fieldSets';
const NS_FIELDSET_LAYOUT = 'fieldSetLayout';
const NS_LIST = 'list';
const NS_EXCEL = 'excel';
const NS_FORM = 'form';
const NS_FILTER = 'filter';
const NS_EDIT = 'edit';
const NS_NEW = 'new';
const NS_ACTIONS = 'actions';
const NS_OBJECT_ACTIONS = 'objectActions';
const NS_OBJECT_ACTIONS_DISPLAY = 'objectActionsDisplay';
const NS_BATCH_ACTIONS = 'batchActions';
const NS_GENERAL_ACTIONS = 'generalActions';
const NS_DISPLAY = 'display';
const NS_COUNT_PER_PAGE = 'countPerPage';
const NS_QUERY = 'query';
const NS_SORT = 'sort';

const NS_IN_FORM = 'inForm';
const NS_IN_INDEX = 'inIndex';
const NS_SOTRABLE = 'sortable';
const NS_SEARCHABLE = 'searchable';
const NS_FILLABLE = 'fillable';
const NS_PRIMARY = 'primary';
const NS_DB_TYPE = 'dbType';
const NS_NAME = 'name';
const NS_LABEL = 'label';
const NS_HELPER = 'helper';
const NS_PLACEHOLDER = 'placeholder';
const NS_DEFAULT_VALUE = 'defaultValue';
const NS_TYPE = 'type';
const NS_VALIDATION = 'validation';
const NS_DATA_PROVIDER = 'dataProvider';
const NS_MASK = 'mask';
const NS_CLASS = 'class';
const NS_CHOICES = 'choices';
const NS_EXPANDED = 'expanded';
const NS_MULTIPLE = 'multiple';
const NS_SESSION_PREFIX = 'sessionPrefix';

const NS_TITLE = 'title';
const NS_TABLE_METHOD = 'table_method';
const NS_SHOW = 'show';

const NS_ROUTE = 'route';
const NS_VALUE = 'value';
const NS_ICON = 'icon';
const NS_CONFIRM = 'confirm';
const NS_METHOD = 'method';

const DEFAULT_FILLABLE = true;
const DEFAULT_SEARCHABLE = true;
const DEFAULT_SORTABLE = false;
const DEFAULT_PRIMARY = false;
const DEFAULT_IN_INDEX = false;
const DEFAULT_IN_FORM = false;
const DEFAULT_ICON = 'glyphicon glyphicon-edit';
const CUSTOM_VIEWS_ROOT = 'backoffice';

const DB_TYPE_INT = 'int';
const DB_TYPE_TEXT = 'text';
const DB_TYPE_DATE = 'date';

const BUTTON_TYPE_LINK = 'link';
const BUTTON_TYPE_SUBMIT = 'submit';
const NS_VIEW = 'view';
const NS_CONDITION = 'condition';
const BUTTON_TYPE_REACT = 'react';
const BUTTON_TYPE_ACTION = 'action';
const BUTTON_TYPE_MODAL = 'modal';
const BUTTON_TYPE_METHOD = 'method';

module.exports.bGenerator = new bGenerator();
module.exports.ns = {
    BUTTON_TYPE_LINK,
    BUTTON_TYPE_SUBMIT,
    NS_VIEW,
    NS_CONDITION,
    BUTTON_TYPE_REACT,
    BUTTON_TYPE_ACTION,
    BUTTON_TYPE_MODAL,
    BUTTON_TYPE_METHOD,
    NS_ROUTE,
    NS_VALUE,
    NS_ICON ,
    NS_CONFIRM,
    NS_METHOD,
    NS_CHOICES,
    NS_DATA_PROVIDER,
    NS_NAME,
    NS_LABEL,
    NS_HELPER,
    NS_PLACEHOLDER,
    NS_DEFAULT_VALUE,
    NS_TYPE,
    NS_IN_FORM,
    NS_IN_INDEX,
    NS_ACTIONS,
    NS_OBJECT_ACTIONS,
    NS_BATCH_ACTIONS,
    NS_GENERAL_ACTIONS,
    NS_DISPLAY,
    NS_COUNT_PER_PAGE,
    NS_FIELDS,
    NS_FIELDSETS,
    NS_FIELDSET_LAYOUT,
    NS_LIST,
    NS_EXCEL,
    NS_FORM,
    NS_FILTER,
    NS_CUSTOM_VIEW,
    NS_SKELETON,
    NS_MODEL,
    NS_DB_TYPE,
    DB_TYPE_DATE,
    DB_TYPE_INT,
    DB_TYPE_TEXT,
    NS_LAYOUT,
    NS_OBJECT_ACTIONS_DISPLAY
}
