export type aspectRatio = `${number}:${number}`

export function parseAspect(aspectRatio: aspectRatio) {
	if (!/\d{1,4}:\d{1,4}/.test(aspectRatio)) return null
	const split = aspectRatio.split(':')
	return Number(split[0]) / Number(split[1])
}
