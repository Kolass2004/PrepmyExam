import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, subject, message } = body;

        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Configure Transporter with the provided SMTP Credentials
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Email Content
        const mailOptions = {
            from: `"${name}" <${process.env.SMTP_USER}>`, // Sender address (must be authenticated user for Gmail typically)
            to: process.env.SMTP_USER, // Send to support email
            replyTo: email, // Allow replying to the user
            subject: `[PrepmyExam] ${subject}`,
            text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            html: `
                <div style="font-family: 'Google Sans', Roboto, sans-serif; background-color: #fdfbff; padding: 40px 20px; color: #1c1b1f;">
                    <div style="max-w-idth: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05); border: 1px solid #e7e0ec;">
                        
                        <!-- Header Region -->
                        <div style="background-color: #6750a4; padding: 32px 32px 24px 32px; color: #ffffff;">
                            <div style="font-size: 14px; font-weight: 500; letter-spacing: 0.1px; opacity: 0.9; margin-bottom: 8px; text-transform: uppercase;">PrepmyExam</div>
                            <h2 style="margin: 0; font-size: 28px; font-weight: 400; font-family: 'Google Sans', sans-serif;">New Inquiry</h2>
                        </div>

                        <!-- Content Region -->
                        <div style="padding: 32px;">
                            
                            <!-- Key-Value Pairs -->
                            <div style="margin-bottom: 24px;">
                                <div style="font-size: 12px; color: #49454f; margin-bottom: 4px; font-weight: 500;">FROM</div>
                                <div style="font-size: 16px; color: #1c1b1f; font-weight: 500;">${name}</div>
                                <div style="font-size: 14px; color: #49454f;">${email}</div>
                            </div>

                            <div style="margin-bottom: 24px;">
                                <div style="font-size: 12px; color: #49454f; margin-bottom: 4px; font-weight: 500;">SUBJECT</div>
                                <div style="font-size: 18px; color: #1c1b1f;">${subject}</div>
                            </div>

                            <!-- Message Card -->
                            <div style="background-color: #f3edf7; border-radius: 16px; padding: 24px; margin-top: 8px;">
                                <div style="font-size: 12px; color: #49454f; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.5px;">MESSAGE</div>
                                <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #1c1b1f; white-space: pre-wrap;">${message}</p>
                            </div>

                        </div>

                        <!-- Footer Region -->
                        <div style="padding: 16px 32px 24px 32px; text-align: center; border-top: 1px solid #e7e0ec; background-color: #fdfbff;">
                            <p style="margin: 0; font-size: 12px; color: #49454f;">Sent via PrepmyExam Contact </p>
                        </div>
                    </div>
                </div>
            `,
        };

        // Send Email
        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Email send error:", error);
        return NextResponse.json(
            { error: "Failed to send email" },
            { status: 500 }
        );
    }
}
