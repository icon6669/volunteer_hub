import { http, HttpResponse } from 'msw';
import { mockUserData, mockExtendedUserData } from '../utils';
import { User } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';

export const handlers = [
  // Auth endpoints
  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: mockUserData,
    });
  }),

  // User endpoints
  http.get(`${SUPABASE_URL}/rest/v1/users`, () => {
    return HttpResponse.json([mockExtendedUserData]);
  }),

  http.get(`${SUPABASE_URL}/rest/v1/users/:id`, () => {
    return HttpResponse.json(mockExtendedUserData);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/users`, async ({ request }) => {
    const data = await request.json() as Partial<User>;
    const userData = {
      ...mockExtendedUserData,
      ...data,
    };
    return HttpResponse.json(userData);
  }),

  // Events endpoints
  http.get(`${SUPABASE_URL}/rest/v1/events`, () => {
    const eventData = {
      id: 'test-event-id',
      name: 'Test Event',
      description: 'Test Description',
      location: 'Test Location',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 86400000).toISOString(),
      owner_id: mockUserData.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json([eventData]);
  }),

  // Roles endpoints
  http.get(`${SUPABASE_URL}/rest/v1/roles`, () => {
    const roleData = {
      id: 'test-role-id',
      event_id: 'test-event-id',
      name: 'Test Role',
      description: 'Test Role Description',
      capacity: 0,
      max_capacity: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json([roleData]);
  }),

  // Volunteers endpoints
  http.get(`${SUPABASE_URL}/rest/v1/volunteers`, () => {
    const volunteerData = {
      id: 'test-volunteer-id',
      role_id: 'test-role-id',
      user_id: mockUserData.id,
      name: mockUserData.user_metadata.name,
      email: mockUserData.email,
      description: 'Test volunteer description',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json([volunteerData]);
  }),

  // Messages endpoints
  http.get(`${SUPABASE_URL}/rest/v1/messages`, () => {
    const messageData = {
      id: 'test-message-id',
      event_id: 'test-event-id',
      sender_id: mockUserData.id,
      content: 'Test message content',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json([messageData]);
  }),
];
