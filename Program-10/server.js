require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3010;

// Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "your_google_client_id_here.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "your_google_client_secret_here";
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `http://localhost:${PORT}/auth/google/callback`;
const ENABLE_SIMULATED = process.env.ENABLE_SIMULATED_OAUTH !== "false";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || "oauth2_dev_secret_key_8921",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(express.static(path.join(__dirname, "public")));

// 1. Initiate OAuth 2.0 Flow
app.get("/auth/google", (req, res) => {
    // Check if live Google credentials are provided or if simulated OAuth should run
    const hasLiveCredentials = GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes("your_google_client_id");

    // Generate cryptographic CSRF state token
    const state = crypto.randomBytes(16).toString("hex");
    req.session.oauthState = state;

    if (hasLiveCredentials) {
        // Real Google OAuth 2.0 Authorization Endpoint
        const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        googleAuthUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
        googleAuthUrl.searchParams.set("redirect_uri", GOOGLE_CALLBACK_URL);
        googleAuthUrl.searchParams.set("response_type", "code");
        googleAuthUrl.searchParams.set("scope", "openid profile email");
        googleAuthUrl.searchParams.set("state", state);
        googleAuthUrl.searchParams.set("access_type", "online");

        return res.redirect(googleAuthUrl.toString());
    } else {
        // Educational Simulated Consent Server
        return res.redirect(`/auth/consent?state=${state}`);
    }
});

// 2. Simulated OAuth 2.0 Consent Screen
app.get("/auth/consent", (req, res) => {
    const state = req.query.state;
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>OAuth 2.0 Consent Authorization Screen</title>
            <style>
                body { font-family: -apple-system, sans-serif; background: #f1f5f9; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
                .consent-box { background: white; padding: 35px; border-radius: 12px; max-width: 440px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
                h2 { margin-top: 0; color: #0f172a; }
                p { color: #475569; font-size: 0.95rem; line-height: 1.5; }
                .scopes { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 0.88rem; }
                .scopes li { margin-bottom: 6px; }
                .btn-row { display: flex; gap: 10px; margin-top: 25px; }
                .btn { flex: 1; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; text-align: center; text-decoration: none; }
                .approve-btn { background: #2563eb; color: white; }
                .cancel-btn { background: #e2e8f0; color: #475569; }
            </style>
        </head>
        <body>
            <div class="consent-box">
                <h2>🔐 OAuth 2.0 Consent Screen</h2>
                <p><strong>MDU Web App Portal</strong> is requesting permission to access your identity credentials:</p>
                <div class="scopes">
                    <strong>Scopes Requested:</strong>
                    <ul>
                        <li>View your basic profile info (Name, Avatar)</li>
                        <li>View your primary email address</li>
                        <li>Associate your account via OpenID Connect</li>
                    </ul>
                </div>
                <p style="font-size:0.8rem; color:#94a3b8;">CSRF Security State Parameter: <code>${state}</code></p>
                <div class="btn-row">
                    <a href="/auth/google/callback?code=AUTH_CODE_${crypto.randomBytes(8).toString("hex")}&state=${state}" class="btn approve-btn">Allow &amp; Continue</a>
                    <a href="/" class="btn cancel-btn">Deny</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

// 3. OAuth 2.0 Callback & Token Exchange
app.get("/auth/google/callback", async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        return res.redirect(`/?error=${encodeURIComponent(error)}`);
    }

    // CSRF State parameter validation
    if (!state || state !== req.session.oauthState) {
        return res.status(403).send("CSRF Attack Detected: OAuth State token mismatch!");
    }

    try {
        // If code is from live Google, exchange code for access_token with Google token endpoint
        // Here we support both live token exchange and verified academic mock exchange
        let userProfile = null;

        if (code.startsWith("AUTH_CODE_")) {
            // Simulated OAuth Provider Identity
            userProfile = {
                id: "google-uid-10892749102",
                name: "Rahul Verma (Student)",
                email: "rahul.verma@mdu.ac.in",
                avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Rahul",
                provider: "Google OAuth 2.0 (Simulated / Verified Mode)",
                tokenType: "Bearer",
                accessToken: "ya29.a0AfH6SMD_" + crypto.randomBytes(16).toString("hex"),
                expiresIn: 3600,
                scope: "openid profile email",
                authenticatedAt: new Date().toISOString()
            };
        } else {
            // Live Google Token Exchange
            const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    code,
                    client_id: GOOGLE_CLIENT_ID,
                    client_secret: GOOGLE_CLIENT_SECRET,
                    redirect_uri: GOOGLE_CALLBACK_URL,
                    grant_type: "authorization_code"
                })
            });

            const tokens = await tokenResponse.json();
            if (!tokenResponse.ok) throw new Error(tokens.error_description || "Token exchange failed");

            // Fetch User Profile from Google UserInfo endpoint
            const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
                headers: { Authorization: `Bearer ${tokens.access_token}` }
            });
            const profileData = await profileResponse.json();

            userProfile = {
                id: profileData.id,
                name: profileData.name,
                email: profileData.email,
                avatar: profileData.picture,
                provider: "Google OAuth 2.0 (Live)",
                tokenType: tokens.token_type,
                accessToken: tokens.access_token,
                expiresIn: tokens.expires_in,
                scope: tokens.scope,
                authenticatedAt: new Date().toISOString()
            };
        }

        // Save authenticated user profile in session
        req.session.user = userProfile;
        delete req.session.oauthState;

        // Redirect back to application dashboard
        res.redirect("/?auth=success");
    } catch (err) {
        console.error("OAuth Callback Error:", err.message);
        res.redirect(`/?error=${encodeURIComponent(err.message)}`);
    }
});

// 4. API: Get Current Authenticated Session Profile
app.get("/api/me", (req, res) => {
    if (req.session.user) {
        res.status(200).json({
            authenticated: true,
            user: req.session.user
        });
    } else {
        res.status(401).json({
            authenticated: false,
            message: "No active authenticated session."
        });
    }
});

// 5. Logout
app.post("/auth/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ success: false, message: "Logout failed" });
        res.clearCookie("connect.sid");
        res.status(200).json({ success: true, message: "Logged out successfully" });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Program-10 OAuth 2.0 Server running at http://localhost:${PORT}`);
});
