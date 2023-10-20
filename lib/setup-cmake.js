"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCMakeToPath = exports.addCMakeToToolCache = void 0;
var tc = __importStar(require("@actions/tool-cache"));
var core = __importStar(require("@actions/core"));
var io = __importStar(require("@actions/io"));
var fs_1 = require("fs");
var path = __importStar(require("path"));
function getURL(version, arch_candidates) {
    var assets_for_platform = version.assets
        .filter(function (a) { return a.platform === process.platform && a.filetype === 'archive'; })
        .sort();
    // The arch_candidates provides an ordered set of architectures to try, and
    // the first matching asset is used. This will typically be 'x86_64' first,
    // with 'x86' checked if nothing was found.
    var matching_assets = undefined;
    var _loop_1 = function (arch) {
        var arch_assets = assets_for_platform.filter(function (a) { return a.arch === arch; });
        if (arch_assets.length != 0) {
            matching_assets = arch_assets;
            return "break";
        }
    };
    for (var _i = 0, arch_candidates_1 = arch_candidates; _i < arch_candidates_1.length; _i++) {
        var arch = arch_candidates_1[_i];
        var state_1 = _loop_1(arch);
        if (state_1 === "break")
            break;
    }
    if (matching_assets == undefined) {
        // If there are no x86_64 or x86 packages then give up.
        throw new Error("Could not find " + process.platform + " asset for cmake version " + version.name);
    }
    core.debug("Assets matching platform and arch: " + matching_assets.map(function (a) { return a.name; }));
    if (matching_assets.length > 1) {
        // If there are multiple assets it is likely to be because there are MacOS
        // builds for PPC, x86 and x86_64. Universal packages prevent parsing the
        // architecture completely, so we need to match against the full name to
        // differentiate between e.g. cmake-2.8.10.2-Darwin-universal.tar.gz and
        // cmake-2.8.10.2-Darwin64-universal.tar.gz.
        // Check to see if this narrows down the options or just removes all options.
        // Prefer to use all previous matches when none of them include '64'.
        //
        // CMake 3.19 and above provide two Mac packages:
        // * cmake-3.19.4-macos-universal.dmg
        // * cmake-3.19.4-macos10.10-universal.dmg
        // The 10.10 package uses OSX deployment target 10.10, while the standard
        // package uses 10.13. As the oldest (and now deprecated) github runner is
        // on 10.15 we can safely choose to use the standard package.
        // https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners
        var possible_assets = matching_assets.filter(function (a) { return a.url.match('64') || a.name.match(/macos-universal/); });
        if (possible_assets.length > 0) {
            matching_assets = possible_assets;
        }
        if (matching_assets.length > 1) {
            core.warning("Found " + matching_assets.length + " matching packages: " + matching_assets.map(function (a) { return a.name; }));
        }
    }
    var asset_url = matching_assets[0].url;
    var num_found = matching_assets.length;
    core.debug("Found " + num_found + " assets for " + process.platform + " with version " + version.name);
    core.debug("Using asset url " + asset_url);
    return asset_url;
}
function getArchive(url) {
    return __awaiter(this, void 0, void 0, function () {
        var download;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, tc.downloadTool(url)];
                case 1:
                    download = _a.sent();
                    if (!url.endsWith('zip')) return [3 /*break*/, 3];
                    io.mv(download, download + '.zip');
                    return [4 /*yield*/, tc.extractZip(download + '.zip')];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    if (!url.endsWith('tar.gz')) return [3 /*break*/, 5];
                    return [4 /*yield*/, tc.extractTar(download)];
                case 4: return [2 /*return*/, _a.sent()];
                case 5: throw new Error("Could not determine filetype of " + url);
            }
        });
    });
}
function addCMakeToToolCache(package_name, version, arch_candidates) {
    return __awaiter(this, void 0, void 0, function () {
        var extracted_archive;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getArchive(getURL(version, arch_candidates))];
                case 1:
                    extracted_archive = _a.sent();
                    return [4 /*yield*/, tc.cacheDir(extracted_archive, package_name, version.name)];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
exports.addCMakeToToolCache = addCMakeToToolCache;
function getBinDirectoryFrom(tool_path) {
    return __awaiter(this, void 0, void 0, function () {
        var root_dir_path;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs_1.promises.readdir(tool_path)];
                case 1:
                    root_dir_path = _a.sent();
                    if (root_dir_path.length != 1) {
                        throw new Error('Archive does not have expected layout.');
                    }
                    return [2 /*return*/, path.join(tool_path, root_dir_path[0])];
            }
        });
    });
}
function addCMakeToPath(package_name, version, arch_candidates) {
    return __awaiter(this, void 0, void 0, function () {
        var tool_path, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    tool_path = tc.find(package_name, version.name);
                    if (!!tool_path) return [3 /*break*/, 2];
                    return [4 /*yield*/, addCMakeToToolCache(package_name, version, arch_candidates)];
                case 1:
                    tool_path = _c.sent();
                    _c.label = 2;
                case 2:
                    _b = (_a = core).addPath;
                    return [4 /*yield*/, getBinDirectoryFrom(tool_path)];
                case 3: return [4 /*yield*/, _b.apply(_a, [_c.sent()])];
                case 4:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.addCMakeToPath = addCMakeToPath;
