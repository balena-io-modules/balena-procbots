declare class Service {
    errors: any[];
    _revision: string;
    _name: string;
    version: string;
    image: string;
    target: string;
    valid: boolean;
    action: string;
}

export interface LintResponse {
    valid: boolean;
    messages: any[];
    frames: Service[];
}

export interface LintError extends Error {
    message: string;
    parsedLine: number;
    snipper: string;
}

declare module 'keyfctl' {
    function lint(base: string, head: string, workDir: string): LintResponse;
}