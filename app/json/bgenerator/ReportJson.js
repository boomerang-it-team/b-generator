class ReportJson {

    request;
    response;
    options;


    constructor(request, response, options) {

        this.options = options
        this.request = request;
        this.response = response;

    }

    toArray = async () => {

        const result = this.options['result'];
        const headers = this.options['headers'];
        const page_title = this.options['page_title'];
        const data_format = this.options['data_format'];
        const page_sum_data = this.options['page_sum_data'];

        let headerJson = [];
        for(let i = 0; i < headers.length; i++){
            const header = headers[i];
            headerJson = headerJson.concat(this.request.i18n ? this.request.i18n.t(header) : header);
        }

        return {
            result,
            headers: headerJson,
            page_title,
            data_format,
            page_sum_data
        };
    }


}

module.exports = ReportJson;