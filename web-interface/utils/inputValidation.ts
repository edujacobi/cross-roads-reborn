export enum InputValidationRule {
	MinLength = "minLength",
	MaxLength = "maxLength",
	Pattern = "pattern",
}

export type InputValidationRules = Partial<Record<InputValidationRule, {
	label: string;
	validate: (value: string) => boolean;
}>>;

export const nicknameMinLength = 3;
export const nicknameMaxLength = 18;
export const nicknamePattern = "[A-Za-z]+( [A-Za-z]+)*";
export const gangNamePattern = "[a-zA-Z0-9\\s]+";

export const nicknameRules: InputValidationRules = {
	[InputValidationRule.MinLength]: {
		label: "Pelo menos 3 caracteres",
		validate: (value) => value.length >= nicknameMinLength,
	},
	[InputValidationRule.MaxLength]: {
		label: "No máximo 18 caracteres",
		validate: (value) => value.length <= nicknameMaxLength,
	},
	[InputValidationRule.Pattern]: {
		label: "Apenas letras e espaços simples entre palavras",
		validate: (value) => /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value),
	},
};

