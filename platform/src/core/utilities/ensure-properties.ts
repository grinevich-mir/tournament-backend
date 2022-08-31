const hasProp = Object.prototype.hasOwnProperty;

function throwsMessage(err: Error) {
	return '[Throws: ' + (err ? err.message : '?') + ']';
}

function safeGetValueFromPropertyOnObject(obj: any, property: string) {
    if (!hasProp.call(obj, property))
        return obj[property];

    try {
        return obj[property];
    }
    catch (err) {
        return throwsMessage(err);
    }
}

export function ensureProperties(obj: any, replacer?: (this: any, value: any | boolean) => any): any {
	const seen: any[] = []; // store references to objects we have seen before

	function visit(o: any): any {
		if (o === null || typeof o !== 'object')
            return o;

        if (replacer) {
            const replacement = replacer.apply(obj, [o]);

            if (replacement !== false)
                return replacement;
        }

		if (seen.indexOf(o) !== -1)
            return '[Circular]';

		seen.push(o);

		if (typeof o.toJSON === 'function')
			try {
				const fResult = visit(o.toJSON());
				seen.pop();
				return fResult;
			} catch(err) {
				return throwsMessage(err);
			}

		if (Array.isArray(o)) {
			const aResult = o.map(visit);
			seen.pop();
			return aResult;
		}

		const result = Object.keys(o).reduce((res: any, prop) => {
			// prevent faulty defined getter properties
			res[prop] = visit(safeGetValueFromPropertyOnObject(o, prop));
			return res;
		}, {});
		seen.pop();
		return result;
	}

	return visit(obj);
}