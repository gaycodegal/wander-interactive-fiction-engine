class Person {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  greet(): string {
    return `Hello, ${this.name}`;
  }
}

export default Person;
