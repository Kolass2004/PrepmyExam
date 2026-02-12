
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || '"Prepmyexam" <no-reply@prepmyexam.in>';

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("Mail: SMTP environment variables missing. Email features will simulate success.");
}

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

interface SendMailParams {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendMailParams) {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.log(`[SIMULATION] Email to ${to}: ${subject}`);
        return { success: true, messageId: 'simulated' };
    }

    try {
        const info = await transporter.sendMail({
            from: SMTP_FROM,
            to,
            subject,
            text: text || "Please enable HTML to view this message.",
            html,
        });
        console.log("Message sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}
