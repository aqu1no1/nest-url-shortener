export declare const MAX_TEST_WORKERS: number;
export declare function loadTestEnv(): void;
export declare function databaseName(url: string): string;
export declare function assertTestDatabase(url: string | undefined): asserts url is string;
export declare function workerDatabaseUrl(baseUrl: string, workerId: number | string): string;
