"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
var axios_1 = require("axios");
var cheerio = require("cheerio");
var dotenv = require("dotenv");
dotenv.config();
var serviceUrl = process.env.MY_SERVICE_URL || '';
var locationId = process.env.MY_LOCATION_ID || '';
var expectedStreet = process.env.MY_EXPECTED_STREET || '';
function parseGermanDate(dateStr) {
    // Example: "Do 09.01.25 *"
    // Strip any trailing asterisk:
    var cleanString = dateStr.replace('*', '').trim(); // => "Do 09.01.25"
    // Split by spaces => ["Do", "09.01.25"]
    var parts = cleanString.split(/\s+/);
    if (parts.length < 2) {
        return null;
    }
    // "09.01.25"
    var datePart = parts[1];
    var _a = datePart.split('.'), day = _a[0], month = _a[1], yearShort = _a[2];
    if (!day || !month || !yearShort) {
        return null;
    }
    var dayNum = parseInt(day, 10);
    // Months are zero-based in JS
    var monthNum = parseInt(month, 10) - 1;
    // We assume "25" => 2025
    var yearFull = 2000 + parseInt(yearShort, 10);
    return new Date(yearFull, monthNum, dayNum);
}
function checkTrashCollection() {
    return __awaiter(this, void 0, void 0, function () {
        var url, response, html, $_1, actualStreet, upcoming_1, today, startOfToday_1, limitDate_1, nextEightDays, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = "".concat(serviceUrl).concat(locationId);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.get(url)];
                case 2:
                    response = _a.sent();
                    html = response.data;
                    $_1 = cheerio.load(html);
                    actualStreet = $_1('#strasse').text().trim();
                    if (actualStreet !== expectedStreet) {
                        console.warn("WARNING: Street name mismatch. Expected \"".concat(expectedStreet, "\" but got \"").concat(actualStreet, "\". The website structure may have changed."));
                        return [2 /*return*/];
                    }
                    else {
                        console.log("Street name is correct: \"".concat(actualStreet, "\""));
                    }
                    upcoming_1 = [];
                    // Each table: .rest, .bio, .papier, .gs
                    $_1('#termine .row .col-6 table').each(function (_, table) {
                        // The category name is in thead > tr > th
                        var categoryName = $_1(table).find('thead tr th').text().trim();
                        // Each row in tbody
                        $_1(table)
                            .find('tbody tr')
                            .each(function (__, row) {
                            var cellText = $_1(row).find('td').text().trim();
                            // e.g., "Do 09.01.25 *" or "&nbsp;"
                            if (!cellText || cellText === '\u00a0') {
                                return; // skip empty or whitespace rows
                            }
                            var parsedDate = parseGermanDate(cellText);
                            if (parsedDate) {
                                upcoming_1.push({ date: parsedDate, type: categoryName });
                            }
                        });
                    });
                    if (upcoming_1.length === 0) {
                        console.log('No dates found, or structure might have changed.');
                        return [2 /*return*/];
                    }
                    today = new Date();
                    startOfToday_1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    limitDate_1 = new Date(startOfToday_1.getTime());
                    limitDate_1.setDate(limitDate_1.getDate() + 7);
                    nextEightDays = upcoming_1.filter(function (item) { return item.date >= startOfToday_1 && item.date <= limitDate_1; });
                    if (nextEightDays.length === 0) {
                        console.log('No pickups in the next 8 days (including today).');
                        return [2 /*return*/];
                    }
                    // 6) Sort the filtered list ascending by date
                    nextEightDays.sort(function (a, b) { return a.date.getTime() - b.date.getTime(); });
                    // 7) Output them
                    console.log('\nPickup(s) in the next 8 days (including today):');
                    nextEightDays.forEach(function (pickup) {
                        // "de-DE" for German format, adapt as needed
                        var dateStr = pickup.date.toLocaleDateString('de-DE', {
                            weekday: 'short', // e.g. "Mi" or "Do"
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                        });
                        console.log("  - ".concat(pickup.type, ": ").concat(dateStr));
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error fetching or parsing data:', error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Run it
checkTrashCollection();
