"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Function chính - được gọi khi extension active
// Function chính - được gọi khi extension active
function activate(context) {
    console.log('🔥🔥🔥 GOLANG ERROR NAVIGATOR STARTING! 🔥🔥🔥');
    console.log('📅 Activation time:', new Date().toISOString());
    // === ĐĂNG KÝ CÁC PROVIDERS CŨ ===
    console.log('📋 Registering providers...');
    // 1. Hover Provider - Phát hiện khi user hover vào error text
    console.log('🎯 Registering hover provider...');
    const hoverProvider = vscode.languages.registerHoverProvider('*', {
        provideHover(document, position, token) {
            console.log('🔍 HOVER TRIGGERED!');
            console.log('📄 Document:', document.fileName);
            console.log('📍 Position:', position.line, position.character);
            return provideErrorHover(document, position);
        }
    });
    // 2. Command để navigate - Được gọi khi user click vào link
    console.log('⚡ Registering navigation command...');
    const navigateCommand = vscode.commands.registerCommand('golang-error-navigator.navigateToError', (location) => {
        console.log('🚀 NAVIGATION COMMAND TRIGGERED!');
        console.log('📂 Target location:', location);
        navigateToErrorLocation(location);
    });
    // 3. Setup decorations cho text (underline, pointer cursor)
    console.log('🎨 Setting up decorations...');
    setupErrorDecorations();
    // === 🔥 THÊM TERMINAL SUPPORT ===
    console.log('📺 Setting up TERMINAL support...');
    // 4. Terminal text selection command
    const parseTerminalCommand = vscode.commands.registerCommand('golang-error-navigator.parseTerminalError', () => {
        console.log('📺 Parse terminal command triggered!');
        parseSelectedTerminalText();
    });
    // 5. Terminal link provider - auto-detect error patterns
    const terminalLinkProvider = vscode.window.registerTerminalLinkProvider({
        provideTerminalLinks: (context, token) => {
            return provideTerminalErrorLinks(context);
        },
        handleTerminalLink: (link) => {
            handleTerminalErrorLink(link);
        }
    });
    // 6. Listen to terminal events
    vscode.window.onDidChangeActiveTerminal(terminal => {
        if (terminal) {
            console.log('📺 Active terminal changed:', terminal.name);
        }
    });
    // Đăng ký tất cả với context để VSCode manage lifecycle
    context.subscriptions.push(hoverProvider, navigateCommand, parseTerminalCommand, terminalLinkProvider);
    console.log('✅ Extension fully activated with TERMINAL SUPPORT! 🎉');
    console.log('🎉 Ready to rock! Hover over error messages OR use terminal features!');
}
// ============= CORE FUNCTIONS =============
async function parseSelectedTerminalText() {
    console.log('📺 === PARSING TERMINAL SELECTION ===');
    const activeTerminal = vscode.window.activeTerminal;
    if (!activeTerminal) {
        vscode.window.showErrorMessage('❌ No active terminal found');
        return;
    }
    // Get selected text (if any)
    const selectedText = await getTerminalSelection();
    if (!selectedText) {
        vscode.window.showInformationMessage('💡 Please select error text in terminal first');
        return;
    }
    console.log('📝 Selected terminal text:', selectedText);
    // Parse error from terminal text
    const errorParts = extractErrorsFromTerminalText(selectedText);
    if (errorParts.length === 0) {
        vscode.window.showInformationMessage('🤷 No error patterns found in selected text');
        return;
    }
    console.log('🔍 Found error parts:', errorParts);
    // Find matches for each error part
    const allMatches = [];
    for (const errorPart of errorParts) {
        const matches = await findAllErrorLocations(errorPart);
        allMatches.push(...matches);
    }
    if (allMatches.length === 0) {
        vscode.window.showInformationMessage('💔 No source locations found for the errors');
        return;
    }
    // Show results in quick pick
    showTerminalErrorResults(errorParts, allMatches);
}
/**
 * Get selected text from terminal (workaround)
 */
async function getTerminalSelection() {
    console.log('📋 Getting terminal selection...');
    try {
        // Save current clipboard content
        const originalClipboard = await vscode.env.clipboard.readText();
        // Copy terminal selection to clipboard
        await vscode.commands.executeCommand('workbench.action.terminal.copySelection');
        // Read the copied text
        const clipboardText = await vscode.env.clipboard.readText();
        // Restore original clipboard (be nice!)
        if (originalClipboard !== clipboardText) {
            await vscode.env.clipboard.writeText(originalClipboard);
        }
        const selectedText = clipboardText.trim();
        console.log('📋 Got terminal selection:', selectedText.substring(0, 100) + '...');
        return selectedText.length > 0 ? selectedText : null;
    }
    catch (error) {
        console.log('⚠️  Could not get terminal selection:', error);
        return null;
    }
}
/**
 * Extract error patterns from terminal text
 */
