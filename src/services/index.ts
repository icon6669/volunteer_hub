export * from './EventService';
export * from './UserService';
export * from './RoleService';
export * from './VolunteerService';

import { EventService } from './EventService';
import { UserService } from './UserService';
import { RoleService } from './RoleService';
import { VolunteerService } from './VolunteerService';

class Services {
  private static instance: Services;
  private _eventService: EventService;
  private _userService: UserService;
  private _roleService: RoleService;
  private _volunteerService: VolunteerService;

  private constructor() {
    this._eventService = new EventService();
    this._userService = new UserService();
    this._roleService = new RoleService();
    this._volunteerService = new VolunteerService();
  }

  static getInstance(): Services {
    if (!Services.instance) {
      Services.instance = new Services();
    }
    return Services.instance;
  }

  get events(): EventService {
    return this._eventService;
  }

  get users(): UserService {
    return this._userService;
  }

  get roles(): RoleService {
    return this._roleService;
  }

  get volunteers(): VolunteerService {
    return this._volunteerService;
  }
}

export const services = Services.getInstance();
