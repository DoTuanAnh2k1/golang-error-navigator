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
// ============= 🚀 MAIN ACTIVATION FUNCTION =============
/**
 * 🎯 Function chính - được gọi khi extension khởi động
 * VSCode sẽ tự động call cái này
 */
function activate(context) {
    console.log('🔥🔥🔥 GOLANG ERROR NAVIGATOR STARTING! 🔥🔥🔥');
    console.log('📅 Activation time:', new Date().toISOString());
    // === 📋 ĐĂNG KÝ CÁC PROVIDERS ===
    console.log('📋 Registering providers...');
    // 1️⃣ Hover Provider - Khi user hover mouse vào text
    console.log('🎯 Registering hover provider...');
    const hoverProvider = vscode.languages.registerHoverProvider('*', {
        provideHover(document, position, token) {
            console.log('🔍 HOVER TRIGGERED!');
            console.log('📄 Document:', document.fileName);
            console.log('📍 Position:', position.line, position.character);
            // 🔥 GỌI FUNCTION MỚI SUPPORT ERROR CHAIN SPLIT
            return provideErrorHoverWithChainSplit(document, position);
        }
    });
    // 2️⃣ Command để navigate - Khi user click vào link trong hover
    console.log('⚡ Registering navigation command...');
    const navigateCommand = vscode.commands.registerCommand('golang-error-navigator.navigateToError', (location) => {
        console.log('🚀 NAVIGATION COMMAND TRIGGERED!');
        console.log('📂 Target location:', location);
        navigateToErrorLocation(location);
    });
    // 3️⃣ Command để parse text trong terminal
    const parseTerminalCommand = vscode.commands.registerCommand('golang-error-navigator.parseTerminalError', async () => {
        console.log('📺 PARSE TERMINAL COMMAND TRIGGERED!');
        await parseSelectedTerminalText();
    });
    // 4️⃣ Terminal Link Provider - Tạo auto-clickable links trong terminal
    const terminalLinkProvider = vscode.window.registerTerminalLinkProvider({
        provideTerminalLinks: (context, token) => {
            return provideTerminalErrorLinks(context);
        },
        handleTerminalLink: (link) => {
            handleTerminalErrorLink(link);
        }
    });
    // 5️⃣ Event listener khi terminal thay đổi
    vscode.window.onDidChangeActiveTerminal(terminal => {
        if (terminal) {
            console.log('📺 Active terminal changed:', terminal.name);
        }
    });
    // 📝 Đăng ký tất cả với VSCode để manage lifecycle
    context.subscriptions.push(hoverProvider, navigateCommand, parseTerminalCommand, terminalLinkProvider);
    console.log('✅ Extension fully activated and registered!');
    console.log('🎉 Ready to rock! Hover over error messages to test!');
}
// ============= ✂️ ERROR CHAIN SPLITTING FUNCTIONS =============
/**
 * 🔥 SPLIT ERROR CHAIN THEO DẤU ":"
 * Input: "request failed: handling user creation: creating user: db insert: duplicate key"
 * Output: ["request failed", "handling user creation", "creating user", "db insert", "duplicate key"]
 */
