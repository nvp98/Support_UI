import apiService from "./ApiService";

export interface ChangeRequestRoleResponse {
  actorCode: string;
  roles: string[];
}

export const ChangeRequestRoleApi = {
  getByActorCode: (actorCode: string) =>
    apiService.get<ChangeRequestRoleResponse>(
      `/api/ChangeRequestRoles/${actorCode}`
    ),
};
