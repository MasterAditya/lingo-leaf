"""Email service for password reset using Gmail SMTP."""

import os
import logging
from smtplib import SMTP
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


def _get_smtp_config() -> tuple[str, str] | None:
    """Get Gmail SMTP credentials from environment variables."""
    gmail_address = os.environ.get("GMAIL_ADDRESS")
    gmail_app_password = os.environ.get("GMAIL_APP_PASSWORD")
    
    if not gmail_address or not gmail_app_password:
        logger.warning("Gmail SMTP credentials not configured in environment variables")
        return None
    
    return gmail_address, gmail_app_password


def send_password_reset_email(recipient: str, reset_url: str) -> bool:
    """Send a password reset email using Gmail SMTP.
    
    Args:
        recipient: The email address to send the reset link to
        reset_url: The full URL for the password reset page with token
        
    Returns:
        True if email was sent successfully, False otherwise
    """
    config = _get_smtp_config()
    if not config:
        logger.error("Cannot send email: Gmail credentials not configured")
        return False
    
    gmail_address, gmail_app_password = config
    
    try:
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Reset Your LingoLeaf Password"
        msg["From"] = gmail_address
        msg["To"] = recipient
        
        # HTML email content
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #10b981;">LingoLeaf Password Reset</h2>
                <p>Hello,</p>
                <p>We received a request to reset your password for your LingoLeaf account.</p>
                <p>Click the button below to reset your password:</p>
                <p>
                    <a href="{reset_url}" 
                       style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Reset Password
                    </a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666; font-size: 14px;">{reset_url}</p>
                <p style="color: #666; font-size: 14px;">This link will expire in 30 minutes.</p>
                <p>If you did not request a password reset, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">LingoLeaf - Learn German the fun way!</p>
            </div>
        </body>
        </html>
        """
        
        # Plain text fallback
        text_content = f"""
LingoLeaf Password Reset

Hello,

We received a request to reset your password for your LingoLeaf account.

Click the link below to reset your password:
{reset_url}

This link will expire in 30 minutes.

If you did not request a password reset, you can safely ignore this email.

LingoLeaf - Learn German the fun way!
"""
        
        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email using Gmail SMTP
        with SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(gmail_address, gmail_app_password)
            server.send_message(msg)
        
        logger.info(f"Password reset email sent to {recipient}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send password reset email to {recipient}: {str(e)}")
        return False
