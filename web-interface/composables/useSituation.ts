import { type ImagePath, imagePaths } from "~/constants/imagePaths";
import { SituationId } from "../../src/core/types/Ids";

const situationImages: Record<SituationId, ImagePath> = {
	[SituationId.Idling]: imagePaths.situations.idling,
	[SituationId.Job]: imagePaths.situations.job,
	[SituationId.Robbery]: imagePaths.situations.robbery,
	[SituationId.PrisonAndHospital]: imagePaths.situations.prison,
	[SituationId.Prison]: imagePaths.situations.prison,
	[SituationId.Hospital]: imagePaths.situations.hospital,
	[SituationId.Scavenging]: imagePaths.situations.scavenging,
	[SituationId.Wanted]: imagePaths.situations.wanted,
	[SituationId.BeatUp]: imagePaths.situations.beatup,
	[SituationId.Casino]: imagePaths.situations.casino,
	[SituationId.DefendingInvestment]: imagePaths.situations.defendingInvestment,
	[SituationId.GangAction]: imagePaths.situations.gangAction,
	[SituationId.Dead]: imagePaths.situations.dead,
};

export function useSituation() {
	function getSituationImageUrl(situationId: SituationId) {
		return situationImages[situationId] ?? imagePaths.situations.idling;
	}

	function getSituationName(situationId: SituationId) {
		switch (situationId) {
			case SituationId.Idling:
				return "Vadiando";
			case SituationId.Job:
				return "Trabalhando";
			case SituationId.Robbery:
				return "Em Roubo";
			case SituationId.PrisonAndHospital:
				return "Preso e Hospitalizado";
			case SituationId.Prison:
				return "Preso";
			case SituationId.Hospital:
				return "Hospitalizado";
			case SituationId.Scavenging:
				return "Vasculhando";
			case SituationId.Wanted:
				return "Procurado";
			case SituationId.BeatUp:
				return "Em Espancamento";
			case SituationId.Casino:
				return "Apostando no Cassino";
			case SituationId.DefendingInvestment:
				return "Defendendo Investimento";
			case SituationId.GangAction:
				return "Em ação de Gangue";
			case SituationId.Dead:
				return "Morto";
			default:
				return "Vadiando";
		}
	}

	return {
		getSituationImageUrl,
		getSituationName,
	};
}
