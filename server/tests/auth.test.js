const request = require("supertest");
const USER_ID = "507f1f77bcf86cd799439011";
const mockCsrfToken = "test-csrf-token";

jest.mock("../models/User", () => ({
  findById: jest.fn(),
}));
jest.mock("../services/authService", () => ({
  register: jest.fn(),
  login: jest.fn(),
  publicUser: jest.fn((user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  })),
  createSession: jest.fn((user, config) => ({
    token: require("jsonwebtoken").sign(
      { sub: user._id.toString(), csrf: mockCsrfToken },
      config.JWT_SECRET,
      { expiresIn: "1h" },
    ),
    csrfToken: mockCsrfToken,
  })),
}));

const User = require("../models/User");
const authService = require("../services/authService");
const createApp = require("../app");
const user = {
  _id: { toString: () => USER_ID },
  name: "Test User",
  email: "test@example.com",
  isActive: true,
};
const app = createApp({
  JWT_SECRET: "test-secret-that-is-long-enough-to-sign-auth-tokens",
  JWT_EXPIRES_IN: "1h",
  COOKIE_MAX_AGE_MS: 3600000,
  COOKIE_SAME_SITE: "lax",
  cookieSecure: false,
  corsOrigins: ["http://localhost:5173"],
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX: 1000,
  AUTH_RATE_LIMIT_MAX: 1000,
});

const cookiesFrom = (response) =>
  response.headers["set-cookie"].map((cookie) => cookie.split(";")[0]);

describe("authentication API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authService.register.mockResolvedValue(user);
    authService.login.mockResolvedValue(user);
    User.findById.mockResolvedValue(user);
  });

  test("registers an account and establishes a protected session", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .set("Origin", "http://localhost:5173")
      .send({
        name: "Test User",
        email: "TEST@example.com",
        password: "a-secure-password",
      })
      .expect(201);

    expect(authService.register).toHaveBeenCalledWith({
      name: "Test User",
      email: "test@example.com",
      password: "a-secure-password",
    });
    expect(response.body.data.user).toMatchObject({
      id: USER_ID,
      email: "test@example.com",
    });
    expect(response.headers["set-cookie"].join(";")).toContain("auth_token=");
    expect(response.headers["set-cookie"].join(";")).toContain("csrf_token=");

    const cookies = cookiesFrom(response);
    await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookies)
      .expect(200)
      .expect((currentUser) => {
        expect(currentUser.body.data.user.id).toBe(USER_ID);
        expect(currentUser.body.data.csrfToken).toBe(mockCsrfToken);
      });
  });

  test("rejects unauthenticated access and invalid registration data", async () => {
    await request(app).get("/api/auth/me").expect(401);
    await request(app)
      .get("/api/prompts")
      .expect(401);
    await request(app).get("/api/collections").expect(401);
    await request(app).get("/api/explore").expect(401);
    await request(app)
      .post("/api/auth/register")
      .set("Origin", "http://localhost:5173")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "short",
      })
      .expect(400);
    expect(authService.register).not.toHaveBeenCalled();
  });

  test("logs in and requires a valid CSRF token to log out", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Origin", "http://localhost:5173")
      .send({ email: "test@example.com", password: "a-secure-password" })
      .expect(200);
    const cookies = cookiesFrom(response);

    await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookies)
      .set("Origin", "http://localhost:5173")
      .set("X-CSRF-Token", "invalid-token")
      .expect(403);
    await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookies)
      .set("Origin", "http://localhost:5173")
      .set("X-CSRF-Token", mockCsrfToken)
      .expect(200);
  });
});
