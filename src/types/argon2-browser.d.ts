declare module "argon2-browser" {
  export enum ArgonType {
    Argon2d = 0,
    Argon2i = 1,
    Argon2id = 2,
  }

  interface HashOptions {
    pass: string;
    salt: Uint8Array;
    type: ArgonType;
    hashLen?: number;
    time?: number;
    mem?: number;
    parallelism?: number;
  }

  interface HashResult {
    hash: Uint8Array;
    hashHex: string;
    salt: Uint8Array;
  }

  const argon2: {
    ArgonType: typeof ArgonType;
    hash: (options: HashOptions) => Promise<HashResult>;
  };

  export default argon2;
}
