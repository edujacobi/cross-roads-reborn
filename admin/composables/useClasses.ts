import { type ImagePath, imagePaths } from "~/constants/imagePaths";
import { ClassId } from "../../src/core/types/Ids";

const classImages: Record<ClassId, ImagePath> = {
	[ClassId.None]: imagePaths.classes.none,
	[ClassId.Thief]: imagePaths.classes.thief,
	[ClassId.Assassin]: imagePaths.classes.assassin,
	[ClassId.Entrepreneur]: imagePaths.classes.entrepreneur,
	[ClassId.Hobo]: imagePaths.classes.hobo,
	[ClassId.Mafioso]: imagePaths.classes.mafioso,
	[ClassId.Attorney]: imagePaths.classes.attorney,
};

interface ClassModifierInfo {
	label: string;
	percentage: number;
	isPositive: boolean;
}

const classDetails: Partial<Record<ClassId, { description: string; modifiers: ClassModifierInfo[] }>> = {
	[ClassId.Attorney]: {
		description: "Conhece as brechas de todas as leis e usa isso ao seu favor, mas não gosta de sujar seu traje.",
		modifiers: [
			{ label: "Ganhos no cassino", percentage: 20, isPositive: true },
			{ label: "Chance de subornar na prisão", percentage: 5, isPositive: true },
			{ label: "Grana e duração de itens encontrados no vasculhamento", percentage: 25, isPositive: false },
		],
	},
	[ClassId.Entrepreneur]: {
		description:
			"Cresceu em berço de ouro, fazendo networking com os colegas de seu pai, mas lhe falta um pouco de malícia.",
		modifiers: [
			{ label: "Recompensa por trabalho", percentage: 15, isPositive: true },
			{ label: "Rendimento de investimentos", percentage: 10, isPositive: true },
			{ label: "Valor roubado", percentage: 25, isPositive: false },
		],
	},
	[ClassId.Hobo]: {
		description: "Invisível para a maioria da população, aproveita-se disso para tirar o máximo de vantagem.",
		modifiers: [
			{ label: "Grana e duração de itens encontrados no vasculhamento", percentage: 20, isPositive: true },
			{ label: "Chance de encontrar itens no vasculhamento", percentage: 10, isPositive: true },
			{ label: "Recompensa por trabalho", percentage: 20, isPositive: false },
		],
	},
	[ClassId.Thief]: {
		description:
			"Habilidoso com as mãos, aprendeu desde cedo a arte de roubar. Uma pena que não possui sorte no tigrinho.",
		modifiers: [
			{ label: "Valor roubado", percentage: 15, isPositive: true },
			{ label: "Chance de fugir da prisão", percentage: 5, isPositive: true },
			{ label: "Ganhos no cassino", percentage: 25, isPositive: false },
		],
	},
};

export function useClasses() {
	function getClassImageUrl(classId: ClassId) {
		return classImages[classId] ?? imagePaths.classes.none;
	}

	function getClassName(classId: ClassId) {
		switch (classId) {
			case ClassId.None:
				return "Sem classe";
			case ClassId.Thief:
				return "Ladrão";
			case ClassId.Assassin:
				return "Assassino";
			case ClassId.Entrepreneur:
				return "Empresário";
			case ClassId.Hobo:
				return "Mendigo";
			case ClassId.Mafioso:
				return "Mafioso";
			case ClassId.Attorney:
				return "Advogado";
			default:
				return "Sem classe";
		}
	}

	function getClassDescription(classId: ClassId) {
		return classDetails[classId]?.description ?? "";
	}

	function getClassModifiers(classId: ClassId) {
		return classDetails[classId]?.modifiers ?? [];
	}

	return {
		getClassImageUrl,
		getClassName,
		getClassDescription,
		getClassModifiers,
	};
}
