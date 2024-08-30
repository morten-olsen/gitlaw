type ValidationMessage = {
  type: 'error' | 'warning' | 'info' | 'suggestion' | 'approval';
  rule: string;
  reason: string;
  stack?: {
    path: string;
    start?: {
      line: number;
      column: number;
    };
    end?: {
      line: number;
      column: number;
    };
  }[];
};

class ValidationContext {
  #messages: ValidationMessage[] = [];

  public get isValid() {
    return !this.#messages.some((message) => message.type === 'error');
  }

  public get messages() {
    return this.#messages;
  }

  public add = (message: ValidationMessage) => {
    this.#messages.push(message);
    if (message.type === 'error') {
      console.error(`❌: ${message.reason}`);
    }
  }

}

export { ValidationContext, type ValidationMessage };
