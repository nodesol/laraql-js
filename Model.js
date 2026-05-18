import axios from 'axios';
import pluralize from 'pluralize';
import QueryBuilder from './QueryBuilder.js';

let _api = axios;
let _headersCallback = (h) => h;
let _onUnauthenticated = null;
let _defaultBaseUrl = "";

export default class Model {
    static baseUrl = "";
    static customPluralName = null;
    static returnType = "id";
    static fillable = [];
    static dirty = [];
    _dirty = {};

    constructor(attributes = {}) {
        this.fill(attributes);
    }

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
        return this.customPluralName || pluralize(this._singularName);
    }

    fill(attributes) {
        if (!attributes || typeof attributes !== 'object') return this;
        
        Object.assign(this, attributes);
        
        const dirtyFields = this.constructor.dirty || [];
        dirtyFields.forEach((e) => {
            if (e in attributes) {
                this._dirty[e] = attributes[e];
            }
        });
        return this;
    }

    clone() {
        return new this.constructor(JSON.parse(JSON.stringify(this)));
    }

    async save(fields) {
        const isUpdate = !!this.id;
        const mutationName = `${isUpdate ? 'update' : 'create'}`;
        const input = this.readyInput();

        if (isUpdate && Object.keys(input).length === 0) {
            console.warn(`LaraQL [${this.constructor.name}]: No modified fields to save.`);
            return this;
        }

        const query = this.generateMutation(fields, mutationName);
        const data = await this.constructor.request(query, { id: this.id, input });
        
        const responseKey = mutationName + this.constructor.name;
        if (data && data[responseKey]) {
            this.fill(data[responseKey]);
        }
        return this;
    }

    async delete(id) {
        const targetId = id ?? this.id;
        if (!targetId) throw new Error(`LaraQL [${this.constructor.name}]: Cannot delete a model without an ID.`);
        
        const query = this.generateMutation(['id'], 'delete');
        await this.constructor.request(query, { id: targetId });
        return true;
    }

    async update(fields) {
        return this.save(fields);
    }

    static query() {
        return new QueryBuilder(this);
    }

    static where(...args) {
        return this.query().where(...args);
    }

    static whereRaw(rawObject = {}) {
        return this.query().whereRaw(rawObject);
    }

    static async all(fields) {
        return this.query().get(fields);
    }

    static async find(id, fields) {
        const fieldSelection = fields ? fields.join(' ') : (this.returnType ?? 'id');
        const query = `query($id: ID!) { ${this._singularName}(id: $id) { ${fieldSelection} } }`;
        const data = await this.request(query, { id });
        return new this(data[this._singularName]);
    }

    static async request(query, variables = {}) {
        const url = `${this._effectiveBaseUrl}`;
        if (!url) throw new Error("LaraQL: Base URL not configured. Call Model.init() first.");

        let headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        };
        headers = _headersCallback(headers);
        
        const operationMatch = query?.match(/\b(query|mutation|subscription)\s+(\w+)/);
        const operationName = operationMatch ? operationMatch[2] : null;

        try {
            const response = await _api.post(url, { query, variables, operationName }, { headers });
            const errors = this._gatherErrors(response?.data?.errors ?? []);

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
        if (!Array.isArray(errors)) return error_messages;

        errors.forEach(error => {
            if (error?.extensions?.validation) {
                const validationErrors = Object.values(error.extensions.validation).flat();
                error_messages.push(...this._gatherErrors(validationErrors));
            } else if (error?.message) {
                error_messages.push(error.message);
            } else if (typeof error === "string") {
                error_messages.push(error);
            }
        });
        return [...new Set(error_messages)];
    }

    generateMutation(fields, operation = 'create') {
        let input = '';
        let insert = '';
        
        const fieldsSelection = fields ? fields.join(' ') : (this.constructor.returnType ?? 'id');
        const operationName = operation + this.constructor.name;
        
        if (operation !== 'delete') {
            input += `$input: ${this.constructor.name}Input!`;
            insert += 'input: $input';
        }
        if (operation === 'update') {
            input += ', ';
            insert += ', ';
        }
        if (operation !== 'create') {
            input += `$id: ID!`;
            insert += 'id: $id';
        }
        
        return `
            mutation ${operationName}(${input}) {
                ${operationName}(${insert}) {
                    ${fieldsSelection}
                }
            }
        `;
    }

    readyInput() {
        let inputs = {};
        const fillableFields = this.constructor.fillable || [];
        const dirtyFields = this.constructor.dirty || [];

        fillableFields.forEach(element => {
            if (this[element] === undefined || dirtyFields.includes(element)) {
                return;
            }
            inputs[element] = this[element];
        });

        dirtyFields.forEach((e) => {
            if (this[e] !== undefined && this[e] !== this._dirty[e]) {
                inputs[e] = this[e];
            }
        });

        return inputs;
    }
}