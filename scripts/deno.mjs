/**
 * @license
 * Copyright (c) 2020 vladfrangu
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @link https://github.com/discordjs/discord-api-types/blob/main/scripts/deno.mjs
 */

/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {
	copyFile,
	mkdir,
	opendir,
	readFile,
	rm,
	writeFile,
} from 'node:fs/promises'

const baseDirectory = new URL('../', import.meta.url)
const denoPath = new URL('deno/', baseDirectory)

// Remove existing deno built files
try {
	await rm(denoPath, { recursive: true })
} catch (error) {
	console.error(error.reason)
}

// Create deno folder
await mkdir(denoPath)

/**
 * @param {string} source The raw source
 */
function convertImports(source) {
	return source.replace(
		/from '(.*)'/g,
		/**
		 * @param {string} importPath The path to import from
		 */ (_, importPath) => {
			if (importPath === '..' || importPath === '../')
				importPath = '../mod.ts'
			if (importPath.includes('index'))
				importPath = importPath.replace('index', 'mod')
			if (!importPath.endsWith('.ts')) importPath += '.ts'

			return `from '${importPath}'`
		}
	)
}

/**
 * @param {string} source The raw source
 */
function convertConstEnums(source) {
	return source.replace(/const enum/gi, 'enum')
}

const transformers = [convertImports, convertConstEnums]

async function convertFile(fullFilePath, finalDenoPath) {
	const originalFile = await readFile(fullFilePath, { encoding: 'utf8' })

	const finalFile = transformers.reduce(
		(code, transformer) => transformer(code),
		originalFile
	)

	await writeFile(finalDenoPath, finalFile)
}

/**
 * @param {string} folderName The folder name
 * @param {URL} node The node path
 * @param {URL} deno The deno path
 */
async function adaptFolderToDeno(
	folderName,
	node = baseDirectory,
	deno = denoPath
) {
	const nodeDirectory = new URL(folderName, node)
	const denoDirectory = new URL(folderName, deno)

	await mkdir(denoDirectory, { recursive: true })

	for await (const file of await opendir(nodeDirectory)) {
		if (file.isDirectory()) {
			await adaptFolderToDeno(
				`${file.name}/`,
				nodeDirectory,
				denoDirectory
			)
			continue
		}

		if (!file.name.endsWith('.ts')) continue

		const fullFilePath = new URL(file.name, nodeDirectory)
		const finalDenoPath = new URL(file.name, denoDirectory)

		await convertFile(fullFilePath, finalDenoPath)
	}
}

// Convert folders
const folderResults = await Promise.allSettled(
	['src/'].map((item) => adaptFolderToDeno(item))
)

for (const result of folderResults) {
	if (result.status === 'rejected') console.error(result.reason)
}

await writeFile(new URL('mod.ts', denoPath), "export * from './src/index.ts'")

// Copy over core files
const copyResults = await Promise.allSettled(
	[
		'license', //
		'CHANGELOG.md',
		'README.md',
	].map((item) =>
		copyFile(new URL(item, baseDirectory), new URL(item, denoPath))
	)
)

for (const result of copyResults) {
	if (result.status === 'rejected') console.error(result.reason)
}
