export type filmWithAspect = `${number}M${'L' | 'I' | 'F' | 'S'}${number}`
export type filmWithoutAspect = `${'V' | 'H'}ML`
export type filmNotation = `${filmWithAspect | filmWithoutAspect}`

/**
 * Converts one horizontal FoV to another based on the input and output of the engine or screen aspect ratio
 * @param inputAspect `horizontal/vertical`
 * @param outputAspect `horizontal/vertical`
 */
export function convertFOV(
	fov: number,
	inputAspect: number,
	outputAspect: number
) {
	return (
		(Math.atan(
			(outputAspect / inputAspect) * Math.tan((fov * Math.PI) / 360)
		) *
			360) /
		Math.PI
	)
}

/**
 * Takes FILM notation and parses the aspect ratio parameters
 * @returns the aspect ratio in `horizontal/vertical` format
 */
export function filmToAspect(filmNotation: filmWithAspect) {
	const startString = filmNotation.split(/M/)[0]
	const endString = filmNotation.split(/M[FLI]/)[1]
	return Number(startString) / Number(endString)
}

/**
 *
 * @param fov
 * @param film
 * @param aspectRatio
 * @returns
 */
export function filmToTrue(
	fov: number,
	film: filmNotation,
	aspectRatio: number
): fovValues {
	if (film as filmWithoutAspect) {
		if (film.startsWith('H')) {
			return lockHorizontal(fov, aspectRatio)
		} else if (film.startsWith('V')) {
			return lockVertical(fov, aspectRatio)
		}
	}
	const filmAspect = filmToAspect(film as filmWithAspect)
	if (/^\d{1,2}MS\d{1,2}$/.test(film)) {
		return {
			horizontalFOV: fov,
			verticalFOV: convertFOV(fov, filmAspect, 1),
		}
	} else if (/^\d{1,2}ML\d{1,2}$/.test(film)) {
		return lockVertical(fov, aspectRatio, filmAspect)
	} else if (/^\d{1,2}MF\d{1,2}$/.test(film)) {
		if (aspectRatio > filmAspect) {
			return lockHorizontal(fov, aspectRatio)
		}
		return lockVertical(fov, aspectRatio, filmAspect)
	} else if (/^\d{1,2}MI\d{1,2}$/.test(film)) {
		if (aspectRatio < filmAspect) {
			return lockHorizontal(fov, aspectRatio)
		}
		return lockVertical(fov, aspectRatio, filmAspect)
	}
	throw Error('parsing failed')
}

/**
 *
 * @param param0
 * @param film {@link film}
 * @param aspectRatio
 * @returns
 */
export function trueToFILM(
	{ horizontalFOV, verticalFOV }: fovValues,
	film: filmNotation,
	aspectRatio: number
): number {
	if (/^\d{1,2}MS\d{1,2}$/.test(film) || film.startsWith('H')) {
		return horizontalFOV
	} else if (film.startsWith('V')) {
		return verticalFOV
	} else {
		const filmAspect = filmToAspect(film as filmWithAspect)
		return convertFOV(horizontalFOV, aspectRatio, filmAspect)
	}
}

/**
 *
 * @param fov
 * @param aspectRatio
 * @param filmAspect
 * @returns
 */
export function lockVertical(
	fov: number,
	aspectRatio: number,
	filmAspect?: number
): fovValues {
	if (filmAspect) {
		return {
			horizontalFOV: convertFOV(fov, filmAspect, aspectRatio),
			verticalFOV: convertFOV(fov, filmAspect, 1),
		}
	}
	return {
		horizontalFOV: convertFOV(fov, 1, aspectRatio),
		verticalFOV: fov,
	}
}

/**
 *
 * @param fov
 * @param aspectRatio
 * @returns
 */
export function lockHorizontal(fov: number, aspectRatio: number): fovValues {
	return {
		horizontalFOV: fov,
		verticalFOV: convertFOV(fov, aspectRatio, 1),
	}
}

export interface fovValues {
	horizontalFOV: number
	verticalFOV: number
}

/**
 *
 * @param fov
 * @param inFILM {@link film}
 * @param outFILM {@link film}
 * @param aspectRatio
 * @returns
 */
export function filmToFilm(
	fov: number,
	inFILM: filmNotation,
	outFILM: filmNotation,
	aspectRatio: number
): number {
	return trueToFILM(
		filmToTrue(fov, inFILM, aspectRatio),
		outFILM,
		aspectRatio
	)
}

/**
 * Parses any string that is a implementation of FILM
 * @param film a string that only contains the text that is the film notation
 * @returns the string back or null if its not film notation
 */
export function parseFilm(film: string) {
	if (!/^[HV]M[LFI]$|^\d{1,2}M[LFI]\d{1,2}$/.test(film)) return null
	return film as filmNotation
}
