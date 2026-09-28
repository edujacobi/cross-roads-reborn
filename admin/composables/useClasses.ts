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

	return {
		getClassImageUrl,
		getClassName,
	};
}
