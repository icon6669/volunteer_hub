export * from './EventService';
export * from './UserService';
export * from './RoleService';
export * from './VolunteerService';
export * from './SettingsService';
export * from './MessageService';

import { EventService } from './EventService';
import { UserService } from './UserService';
import { RoleService } from './RoleService';
import { VolunteerService } from './VolunteerService';
import { SettingsService } from './SettingsService';
import { MessageService } from './MessageService';

class Services {
  private static instance: Services;
  private _eventService: EventService;
  private _userService: UserService;
  private _roleService: RoleService;
  private _volunteerService: VolunteerService;
  private _settingsService: SettingsService;
  private _messageService: MessageService;

  private constructor() {
    this._eventService = new EventService();
    this._userService = new UserService();
    this._roleService = new RoleService();
    this._volunteerService = new VolunteerService();
    this._settingsService = new SettingsService();
    this._messageService = new MessageService();
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

  get settings(): SettingsService {
    return this._settingsService;
  }

  get messages(): MessageService {
    return this._messageService;
  }
}

export const services = Services.getInstance();
