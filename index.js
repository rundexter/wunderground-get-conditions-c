var _ = require('lodash'),
    request = require('request'),
    util = require('./util.js');

var apiURL = 'http://api.wunderground.com/api/';

var pickInputs = {
        'country': 'country',
        'city': 'city',
        'state': 'state'
    },
    pickOutputs = {
        'display_location': 'current_observation.display_location.full',
        'country_iso3166': 'current_observation.display_location.country_iso3166',
        'local_time_rfc822': 'current_observation.local_time_rfc822',
        'weather': 'current_observation.weather',
        'temp_c': 'current_observation.temp_c',
        'relative_humidity': 'current_observation.relative_humidity',
        'wind_string': 'current_observation.wind_string',
        'forecast_url': 'current_observation.forecast_url'
    };

module.exports = {

    /**
     * Get auth data.
     *
     * @param step
     * @param dexter
     * @returns {*}
     */
    authorizeRequest: function (dexter) {

        if(!dexter.environment('wunderground_api_key')) {

            this.fail('A [wunderground_api_key] environment variable is required for this module');

            return false;
        } else {

            request = request.defaults({
                baseUrl: apiURL.concat(_(dexter.environment('wunderground_api_key')).toString().trim())
            });

            return true;
        }
    },

    /**
     * Check correct inputs data.
     *
     * @param step
     * @returns {*}
     */
    checkInputStruct: function (step, pickInputs) {
        var requestData = util.pickStringInputs(step, pickInputs),
            uriData = [];

        if (requestData.country)
            uriData.push(requestData.country);

        if (requestData.state)
            uriData.push(requestData.state);

        if (requestData.city)
            uriData.push(requestData.city);


        if (uriData.length < 2) {

            this.fail('A [country,city or state] inputs need for this module.');

            return false;
        }

        return uriData;
    },

    processResult: function (error, response, data) {

            if (error)
                this.fail(error);

            else if (data.error)
                this.fail(data.error);

            else if (data.response.results)
                this.fail(['Not full input parameters']);

            else if (response.statusCode !== 200)
                this.fail(response.statusCode + ': Something is happened');

            else
                this.complete(util.pickResult(data, pickOutputs));
    },

    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {

        var uriData = this.checkInputStruct(step, pickInputs),
            uri = 'conditions/q/' + uriData.join('/') + '.json';

        if (!this.authorizeRequest(dexter) || !uriData)
            return;


        request.get({uri: uri, json: true}, this.processResult.bind(this));
    }
};
