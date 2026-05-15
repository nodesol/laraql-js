import axios from 'axios';
import pluralize from 'pluralize';
import QueryBuilder from './QueryBuilder.js';

let _api = axios;
let _headersCallback = (h) => h;
let _onUnauthenticated = null;
let _defaultBaseUrl = "";

export default class Model {
    static baseUrl = "";

    constructor(attributes = {}) {
        this.fill(attributes);
    }

    /**
     * Global Configuration
     * @param {Object} config - { url, api, headersCallback, router, onUnauthenticated }
     */
    static init(config) {
        if (!config || typeof config !== 'object') return;
        if (config.url) _defaultBaseUrl = config.url;
        if (config.api) _api = config.api;
        if (config.headersCallback) _headersCallback = config.headersCallback;
        if (config.onUnauthenticated) _onUnauthenticated = config.onUnauthenticated;
    }

    static get _effectiveBaseUrl() {
        return (this.baseUrl || _defaultBaseUrl).replace(/\/$/, "");
    }

    static get _singularName() {
        return (this.name).split(/(?=[A-Z])/).join("_").toLowerCase();
    }

    static get _pluralName() {
        return pluralize(this._singularName);
    }

    fill(attributes) {
        Object.assign(this, attributes);
        return this;
    }

    clone() {
        return new this.constructor(JSON.parse(JSON.stringify(this)));
    }

    async save(fields = ['id']) {
        const isUpdate = !!this.id;
        const mutationName = `${isUpdate ? 'update' : 'create'}`;
        const {id,...input} =  this;
        if (isUpdate && Object.keys(this).length === 0) return this;
        const query = this.generateMutation(fields,mutationName);
        const data = await this.constructor.request(query, {id:id,input:input });
        this.fill(data[mutationName+this.constructor.name]);
        return this;
    }

    async delete(id) {
        if (!this.id && !id) throw new Error("LaraQL: Cannot delete a model without an ID.");
        const query = this.generateMutation(['id'],'delete');
        await this.constructor.request(query, { id: id ?? this.id });
        return true;
    }

    async update(fields = ['id']) {
        return this.save(fields);
    }

    static query() {
        return new QueryBuilder(this);
    }

    static where(...args) {
        return this.query().where(...args);
    }

    static async all(fields = ['id']) {
        return this.query().get(fields);
    }

    static async find(id, fields = ['id']) {
        const query = `query($id: ID!) { ${this._singularName}(id: $id) { ${fields.join(' ')} } }`;
        const data = await this.request(query, { id });
        return new this(data[this._singularName]);
    }

    static async request(query, variables = {}) {
        const url = `${this._effectiveBaseUrl}`;
        
        let headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        };
         headers = _headersCallback(headers)
        // Extract operationName for better server-side logging
        const operationMatch = query?.match(/\b(query|mutation|subscription)\s+(\w+)/);
        const operationName = operationMatch ? operationMatch[2] : null;

        try {
            const response = await _api.post(url, {
                query,
                variables,
                operationName
            }, { headers });

            const errors = this._gatherErrors(response?.data?.errors ?? []);

            // Check for authentication failure
            if (errors.some(e => e === "Unauthenticated.")) {
                if (_onUnauthenticated) _onUnauthenticated();
                throw new Error("Session expired. Please login again.");
            }

            if (errors.length) {
                throw new Error(errors.join(", "));
            }

            return response.data.data;
        } catch (error) {
            console.error(`LaraQL [${this.name}] Request Error:`, error.message);
            throw error;
        }
    }

    static _gatherErrors(errors) {
        let error_messages = [];
        errors.map(error => {
            if (error?.extensions?.validation) {
                const validationErrors = Object.values(error.extensions.validation).flat();
                error_messages.push(...this._gatherErrors(validationErrors));
            } else if (error?.message) {
                error_messages.push(error.message);
            } else if (typeof error == "string") {
                error_messages.push(error);
            }
        });
        return [...new Set(error_messages)]; // Unique errors only
    }

    generateMutation(fields,operation='create'){
            let input ='';
            let insert = '';
            const operationName = operation+ this.constructor.name;
            if(operation != 'delete'){
                input +=`$input:${this.constructor.name}Input!`;
                insert += 'input:$input'
            }
            if(operation == 'update'){
                input += ','
                insert += ','
            }
            if(operation != 'create'){
                input += `$id:ID!`,
                insert += 'id:$id'
            }
            return  `
                mutation ${operationName}(${input}) {
                    ${operationName}(${insert}){
                        ${fields.join(" ")}
                    }
                }
            `
    }
}