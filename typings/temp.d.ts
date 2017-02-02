declare module 'temp' {
    function track(): void;
    function mkdir(prefix: string): (err: Error, dirPath: string) => void;
}
