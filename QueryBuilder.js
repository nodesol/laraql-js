export default class QueryBuilder {
    constructor(modelClass) {
        this.model = modelClass;
        this.filters = [];
        this.rawWhere = null;
        this._pagination = null;
        this._orderBy = [];
    }

    where(column, operator, value) {
        if (value === undefined) {
            value = operator;
            operator = 'EQ';
        }
        this.filters.push({ column, operator, value });
        return this;
    }

    whereRaw(conditionObject) {
        this.rawWhere = conditionObject;
        return this;
    }

    paginate(first = 15, page = 1) {
        this._pagination = { first, page };
        return this;
    }

    orderBy(column, order = 'ASC') {
        this._orderBy.push({ 
            column: column.toUpperCase(), 
            order: order.toUpperCase() 
        });
        return this;
    }

    _stringifyCondition(obj) {
        if (Array.isArray(obj)) {
            return `[${obj.map(o => this._stringifyCondition(o)).join(', ')}]`;
        }
        if (typeof obj === 'object' && obj !== null) {
            const entries = Object.entries(obj).map(([key, val]) => {
                if (key === 'column' || key === 'operator') return `${key}: ${val.toUpperCase()}`;
                if (key === 'value') return `value: ${JSON.stringify(val)}`;
                return `${key}: ${this._stringifyCondition(val)}`;
            });
            return `{ ${entries.join(', ')} }`;
        }
        return JSON.stringify(obj);
    }

    async get(fields = ['id']) {
        let wherePart = '';

        if (this.rawWhere) {
            wherePart = `where: ${this._stringifyCondition(this.rawWhere)}`;
        } else if (this.filters.length > 0) {
            const conditions = this.filters.map(f => (
                `{ column: ${f.column.toUpperCase()}, operator: ${f.operator.toUpperCase()}, value: ${JSON.stringify(f.value)} }`
            ));
            wherePart = `where: { ${conditions.length > 1 ? `AND: [${conditions.join(', ')}]` : conditions[0]} }`;
        }

        const args = [];
        if (wherePart) args.push(wherePart);
        if (this._pagination) {
            args.push(`first: ${this._pagination.first}`);
            args.push(`page: ${this._pagination.page}`);
        }
        if (this._orderBy.length > 0) {
            const orders = this._orderBy.map(o => `{ column: ${o.column}, order: ${o.order} }`).join(', ');
            args.push(`orderBy: [${orders}]`);
        }

        const argsString = args.length ? `(${args.join(', ')})` : '';

        let query;
        if (this._pagination) {
            query = `query { 
                ${this.model._pluralName}${argsString} { 
                    data { ${fields.join(' ')} } 
                    paginatorInfo { total currentPage lastPage hasMorePages } 
                } 
            }`;
        } else {
            query = `query { ${this.model._pluralName}${argsString} { ${fields.join(' ')} } }`;
        }

        const response = await this.model.request(query);
        const result = response[this.model._pluralName];

        // Ensure we return Model instances
        if (this._pagination) {
            result.data = result.data.map(item => new this.model(item));
            return result;
        }

        return result.map(item => new this.model(item));
    }
}