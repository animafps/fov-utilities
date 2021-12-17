export type aspectRatio = `${number | ''}${number}:${number | ''}${number}`

export function parseAspect(aspectRatio: aspectRatio) {
	const split = aspectRatio.split(':')
	return Number(split[0]) / Number(split[1])
}