function splitErrorChain(errorMessage) {
    console.log('✂️ === SPLITTING ERROR CHAIN ===');
    console.log('📝 Input message:', errorMessage);
    // Chia theo dấu ":" và dọn dẹp
    const parts = errorMessage
        .split(':') // Split theo ":"
        .map(part => part.trim()) // Xóa space thừa
        .filter(part => part.length > 0 && part.length < 100); // Lọc bỏ rác
    console.log('✂️ Split results:', parts);
    // Tạo array chứa các error parts
    const chains = [];
    // Thêm từng part riêng lẻ (GIẢM THRESHOLD để bao gồm cả "error")
    parts.forEach(part => {
        if (part.length > 1) { // Chỉ bỏ qua part cực ngắn (1 ký tự)
            chains.push(part);
            console.log(`✅ Added part: "${part}"`);
        }
        else {
            console.log(`❌ Skipped part too short: "${part}"`);
        }
    });
    // Thêm cumulative chains (optional - để match tốt hơn) - BỎ QUA BƯỚC NÀY
    // VÌ NÓ TẠO RA QUาาԱ NHIỀU NOISE!
    console.log('🚫 Skipping cumulative chains to avoid noise');
    /*
    for (let i = 0; i < parts.length - 1; i++) {
        const cumulativeChain = parts.slice(0, i + 2).join(': ');
        if (cumulativeChain.length > 10 && cumulativeChain.length < 100) {
            chains.push(cumulativeChain);
        }
    }
    */
    // Xóa duplicate và sort theo độ dài (ngắn trước cho UX tốt hơn)
    const uniqueChains = [...new Set(chains)].sort((a, b) => a.length - b.length);
    console.log('🎯 Final chains:', uniqueChains);
    return uniqueChains;
}
// ============= 🔍 CORE HOVER FUNCTIONS =============
/**
 * 🔥 ENHANCED HOVER PROVIDER - SUPPORT ERROR CHAIN SPLITTING
 * Đây là function chính xử lý khi user hover mouse
 */
async function provideErrorHoverWithChainSplit(document, position) {
    console.log('🔥 === NEW HOVER SESSION WITH CHAIN SPLIT ===');
    const line = document.lineAt(position);
    // const lineText = line.text;
    // 🔥 ENHANCED: Lấy toàn bộ line thay vì chỉ word để detect error chains
    const lineRange = line.range;
    const lineText = line.text.trim();
    // Nếu line có dấu ":" thì lấy toàn bộ line, nếu không thì lấy word
    let wordRange;
    let exactText;
    if (lineText.includes(':') && lineText.split(':').length > 1) {
        // Đây có thể là error chain - lấy toàn bộ line
        console.log('🔗 Potential error chain detected, using full line');
        wordRange = lineRange;
        exactText = lineText;
    }
    else {
        // Fallback: lấy word range như cũ
        console.log('📝 Single word detection');
        wordRange = document.getWordRangeAtPosition(position) ||
            document.getWordRangeAtPosition(position, /[\w\s:]+/);
        if (!wordRange) {
            console.log('❌ No word range found at cursor position');
            return null;
        }
        exactText = document.getText(wordRange);
    }
    if (!wordRange) {
        console.log('❌ No word range found at cursor position');
        return null;
    }
    if (!wordRange) {
        console.log('❌ No word range found at cursor position');
        return null;
    }
    console.log('🎯 Text under cursor:', JSON.stringify(exactText));
    // 🔥 MỚI: Kiểm tra xem có phải error chain không (có dấu ":")
    const isErrorChain = exactText.includes(':') && exactText.split(':').length > 1;
    console.log('🔍 Is error chain?', isErrorChain);
    console.log('📏 Text length:', exactText.length);
    console.log('📊 Colon count:', (exactText.match(/:/g) || []).length);
    if (isErrorChain) {
        console.log('🔗 Detected error chain! Splitting...');
        // Split error chain thành các parts
        const errorParts = splitErrorChain(exactText);
        // Tìm matches cho từng part
        const allMatches = [];
        for (const part of errorParts) {
            console.log(`🔍 Searching for part: "${part}"`);
            const matches = await findAllErrorLocations(part);
            if (matches.length > 0) {
                allMatches.push({ part, matches });
            }
        }
        if (allMatches.length > 0) {
            console.log(`✅ Found matches for ${allMatches.length} error parts`);
            return createHoverWithErrorChain(exactText, allMatches);
        }
    }
    else {
        // Fallback: tìm kiếm text đơn giản (không phải error chain)
        console.log('📝 Single text search (not error chain)');
        const matches = await findAllErrorLocations(exactText);
        if (matches.length > 0) {
            console.log(`✅ Found ${matches.length} matches for single text`);
            return createHoverWithMultipleOptions(exactText, matches);
        }
    }
    console.log(`❌ No matches found`);
    return null;
}
/**
 * 🔍 TÌM TẤT CẢ ERROR LOCATIONS CHO 1 TEXT
 * Function này search trong toàn bộ workspace
 */
