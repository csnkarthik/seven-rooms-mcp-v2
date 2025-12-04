// Minimal ambient declaration to silence missing @types/express in this workspace.
// This treats express as any; for stronger typing, install @types/express as a dev dependency.
declare module "express" {
  import http = require("http");

  function express(): any;
  namespace express {
    function json(opts?: any): any;
    function urlencoded(opts?: any): any;

    export interface Request extends http.IncomingMessage {}
    export interface Response extends http.ServerResponse {}
    export interface NextFunction {
      (err?: any): void;
    }
  }

  export = express;
}
