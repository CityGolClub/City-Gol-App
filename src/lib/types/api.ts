export type LoginRequest = {
  email: string;
  phone: string;
};

export type LoginResponse =
  | {
      success: true;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        role: "user" | "admin";
      };
    }
  | {
      success: false;
      message: string;
    };
