
C:\openpose\selen-api>node api/selen.js
file:///C:/openpose/selen-api/api/selen.js:8
import cacheService from "../cache/cacheService.js";
       ^^^^^^^^^^^^
SyntaxError: The requested module '../cache/cacheService.js' does not provide an export named 'default'
    at ModuleJob._instantiate (node:internal/modules/esm/module_job:182:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:266:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:644:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:5)

Node.js v22.16.0