function extractErrorsFromTerminalText(text) {
    console.log('🔍 Extracting errors from terminal text...');
    const errorPatterns = [
        // Go error chain patterns (chính xác như trong hover)
        /(\w+(?:\s+\w+)*?):\s*(.+)/gi,
        // Error keywords
        /error[:\s]+(.+?)$/gmi,
        /failed[:\s]+(.+?)$/gmi,
        /panic[:\s]+(.+?)$/gmi,
        // File:line patterns
        /([\w\/\\.-]+\.go):\d+/gi,
        // Function patterns 
        /(\w+)\s*\(/gi,
        // Specific Go error patterns
        /cannot\s+(.+)/gi,
        /undefined[:\s]+(.+)/gi,
        /not\s+found[:\s]*(.+)?/gi
    ];
    const extractedErrors = new Set();
    // Split text into lines for better parsing
    const lines = text.split('\n');
    for (const line of lines) {
        console.log('🔍 Processing line:', line.trim());
        for (let patternIndex = 0; patternIndex < errorPatterns.length; patternIndex++) {
            const pattern = errorPatterns[patternIndex];
            pattern.lastIndex = 0; // Reset regex
            let match;
            while ((match = pattern.exec(line)) !== null) {
                // Get the most relevant part of the match
                const errorText = (match[1] || match[0]).trim();
                // Filter out noise
                if (errorText.length > 3 &&
                    !errorText.match(/^\d+$/) && // Not just numbers
                    !errorText.match(/^[^\w]*$/) && // Not just symbols
                    errorText.length < 100) { // Not too long
                    console.log(`✅ Extracted: "${errorText}" from pattern ${patternIndex + 1}`);
                    extractedErrors.add(errorText);
                }
            }
        }
    }
    const results = Array.from(extractedErrors);
    console.log('📋 Final extracted error parts:', results);
    return results;
}
/**
 * Enhanced findAllErrorLocations cho terminal (reuse existing logic)
 */
async function findAllErrorLocations(errorText) {
    console.log(`🔍 === FIND ALL ERROR LOCATIONS FOR: "${errorText}" ===`);
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        console.log('❌ No workspace folders found');
        return [];
    }
    const allMatches = [];
    for (const folder of workspaceFolders) {
        const goFiles = await findGoFiles(folder.uri.fsPath);
        for (const filePath of goFiles) {
            // Use existing searchInFile logic but collect ALL matches
            const matches = await searchInFileForAllMatches(filePath, errorText);
            allMatches.push(...matches);
        }
    }
    // Remove duplicates và sort by similarity
    const uniqueMatches = removeDuplicateMatches(allMatches);
    uniqueMatches.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    console.log(`📊 Found ${uniqueMatches.length} total matches`);
    return uniqueMatches.slice(0, 8); // Top 8 matches
}
/**
 * Search for ALL matches in a file (not just first one)
 */
async function searchInFileForAllMatches(filePath, errorText) {
    console.log(`🔍 Searching ALL matches for "${errorText}" in ${path.basename(filePath)}`);
    const matches = [];
    const searchTerms = generateSearchTerms(errorText);
    try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // === EXACT TEXT MATCH (highest priority) ===
            if (line.toLowerCase().includes(errorText.toLowerCase())) {
                matches.push({
                    file: filePath,
                    line: i + 1,
                    similarity: 1.0,
                    description: `Exact match: "${errorText}"`
                });
                continue;
            }
            // === FUNCTION DEFINITIONS ===
            for (const term of searchTerms) {
                if (line.includes(`func ${term}`) ||
                    (line.includes(`func (`) && line.includes(`${term}(`))) {
                    matches.push({
                        file: filePath,
                        line: i + 1,
                        functionName: term,
                        similarity: 0.9,
                        description: `Function: ${term}()`
                    });
                    break; // One function per line
                }
            }
            // === ERROR MESSAGES ===
            if (line.includes('fmt.Errorf') ||
                line.includes('errors.New') ||
                line.includes('log.') ||
                line.includes('panic(')) {
                const similarity = calculateSimilarity(line, errorText);
                if (similarity > 0.2) { // Lower threshold for terminal
                    matches.push({
                        file: filePath,
                        line: i + 1,
                        similarity: similarity,
                        description: `Error message (${(similarity * 100).toFixed(0)}% match)`
                    });
                }
            }
        }
    }
    catch (error) {
        console.log(`⚠️  Cannot read file: ${path.basename(filePath)}`);
    }
    return matches;
}
/**
 * Remove duplicate matches (same file + line)
 */
