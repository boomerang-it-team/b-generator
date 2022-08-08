class bGeneratorRouter {

    crud = (router, middlewares, model, controller, routeName) => {
        router.post('/' +routeName + '/load/:id?', middlewares, function(req, res, next) {
            return controller.load(req, res);
        });
        router.post('/' +routeName + '/create', middlewares, function(req, res, next) {
            return controller.store(req, res);
        });
        router.post('/' +routeName + '/update/:id', middlewares, function(req, res, next) {
            return controller.store(req, res);
        });
        router.post('/' +routeName + '/delete/:id', middlewares, function(req, res, next) {
            return controller.delete(req, res);
        });
        router.post('/' + routeName, middlewares, function(req, res, next) {
            return controller.getIndex(req, res);
        });
    }

    crudParent = (router, middlewares, model, controller, routeName) => {

        router.post('/' + routeName + '/load/:id', middlewares, function(req, res, next) {
            return controller.load(req, res);
        });
        router.post('/' +routeName + '/create/:pid', middlewares, function(req, res, next) {
            return controller.store(req, res);
        });
        router.post('/' +routeName + '/update/:id', middlewares, function(req, res, next) {
            return controller.store(req, res);
        });
        router.post('/' +routeName + '/delete/:id', middlewares, function(req, res, next) {
            return controller.delete(req, res);
        });
        router.post('/' +routeName + '/:pid', middlewares, function(req, res, next) {
            return controller.getIndex(req, res);
        });

    }

    crudSettings = (router, middlewares, model, controller, routeName) => {
        router.post('/' +routeName + '/update/:id', middlewares, function(req, res, next) {
            return controller.store(req, res);
        });
        router.post('/' + routeName, middlewares, function(req, res, next) {
            return controller.getIndex(req, res);
        });
    }

    report = (router, middlewares, controller, routeName) => {
        router.post('/' +routeName + '/report', middlewares, function(req, res, next) {
            return controller.report(req, res);
        });
        router.post('/' + routeName, middlewares, function(req, res, next) {
            return controller.getIndex(req, res);
        });
    }

    reportParent = (router, middlewares, controller, routeName) => {
        router.post('/' +routeName + '/report/:id', middlewares, function(req, res, next) {
            return controller.report(req, res);
        });
        router.post('/' + routeName, middlewares, function(req, res, next) {
            return controller.getIndex(req, res);
        });
    }

    import = (router, middlewares, controller, routeName) => {

        router.post('/' +routeName + '/import', middlewares, function(req, res, next) {
            return controller.import(req, res);
        });

        router.post('/' +routeName + '/download-sample', middlewares, function(req, res, next) {
            return controller.downloadSampleData(req, res);
        });

        router.post('/' + routeName, middlewares, function(req, res, next) {
            return controller.prepare(req, res);
        });

    }
}

module.exports = new bGeneratorRouter();