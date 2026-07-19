async function qtLoad(config)
{
    const throwIfEnvUsedButNotExported = (instance, config) =>
    {
        const environment = config.qt.environment;
        if (!environment || Object.keys(environment).length === 0)
            return;
        const descriptor = Object.getOwnPropertyDescriptor(instance, 'ENV');
        const isEnvExported = typeof descriptor.value === 'object';
        if (!isEnvExported) {
            throw new Error('ENV must be exported if environment variables are passed, ' +
                            'add it to the QT_WASM_EXTRA_EXPORTED_METHODS CMake target property');
        }
    };

    if (typeof config !== 'object')
        throw new Error('config is required, expected an object');
    if (typeof config.qt !== 'object')
        throw new Error('config.qt is required, expected an object');
    if (typeof config.qt.entryFunction !== 'function')
        throw new Error('config.qt.entryFunction is required, expected a function');

    config.qt.qtdir ??= 'qt';
    config.qt.preload ??= [];

    config.qtContainerElements = config.qt.containerElements;
    delete config.qt.containerElements;
    config.qtFontDpi = config.qt.fontDpi;
    delete config.qt.fontDpi;

    const originalNoInitialRun = config.noInitialRun;
    const originalArguments = config.arguments;
    config.noInitialRun = true;

    let circuitBreakerReject;
    const circuitBreaker = new Promise((_, reject) => { circuitBreakerReject = reject; });

    if (config.qt.module) {
        config.instantiateWasm = async (imports, successCallback) =>
        {
            try {
                const module = await config.qt.module;
                successCallback(
                    await WebAssembly.instantiate(module, imports), module);
            } catch (e) {
                circuitBreakerReject(e);
            }
        }
    }
    const preloadFetchHelper = async (path) => {
        const response = await fetch(path);
        if (!response.ok)
            throw new Error("Could not fetch preload file: " + path);
        return response.json();
    }
    const filesToPreload = (await Promise.all(config.qt.preload.map(preloadFetchHelper))).flat();
    const qtPreRun = (instance) => {
        throwIfEnvUsedButNotExported(instance, config);
        for (const [name, value] of Object.entries(config.qt.environment ?? {}))
            instance.ENV[name] = value;

        const makeDirs = (FS, filePath) => {
            const parts = filePath.split("/");
            let path = "/";
            for (let i = 0; i < parts.length - 1; ++i) {
                const part = parts[i];
                if (part == "")
                    continue;
                path += part + "/";
                try {
                    FS.mkdir(path);
                } catch (error) {
                    const EEXIST = 20;
                    if (error.errno != EEXIST)
                        throw error;
                }
            }
        }

        const extractFilenameAndDir = (path) => {
            const parts = path.split('/');
            const filename = parts.pop();
            const dir = parts.join('/');
            return {
                filename: filename,
                dir: dir
            };
        }
        const preloadFile = (file) => {
            makeDirs(instance.FS, file.destination);
            const source = file.source.replace('$QTDIR', config.qt.qtdir);
            const filenameAndDir = extractFilenameAndDir(file.destination);
            instance.FS.createPreloadedFile(filenameAndDir.dir, filenameAndDir.filename, source, true, true);
        }
        const isFsExported = typeof instance.FS === 'object';
        if (!isFsExported)
            throw new Error('FS must be exported if preload is used');
        filesToPreload.forEach(preloadFile);
    }

    if (!config.preRun)
        config.preRun = [];
    config.preRun.push(qtPreRun);

    const originalOnRuntimeInitialized = config.onRuntimeInitialized;
    config.onRuntimeInitialized = () => {
        originalOnRuntimeInitialized?.();
        config.qt.onLoaded?.();
    }

    const originalLocateFile = config.locateFile;
    config.locateFile = filename => {
        const originalLocatedFilename = originalLocateFile ? originalLocateFile(filename) : filename;
        if (originalLocatedFilename.startsWith(
                    'libQt6'))
            return `${config.qt.qtdir}/lib/${originalLocatedFilename}`;
        return originalLocatedFilename;
    }

    let onExitCalled = false;
    const originalOnExit = config.onExit;
    config.onExit = code => {
        originalOnExit?.();

        if (!onExitCalled) {
            onExitCalled = true;
            config.qt.onExit?.({
                code,
                crashed: false
            });
        }
    }

    const originalOnAbort = config.onAbort;
    config.onAbort = text =>
    {
        originalOnAbort?.();
        
        if (!onExitCalled) {
            onExitCalled = true;
            config.qt.onExit?.({
                text,
                crashed: true
            });
        }
    };

    let instance;
    try {
        instance = await Promise.race(
            [circuitBreaker, config.qt.entryFunction(config)]);

        if (!originalNoInitialRun)
            instance.callMain(originalArguments);
    } catch (e) {
        if (e == "unwind")
            return;

        if (!onExitCalled) {
            onExitCalled = true;
            config.qt.onExit?.({
                text: e.message,
                crashed: true
            });
        }
        throw e;
    }

    return instance;
}

function QtLoader(qtConfig) {

    const warning = 'Warning: The QtLoader API is deprecated and will be removed in ' +
                    'a future version of Qt. Please port to the new qtLoad() API.';
    console.warn(warning);

    let emscriptenConfig = qtConfig.moduleConfig || {}
    qtConfig.moduleConfig = undefined;
    const showLoader = qtConfig.showLoader;
    qtConfig.showLoader = undefined;
    const showError = qtConfig.showError;
    qtConfig.showError = undefined;
    const showExit = qtConfig.showExit;
    qtConfig.showExit = undefined;
    const showCanvas = qtConfig.showCanvas;
    qtConfig.showCanvas = undefined;
    if (qtConfig.canvasElements) {
        qtConfig.containerElements = qtConfig.canvasElements
        qtConfig.canvasElements = undefined;
    } else {
        qtConfig.containerElements = qtConfig.containerElements;
        qtConfig.containerElements = undefined;
    }
    emscriptenConfig.qt = qtConfig;

    let qtloader = {
        exitCode: undefined,
        exitText: "",
        loadEmscriptenModule: _name => {
            try {
                qtLoad(emscriptenConfig);
            } catch (e) {
                showError?.(e.message);
            }
        }
    }

    qtConfig.onLoaded = () => {
        showCanvas?.();
    }

    qtConfig.onExit = exit => {
        qtloader.exitCode = exit.code
        qtloader.exitText = exit.text;
        showExit?.();
    }

    showLoader?.("Loading");

    return qtloader;
};