function removeDuplicateMatches(matches) {
    const seen = new Set();
    return matches.filter(match => {
        const key = `${match.file}:${match.line}`;
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
}
/**
 * Show terminal error results in quick pick menu
 */
async function showTerminalErrorResults(errorParts, matches) {
    console.log('📋 Showing terminal error results...');
    if (matches.length === 0) {
        vscode.window.showInformationMessage('💔 No matches found in source code');
        return;
    }
    const quickPickItems = matches.map((match, index) => {
        const relativePath = vscode.workspace.asRelativePath(match.file);
        const description = match.description || 'Match';
        const score = match.similarity ? `(${(match.similarity * 100).toFixed(0)}%)` : '';
        return {
            label: `${index + 1}. 📍 ${relativePath}:${match.line}`,
            description: `${description} ${score}`,
            detail: match.functionName ? `Function: ${match.functionName}` : undefined,
            location: match
        };
    });
    const selected = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: `🔍 Found ${matches.length} matches for terminal errors. Select one to navigate:`,
        matchOnDescription: true,
        matchOnDetail: true,
        ignoreFocusOut: true
    });
    if (selected) {
        console.log('🚀 User selected:', selected.label);
        await navigateToErrorLocation(selected.location);
    }
    else {
        console.log('❌ User cancelled selection');
    }
}
/**
 * Provide terminal links for error patterns (auto-clickable)
 */
function provideTerminalErrorLinks(context) {
    const text = context.line;
    console.log('🔗 Checking terminal line for auto-links:', text.substring(0, 50) + '...');
    const links = [];
    // Pattern for Go error chains
    const errorPatterns = [
        /(\w+(?:\s+\w+){1,3}):\s*(.+)/g,
        /error[:\s]+(.{10,})/gi,
        /failed[:\s]+(.{10,})/gi
    ];
    for (const pattern of errorPatterns) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const startIndex = match.index;
            const length = Math.min(match[0].length, 50); // Limit length
            links.push({
                startIndex,
                length,
                tooltip: '🔍 Click to find source location',
                data: match[1] || match[0] // Store the matched text
            });
        }
    }
    console.log(`🔗 Generated ${links.length} auto-links for terminal`);
    return links.length > 0 ? links : undefined;
}
/**
 * Handle terminal link clicks (auto-links)
 */
async function handleTerminalErrorLink(link) {
    console.log('🔗 Terminal auto-link clicked:', link.data);
    const errorText = link.data.trim();
    if (errorText.length < 3) {
        console.log('❌ Error text too short, ignoring');
        return;
    }
    vscode.window.showInformationMessage(`🔍 Searching for: "${errorText}"`);
    const matches = await findAllErrorLocations(errorText);
    if (matches.length === 0) {
        vscode.window.showInformationMessage(`💔 No source location found for: "${errorText}"`);
        return;
    }
    if (matches.length === 1) {
        // Direct navigation for single match
        console.log('🚀 Single match found, navigating directly');
        await navigateToErrorLocation(matches[0]);
    }
    else {
        // Show picker for multiple matches
        console.log(`🎯 Multiple matches found (${matches.length}), showing picker`);
        showTerminalErrorResults([errorText], matches);
    }
}
/**
 * Provider cho hover - Được gọi khi user hover vào text
 */