async function findAllErrorLocations(exactText) {
    console.log(`🔍 === SEARCHING FOR EXACT TEXT: "${exactText}" ===`);
    // Lấy workspace folders
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        console.log('❌ No workspace folders found');
        return [];
    }
    const allMatches = [];
    // Duyệt qua từng workspace folder
    for (const folder of workspaceFolders) {
        console.log(`📁 Searching in workspace: ${folder.name}`);
        const goFiles = await findGoFiles(folder.uri.fsPath);
        // Duyệt qua từng Go file
        for (const filePath of goFiles) {
            console.log(`📄 Searching in: ${path.basename(filePath)}`);
            // Tìm exact text trong file
            const matches = await findExactTextInFile(filePath, exactText);
            allMatches.push(...matches);
        }
    }
    // Sort theo relevance (similarity score cao nhất trước)
    allMatches.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    console.log(`📊 Found ${allMatches.length} total matches for "${exactText}"`);
    return allMatches.slice(0, 10); // Giới hạn 10 results thôi
}
/**
 * 🔍 TÌM EXACT TEXT TRONG 1 FILE CỤ THỂ
 */
async function findExactTextInFile(filePath, exactText) {
    console.log(`🔍 Searching for "${exactText}" in ${path.basename(filePath)}`);
    const matches = [];
    try {
        // Đọc file content
        const content = await fs.promises.readFile(filePath, 'utf8');
        const lines = content.split('\n');
        // Duyệt qua từng dòng
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Kiểm tra exact string match (case insensitive)
            if (line.toLowerCase().includes(exactText.toLowerCase())) {
                console.log(`✅ EXACT MATCH at line ${i + 1}: "${line.trim()}"`);
                // Tính similarity score dựa trên context
                let similarity = 0.7; // Base score
                // Bonus nếu có fmt.Errorf hoặc errors.New
                if (line.includes('fmt.Errorf') || line.includes('errors.New')) {
                    similarity += 0.2;
                }
                // Bonus nếu có return statement
                if (line.trim().startsWith('return')) {
                    similarity += 0.1;
                }
                matches.push({
                    file: filePath,
                    line: i + 1,
                    similarity: Math.min(similarity, 1.0),
                    description: `Contains: "${exactText}"`
                });
            }
        }
    }
    catch (error) {
        console.log(`⚠️ Error reading ${path.basename(filePath)}:`, error);
    }
    console.log(`📊 Found ${matches.length} matches in ${path.basename(filePath)}`);
    return matches;
}
// ============= 🎨 HOVER UI CREATION FUNCTIONS =============
/**
 * 🔥 TẠO HOVER VỚI ERROR CHAIN BREAKDOWN
 * Đây là function tạo UI cho error chain (có nhiều parts)
 */
