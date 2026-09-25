import { SituationId } from "../../src/core/types/Ids";

export function useSituation() {
	function getSituationImageUrl(situationId: SituationId) {
		switch (situationId) {
			case SituationId.Idling:
				return "situations/idling.png";
			case SituationId.Job:
				return "situations/job.png";
			case SituationId.Robbery:
				return "situations/robbery.png";
			case SituationId.PrisonAndHospital:
				return "situations/prison.png";
			case SituationId.Prison:
				return "situations/prison.png";
			case SituationId.Hospital:
				return "situations/hospital.png";
			case SituationId.Scavenging:
				return "situations/scavenging.png";
			case SituationId.Wanted:
				return "situations/wanted.png";
			case SituationId.BeatUp:
				return "situations/beatup.png";
			case SituationId.Casino:
				return "situations/casino.png";
			case SituationId.DefendingInvestment:
				return "situations/defending-investment.png";
			case SituationId.GangAction:
				return "situations/gang-action.png";
			case SituationId.Dead:
				return "situations/dead.png";
			default:
				return "situations/idling.png";
		}
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
