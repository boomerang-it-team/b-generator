# b-generator

A simple and useful Admin generator and report generator for nodejs

## Table of contents

1. [ Installation ](#installation)
2. [ Usage ](#usage)
3. [ CRUD Generator ](#crud-generator)
3. [ Report Generator ](#report-generator)

<a name="installation"></a>
## Installation

Using npm:

```bash
$ npm install b-generator
```

Using bower:

```bash
$ bower install b-generator
```

Using yarn:

```bash
$ yarn add b-generator
```

Using pnpm:

```bash
$ pnpm add b-generator
```

<a name="usage"></a>
## Usage

### Structure

You should create two file for each model. the first is a model definition, and the second is repository file which extends Base Repository inside b-generator package

### Repository

```js
const BGenerator = require("b-generator");
const BaseRepository = BGenerator.BaseRepository;
const SampleModel = require("Path_to_SampleModel");

class SampleRepository extends BaseRepository {
    // Your relations and ...
}

module.exports = new SampleRepository(SampleModel);

```

## Routing

Inside routes folder you can use a macro that is implemented for creating CRUDs.

```js
const BGenerator = require("b-generator");
const bGeneratorRouter = BGenerator.bGeneratorRouter;

bGeneratorRouter.crud(router, [], 'SampleController', (new SampleController()), 'api/crud/sample');
bGeneratorRouter.crudSettings(router, [], 'SampleSettingsController', (new SampleController()), 'api/crud/sample-settings');

```

The difference between crud and crudSettings is that crudSettings will remove delete route and that is used for settings pages where we want to show one form instead of list with all CRUD options.

### Inside Resources

You should have folders that you put data for generators and reports schema. you can name it "generators" and "reports".

## Modules

These are some modules inside b-generator:
1. CRUD Generator: It creates an api based crud that can be used by react and vue.js.
1. Report Generator: It creates an api based report generator with ability to create filters and export as excel.

<a name="crud-generator"></a>
### CRUD Generator

There are two types of controllers. The simple one is CRUD controller that you can add simple CRUD like user management and etc.

The other one is crud parent controller that manipulates data that are subset of another data. 
For example the posts that belong to user. or comments that belong to a post. 

#### Controller

```js
const BGenerator = require("b-generator");
const BGenController = BGenerator.CrudController;
// for using parent controller
// const BGenController = BGenerator.CrudParentController;

const configFile = require("path_to_config.json");

const sequelize = require("sequelize");
const bGenConfig = {
    wrapper_api_base: "/api/",
    sequelize,
    base_app_path: __dirname + "/../../"  /* PATH TO YOUR APP FOLDER */
}

class SampleController extends BGenController {
    constructor() {
        super(configFile, bGenConfig);
    }
}

module.exports = SampleController;

```

### Admin Config File

Inside your config file you should address model and repository of the file that you need.

The path starts from "base_app_path" that you gave earlier inside controller constructor.

```json
{
    "params": {
        "model": "Path_to_model",
        "repository": "path_to_repository",
        "customView": "backoffice/simple"
    },

    "fields": [
        { "name": "sample_field_1", "label": "language:labels.sample_field_1" },
        { "name": "sample_field_2", "label": "Sample Field 2" }
    ],

        "form": {
        "display": [
          "sample_field_1",
          "sample_field_2"
        ]
    },

    "filter": {
        "display": [
          "sample_field_1",
          "sample_field_2"
        ]
    },

    "list": {
        "title": "Sample list title",
            "display": [
              "sample_field_1",
              "sample_field_2"
            ],
            "objectActions": [
            { "name": "edit", "label": "Edit", "route": "/api/admin/v1/sample/load/:id", "type": "action", "class": "btn btn-sm btn-default g-bg-white border", "icon": "fa fa-edit" },
            { "name": "delete", "label": "Delete", "route": "/api/admin/v1/sample/delete/:id", "type": "action", "view": false, "class": "btn btn-sm btn-danger border", "icon": "fa fa-trash", "confirm": "Are you sure?"}
        ],
            "actions": [
            { "name": "create", "label": "Create", "route": "/api/admin/v1/sample/load", "type": "action", "class": "btn btn-info abstract-list-btn-standard" }
        ],
            "generalActions": [],
            "batchActions": []
    },

    "new": {
        "title" : "New Sample",
            "display": [
              "sample_field_1",
              "sample_field_2"
            ],
            "actions": [
            { "name": "list", "label": "Back", "route": "/api/admin/v1/sample", "type": "action", "class": "btn btn-default abstract-list-btn-standard" },
            { "name": "create", "label": "Save", "route": "/api/admin/v1/sample/create", "type": "action", "view": false, "class": "btn btn-primary abstract-list-btn-standard"},
            { "name": "save_and_add", "label": "Save and Add", "route": "/api/admin/v1/sample/create", "view": false, "type": "action", "class": "btn btn-primary c-btn-save-and-add"}
        ]
    },

    "edit": {
        "title" : "Edit Sample",
            "actions": [
            { "name": "list", "label": "Back", "route": "/api/admin/v1/sample", "type": "action", "class": "btn btn-default abstract-list-btn-standard" },
            { "name": "delete", "label": "Delete", "route": "/api/admin/v1/sample/delete/:id", "type": "action", "view": false, "class": "btn btn-danger abstract-list-btn-standard", "confirm": "Are you Sure?"},
            { "name": "update", "label": "Save", "route": "/api/admin/v1/sample/update/:id", "type": "action", "view": false, "class": "btn btn-primary abstract-list-btn-standard"}
        ]
    },

    "show": {
        "title" : "Show Sample",
            "display": [],
            "actions": []
    },

    "excel": {
        "display": []
    }
}

```

#### Fields structure

```json
{
    "fields": [
      {
        "name": "sample_field_1",
        "label": "language:labels.sample_field_1",
        "dataProvider": "aMethodNameInsideRepository (used to fetch options inside list by its id. it is only used when you have micro services or have no access to parts of your data inside your current package)",
        "form": {
          "type": "text|select|checkbox|color|hidden|file|password|autocomplete",
          "multiple": "true|false (in case of type=select)",
          "expanded": "true|false (in case of type=select)",
          "dataProvider": "aMethodNameInsideRepository (used to fetch select options and validate) or a route (in case of type=autocomplete)",
          "placeholder": "some text",
          "choices": {
            "key1": "in case of predefined choices in select you can use this and remove dataProvider",
            "key2": "value2"
          },
          "validation": ["nullable", "required", "min:5", "max:10"]
        },
        "filter": {
          "type": "text|select|checkbox|color|hidden|file|password|autocomplete",
          "multiple": "true|false (in case of type=select)",
          "expanded": "true|false (in case of type=select)",
          "dataProvider": "aMethodNameInsideRepository (used to fetch select options and validate) or a route (in case of type=autocomplete)",
          "placeholder": "some text",
          "choices": {
            "key1": "in case of predefined choices in select you can use this and remove dataProvider",
            "key2": "value2"
          },
          "validation": ["nullable", "required", "min:5", "max:10"]
        }
      }
    ]
}
```

Notes: 
1. Check [ Validator ](https://www.npmjs.com/package/Validator) for all validation options
1. You can use ":base" inside "dataProvider" for example ":base/getUsers". This is automatically replaced with "wrapper_api_base" that you passed inside constructor of controller.
It is a good practice is to put "wrapper_api_base" into .env file.

#### Display Fields inside List
Once you defined fields you can add options for displaying list.

```json
{
  
    "filter": {
        "display": ["sample_field_1", "sample_field_2"]
    },

    "list": {
        "title": "Sample list title",
        "display": ["sample_field_1", "_sample_field_2"],
        "objectActionsDisplay": "collapsed|expanded",
        "objectActions": [
            { "name": "edit", "label": "Edit", "route": ":base/sample/load/:id", "type": "action", "class": "btn btn-sm btn-default g-bg-white border", "icon": "fa fa-edit" },
            { "name": "delete", "label": "Delete", "route": ":base/sample/delete/:id", "type": "action", "view": false, "class": "btn btn-sm btn-danger border", "icon": "fa fa-trash", "confirm": "Are you sure?"}
        ],
        "actions": [
            { "name": "create", "label": "Create", "route": ":base/sample/load", "type": "action", "class": "btn btn-info abstract-list-btn-standard" }
        ],
       "generalActions": [],
       "batchActions": []
    }

}

```

Note: 
1. If you want to customize display of data inside table, You can put underscore at the beginning of every field name inside display.
After that you should create a list_FIELD_NAME.jade file inside resources_folder/views/YOUR_CUSTOM_VIEW_VALUE_INSIDE_PARAMS. in this file you can access to a variable named "item" that refers to the object that you need to show.
1. you can refer :FIELD_NAME inside routes. this will be automatically replaced to item[FIELD_NAME].
1. You can access this API by sending a post request to "/api/crud/sample"

<a name="report-generator"></a>
### Report Generator

note: you can use i18next for field labels
## License

[ISC](LICENSE)