function createHoverWithErrorChain(originalText, chainMatches) {
    console.log('🎈 Creating hover with error chain breakdown...');
    const markdown = new vscode.MarkdownString();
    // Header
    markdown.appendMarkdown(`🔗 **Error Chain Analysis:**\n\n`);
    markdown.appendMarkdown(`\`${originalText}\`\n\n`);
    markdown.appendMarkdown(`---\n\n`);
    // Từng error part
    chainMatches.forEach(({ part, matches }, chainIndex) => {
        markdown.appendMarkdown(`### 🎯 "${part}"\n\n`);
        // Hiển thị tối đa 3 matches per part
        matches.slice(0, 3).forEach((location, matchIndex) => {
            const relativePath = vscode.workspace.asRelativePath(location.file);
            const score = location.similarity ? `(${(location.similarity * 100).toFixed(0)}%)` : '';
            const description = location.description || 'Match';
            // Tạo command URI để navigate khi click
            const commandUri = vscode.Uri.parse(`command:golang-error-navigator.navigateToError?${encodeURIComponent(JSON.stringify(location))}`);
            markdown.appendMarkdown(`${matchIndex + 1}. [📍 **${relativePath}:${location.line}**](${commandUri}) - ${description} ${score}\n\n`);
        });
        // Hiển thị thông báo nếu có nhiều matches hơn
        if (matches.length > 3) {
            markdown.appendMarkdown(`*... and ${matches.length - 3} more matches*\n\n`);
        }
        // Thêm separator giữa các parts
        if (chainIndex < chainMatches.length - 1) {
            markdown.appendMarkdown(`---\n\n`);
        }
    });
    markdown.appendMarkdown('*💡 Click any link to navigate to that location*');
    markdown.isTrusted = true; // Cho phép command links hoạt động
    console.log('✅ Error chain hover created!');
    return new vscode.Hover(markdown);
}
/**
 * 🎈 TẠO HOVER VỚI MULTIPLE OPTIONS (cho single text)
 * Đây là fallback khi không phải error chain
 */
function createHoverWithMultipleOptions(errorText, locations) {
    console.log('🎈 Creating hover with multiple options...');
    const markdown = new vscode.MarkdownString();
    markdown.appendMarkdown(`🔍 **Found ${locations.length} potential matches for "${errorText}":**\n\n`);
    locations.forEach((location, index) => {
        const relativePath = vscode.workspace.asRelativePath(location.file);
        const score = location.similarity ? `(${(location.similarity * 100).toFixed(0)}%)` : '';
        const description = location.description || 'Match';
        // Tạo command URI cho từng option
        const commandUri = vscode.Uri.parse(`command:golang-error-navigator.navigateToError?${encodeURIComponent(JSON.stringify(location))}`);
        markdown.appendMarkdown(`${index + 1}. [📍 **${relativePath}:${location.line}**](${commandUri}) - ${description} ${score}\n\n`);
    });
    markdown.appendMarkdown('*Click any link to navigate to that location*');
    markdown.isTrusted = true;
    console.log('✅ Multi-option hover created!');
    return new vscode.Hover(markdown);
}
// ============= 📁 FILE SYSTEM FUNCTIONS =============
/**
 * 📁 TÌM TẤT CẢ GO FILES TRONG DIRECTORY (RECURSIVE)
 */
async function findGoFiles(dirPath) {
    console.log('📁 Scanning directory:', dirPath);
    const files = [];
    // Recursive function để scan directories
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
                    !['vendor', 'node_modules', 'dist', 'build', 'target'].includes(entry.name)) {
                    await scanDir(fullPath, depth + 1);
                }
                else if (entry.isFile() && entry.name.endsWith('.go')) {
                    console.log(`${indent}📄 Go file found: ${entry.name}`);
                    files.push(fullPath);
                }
            }
        }
        catch (error) {
            console.log(`${indent}⚠️ Cannot read directory: ${dir}`, error);
        }
    }
    await scanDir(dirPath);
    console.log(`📊 Total Go files found: ${files.length}`);
    return files;
}
// ============= 🚀 NAVIGATION FUNCTIONS =============
/**
 * 🚀 NAVIGATE ĐẾN ERROR LOCATION
 * Function này mở file và jump đến dòng code
 */
