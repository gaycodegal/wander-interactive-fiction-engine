export class Person {
    private _name: string;

    constructor(name: string) {
        this._name = name;
    }

    greet(): string {
        return 'Hello, ' + this._name;
    }
}
