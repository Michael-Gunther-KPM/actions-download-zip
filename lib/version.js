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
exports.getLatestMatching = exports.getAllVersionInfo = void 0;
var rest = __importStar(require("typed-rest-client/RestClient"));
var core = __importStar(require("@actions/core"));
var semver = __importStar(require("semver"));
var USER_AGENT = 'jwlawson-actions-setup-cmake';
function extractPlatformFrom(filename) {
    if (filename.match(/Linux/) || filename.match(/linux/)) {
        return 'linux';
    }
    else if (filename.match(/Darwin/) || filename.match(/macos/)) {
        return 'darwin';
    }
    else if (filename.match(/win32/) ||
        filename.match(/windows/) ||
        filename.match(/win64/)) {
        return 'win32';
    }
    else {
        return '';
    }
}
var KNOWN_EXTENSIONS = {
    dmg: 'package',
    gz: 'archive',
    sh: 'script',
    txt: 'text',
    asc: 'text',
    msi: 'package',
    zip: 'archive',
};
function extractFileTypeFrom(filename) {
    var ext = filename.split('.').pop() || '';
    if (KNOWN_EXTENSIONS.hasOwnProperty(ext)) {
        return KNOWN_EXTENSIONS[ext];
    }
    else {
        return '';
    }
}
function extractArchFrom(filename) {
    if (filename.match(/x86_64/)) {
        return 'x86_64';
    }
    else if (filename.match(/x64/)) {
        return 'x86_64';
    }
    else if (filename.match(/universal/)) {
        return 'x86_64';
    }
    else if (filename.match(/x86/)) {
        return 'x86';
    }
    else if (filename.match(/i386/)) {
        return 'x86';
    }
    else {
        return '';
    }
}
function convertToVersionInfo(versions) {
    var result = new Array();
    versions.map(function (v) {
        var sv_version = semver.coerce(v.tag_name);
        if (sv_version) {
            var assets = v.assets.map(function (a) { return ({
                name: a.name,
                platform: extractPlatformFrom(a.name),
                arch: extractArchFrom(a.name),
                filetype: extractFileTypeFrom(a.name),
                url: a.browser_download_url,
            }); });
            result.push({
                assets: assets,
                url: v.url,
                name: sv_version.toString(),
                draft: v.draft,
                prerelease: v.prerelease,
            });
        }
    });
    return result;
}
function getHttpOptions(api_token, page_number) {
    if (page_number === void 0) { page_number = 1; }
    var options = {};
    options.additionalHeaders = { Accept: 'application/vnd.github.v3+json' };
    if (page_number > 1) {
        options.queryParameters = { params: { page: page_number } };
    }
    if (api_token) {
        options.additionalHeaders.Authorization = 'token ' + api_token;
    }
    return options;
}
// Parse the pagination Link header to get the next url.
// The header has the form <...url...>; rel="...", <...>; rel="..."
function getNextFromLink(link) {
    var rLink = /<(?<url>[A-Za-z0-9_?=.\/:-]*?)>; rel="(?<rel>\w*?)"/g;
    var match;
    while ((match = rLink.exec(link)) != null) {
        if (match.groups && /next/.test(match.groups.rel)) {
            return match.groups.url;
        }
    }
    return;
}
function getAllVersionInfo(releases_url, api_token) {
    if (releases_url === void 0) { releases_url = ''; }
    if (api_token === void 0) { api_token = ''; }
    return __awaiter(this, void 0, void 0, function () {
        var client, options, version_response, raw_versions, headers, next, options_1, version_response_1, max_pages, cur_page, options_2, version_response_2, versions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    client = new rest.RestClient(USER_AGENT);
                    options = getHttpOptions(api_token);
                    return [4 /*yield*/, client.get(releases_url, options)];
                case 1:
                    version_response = _a.sent();
                    if (version_response.statusCode != 200 || !version_response.result) {
                        return [2 /*return*/, []];
                    }
                    raw_versions = version_response.result;
                    headers = version_response.headers;
                    if (!headers.link) return [3 /*break*/, 5];
                    core.debug("Using link headers for pagination");
                    next = getNextFromLink(headers.link);
                    _a.label = 2;
                case 2:
                    if (!next) return [3 /*break*/, 4];
                    options_1 = getHttpOptions(api_token);
                    return [4 /*yield*/, client.get(next, options_1)];
                case 3:
                    version_response_1 = _a.sent();
                    if (version_response_1.statusCode != 200 || !version_response_1.result) {
                        return [3 /*break*/, 4];
                    }
                    raw_versions = raw_versions.concat(version_response_1.result);
                    headers = version_response_1.headers;
                    if (!headers.link) {
                        return [3 /*break*/, 4];
                    }
                    next = getNextFromLink(headers.link);
                    return [3 /*break*/, 2];
                case 4: return [3 /*break*/, 8];
                case 5:
                    core.debug("Using page count for pagination");
                    max_pages = 20;
                    cur_page = 2;
                    _a.label = 6;
                case 6:
                    if (!(cur_page <= max_pages)) return [3 /*break*/, 8];
                    options_2 = getHttpOptions(api_token, cur_page);
                    return [4 /*yield*/, client.get(releases_url, options_2)];
                case 7:
                    version_response_2 = _a.sent();
                    if (!version_response_2.result || version_response_2.result.length == 0) {
                        return [3 /*break*/, 8];
                    }
                    raw_versions = raw_versions.concat(version_response_2.result);
                    cur_page++;
                    return [3 /*break*/, 6];
                case 8:
                    core.debug("overall got " + raw_versions.length + " versions");
                    versions = convertToVersionInfo(raw_versions);
                    return [2 /*return*/, versions];
            }
        });
    });
}
exports.getAllVersionInfo = getAllVersionInfo;
function getLatest(version_list) {
    var sorted_versions = version_list.sort(function (a, b) {
        return semver.rcompare(a.name, b.name);
    });
    return sorted_versions[0];
}
function getLatestMatching(version, version_list) {
    var matching_versions = version_list
        .filter(function (v) { return !v.draft && !v.prerelease; })
        .filter(function (v) { return semver.satisfies(v.name, version); });
    if (matching_versions.length == 0) {
        throw new Error('Unable to find version matching ' + version);
    }
    return getLatest(matching_versions);
}
exports.getLatestMatching = getLatestMatching;
