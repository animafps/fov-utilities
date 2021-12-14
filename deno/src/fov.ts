/**
 *
 * @param fov
 * @param inputAspect
 * @param outputAspect
 * @returns
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
 *
 * @param filmNotation
 * @returns
 */
export function filmToAspect(filmNotation: string) {
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
	film: string,
	aspectRatio: number
): fovValues {
	const filmAspect = filmToAspect(film)
	if (/^\d{1,2}MS\d{1,2}$/.test(film)) {
		return {
			horizontalFOV: fov,
			verticalFOV: convertFOV(fov, filmAspect, 1),
		}
	} else if (film.startsWith('H')) {
		return lockHorizontal(fov, aspectRatio)
	} else if (film.startsWith('V')) {
		return lockVertical(fov, aspectRatio)
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
 * @param film
 * @param aspectRatio
 * @returns
 */
export function trueToFILM(
	{ horizontalFOV, verticalFOV }: fovValues,
	film: string,
	aspectRatio: number
): number {
	const filmAspect = filmToAspect(film)
	if (/^\d{1,2}MS\d{1,2}$/.test(film) || film.startsWith('H')) {
		return horizontalFOV
	} else if (film.startsWith('V')) {
		return verticalFOV
	} else {
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

/**
 *
 */
export interface fovValues {
	horizontalFOV: number
	verticalFOV: number
}

/**
 *
 * @param fov
 * @param inFILM
 * @param outFILM
 * @param aspectRatio
 * @returns
 */
export function filmToFilm(
	fov: number,
	inFILM: string,
	outFILM: string,
	aspectRatio: number
): number {
	return trueToFILM(
		filmToTrue(fov, inFILM, aspectRatio),
		outFILM,
		aspectRatio
	)
}
