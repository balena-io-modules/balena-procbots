declare module 'temp' {
    function track(): void;
    function mkdir(prefix: string, cb: (err: Error, dirPath: string) => void): void;
}
