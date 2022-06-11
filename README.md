# b-generator

A simple and useful Admin generator for nodejs

## Installing

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

## Usage

### .env
```dotenv
BASE_APP_PATH=Full_path_of_project
DATABASE_CONFIG_FILE=Path_of_sequelize_DB_initiator
```

### Controller

```js
const BGenerator = require("b-generator");
const BGenController = BGenerator.CrudController;
const configFile = require("path_to_config.json");

class SampleController extends BGenController {
    constructor() {
        super(configFile);
    }
}

module.exports = SampleController;

```

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

### Admin Config File

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
note: you can use i18next for field labels
## License

[ISC](LICENSE)