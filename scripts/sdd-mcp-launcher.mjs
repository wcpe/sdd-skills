#!/usr/bin/env node
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || process.cwd()
await import(pathToFileURL(join(pluginRoot, 'mcp', 'sdd-mcp.mjs')).href)