async function provideErrorHover(document, position) {
    console.log('🔥 === HOVER FUNCTION STARTED ===');
    const line = document.lineAt(position);
    const lineText = line.text;
    console.log('📝 Line text:', JSON.stringify(lineText));
    console.log('📍 Cursor position:', position.character);
    // === PATTERN MATCHING - Tìm các error patterns trong Go ===
    console.log('🔍 Starting pattern matching...');
    const errorPatterns = [
        // Pattern 1: "handling user creation: error message"
        /(\w+(?:\s+\w+)*?):\s*(.+)/g,
        // Pattern 2: "request failed: handling something"
        /failed.*?(\w+(?:\s+\w+)*)/g,
        // Pattern 3: "error in something"
        /error.*?(\w+(?:\s+\w+)*)/g,
        // Pattern 4: Simple word matching
        /(\w+(?:\s+\w+){0,3})/g
    ];
    console.log('🎯 Testing', errorPatterns.length, 'patterns...');
    // Kiểm tra từng pattern
    for (let patternIndex = 0; patternIndex < errorPatterns.length; patternIndex++) {
        const pattern = errorPatterns[patternIndex];
        console.log(`🔍 Testing pattern ${patternIndex + 1}:`, pattern.source);
        // Reset regex
        pattern.lastIndex = 0;
        const matches = [...lineText.matchAll(pattern)];
        console.log(`📊 Pattern ${patternIndex + 1} found ${matches.length} matches`);
        for (let matchIndex = 0; matchIndex < matches.length; matchIndex++) {
            const match = matches[matchIndex];
            console.log(`🎯 Match ${matchIndex + 1}:`, {
                fullMatch: match[0],
                groups: match.slice(1),
                index: match.index
            });
            if (!match.index && match.index !== 0)
                continue;
            const startIndex = match.index;
            const endIndex = startIndex + match[0].length;
            console.log(`📏 Range: ${startIndex}-${endIndex}, cursor at: ${position.character}`);
            // Tạo range cho text match
            const range = new vscode.Range(position.line, startIndex, position.line, endIndex);
            console.log('📐 Created range:', {
                start: { line: range.start.line, char: range.start.character },
                end: { line: range.end.line, char: range.end.character }
            });
            // Check nếu cursor đang ở trong range này
            const isInRange = range.contains(position);
            console.log('❓ Cursor in range?', isInRange);
            if (isInRange) {
                const errorPart = match[1] || match[0];
                console.log(`🎉 MATCH FOUND! Error part: "${errorPart}"`);
                // Tìm location trong codebase
                console.log('🔍 Starting location search...');
                const location = await findErrorLocation(errorPart);
                if (location) {
                    console.log(`✅ Location found!`, location);
                    const hover = createHoverWithLink(errorPart, location);
                    console.log('🎈 Hover created successfully!');
                    return hover;
                }
                else {
                    console.log(`❌ No location found for: "${errorPart}"`);
                }
            }
        }
    }
    console.log('💔 No matches found - returning null');
    return null;
}
/**
 * Tìm location của error trong codebase
 */
async function findErrorLocation(errorText) {
    console.log('🔍 === FIND ERROR LOCATION STARTED ===');
    console.log('🎯 Searching for:', JSON.stringify(errorText));
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        console.log('❌ No workspace folders found');
        return null;
    }
    console.log('📁 Workspace folders:', workspaceFolders.map(f => f.name));
    // Generate các search terms từ error text
    const searchTerms = generateSearchTerms(errorText);
    console.log(`🔍 Generated ${searchTerms.length} search terms:`, searchTerms);
    // Tìm trong tất cả workspace folders
    for (let folderIndex = 0; folderIndex < workspaceFolders.length; folderIndex++) {
        const folder = workspaceFolders[folderIndex];
        console.log(`📂 Searching in folder ${folderIndex + 1}: ${folder.name} (${folder.uri.fsPath})`);
        const goFiles = await findGoFiles(folder.uri.fsPath);
        console.log(`📄 Found ${goFiles.length} Go files in ${folder.name}`);
        // Log first few files
        goFiles.slice(0, 3).forEach((file, i) => {
            console.log(`📄 File ${i + 1}: ${path.basename(file)}`);
        });
        // Search trong từng Go file
        for (let fileIndex = 0; fileIndex < goFiles.length; fileIndex++) {
            const filePath = goFiles[fileIndex];
            console.log(`🔍 Searching in file ${fileIndex + 1}/${goFiles.length}: ${path.basename(filePath)}`);
            const location = await searchInFile(filePath, searchTerms, errorText);
            if (location) {
                console.log(`🎉 LOCATION FOUND in ${path.basename(filePath)}!`, location);
                return location;
            }
        }
    }
    console.log('💔 No location found anywhere');
    return null;
}
/**
 * Generate search terms từ error text
 */
