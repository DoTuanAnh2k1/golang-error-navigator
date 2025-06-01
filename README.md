# Go Error Navigator 🔥

Navigate Go error chains like a boss! Click on error messages to jump directly to source code.

## Features

- 🎯 **Error Chain Splitting**: Automatically split Go error chains by `:` 
- 🔍 **Smart Hover**: Hover over error messages to see source locations
- 🚀 **One-Click Navigation**: Click to jump directly to error source
- 📺 **Terminal Integration**: Parse errors from terminal output

## Usage

1. Run your Go program and see error output
2. Hover over any error message in terminal or code
3. Click on the suggested locations to navigate!

## Example
```
error: store failed: disk full
```
Will show:
- 📍 "error" → main.go:23
- 📍 "store failed" → main.go:16  
- 📍 "disk full" → main.go:11

## Requirements

- VSCode 1.74.0+
- Go workspace

## Release Notes

### 1.0.0
- Initial release
- Error chain splitting
- Hover navigation
- Terminal integration

**Enjoy!** 🎉