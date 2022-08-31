/**
 * @example
 * {
 *   "id": 5
 * }
 */
export interface UserAvatarUpdateModel {
    /**
     * @isInt id
     */
    id: number;
}


export interface UserAvatarModel {
    /**
     * @isInt id
     */
    id: number;
    url: string;
}