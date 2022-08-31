import { TournamentModel } from './tournament.model';
import { Prize } from '../../prize';

export interface UserTournamentModel extends TournamentModel {
    playerJoined: boolean;
    playerCompleted: boolean;
    playerKnockedOut: boolean;
    playerAllocations?: number;
    playerAllocationsComplete?: number;
    playerAllocationsRemaining?: number;
    userPrize?: Prize;
    playerEntryCost?: number;
    playerTotalCost?: number;
}