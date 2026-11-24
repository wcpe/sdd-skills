#!/usr/bin/env node
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'

// 按启动器自身位置定位插件根，不依赖宿主注入的 CLAUDE_PLUGIN_ROOT / PLUGIN_ROOT 或启动时的 cwd
const pluginRoot = fileURLToPath(new URL('..', import.meta.url))
await import(pathToFileURL(join(pluginRoot, 'mcp', 'sdd-mcp.mjs')).href)
