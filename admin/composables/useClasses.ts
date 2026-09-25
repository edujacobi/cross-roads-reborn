import { ClassId } from "../../src/core/types/Ids";

export function useClasses() {
	function getClassImageUrl(classId: ClassId) {
		switch (classId) {
			case ClassId.None:
				return "/classes/0_None.png";
			case ClassId.Thief:
				return "/classes/1_Thief.png";
			case ClassId.Assassin:
				return "/classes/2_Assassin.png";
			case ClassId.Entrepreneur:
				return "/classes/3_Entrepreneur.png";
			case ClassId.Hobo:
				return "/classes/4_Hobo.png";
			case ClassId.Mafioso:
				return "/classes/5_Mafioso.png";
			case ClassId.Attorney:
				return "/classes/6_Attorney.png";
			default:
				return "/classes/0_None.png";
		}
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