function generateSearchTerms(errorText) {
    console.log('🏭 Generating search terms for:', JSON.stringify(errorText));
    const terms = [];
    // Split text thành words
    const words = errorText.toLowerCase().split(/[\s_-]+/).filter(w => w.length > 0);
    console.log('📝 Words extracted:', words);
    if (words.length === 0) {
        console.log('⚠️ No words found, using original text');
        return [errorText];
    }
    // camelCase: handleUserCreation
    const camelCase = words.map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('');
    // PascalCase: HandleUserCreation  
    const pascalCase = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    // snake_case: handle_user_creation
    const snakeCase = words.join('_');
    // kebab-case: handle-user-creation
    const kebabCase = words.join('-');
    terms.push(camelCase, pascalCase, snakeCase, kebabCase);
    terms.push(...words); // Thêm individual words
    terms.push(errorText); // Original text
    // Remove duplicates và empty strings
    const uniqueTerms = [...new Set(terms)].filter(t => t.length > 1);
    console.log('✨ Final search terms:', uniqueTerms);
    return uniqueTerms;
}
/**
 * Tìm tất cả Go files trong directory (recursive)
 */
async function findGoFiles(dirPath) {
    console.log('📁 Scanning directory:', dirPath);
    const files = [];
    async function scanDir(dir, depth = 0) {
        const indent = '  '.repeat(depth);
        console.log(`${indent}📂 Scanning: ${path.basename(dir)}`);
        try {
            const entries = await fs.promises.readdir(dir, { withFileTypes: true });
            console.log(`${indent}📋 Found ${entries.length} entries`);
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                // Skip hidden folders và vendor, node_modules
                if (entry.isDirectory() &&
                    !entry.name.startsWith('.') &&
                    !['vendor', 'node_modules', 'dist', 'build'].includes(entry.name)) {
                    await scanDir(fullPath, depth + 1);
                }
                else if (entry.isFile() && entry.name.endsWith('.go')) {
                    console.log(`${indent}📄 Go file found: ${entry.name}`);
                    files.push(fullPath);
                }
            }
        }
        catch (error) {
            console.log(`${indent}⚠️  Cannot read directory: ${dir}`, error);
        }
    }
    await scanDir(dirPath);
    console.log(`📊 Total Go files found: ${files.length}`);
    return files;
}
/**
 * Search trong 1 file cụ thể
 */
async function searchInFile(filePath, searchTerms, originalError) {
    console.log(`🔍 === SEARCHING IN FILE: ${path.basename(filePath)} ===`);
    try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const lines = content.split('\n');
        console.log(`📄 File has ${lines.length} lines`);
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // === TÌM FUNCTION DEFINITIONS ===
            for (let termIndex = 0; termIndex < searchTerms.length; termIndex++) {
                const term = searchTerms[termIndex];
                // func FunctionName()
                if (line.includes(`func ${term}`) ||
                    // func (receiver) FunctionName()
                    (line.includes(`func (`) && line.includes(`${term}(`)) ||
                    // FunctionName() call
                    line.includes(`${term}(`)) {
                    console.log(`🎉 FUNCTION MATCH FOUND!`);
                    console.log(`📍 File: ${path.basename(filePath)}, Line: ${i + 1}`);
                    console.log(`🔍 Term: "${term}"`);
                    console.log(`📝 Line content: "${line.trim()}"`);
                    return {
                        file: filePath,
                        line: i + 1,
                        functionName: term
                    };
                }
            }
            // === TÌM ERROR MESSAGES TƯƠNG TỰ ===
            if (line.includes('fmt.Errorf') ||
                line.includes('errors.New') ||
                line.includes('log.') ||
                line.includes('panic(')) {
                const similarity = calculateSimilarity(line, originalError);
                console.log(`🧮 Similarity check: ${similarity.toFixed(2)} for line ${i + 1}`);
                if (similarity > 0.4) { // 40% similarity threshold
                    console.log(`🎉 ERROR MESSAGE MATCH FOUND!`);
                    console.log(`📍 File: ${path.basename(filePath)}, Line: ${i + 1}`);
                    console.log(`🔍 Similarity: ${similarity.toFixed(2)}`);
                    console.log(`📝 Line content: "${line.trim()}"`);
                    return {
                        file: filePath,
                        line: i + 1
                    };
                }
            }
        }
        console.log(`💔 No matches found in ${path.basename(filePath)}`);
    }
    catch (error) {
        console.log(`⚠️  Cannot read file: ${path.basename(filePath)}`, error);
    }
    return null;
}
/**
 * Tính độ tương tự giữa 2 strings
 */
