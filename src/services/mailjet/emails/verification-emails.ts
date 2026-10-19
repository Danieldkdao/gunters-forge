import { serverEnv } from "@/data/env/server";
import { sendEmail } from "..";

const APP_NAME = "Gunter's Forge";

type SendVerificationOtpProps = {
  email: string;
  type: "sign-in" | "change-email" | "email-verification" | "forget-password";
  otp: string;
};

const emailContentByType: Record<
  SendVerificationOtpProps["type"],
  {
    subject: string;
    heading: string;
    description: string;
    instruction: string;
  }
> = {
  "sign-in": {
    subject: `Your ${APP_NAME} sign-in code`,
    heading: "Use this code to sign in",
    description: `Enter the verification code below to finish signing in to your ${APP_NAME} account.`,
    instruction: "Paste this code into the sign-in screen to continue.",
  },
  "change-email": {
    subject: `Confirm your new ${APP_NAME} email`,
    heading: "Confirm your new email",
    description: `Use the verification code below to confirm this email address for your ${APP_NAME} account.`,
    instruction: "Enter this code to complete your email change.",
  },
  "email-verification": {
    subject: `Verify your email for ${APP_NAME}`,
    heading: "Verify your email",
    description: `Welcome to ${APP_NAME}. Enter the verification code below to activate your account.`,
    instruction: "Type this code into the verification form to finish setup.",
  },
  "forget-password": {
    subject: `Your ${APP_NAME} password reset code`,
    heading: "Reset your password",
    description: `Use the verification code below to continue resetting your ${APP_NAME} password.`,
    instruction: "Enter this code on the password reset screen to proceed.",
  },
};

export const sendVerificationOtp = async ({
  email,
  type,
  otp,
}: SendVerificationOtpProps) => {
  const { description, heading, instruction, subject } =
    emailContentByType[type];
  const text = [
    `${heading} - Gunter's Forge`,
    "",
    description,
    "",
    `Verification code: ${otp}`,
    instruction,
    "",
    "If you did not request this email, you can safely ignore it.",
  ].join("\n");

  const html = `<!doctype html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${heading}</title>
    </head>

    <body style="margin:0;padding:0;background-color:#f2e8d5;color:#2b2623;font-family:Outfit,Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
        style="background-color:#f2e8d5;">
        <tr>
          <td align="center" style="padding:40px 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
              style="max-width:560px;background-color:#e9dfcc;border:1px solid #8c7b6b;border-radius:3px;">

              <tr>
                <td align="center"
                  style="padding:24px;background-color:#332f2c;border-bottom:3px solid #c49a50;">
                  <p style="margin:0;color:#f2e8d5;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;letter-spacing:1px;">
                    ${APP_NAME}
                  </p>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding:32px 24px 0;">
                  <p style="margin:0 0 12px;color:#8c3026;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
                    A message from the forge
                  </p>

                  <h1 style="margin:0;color:#2b2623;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.25;font-weight:700;">
                    ${heading}
                  </h1>

                  <p style="margin:16px 0 0;color:#5c534d;font-size:16px;line-height:1.7;">
                    ${instruction}
                  </p>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding:28px 24px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                    style="background-color:#f2e8d5;border:1px solid #8c7b6b;border-top:3px solid #8c3026;border-radius:3px;">
                    <tr>
                      <td align="center" style="padding:20px 12px 24px;">
                        <p style="margin:0 0 12px;color:#5c534d;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
                          Your verification code
                        </p>

                        <p style="margin:0;color:#8c3026;font-family:'Courier New',Courier,monospace;font-size:36px;line-height:1.3;font-weight:700;letter-spacing:5px;">
                          ${otp}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding:0 24px 28px;">
                  <p style="margin:0;color:#2b2623;font-size:14px;line-height:1.7;">
                    This code expires in <strong>15 minutes</strong>.<br />
                    Keep it private. Do not share it with anyone.
                  </p>

                  <p style="margin:16px 0 0;color:#5c534d;font-size:13px;line-height:1.7;">
                    If you did not request this code, you can safely ignore this email.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:0 24px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td height="1" style="height:1px;background-color:#8c7b6b;font-size:1px;line-height:1px;">
                        &nbsp;
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding:22px 24px 28px;">
                  <p style="margin:0;color:#5c534d;font-size:13px;line-height:1.7;">
                    Sent by <strong>${APP_NAME}</strong>
                  </p>

                  <p style="margin:8px 0 0;color:#5c534d;font-size:12px;line-height:1.7;">
                    This is an automated message. Please do not reply.
                  </p>

                  <p style="margin:8px 0 0;color:#5c534d;font-size:12px;line-height:1.7;">
                    &copy; 2026 ${APP_NAME}. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  await sendEmail({
    from: serverEnv.SENDER_EMAIL,
    to: email,
    subject,
    html,
    text,
  });
};
