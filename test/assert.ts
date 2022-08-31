import * as Chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiString from 'chai-string';
import chaiEach from 'chai-each';
Chai.use(chaiString);
Chai.use(chaiEach);
Chai.use(chaiAsPromised);
export = Chai;