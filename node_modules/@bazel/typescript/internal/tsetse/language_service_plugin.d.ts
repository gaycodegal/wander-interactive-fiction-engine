import * as ts from 'typescript/lib/tsserverlibrary';
declare function init(): {
    create(info: ts.server.PluginCreateInfo): ts.LanguageService;
};
export = init;