async function navigateToErrorLocation(location) {
    console.log('🚀 === NAVIGATION STARTED ===');
    console.log('📂 Target location:', location);
    try {
        // Tạo URI cho file
        const uri = vscode.Uri.file(location.file);
        console.log('📁 Opening file:', uri.toString());
        // Mở document
        const document = await vscode.workspace.openTextDocument(uri);
        console.log('📄 Document opened successfully');
        // Hiển thị editor
        const editor = await vscode.window.showTextDocument(document);
        console.log('✏️ Editor opened successfully');
        // Jump đến dòng cụ thể và center trong editor
        const position = new vscode.Position(location.line - 1, 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
        console.log(`📍 Jumped to line ${location.line}`);
        // Hiển thị success message
        vscode.window.showInformationMessage(`🎯 Navigated to: ${path.basename(location.file)}:${location.line}`);
        console.log('✅ Navigation completed successfully!');
    }
    catch (error) {
        console.error('💥 Navigation error:', error);
        vscode.window.showErrorMessage(`❌ Could not navigate to: ${location.file}`);
    }
}
// ============= 📺 TERMINAL FUNCTIONS =============
/**
 * 📺 PARSE SELECTED TEXT TRONG TERMINAL
 */
async function parseSelectedTerminalText() {
    console.log('📺 === PARSING TERMINAL SELECTION ===');
    const activeTerminal = vscode.window.activeTerminal;
    if (!activeTerminal) {
        vscode.window.showErrorMessage('❌ No active terminal found');
        return;
    }
    // Lấy selected text (nếu có)
    const selectedText = await getTerminalSelection();
    if (!selectedText) {
        vscode.window.showInformationMessage('💡 Please select error text in terminal first');
        return;
    }
    console.log('📝 Selected terminal text:', selectedText);
    // Parse error từ terminal text
    const errorParts = extractErrorsFromTerminalTextWithChainSplit(selectedText);
    if (errorParts.length === 0) {
        vscode.window.showInformationMessage('🤷 No error patterns found in selected text');
        return;
    }
    console.log('🔍 Found error parts:', errorParts);
    // Tìm matches cho từng error part
    const allMatches = [];
    for (const errorPart of errorParts) {
        const matches = await findAllErrorLocations(errorPart);
        allMatches.push(...matches);
    }
    if (allMatches.length === 0) {
        vscode.window.showInformationMessage('💔 No source locations found for the errors');
        return;
    }
    // Hiển thị results trong quick pick menu
    showTerminalErrorResults(errorParts, allMatches);
}
/**
 * 📋 LẤY SELECTED TEXT TỪ TERMINAL (workaround)
 */
async function getTerminalSelection() {
    console.log('📋 Getting terminal selection...');
    try {
        // Lưu clipboard hiện tại
        const originalClipboard = await vscode.env.clipboard.readText();
        // Copy terminal selection vào clipboard
        await vscode.commands.executeCommand('workbench.action.terminal.copySelection');
        // Đọc text đã copy
        const clipboardText = await vscode.env.clipboard.readText();
        // Khôi phục clipboard cũ (lịch sự!)
        if (originalClipboard !== clipboardText) {
            await vscode.env.clipboard.writeText(originalClipboard);
        }
        const selectedText = clipboardText.trim();
        console.log('📋 Got terminal selection:', selectedText.substring(0, 100) + '...');
        return selectedText.length > 0 ? selectedText : null;
    }
    catch (error) {
        console.log('⚠️ Could not get terminal selection:', error);
        return null;
    }
}
/**
 * 🔍 ENHANCED TERMINAL PARSING VỚI CHAIN SPLIT
 */
function extractErrorsFromTerminalTextWithChainSplit(text) {
    console.log('🔍 Enhanced terminal parsing with chain split...');
    // Lấy original extracted errors
    const originalErrors = extractErrorsFromTerminalTextBasic(text);
    // Thêm: tìm error chain patterns
    const chainPatterns = [
        // Full error chain patterns (nhiều dấu colons)
        /([^:\n]+:\s*[^:\n]+:\s*[^:\n]+(?::\s*[^:\n]+)*)/gi,
        // Go-style wrapped errors
        /(failed|error|panic)[:\s]+([^:\n]+:\s*[^:\n]+(?::\s*[^:\n]+)*)/gi
    ];
    const errorChains = new Set();
    for (const pattern of chainPatterns) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const fullChain = (match[2] || match[1] || match[0]).trim();
            if (fullChain.includes(':') && fullChain.length > 20 && fullChain.length < 200) {
                console.log(`🔗 Found error chain: "${fullChain}"`);
                errorChains.add(fullChain);
                // Thêm luôn các parts riêng lẻ từ chain
                const parts = splitErrorChain(fullChain);
                parts.forEach(part => {
                    if (part.length > 5) {
                        errorChains.add(part);
                    }
                });
            }
        }
    }
    // Combine original errors với chain-split errors
    const allErrors = [...new Set([...originalErrors, ...Array.from(errorChains)])];
    console.log('📋 Enhanced extracted errors:', allErrors);
    return allErrors;
}
/**
 * 🔍 BASIC TERMINAL ERROR EXTRACTION (original function)
 */
