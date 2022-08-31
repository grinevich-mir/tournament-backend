export function Get(value?: string): MethodDecorator {
  return (target, key) => {
      Reflect.defineMetadata('http:method', 'GET', target, key);
  };
}

export function Post(value?: string): MethodDecorator {
  return (target, key) => {
      Reflect.defineMetadata('http:method', 'POST', target, key);
  };
}

export function Put(value?: string): MethodDecorator {
  return (target, key) => {
      Reflect.defineMetadata('http:method', 'PUT', target, key);
  };
}

export function Patch(value?: string): MethodDecorator {
  return (target, key) => {
      Reflect.defineMetadata('http:method', 'PUT', target, key);
  };
}

export function Delete(value?: string): MethodDecorator {
  return (target, key) => {
      Reflect.defineMetadata('http:method', 'DELETE', target, key);
  };
}

export function Head(value?: string): MethodDecorator {
  return (target, key) => {
      Reflect.defineMetadata('http:method', 'HEAD', target, key);
  };
}
