type CodeInput = {
	picture_base64?: string | null
	phrase_code?: string | null
	image_code?: number[][] | null
}

export type GetterRequest = {
	pass_code: string
} & CodeInput

export type MakerRequest = {
	words: string
	pass_code: string
} & CodeInput
