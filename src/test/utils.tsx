import React, { ReactElement } from 'react';
import { render as rtlRender } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import { UserRole } from '../types';
import { User } from '@supabase/supabase-js';

// Create a function that returns chainable mock methods
interface MockMethods {
  table?: string;
  select: jest.Mock<any>;
  insert: jest.Mock<any>;
  update: jest.Mock<any>;
  delete: jest.Mock<any>;
  eq: jest.Mock<any>;
  single: jest.Mock<any>;
  maybeSingle: jest.Mock<any>;
  contains: jest.Mock<any>;
  not: jest.Mock<any>;
  in: jest.Mock<any>;
  notIn: jest.Mock<any>;
  is: jest.Mock<any>;
  notIs: jest.Mock<any>;
  like: jest.Mock<any>;
  notLike: jest.Mock<any>;
  ilike: jest.Mock<any>;
  notIlike: jest.Mock<any>;
  similar: jest.Mock<any>;
  notSimilar: jest.Mock<any>;
  startsWith: jest.Mock<any>;
  notStartsWith: jest.Mock<any>;
  endsWith: jest.Mock<any>;
  notEndsWith: jest.Mock<any>;
  rangeGt: jest.Mock<any>;
  rangeGte: jest.Mock<any>;
  rangeLt: jest.Mock<any>;
  rangeLte: jest.Mock<any>;
  rangeAdjacent: jest.Mock<any>;
  overlaps: jest.Mock<any>;
  strict: jest.Mock<any>;
  notStrict: jest.Mock<any>;
  limit: jest.Mock<any>;
  range: jest.Mock<any>;
  order: jest.Mock<any>;
  to: jest.Mock<any>;
  using: jest.Mock<any>;
  maybe: jest.Mock<any>;
  upsert: jest.Mock<any>;
}

export const createChainableMock = (returnValue: any = null): MockMethods => {
  const mockMethods: MockMethods = {
    select: jest.fn().mockImplementation(() => mockMethods),
    insert: jest.fn().mockImplementation(() => mockMethods),
    update: jest.fn().mockImplementation(() => mockMethods),
    delete: jest.fn().mockImplementation(() => mockMethods),
    eq: jest.fn().mockImplementation(() => mockMethods),
    single: jest.fn().mockResolvedValue({ data: returnValue, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: returnValue, error: null }),
    contains: jest.fn().mockImplementation(() => mockMethods),
    not: jest.fn().mockImplementation(() => mockMethods),
    in: jest.fn().mockImplementation(() => mockMethods),
    notIn: jest.fn().mockImplementation(() => mockMethods),
    is: jest.fn().mockImplementation(() => mockMethods),
    notIs: jest.fn().mockImplementation(() => mockMethods),
    like: jest.fn().mockImplementation(() => mockMethods),
    notLike: jest.fn().mockImplementation(() => mockMethods),
    ilike: jest.fn().mockImplementation(() => mockMethods),
    notIlike: jest.fn().mockImplementation(() => mockMethods),
    similar: jest.fn().mockImplementation(() => mockMethods),
    notSimilar: jest.fn().mockImplementation(() => mockMethods),
    startsWith: jest.fn().mockImplementation(() => mockMethods),
    notStartsWith: jest.fn().mockImplementation(() => mockMethods),
    endsWith: jest.fn().mockImplementation(() => mockMethods),
    notEndsWith: jest.fn().mockImplementation(() => mockMethods),
    rangeGt: jest.fn().mockImplementation(() => mockMethods),
    rangeGte: jest.fn().mockImplementation(() => mockMethods),
    rangeLt: jest.fn().mockImplementation(() => mockMethods),
    rangeLte: jest.fn().mockImplementation(() => mockMethods),
    rangeAdjacent: jest.fn().mockImplementation(() => mockMethods),
    overlaps: jest.fn().mockImplementation(() => mockMethods),
    strict: jest.fn().mockImplementation(() => mockMethods),
    notStrict: jest.fn().mockImplementation(() => mockMethods),
    limit: jest.fn().mockImplementation(() => mockMethods),
    range: jest.fn().mockImplementation(() => mockMethods),
    order: jest.fn().mockImplementation(() => mockMethods),
    to: jest.fn().mockImplementation(() => mockMethods),
    using: jest.fn().mockImplementation(() => mockMethods),
    maybe: jest.fn().mockImplementation(() => mockMethods),
    upsert: jest.fn().mockImplementation(() => mockMethods),
  };

  return mockMethods;
};

// Mock user data that matches Supabase User type
export const mockUserData: User = {
  id: 'test-user-id',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {
    provider: 'email',
    providers: ['email'],
  },
  user_metadata: {
    name: 'Test User',
  },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Extended user data with application-specific fields
export const mockExtendedUserData = {
  ...mockUserData,
  user_role: UserRole.VOLUNTEER,
  email_notifications: true,
  unread_messages: 0,
};

// Mock Supabase client
export const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: mockUserData }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { user: mockUserData }, error: null }),
    signIn: jest.fn().mockResolvedValue({ data: { user: mockUserData }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    signInWithPassword: jest.fn(),
  },
  from: jest.fn((table: string) => {
    const mockMethods = createChainableMock();
    mockMethods.table = table;
    return mockMethods;
  }),
};

// Custom render function that includes providers
function customRender(
  ui: ReactElement,
  options = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthProvider>
        {children}
      </AuthProvider>
    );
  }
  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