function extractErrorsFromTerminalTextBasic(text) {
    console.log('🔍 Basic error extraction from terminal text...');
    const errorPatterns = [
        // Go error chain patterns
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
    // Split text thành lines để parse tốt hơn
    const lines = text.split('\n');
    for (const line of lines) {
        console.log('🔍 Processing line:', line.trim());
        for (let patternIndex = 0; patternIndex < errorPatterns.length; patternIndex++) {
            const pattern = errorPatterns[patternIndex];
            pattern.lastIndex = 0; // Reset regex
            let match;
            while ((match = pattern.exec(line)) !== null) {
                // Lấy phần relevant nhất của match
                const errorText = (match[1] || match[0]).trim();
                // Lọc bỏ noise
                if (errorText.length > 3 &&
                    !errorText.match(/^\d+$/) && // Không chỉ là numbers
                    !errorText.match(/^[^\w]*$/) && // Không chỉ là symbols
                    errorText.length < 100) { // Không quá dài
                    console.log(`✅ Extracted: "${errorText}" from pattern ${patternIndex + 1}`);
                    extractedErrors.add(errorText);
                }
            }
        }
    }
    const results = Array.from(extractedErrors);
    console.log('📋 Basic extracted error parts:', results);
    return results;
}
/**
 * 📋 HIỂN THỊ TERMINAL ERROR RESULTS TRONG QUICK PICK MENU
 */
async function showTerminalErrorResults(errorParts, matches) {
    console.log('📋 Showing terminal error results...');
    if (matches.length === 0) {
        vscode.window.showInformationMessage('💔 No matches found in source code');
        return;
    }
    // Tạo quick pick items
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
    // Hiển thị quick pick menu
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
 * 🔗 PROVIDE TERMINAL LINKS CHO ERROR PATTERNS (auto-clickable)
 */
function provideTerminalErrorLinks(context) {
    const text = context.line;
    console.log('🔗 Checking terminal line for auto-links:', text.substring(0, 50) + '...');
    const links = [];
    // Patterns cho Go error chains
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
            const length = Math.min(match[0].length, 50); // Giới hạn length
            links.push({
                startIndex,
                length,
                tooltip: '🔍 Click to find source location',
                data: match[1] || match[0] // Lưu matched text
            });
        }
    }
    console.log(`🔗 Generated ${links.length} auto-links for terminal`);
    return links.length > 0 ? links : undefined;
}
/**
 * 🔗 HANDLE TERMINAL LINK CLICKS (auto-links)
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
        // Direct navigation cho single match
        console.log('🚀 Single match found, navigating directly');
        await navigateToErrorLocation(matches[0]);
    }
    else {
        // Show picker cho multiple matches
        console.log(`🎯 Multiple matches found (${matches.length}), showing picker`);
        showTerminalErrorResults([errorText], matches);
    }
}
// ============= 🧹 CLEANUP FUNCTION =============
/**
 * 👋 Function được gọi khi extension deactivate
 */
function deactivate() {
    console.log('👋 Golang Error Navigator deactivated!');
    console.log('🧹 Cleaning up resources...');
    // VSCode sẽ tự động cleanup các subscriptions trong context
}
//# sourceMappingURL=extension.js.map