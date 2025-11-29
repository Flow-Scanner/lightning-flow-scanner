export interface IExceptions {
  [exceptionName: string]: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [property: string]: any[];
  };
}
