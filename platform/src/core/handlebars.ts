import Handlebars from 'handlebars';

Handlebars.registerHelper({
    pluralise(count: number, singular: string, plural: string) {
        return count === 1 ? singular : plural;
    },
    exists(data: any, options: Handlebars.HelperOptions) {
        return data !== null && data !== undefined ? options.fn(this) : options.inverse(this);
    }
});

export default Handlebars;