function calculateSimilarity(str1, str2) {
    // Extract words (length > 2 để bỏ qua các từ ngắn)
    const words1 = str1.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const words2 = str2.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    if (words1.length === 0 || words2.length === 0)
        return 0;
    let matches = 0;
    for (const word of words1) {
        if (words2.some(w2 => w2.includes(word) || word.includes(w2))) {
            matches++;
        }
    }
    const similarity = matches / Math.max(words1.length, words2.length);
    console.log(`🧮 Similarity calculation: ${matches}/${Math.max(words1.length, words2.length)} = ${similarity.toFixed(2)}`);
    return similarity;
}
/**
 * Tạo hover với clickable link
 */
function createHoverWithLink(errorText, location) {
    console.log('🎈 Creating hover with link...');
    const relativePath = vscode.workspace.asRelativePath(location.file);
    const linkText = `📍 **Found match**: ${relativePath}:${location.line}`;
    console.log('🔗 Link text:', linkText);
    // Tạo command URI để execute command khi click
    const commandUri = vscode.Uri.parse(`command:golang-error-navigator.navigateToError?${encodeURIComponent(JSON.stringify(location))}`);
    console.log('🔗 Command URI:', commandUri.toString());
    const markdown = new vscode.MarkdownString();
    markdown.appendMarkdown(linkText + '\n\n');
    markdown.appendMarkdown(`[🚀 **Click to navigate**](${commandUri})`);
    markdown.isTrusted = true; // Cho phép execute commands
    console.log('✅ Hover created successfully!');
    return new vscode.Hover(markdown);
}
/**
 * Navigate đến error location
 */
async function navigateToErrorLocation(location) {
    console.log('🚀 === NAVIGATION STARTED ===');
    console.log('📂 Target location:', location);
    try {
        const uri = vscode.Uri.file(location.file);
        console.log('📁 Opening file:', uri.toString());
        const document = await vscode.workspace.openTextDocument(uri);
        console.log('📄 Document opened successfully');
        const editor = await vscode.window.showTextDocument(document);
        console.log('✏️  Editor opened successfully');
        // Jump to specific line và center trong editor
        const position = new vscode.Position(location.line - 1, 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
        console.log(`📍 Jumped to line ${location.line}`);
        // Show success message
        vscode.window.showInformationMessage(`🎯 Navigated to: ${path.basename(location.file)}:${location.line}`);
        console.log('✅ Navigation completed successfully!');
    }
    catch (error) {
        console.error('💥 Navigation error:', error);
        vscode.window.showErrorMessage(`❌ Could not navigate to: ${location.file}`);
    }
}
/**
 * Setup decorations cho clickable text
 */
function setupErrorDecorations() {
    console.log('🎨 Setting up error decorations...');
    const decorationType = vscode.window.createTextEditorDecorationType({
        cursor: 'pointer',
        textDecoration: 'underline',
        color: new vscode.ThemeColor('textLink.foreground')
    });
    console.log('✨ Decoration type created');
    // Apply decorations khi active editor thay đổi
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            console.log('👁️  Active editor changed:', editor.document.fileName);
            updateDecorations(editor, decorationType);
        }
    });
    // Apply cho editor hiện tại (nếu có)
    if (vscode.window.activeTextEditor) {
        console.log('👁️  Applying to current active editor');
        updateDecorations(vscode.window.activeTextEditor, decorationType);
    }
    console.log('🎨 Decorations setup completed');
}
/**
 * Update decorations cho editor
 */
async function updateDecorations(editor, decorationType) {
    console.log('🎨 Updating decorations for:', path.basename(editor.document.fileName));
    const document = editor.document;
    const decorations = [];
    // Scan document để tìm error patterns
    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const errorPattern = /(\w+(?:\s+\w+)*?):\s*(.+)/g;
        let match;
        while ((match = errorPattern.exec(line.text)) !== null) {
            const startPos = new vscode.Position(i, match.index);
            const endPos = new vscode.Position(i, match.index + match[0].length);
            decorations.push({
                range: new vscode.Range(startPos, endPos),
                hoverMessage: '🔍 Hover to find source location'
            });
            console.log(`🎨 Added decoration for: "${match[0]}" at line ${i + 1}`);
        }
    }
    editor.setDecorations(decorationType, decorations);
    console.log(`🎨 Applied ${decorations.length} decorations`);
}
// Function được gọi khi extension deactivate
function deactivate() {
    console.log('👋 Golang Error Navigator deactivated!');
}
//# sourceMappingURL=extension.test.js.map