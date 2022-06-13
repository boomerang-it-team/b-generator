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
    
}

module.exports = new bGeneratorRouter();