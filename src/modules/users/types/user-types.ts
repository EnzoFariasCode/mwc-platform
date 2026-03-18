// src/types/user-types.ts

// O formato do dado que o Front vai receber
export type UserProfileDTO = {
  name: string | null;
  displayName: string | null;
  email: string;
  userType: string;
};

// O formato padrão de resposta das suas Server Actions
export type ActionResponse<T = null> = {
  success: boolean;
  data?: T;
  error?: string;
};
