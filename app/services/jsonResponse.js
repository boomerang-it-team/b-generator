class jsonResponse {
    send = (res, data, message, code) => {

        if (code) {
            res.status(code);
        } else {
            code = 0;
        }

        if (!message) {
            message = '';
        }

        return res.send({
            "returnCode" : code,
            "message" : message,
            "data": data
        });
    };

    validationFailed = (res, data) => {
        return this.send(res, data, 'Validation Failed!', 422);
    };

    authorizationFailed = (res) => {
        return this.send(res, {}, 'Authorization Failed!', 401);
    };

    error = (res, data) => {
        return this.send(res, data, 'Server Error!', 500);
    };
}

module.exports = new jsonResponse();