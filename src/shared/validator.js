import { Observable } from 'rxjs';

// Validator: class responsible for containing error information;
export class Validator {
  get isValid() { return !this._errors.length; }
  get errors() { return this._errors; }
  get message() { return this._errors.join(", "); }

  constructor() {
    this._errors = [];
  }

  error(message) {
    this._errors.push(message);
  }

  toObject() {
    if (this.isValid)
      return {};

    return {
      errors: this._errors,
      message: this.message
    };
  }

  // allow validator to integrate with observable pipeline
  throw$() {
    return Observable.throw({clientMessage: this.message});
  }
}
